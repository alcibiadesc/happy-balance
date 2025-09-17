import { Transaction } from '../entities/Transaction';
import { Category } from '../entities/Category';
import { CategoryPattern, PatternType } from '../entities/CategoryPattern';
import { Result } from '../shared/Result';

export interface ICategoryPatternRepository {
  findByCategory(categoryId: string): Promise<CategoryPattern[]>;
  findActivePatterns(): Promise<CategoryPattern[]>;
  save(pattern: CategoryPattern): Promise<void>;
  findById(id: string): Promise<CategoryPattern | null>;
  delete(id: string): Promise<void>;
}

export interface ITransactionRepository {
  findByMerchant(merchant: string): Promise<Transaction[]>;
  findByPattern(pattern: string): Promise<Transaction[]>;
  updateMany(transactions: Transaction[]): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
}

export interface PatternExtraction {
  merchant?: string;
  descriptionPattern?: string;
  suggestedPatternType: PatternType;
}

export interface CategorizationOptions {
  applyToAll: boolean;
  applyToFuture: boolean;
  createPattern: boolean;
}

export class SmartCategorizationService {
  constructor(
    private readonly patternRepository: ICategoryPatternRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  /**
   * Extract a pattern from a transaction for smart categorization
   */
  extractPattern(transaction: Transaction): PatternExtraction {
    const merchant = transaction.merchant.name.toLowerCase();
    const description = transaction.description.toLowerCase();

    // Clean up merchant name for pattern extraction
    const cleanedMerchant = this.cleanMerchantName(merchant);

    // Determine the best pattern type based on available data
    let suggestedPatternType: PatternType = PatternType.MERCHANT;
    let descriptionPattern: string | undefined;

    if (description && description.length > 3) {
      // Extract meaningful words from description
      const meaningfulWords = this.extractMeaningfulWords(description);
      if (meaningfulWords.length > 0) {
        descriptionPattern = meaningfulWords[0];
        if (!cleanedMerchant || cleanedMerchant.length < 3) {
          suggestedPatternType = PatternType.DESCRIPTION;
        } else {
          suggestedPatternType = PatternType.COMBINED;
        }
      }
    }

    return {
      merchant: cleanedMerchant,
      descriptionPattern,
      suggestedPatternType
    };
  }

  /**
   * Categorize a single transaction with optional pattern creation
   */
  async categorizeTransaction(
    transaction: Transaction,
    category: Category,
    options: CategorizationOptions
  ): Promise<Result<CategorizationResult>> {
    const results: CategorizationResult = {
      categorizedCount: 0,
      patternCreated: false,
      affectedTransactionIds: []
    };

    // Categorize the current transaction
    const categorizeResult = transaction.categorize(category);
    if (categorizeResult.isFailure()) {
      return Result.fail(categorizeResult.getError());
    }

    results.categorizedCount = 1;
    results.affectedTransactionIds.push(transaction.id.value);

    // If apply to all or create pattern is requested
    if (options.applyToAll || options.createPattern) {
      const pattern = this.extractPattern(transaction);

      if (options.createPattern && pattern.merchant) {
        // Create a new pattern
        const patternResult = CategoryPattern.create(
          category.id,
          pattern.merchant,
          pattern.suggestedPatternType,
          options.applyToFuture
        );

        if (patternResult.isSuccess()) {
          await this.patternRepository.save(patternResult.getValue());
          results.patternCreated = true;
        }
      }

      if (options.applyToAll && pattern.merchant) {
        // Find and categorize all matching transactions
        const matchingTransactions = await this.findMatchingTransactions(
          transaction,
          pattern
        );

        for (const matchingTx of matchingTransactions) {
          if (!matchingTx.equals(transaction)) {
            // Use setCategoryId method for simpler categorization
            matchingTx.setCategoryId(category.id.value);
            results.categorizedCount++;
            results.affectedTransactionIds.push(matchingTx.id.value);
          }
        }

        // Update all categorized transactions
        if (matchingTransactions.length > 0) {
          await this.transactionRepository.updateMany(matchingTransactions);
        }
      }
    }

    return Result.ok(results);
  }

  /**
   * Apply existing patterns to uncategorized transactions
   */
  async applyPatternsToTransactions(
    transactions: Transaction[]
  ): Promise<ApplyPatternsResult> {
    const activePatterns = await this.patternRepository.findActivePatterns();

    // Sort patterns by priority (higher priority first)
    activePatterns.sort((a, b) => b.priority - a.priority);

    const results: ApplyPatternsResult = {
      categorizedCount: 0,
      patternsApplied: new Map()
    };

    for (const transaction of transactions) {
      // Skip if already categorized
      if (transaction.categoryId) {
        continue;
      }

      for (const pattern of activePatterns) {
        if (pattern.matches(transaction.merchant.name, transaction.description)) {
          // Apply the pattern's category
          transaction.setCategoryId(pattern.categoryId.value);
          pattern.incrementMatchCount();
          await this.patternRepository.save(pattern);

          results.categorizedCount++;
          const appliedCount = results.patternsApplied.get(pattern.id.value) || 0;
          results.patternsApplied.set(pattern.id.value, appliedCount + 1);

          break; // Apply only the highest priority matching pattern
        }
      }
    }

    return results;
  }

  /**
   * Find all transactions that match the same pattern as the given transaction
   */
  private async findMatchingTransactions(
    transaction: Transaction,
    pattern: PatternExtraction
  ): Promise<Transaction[]> {
    const matchingTransactions: Transaction[] = [];

    if (pattern.merchant) {
      const merchantMatches = await this.transactionRepository.findByMerchant(
        pattern.merchant
      );
      matchingTransactions.push(...merchantMatches);
    }

    if (pattern.descriptionPattern && pattern.suggestedPatternType !== PatternType.MERCHANT) {
      const descriptionMatches = await this.transactionRepository.findByPattern(
        pattern.descriptionPattern
      );

      // Add only unique transactions
      for (const tx of descriptionMatches) {
        if (!matchingTransactions.some(existing => existing.equals(tx))) {
          matchingTransactions.push(tx);
        }
      }
    }

    return matchingTransactions;
  }

  /**
   * Clean and normalize merchant name for pattern extraction
   */
  private cleanMerchantName(merchant: string): string {
    // Remove common suffixes and clean up
    const cleaned = merchant
      .toLowerCase()
      .replace(/\s+(inc|llc|ltd|corp|co|company)\.?$/i, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    // Extract the main merchant name (first meaningful part)
    const parts = cleaned.split(/\s+/);
    if (parts.length > 0 && parts[0].length >= 3) {
      return parts[0];
    }

    return cleaned;
  }

  /**
   * Extract meaningful words from description for pattern matching
   */
  private extractMeaningfulWords(description: string): string[] {
    const stopWords = ['the', 'and', 'for', 'with', 'from', 'to', 'at', 'in', 'on'];

    const words = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word =>
        word.length >= 3 &&
        !stopWords.includes(word)
      );

    return words;
  }

  /**
   * Update pattern priority based on usage
   */
  async updatePatternPriorities(): Promise<void> {
    const patterns = await this.patternRepository.findActivePatterns();

    // Sort by match count and update priorities
    patterns.sort((a, b) => b.matchCount - a.matchCount);

    for (let i = 0; i < patterns.length; i++) {
      const newPriority = patterns.length - i;
      patterns[i].updatePriority(newPriority);
      await this.patternRepository.save(patterns[i]);
    }
  }
}

export interface CategorizationResult {
  categorizedCount: number;
  patternCreated: boolean;
  affectedTransactionIds: string[];
}

export interface ApplyPatternsResult {
  categorizedCount: number;
  patternsApplied: Map<string, number>;
}