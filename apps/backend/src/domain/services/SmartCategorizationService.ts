import { Transaction } from '../entities/Transaction';
import { Category } from '../entities/Category';
import { CategoryPattern, PatternType } from '../entities/CategoryPattern';
import { MerchantAlias } from '../entities/MerchantAlias';
import { TransactionType } from '../entities/TransactionType';
import { CategoryType } from '../entities/CategoryType';
import { Result } from '../shared/Result';
import { MerchantNormalizer } from './MerchantNormalizer';

export interface ICategoryPatternRepository {
  findByCategory(categoryId: string): Promise<CategoryPattern[]>;
  findActivePatterns(): Promise<CategoryPattern[]>;
  save(pattern: CategoryPattern): Promise<void>;
  findById(id: string): Promise<CategoryPattern | null>;
  delete(id: string): Promise<void>;
}

export interface IMerchantAliasRepository {
  findByRawPattern(pattern: string, userId?: string | null): Promise<MerchantAlias | null>;
  findBestMatch(merchant: string, userId?: string | null): Promise<MerchantAlias | null>;
  save(alias: MerchantAlias): Promise<void>;
}

export interface ITransactionRepository {
  findByMerchant(merchant: string): Promise<Transaction[]>;
  findByPattern(pattern: string): Promise<Transaction[]>;
  findByNormalizedMerchant(normalizedMerchant: string): Promise<Transaction[]>;
  updateMany(transactions: Transaction[]): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
}

export interface PatternExtraction {
  merchant?: string;
  normalizedMerchant?: string;
  canonicalMerchant?: string;
  descriptionPattern?: string;
  suggestedPatternType: PatternType;
  confidence: number;
  tokens: string[];
}

export interface CategorizationOptions {
  applyToAll: boolean;
  applyToFuture: boolean;
  createPattern: boolean;
  userId?: string | null;
  selectedTransactionIds?: string[];
}

export class SmartCategorizationService {
  private readonly normalizer: MerchantNormalizer;

  constructor(
    private readonly patternRepository: ICategoryPatternRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly aliasRepository?: IMerchantAliasRepository
  ) {
    this.normalizer = new MerchantNormalizer();
  }

  /**
   * Extract a pattern from a transaction for smart categorization
   * Uses intelligent normalization to extract clean, canonical patterns
   */
  extractPattern(transaction: Transaction): PatternExtraction {
    const merchant = transaction.merchant.name;
    const description = transaction.description;

    // Use intelligent normalization
    const normResult = this.normalizer.normalize(merchant);

    // Determine the best pattern type based on available data
    let suggestedPatternType: PatternType = PatternType.MERCHANT;
    let descriptionPattern: string | undefined;

    if (description && description.length > 3) {
      // Extract meaningful words from description
      const meaningfulWords = this.extractMeaningfulWords(description.toLowerCase());
      if (meaningfulWords.length > 0) {
        descriptionPattern = meaningfulWords[0];
        if (!normResult.normalized || normResult.normalized.length < 3) {
          suggestedPatternType = PatternType.DESCRIPTION;
        } else if (normResult.confidence < 0.5) {
          // Low confidence in merchant normalization, combine with description
          suggestedPatternType = PatternType.COMBINED;
        }
      }
    }

    return {
      merchant: normResult.normalized,
      normalizedMerchant: normResult.normalized,
      canonicalMerchant: normResult.canonical,
      descriptionPattern,
      suggestedPatternType,
      confidence: normResult.confidence,
      tokens: normResult.tokens,
    };
  }

  /**
   * Extract pattern with alias lookup for better matching
   */
  async extractPatternWithAliases(
    transaction: Transaction,
    userId?: string | null
  ): Promise<PatternExtraction> {
    const basePattern = this.extractPattern(transaction);

    // If we have alias repository, try to find existing alias
    if (this.aliasRepository && basePattern.normalizedMerchant) {
      const existingAlias = await this.aliasRepository.findBestMatch(
        transaction.merchant.name,
        userId
      );

      if (existingAlias) {
        // Use the canonical name from the alias
        existingAlias.recordMatch();
        await this.aliasRepository.save(existingAlias);

        return {
          ...basePattern,
          canonicalMerchant: existingAlias.canonicalName,
          confidence: Math.max(basePattern.confidence, existingAlias.confidence),
        };
      }
    }

    return basePattern;
  }

  /**
   * Categorize a single transaction with optional pattern creation
   * CRITICAL: Validates type compatibility before categorization
   *
   * Enhanced with intelligent pattern extraction and alias learning
   */
  async categorizeTransaction(
    transaction: Transaction,
    category: Category,
    options: CategorizationOptions
  ): Promise<Result<CategorizationResult>> {
    // CRITICAL VALIDATION: Check if category type is compatible with transaction type
    if (!this.isTransactionCompatibleWithCategory(transaction, category)) {
      return Result.failWithMessage(
        `Cannot apply ${category.type} category to ${transaction.type} transaction. ` +
          `Category type must match transaction type (INCOME→INCOME, EXPENSE→ESSENTIAL/DISCRETIONARY/DEBT, INVESTMENT→INVESTMENT)`
      );
    }

    const results: CategorizationResult = {
      categorizedCount: 0,
      patternCreated: false,
      aliasCreated: false,
      affectedTransactionIds: [],
    };

    // Categorize the current transaction
    const categorizeResult = transaction.categorize(category);
    if (categorizeResult.isFailure()) {
      return Result.fail(categorizeResult.getError());
    }

    results.categorizedCount = 1;
    results.affectedTransactionIds.push(transaction.id.value);

    // Extract pattern with intelligent normalization
    const pattern = await this.extractPatternWithAliases(transaction, options.userId);

    // Check if we need to apply to additional transactions
    const hasSelectedIds =
      options.selectedTransactionIds && options.selectedTransactionIds.length > 0;

    // If apply to all, create pattern, or selected transactions are requested
    if (options.applyToAll || options.createPattern || hasSelectedIds) {
      // Use canonical merchant for pattern creation (better matching)
      const patternText =
        pattern.canonicalMerchant || pattern.normalizedMerchant || pattern.merchant;

      if (options.createPattern && patternText && patternText.length >= 2) {
        // Create a new pattern using the canonical/normalized name
        const patternResult = CategoryPattern.create(
          category.id,
          patternText,
          pattern.suggestedPatternType,
          options.applyToFuture
        );

        if (patternResult.isSuccess()) {
          await this.patternRepository.save(patternResult.getValue());
          results.patternCreated = true;
        }

        // Also create/update merchant alias for learning
        if (this.aliasRepository && pattern.normalizedMerchant && pattern.canonicalMerchant) {
          const aliasResult = await this.learnMerchantAlias(
            transaction.merchant.name,
            pattern.canonicalMerchant,
            options.userId
          );
          results.aliasCreated = aliasResult;
        }
      }

      // Apply to selected transactions or all matching
      // For selected IDs, we don't need a pattern - just apply directly
      // For applyToAll, we need a pattern to find matching transactions
      if (hasSelectedIds || (options.applyToAll && patternText)) {
        const transactionsToUpdate: Transaction[] = [];

        if (hasSelectedIds) {
          // Apply to specific selected transactions
          for (const txId of options.selectedTransactionIds!) {
            if (txId !== transaction.id.value) {
              const tx = await this.transactionRepository.findById(txId);
              if (tx && this.isTransactionCompatibleWithCategory(tx, category)) {
                tx.setCategoryId(category.id.value);
                results.categorizedCount++;
                results.affectedTransactionIds.push(tx.id.value);
                transactionsToUpdate.push(tx);
              }
            }
          }
        } else if (options.applyToAll) {
          // Find and categorize all matching transactions using normalized search
          const matchingTransactions = await this.findMatchingTransactionsEnhanced(
            transaction,
            pattern
          );

          for (const matchingTx of matchingTransactions) {
            if (!matchingTx.equals(transaction)) {
              // CRITICAL: Validate type compatibility before applying category
              if (this.isTransactionCompatibleWithCategory(matchingTx, category)) {
                matchingTx.setCategoryId(category.id.value);
                results.categorizedCount++;
                results.affectedTransactionIds.push(matchingTx.id.value);
                transactionsToUpdate.push(matchingTx);
              }
            }
          }
        }

        // Update all categorized transactions
        if (transactionsToUpdate.length > 0) {
          await this.transactionRepository.updateMany(transactionsToUpdate);
        }
      }
    }

    return Result.ok(results);
  }

  /**
   * Learn a merchant alias from user categorization
   * Creates or updates an alias mapping raw merchant → canonical name
   */
  private async learnMerchantAlias(
    rawMerchant: string,
    canonicalName: string,
    userId?: string | null
  ): Promise<boolean> {
    if (!this.aliasRepository) return false;

    const normalizedRaw = rawMerchant.toLowerCase().trim();

    // Check if alias already exists
    const existing = await this.aliasRepository.findByRawPattern(normalizedRaw, userId);

    if (existing) {
      // Update existing alias
      existing.updateCanonicalName(canonicalName);
      existing.recordMatch();
      await this.aliasRepository.save(existing);
      return false; // Not a new alias
    }

    // Create new alias
    const aliasResult = MerchantAlias.create(
      normalizedRaw,
      canonicalName,
      'learned',
      userId ?? null,
      0.9 // Start with high confidence for user-learned aliases
    );

    if (aliasResult.isSuccess()) {
      await this.aliasRepository.save(aliasResult.getValue());
      return true;
    }

    return false;
  }

  /**
   * Enhanced matching using normalized merchant names
   */
  private async findMatchingTransactionsEnhanced(
    transaction: Transaction,
    pattern: PatternExtraction
  ): Promise<Transaction[]> {
    const matchingTransactions: Transaction[] = [];
    const sourceType = transaction.type;

    // First try canonical/normalized merchant matching
    const searchTerm = pattern.canonicalMerchant || pattern.normalizedMerchant || pattern.merchant;

    if (searchTerm) {
      // Try to find by normalized merchant if repository supports it
      let merchantMatches: Transaction[] = [];

      if (this.transactionRepository.findByNormalizedMerchant) {
        try {
          merchantMatches = await this.transactionRepository.findByNormalizedMerchant(searchTerm);
        } catch {
          // Fallback to regular search
          merchantMatches = await this.transactionRepository.findByMerchant(searchTerm);
        }
      } else {
        merchantMatches = await this.transactionRepository.findByMerchant(searchTerm);
      }

      // Also search by pattern to catch variations
      const patternMatches = await this.transactionRepository.findByPattern(searchTerm);

      // Combine and deduplicate
      const allMatches = [...merchantMatches];
      for (const tx of patternMatches) {
        if (!allMatches.some((existing) => existing.equals(tx))) {
          allMatches.push(tx);
        }
      }

      // Filter by same transaction type and validate with normalizer
      for (const tx of allMatches) {
        if (tx.type === sourceType) {
          // Additional check: normalize and compare
          const txNorm = this.normalizer.normalize(tx.merchant.name);
          if (
            txNorm.canonical === pattern.canonicalMerchant ||
            txNorm.normalized === pattern.normalizedMerchant ||
            this.normalizer.isSameMerchant(tx.merchant.name, transaction.merchant.name)
          ) {
            matchingTransactions.push(tx);
          }
        }
      }
    }

    // Also check description patterns
    if (pattern.descriptionPattern && pattern.suggestedPatternType !== PatternType.MERCHANT) {
      const descriptionMatches = await this.transactionRepository.findByPattern(
        pattern.descriptionPattern
      );

      for (const tx of descriptionMatches) {
        if (
          tx.type === sourceType &&
          !matchingTransactions.some((existing) => existing.equals(tx))
        ) {
          matchingTransactions.push(tx);
        }
      }
    }

    return matchingTransactions;
  }

  /**
   * Apply existing patterns to uncategorized transactions
   * Enhanced with intelligent normalization for better matching
   */
  async applyPatternsToTransactions(
    transactions: Transaction[],
    userId?: string | null
  ): Promise<ApplyPatternsResult> {
    const activePatterns = await this.patternRepository.findActivePatterns();

    // Sort patterns by priority (higher priority first), then by match count
    activePatterns.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.matchCount - a.matchCount;
    });

    const results: ApplyPatternsResult = {
      categorizedCount: 0,
      patternsApplied: new Map(),
      normalizedMatches: 0,
    };

    for (const transaction of transactions) {
      // Skip if already categorized
      if (transaction.categoryId) {
        continue;
      }

      // Normalize the transaction's merchant
      const txNorm = this.normalizer.normalize(transaction.merchant.name);

      // First, try to find alias match
      if (this.aliasRepository) {
        const alias = await this.aliasRepository.findBestMatch(transaction.merchant.name, userId);

        if (alias) {
          // Use canonical name for pattern matching
          const canonicalName = alias.canonicalName;

          for (const pattern of activePatterns) {
            // Match against canonical name
            if (pattern.matches(canonicalName, transaction.description)) {
              transaction.setCategoryId(pattern.categoryId.value);
              pattern.incrementMatchCount();
              alias.recordMatch();

              await Promise.all([
                this.patternRepository.save(pattern),
                this.aliasRepository.save(alias),
              ]);

              results.categorizedCount++;
              results.normalizedMatches++;
              const appliedCount = results.patternsApplied.get(pattern.id.value) || 0;
              results.patternsApplied.set(pattern.id.value, appliedCount + 1);

              break;
            }
          }

          if (transaction.categoryId) continue;
        }
      }

      // Fall back to pattern matching with normalized merchant
      for (const pattern of activePatterns) {
        // Try matching against:
        // 1. Original merchant name
        // 2. Normalized merchant name
        // 3. Canonical merchant name
        const matches =
          pattern.matches(transaction.merchant.name, transaction.description) ||
          pattern.matches(txNorm.normalized, transaction.description) ||
          pattern.matches(txNorm.canonical, transaction.description);

        if (matches) {
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
   * Suggest category for a transaction based on patterns and aliases
   * Returns a confidence score to help with auto-categorization decisions
   */
  async suggestCategory(
    transaction: Transaction,
    userId?: string | null
  ): Promise<CategorySuggestion | null> {
    const txNorm = this.normalizer.normalize(transaction.merchant.name);
    const activePatterns = await this.patternRepository.findActivePatterns();

    // Sort by priority and match count
    activePatterns.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.matchCount - a.matchCount;
    });

    // First check alias for canonical name
    let canonicalName = txNorm.canonical;
    let aliasConfidence = 0;

    if (this.aliasRepository) {
      const alias = await this.aliasRepository.findBestMatch(transaction.merchant.name, userId);

      if (alias) {
        canonicalName = alias.canonicalName;
        aliasConfidence = alias.confidence;
      }
    }

    // Find best matching pattern
    for (const pattern of activePatterns) {
      const matches =
        pattern.matches(transaction.merchant.name, transaction.description) ||
        pattern.matches(txNorm.normalized, transaction.description) ||
        pattern.matches(canonicalName, transaction.description);

      if (matches) {
        // Calculate confidence based on multiple factors
        const patternUsage = Math.min(pattern.matchCount / 100, 0.3); // Max 30% boost from usage
        const normConfidence = txNorm.confidence * 0.3; // 30% from normalization
        const aliasBoost = aliasConfidence * 0.2; // 20% from alias
        const baseConfidence = 0.5; // Base 50%

        const totalConfidence = Math.min(
          baseConfidence + patternUsage + normConfidence + aliasBoost,
          1.0
        );

        return {
          categoryId: pattern.categoryId.value,
          patternId: pattern.id.value,
          confidence: totalConfidence,
          matchedOn: canonicalName !== txNorm.canonical ? 'alias' : 'pattern',
          normalizedMerchant: txNorm.normalized,
          canonicalMerchant: canonicalName,
        };
      }
    }

    return null;
  }

  /**
   * Check if a transaction type is compatible with a category type
   * Prevents applying wrong category types to transactions
   * (e.g., INCOME categories should NEVER be applied to EXPENSE transactions)
   */
  private isTransactionCompatibleWithCategory(
    transaction: Transaction,
    category: Category
  ): boolean {
    // NO_COMPUTE categories can be applied to any transaction type
    // as they represent internal transfers that don't affect financial metrics
    if (category.type === CategoryType.NO_COMPUTE) {
      return true;
    }

    switch (transaction.type) {
      case TransactionType.INCOME:
        // INCOME transactions can ONLY have INCOME categories
        return category.type === CategoryType.INCOME;

      case TransactionType.EXPENSE:
        // EXPENSE transactions can have expense-related categories
        // Note: INVESTMENT is allowed because buying investments is technically an expense
        return (
          category.type === CategoryType.ESSENTIAL ||
          category.type === CategoryType.DISCRETIONARY ||
          category.type === CategoryType.DEBT_PAYMENT ||
          category.type === CategoryType.INVESTMENT
        );

      case TransactionType.INVESTMENT:
        // INVESTMENT transactions can ONLY have INVESTMENT categories
        return category.type === CategoryType.INVESTMENT;

      default:
        return false;
    }
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
      .filter((word) => word.length >= 3 && !stopWords.includes(word));

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
  aliasCreated: boolean;
  affectedTransactionIds: string[];
}

export interface ApplyPatternsResult {
  categorizedCount: number;
  patternsApplied: Map<string, number>;
  normalizedMatches: number;
}

export interface CategorySuggestion {
  categoryId: string;
  patternId: string;
  confidence: number;
  matchedOn: 'alias' | 'pattern';
  normalizedMerchant: string;
  canonicalMerchant: string;
}
