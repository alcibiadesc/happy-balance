/**
 * Port for AI-assisted categorization.
 *
 * The rule engine (patterns + merchant aliases) only knows merchants it has
 * seen before. New merchants — a business' infra bills, a trip abroad — have
 * no history, so they fall through to manual work. This port lets an LLM
 * propose a category for those, always constrained to the user's own catalog.
 */

export interface AiCategorizationCandidate {
  id: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | string;
}

export interface AiCategoryOption {
  id: string;
  name: string;
  type: string;
  /** Merchants already filed under this category — the strongest signal we can give. */
  examples: string[];
}

export interface AiCategorizationChoice {
  categoryId: string;
  /** 0..1 as reported by the model. */
  confidence: number;
  reason: string;
}

export interface AiCategorizationUsage {
  inputTokens: number;
  outputTokens: number;
  batches: number;
}

export interface AiCategorizationResult {
  /** transactionId → choice. Transactions the model declined are simply absent. */
  choices: Map<string, AiCategorizationChoice>;
  usage: AiCategorizationUsage;
  warnings: string[];
}

export interface IAiCategorizationProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  classify(
    candidates: AiCategorizationCandidate[],
    options: AiCategoryOption[]
  ): Promise<AiCategorizationResult>;
}
