import {
  AiCategorizationCandidate,
  AiCategorizationChoice,
  AiCategorizationResult,
  AiCategoryOption,
  IAiCategorizationProvider,
} from '@domain/services/AiCategorizationPort';
import { logger } from '@infrastructure/logging/logger';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/** Default model: cheap enough that a full pass over a year of transactions costs cents. */
const DEFAULT_MODEL = 'claude-haiku-4-5';

/**
 * Transactions per request. Small enough that one bad batch doesn't lose much
 * work, large enough that the category catalog (the bulk of the prompt) is
 * amortised across many transactions.
 */
const BATCH_SIZE = 40;

const MAX_ATTEMPTS = 3;

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { type?: string; message?: string };
}

export class AnthropicCategorizationProvider implements IAiCategorizationProvider {
  readonly name = 'anthropic';
  readonly model: string;

  private readonly apiKey: string;
  private readonly batchSize: number;

  constructor(
    apiKey: string | undefined = process.env.ANTHROPIC_API_KEY,
    model: string = process.env.AI_CATEGORIZATION_MODEL || DEFAULT_MODEL,
    batchSize: number = Number(process.env.AI_CATEGORIZATION_BATCH_SIZE) || BATCH_SIZE
  ) {
    this.apiKey = (apiKey || '').trim();
    this.model = model;
    this.batchSize = Math.max(1, Math.min(batchSize, 100));
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async classify(
    candidates: AiCategorizationCandidate[],
    options: AiCategoryOption[]
  ): Promise<AiCategorizationResult> {
    const result: AiCategorizationResult = {
      choices: new Map<string, AiCategorizationChoice>(),
      usage: { inputTokens: 0, outputTokens: 0, batches: 0 },
      warnings: [],
    };

    if (!this.isConfigured()) {
      result.warnings.push('ANTHROPIC_API_KEY is not set; AI categorization is disabled');
      return result;
    }
    if (candidates.length === 0 || options.length === 0) {
      return result;
    }

    const catalog = this.renderCatalog(options);

    for (let i = 0; i < candidates.length; i += this.batchSize) {
      const batch = candidates.slice(i, i + this.batchSize);
      result.usage.batches++;

      try {
        const { choices, inputTokens, outputTokens } = await this.classifyBatch(batch, catalog);
        result.usage.inputTokens += inputTokens;
        result.usage.outputTokens += outputTokens;
        for (const [txId, choice] of choices) {
          result.choices.set(txId, choice);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error({ err: message, batchStart: i }, 'AI categorization batch failed');
        result.warnings.push(`Batch starting at ${i + 1} failed: ${message}`);
      }
    }

    return result;
  }

  private renderCatalog(options: AiCategoryOption[]): string {
    return options
      .map((o) => {
        const examples = o.examples.length ? ` — e.g. ${o.examples.slice(0, 6).join(', ')}` : '';
        return `- ${o.id} | ${o.name} | ${o.type}${examples}`;
      })
      .join('\n');
  }

  private buildSystemPrompt(catalog: string): string {
    return [
      'You classify personal and small-business bank transactions into the user’s own category catalog.',
      'The user is based in the Canary Islands (Spain); merchant strings come from Spanish bank and PayPal statements, so they are truncated, uppercased and often missing accents.',
      '',
      'CATALOG (categoryId | name | type | merchants already filed there):',
      catalog,
      '',
      'RULES',
      '1. Only ever answer with a categoryId from the catalog above. Never invent one.',
      '2. Respect the type of the transaction:',
      '   - INCOME transactions take only `income` or `no_compute` categories.',
      '   - INVESTMENT transactions take only `investment` or `no_compute` categories.',
      '   - EXPENSE transactions take `essential`, `discretionary`, `debt_payment`, `investment` or `no_compute`.',
      '3. The example merchants are the ground truth: if a transaction looks like one of them, reuse that category.',
      '4. A movement whose counterparty is one of the user’s own accounts is a transfer, not income or spending — use the `no_compute` transfer category.',
      '5. If you are not reasonably sure, omit the transaction from your answer. A gap is cheap; a wrong category silently corrupts the books.',
      '6. `confidence` is your own honest probability of being right, from 0 to 1. Do not inflate it.',
      '7. `reason` is at most 12 words, in Spanish, naming the evidence you used.',
      '',
      'Answer with JSON only — no prose, no markdown fence:',
      '{"results":[{"id":"<transactionId>","categoryId":"<categoryId>","confidence":0.0,"reason":"..."}]}',
    ].join('\n');
  }

  private buildUserPrompt(batch: AiCategorizationCandidate[]): string {
    const rows = batch.map((c) => ({
      id: c.id,
      date: c.date,
      type: c.type,
      amount: c.amount,
      currency: c.currency,
      merchant: c.merchant,
      description: c.description || undefined,
    }));

    return [`Classify these ${batch.length} transactions:`, JSON.stringify(rows, null, 1)].join(
      '\n'
    );
  }

  private async classifyBatch(
    batch: AiCategorizationCandidate[],
    catalog: string
  ): Promise<{
    choices: Map<string, AiCategorizationChoice>;
    inputTokens: number;
    outputTokens: number;
  }> {
    const body = {
      model: this.model,
      max_tokens: 8000,
      temperature: 0,
      system: this.buildSystemPrompt(catalog),
      messages: [{ role: 'user', content: this.buildUserPrompt(batch) }],
    };

    let lastError = 'unknown error';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response: Response;
      try {
        response = await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120_000),
        });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        await this.backoff(attempt);
        continue;
      }

      // 429 and 5xx are transient; anything else is a real problem worth surfacing.
      if (response.status === 429 || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        await this.backoff(attempt, response.headers.get('retry-after'));
        continue;
      }

      const payload = (await response.json().catch(() => null)) as AnthropicResponse | null;

      if (!response.ok) {
        throw new Error(
          `Anthropic API error HTTP ${response.status}: ${payload?.error?.message ?? 'no detail'}`
        );
      }

      const text = (payload?.content ?? [])
        .filter((block) => block.type === 'text' && block.text)
        .map((block) => block.text as string)
        .join('');

      return {
        choices: this.parseChoices(text, batch),
        inputTokens: payload?.usage?.input_tokens ?? 0,
        outputTokens: payload?.usage?.output_tokens ?? 0,
      };
    }

    throw new Error(`Anthropic API unreachable after ${MAX_ATTEMPTS} attempts: ${lastError}`);
  }

  private async backoff(attempt: number, retryAfter?: string | null): Promise<void> {
    const fromHeader = retryAfter ? Number(retryAfter) * 1000 : NaN;
    const delay = Number.isFinite(fromHeader) ? fromHeader : 500 * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10_000)));
  }

  /**
   * The model is asked for bare JSON, but a stray fence or a leading sentence
   * would throw away a whole batch, so we pull out the outermost object first.
   */
  private parseChoices(
    text: string,
    batch: AiCategorizationCandidate[]
  ): Map<string, AiCategorizationChoice> {
    const choices = new Map<string, AiCategorizationChoice>();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return choices;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      return choices;
    }

    const results = (parsed as { results?: unknown }).results;
    if (!Array.isArray(results)) return choices;

    const batchIds = new Set(batch.map((c) => c.id));

    for (const raw of results) {
      if (!raw || typeof raw !== 'object') continue;
      const { id, categoryId, confidence, reason } = raw as Record<string, unknown>;
      if (typeof id !== 'string' || typeof categoryId !== 'string') continue;
      // Ignore ids the model invented or carried over from another batch.
      if (!batchIds.has(id)) continue;

      const score = typeof confidence === 'number' ? confidence : Number(confidence);

      choices.set(id, {
        categoryId,
        confidence: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0,
        reason: typeof reason === 'string' ? reason.slice(0, 200) : '',
      });
    }

    return choices;
  }
}
