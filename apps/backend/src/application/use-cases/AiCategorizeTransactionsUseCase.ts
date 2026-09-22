import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { Transaction } from '@domain/entities/Transaction';
import { Category, CategoryId } from '@domain/entities/Category';
import { CategoryType } from '@domain/entities/CategoryType';
import { TransactionType } from '@domain/entities/TransactionType';
import { CategoryPattern, PatternType } from '@domain/entities/CategoryPattern';
import { MerchantNormalizer } from '@domain/services/MerchantNormalizer';
import {
  AiCategorizationCandidate,
  AiCategoryOption,
  IAiCategorizationProvider,
} from '@domain/services/AiCategorizationPort';
import { ICategoryPatternRepository } from '@domain/services/SmartCategorizationService';

/** Below this, a proposal is shown but never applied automatically. */
const DEFAULT_MIN_CONFIDENCE = 0.75;

/** How many past merchants we show per category as evidence for the model. */
const EXAMPLES_PER_CATEGORY = 8;

export interface AiCategorizeRequest {
  userId: string;
  /** When false (the default) nothing is written — the caller reviews first. */
  apply?: boolean;
  limit?: number;
  minConfidence?: number;
  /** Restrict the run to these transactions instead of every uncategorized one. */
  transactionIds?: string[];
  /**
   * Turn each applied proposal into a low-priority merchant pattern, so the
   * rule engine handles that merchant next month without calling the model.
   */
  learnPatterns?: boolean;
}

export interface AiProposal {
  transactionId: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  categoryType: string;
  confidence: number;
  reason: string;
  /** False when confidence is under the threshold: proposed, not written. */
  applied: boolean;
}

export interface AiCategorizeResponse {
  configured: boolean;
  model: string;
  provider: string;
  examined: number;
  proposals: AiProposal[];
  appliedCount: number;
  patternsLearned: number;
  /** Uncategorized transactions the model declined to classify. */
  undecided: number;
  rejected: Array<{ transactionId: string; merchant: string; reason: string }>;
  usage: { inputTokens: number; outputTokens: number; batches: number };
  warnings: string[];
}

/**
 * Ask an LLM to categorize the transactions the rule engine could not.
 *
 * Everything the model returns is re-validated here: the category must exist,
 * be active, and be type-compatible with the transaction. The model is a
 * suggestion engine, never the authority on what gets written.
 */
export class AiCategorizeTransactionsUseCase {
  private readonly normalizer = new MerchantNormalizer();

  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly provider: IAiCategorizationProvider,
    private readonly patternRepository?: ICategoryPatternRepository
  ) {}

  async execute(request: AiCategorizeRequest): Promise<AiCategorizeResponse> {
    const minConfidence = request.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
    const response: AiCategorizeResponse = {
      configured: this.provider.isConfigured(),
      model: this.provider.model,
      provider: this.provider.name,
      examined: 0,
      proposals: [],
      appliedCount: 0,
      patternsLearned: 0,
      undecided: 0,
      rejected: [],
      usage: { inputTokens: 0, outputTokens: 0, batches: 0 },
      warnings: [],
    };

    if (!response.configured) {
      response.warnings.push(
        'No hay clave de API configurada (ANTHROPIC_API_KEY): la clasificación con IA está desactivada.'
      );
      return response;
    }

    const categories = await this.loadActiveCategories();
    if (categories.length === 0) {
      response.warnings.push('No hay categorías activas con las que clasificar.');
      return response;
    }

    const targets = await this.loadTargets(request);
    response.examined = targets.length;
    if (targets.length === 0) return response;

    const options = await this.buildCatalog(categories);

    const candidates: AiCategorizationCandidate[] = targets.map((t) => {
      const s = t.toSnapshot();
      return {
        id: s.id,
        date: new Date(s.date).toISOString().slice(0, 10),
        merchant: s.merchant,
        description: s.description ?? '',
        amount: s.amount,
        currency: s.currency,
        type: s.type,
      };
    });

    const aiResult = await this.provider.classify(candidates, options);
    response.usage = aiResult.usage;
    response.warnings.push(...aiResult.warnings);

    const byId = new Map(categories.map((c) => [c.toSnapshot().id, c]));
    const toPersist: Transaction[] = [];
    const patternSeeds = new Map<string, string>(); // normalized merchant → categoryId

    for (const transaction of targets) {
      const snapshot = transaction.toSnapshot();
      const choice = aiResult.choices.get(snapshot.id);

      if (!choice) {
        response.undecided++;
        continue;
      }

      const category = byId.get(choice.categoryId);
      if (!category) {
        response.rejected.push({
          transactionId: snapshot.id,
          merchant: snapshot.merchant,
          reason: `categoría inexistente o inactiva (${choice.categoryId})`,
        });
        continue;
      }

      const catSnapshot = category.toSnapshot();
      if (!this.isCompatible(snapshot.type, catSnapshot.type)) {
        response.rejected.push({
          transactionId: snapshot.id,
          merchant: snapshot.merchant,
          reason: `«${catSnapshot.name}» (${catSnapshot.type}) no es compatible con ${snapshot.type}`,
        });
        continue;
      }

      const confident = choice.confidence >= minConfidence;
      const willApply = Boolean(request.apply) && confident;

      if (willApply) {
        transaction.setCategoryId(catSnapshot.id);
        toPersist.push(transaction);
        response.appliedCount++;

        if (request.learnPatterns) {
          const normalized = this.normalizer.normalize(snapshot.merchant).normalized;
          if (normalized && normalized.length >= 3) {
            patternSeeds.set(normalized, catSnapshot.id);
          }
        }
      }

      response.proposals.push({
        transactionId: snapshot.id,
        date: new Date(snapshot.date).toISOString().slice(0, 10),
        merchant: snapshot.merchant,
        description: snapshot.description ?? '',
        amount: snapshot.amount,
        currency: snapshot.currency,
        type: snapshot.type,
        categoryId: catSnapshot.id,
        categoryName: catSnapshot.name,
        categoryIcon: catSnapshot.icon,
        categoryColor: catSnapshot.color,
        categoryType: catSnapshot.type,
        confidence: choice.confidence,
        reason: choice.reason,
        applied: willApply,
      });
    }

    for (const transaction of toPersist) {
      const saved = await this.transactionRepository.update(transaction);
      if (saved.isFailure()) {
        response.warnings.push(
          `No se pudo guardar ${transaction.id.value}: ${saved.getError().message}`
        );
      }
    }

    if (request.learnPatterns && this.patternRepository && patternSeeds.size > 0) {
      response.patternsLearned = await this.learnPatterns(patternSeeds);
    }

    response.proposals.sort((a, b) => b.confidence - a.confidence);
    return response;
  }

  private async loadActiveCategories(): Promise<Category[]> {
    const result = await this.categoryRepository.findActive();
    return result.isSuccess() ? result.getValue() : [];
  }

  private async loadTargets(request: AiCategorizeRequest): Promise<Transaction[]> {
    if (request.transactionIds && request.transactionIds.length > 0) {
      const found: Transaction[] = [];
      for (const id of request.transactionIds) {
        const result = await this.transactionRepository.findById({ value: id } as any);
        const transaction = result.isSuccess() ? result.getValue() : null;
        if (transaction) found.push(transaction);
      }
      return found;
    }

    const result = await this.transactionRepository.findWithFilters(
      { categoryId: null as any, includeHidden: false },
      { offset: 0, limit: 10000 }
    );
    const all = result.isSuccess() ? result.getValue().transactions : [];
    return request.limit && request.limit > 0 ? all.slice(0, request.limit) : all;
  }

  /**
   * The catalog the model sees. Each category carries the merchants already
   * filed under it, which is what actually makes the classification accurate:
   * it turns a generic taxonomy into this user's own taxonomy.
   */
  private async buildCatalog(categories: Category[]): Promise<AiCategoryOption[]> {
    const examples = new Map<string, string[]>();

    const result = await this.transactionRepository.findWithFilters(
      { includeHidden: true },
      { offset: 0, limit: 10000 }
    );

    if (result.isSuccess()) {
      const seen = new Map<string, Set<string>>();
      // Newest first, so the examples reflect how the user files things today.
      const transactions = [...result.getValue().transactions].sort(
        (a, b) => b.date.value.getTime() - a.date.value.getTime()
      );

      for (const transaction of transactions) {
        const categoryId = transaction.categoryId?.value;
        if (!categoryId) continue;

        const merchants = seen.get(categoryId) ?? new Set<string>();
        if (merchants.size >= EXAMPLES_PER_CATEGORY) continue;

        const merchant = transaction.merchant.name.trim();
        if (!merchant || merchant.toLowerCase() === 'unknown merchant') continue;

        merchants.add(merchant);
        seen.set(categoryId, merchants);
      }

      for (const [categoryId, merchants] of seen) {
        examples.set(categoryId, [...merchants]);
      }
    }

    return categories.map((category) => {
      const snapshot = category.toSnapshot();
      return {
        id: snapshot.id,
        name: snapshot.name,
        type: snapshot.type,
        examples: examples.get(snapshot.id) ?? [],
      };
    });
  }

  private async learnPatterns(seeds: Map<string, string>): Promise<number> {
    if (!this.patternRepository) return 0;

    const existing = await this.patternRepository.findActivePatterns();
    const known = new Set(existing.map((p) => p.pattern.toLowerCase()));
    let learned = 0;

    for (const [pattern, categoryId] of seeds) {
      if (known.has(pattern.toLowerCase())) continue;

      const categoryIdResult = CategoryId.create(categoryId);
      if (categoryIdResult.isFailure()) continue;

      // Priority 1: an AI-learned pattern must never outrank one the user made.
      const created = CategoryPattern.create(
        categoryIdResult.getValue(),
        pattern,
        PatternType.MERCHANT,
        true,
        1
      );
      if (created.isSuccess()) {
        await this.patternRepository.save(created.getValue());
        learned++;
      }
    }

    return learned;
  }

  private isCompatible(txType: string, catType: string): boolean {
    if (catType === CategoryType.NO_COMPUTE) return true;

    switch (txType) {
      case TransactionType.INCOME:
        return catType === CategoryType.INCOME;
      case TransactionType.INVESTMENT:
        return catType === CategoryType.INVESTMENT;
      case TransactionType.EXPENSE:
        return (
          catType === CategoryType.ESSENTIAL ||
          catType === CategoryType.DISCRETIONARY ||
          catType === CategoryType.DEBT_PAYMENT ||
          catType === CategoryType.INVESTMENT
        );
      default:
        return false;
    }
  }
}
