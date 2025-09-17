import { Transaction } from "../entities/Transaction";
import { Category } from "../entities/Category";
import { Result } from "../shared/Result";
import { TransactionType } from "../entities/TransactionType";
import { CategoryType } from "../entities/CategoryType";

export interface CategorizationRule {
  id: string;
  name: string;
  keywords: string[];
  categoryId: string;
  priority: number;
  isActive: boolean;
}

export interface CategorizationResult {
  transaction: Transaction;
  suggestedCategory?: Category;
  confidence: number; // 0-1 scale
  reason: string;
}

/**
 * Domain service for transaction categorization
 * Implements business logic for automatic and manual categorization
 */
export class CategorizationService {
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Suggest category for a transaction based on merchant and description
   */
  suggestCategory(
    transaction: Transaction,
    availableCategories: Category[],
  ): Result<CategorizationResult> {
    const eligibleCategories = availableCategories.filter(
      (category) => category.isActive && this.isCategoryCompatible(category.type, transaction.type),
    );

    if (eligibleCategories.length === 0) {
      return Result.ok({
        transaction,
        confidence: 0,
        reason: "No eligible categories available",
      });
    }

    let bestMatch: Category | undefined;
    let highestConfidence = 0;
    let matchReason = "";

    for (const category of eligibleCategories) {
      const confidence = this.calculateCategoryConfidence(
        transaction,
        category,
      );

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = category;
        matchReason = this.buildMatchReason(transaction, category, confidence);
      }
    }

    return Result.ok({
      transaction,
      suggestedCategory:
        highestConfidence >= this.MIN_CONFIDENCE_THRESHOLD
          ? bestMatch
          : undefined,
      confidence: highestConfidence,
      reason: matchReason || "No suitable category match found",
    });
  }

  /**
   * Categorize multiple transactions
   */
  categorizeTransactions(
    transactions: Transaction[],
    availableCategories: Category[],
    rules: CategorizationRule[] = [],
  ): Result<CategorizationResult[]> {
    const results: CategorizationResult[] = [];

    for (const transaction of transactions) {
      // First try rule-based categorization
      const ruleResult = this.applyRules(
        transaction,
        availableCategories,
        rules,
      );

      if (ruleResult.isSuccess() && ruleResult.getValue().suggestedCategory) {
        results.push(ruleResult.getValue());
        continue;
      }

      // Fall back to ML-like categorization
      const suggestionResult = this.suggestCategory(
        transaction,
        availableCategories,
      );
      if (suggestionResult.isSuccess()) {
        results.push(suggestionResult.getValue());
      }
    }

    return Result.ok(results);
  }

  /**
   * Apply categorization rules to a transaction
   */
  applyRules(
    transaction: Transaction,
    availableCategories: Category[],
    rules: CategorizationRule[],
  ): Result<CategorizationResult> {
    const activeRules = rules
      .filter((rule) => rule.isActive)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    for (const rule of activeRules) {
      if (this.ruleMatches(transaction, rule)) {
        const category = availableCategories.find(
          (cat) => cat.id.value === rule.categoryId && cat.isActive,
        );

        if (category && this.isCategoryCompatible(category.type, transaction.type)) {
          return Result.ok({
            transaction,
            suggestedCategory: category,
            confidence: 0.95, // Rule-based matches have high confidence
            reason: `Matched rule: ${rule.name}`,
          });
        }
      }
    }

    return Result.ok({
      transaction,
      confidence: 0,
      reason: "No rules matched",
    });
  }

  /**
   * Create a categorization rule from examples
   */
  createRuleFromExamples(
    name: string,
    categoryId: string,
    exampleTransactions: Transaction[],
    priority = 1,
  ): Result<CategorizationRule> {
    if (exampleTransactions.length === 0) {
      return Result.failWithMessage(
        "At least one example transaction is required",
      );
    }

    // Extract keywords from merchant names and descriptions
    const keywords = this.extractKeywords(exampleTransactions);

    const rule: CategorizationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      keywords,
      categoryId,
      priority,
      isActive: true,
    };

    return Result.ok(rule);
  }

  /**
   * Update categorization confidence based on user feedback
   */
  updateConfidenceFromFeedback(
    transaction: Transaction,
    suggestedCategory: Category,
    userAccepted: boolean,
  ): number {
    const baseConfidence = this.calculateCategoryConfidence(
      transaction,
      suggestedCategory,
    );

    if (userAccepted) {
      // Increase confidence for accepted suggestions
      return Math.min(baseConfidence * 1.2, 1.0);
    } else {
      // Decrease confidence for rejected suggestions
      return Math.max(baseConfidence * 0.8, 0.0);
    }
  }

  private calculateCategoryConfidence(
    transaction: Transaction,
    category: Category,
  ): number {
    let confidence = 0;

    // Direct merchant name matching
    if (category.matchesMerchant(transaction.merchant.name)) {
      confidence += 0.8;
    }

    // Merchant category hints
    const merchantHints = transaction.merchant.getCategoryHints();
    if (merchantHints.includes(category.name.toLowerCase())) {
      confidence += 0.6;
    }

    // Description keyword matching
    const descriptionMatch = this.matchesDescription(
      transaction.description,
      category,
    );
    confidence += descriptionMatch * 0.4;

    // Normalize confidence to 0-1 range
    return Math.min(confidence, 1.0);
  }

  private matchesDescription(description: string, category: Category): number {
    if (!description) return 0;

    const descWords = description.toLowerCase().split(/\s+/);
    const categoryWords = category.name.toLowerCase().split(/\s+/);

    let matchCount = 0;
    for (const descWord of descWords) {
      for (const categoryWord of categoryWords) {
        if (
          descWord.includes(categoryWord) ||
          categoryWord.includes(descWord)
        ) {
          matchCount++;
        }
      }
    }

    return matchCount / Math.max(descWords.length, categoryWords.length);
  }

  private ruleMatches(
    transaction: Transaction,
    rule: CategorizationRule,
  ): boolean {
    const searchText =
      `${transaction.merchant.name} ${transaction.description}`.toLowerCase();

    return rule.keywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase()),
    );
  }

  private extractKeywords(transactions: Transaction[]): string[] {
    const keywordMap = new Map<string, number>();

    for (const transaction of transactions) {
      const words = this.extractWordsFromTransaction(transaction);

      for (const word of words) {
        keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
      }
    }

    // Return keywords that appear in at least 50% of transactions
    const threshold = Math.ceil(transactions.length * 0.5);
    return Array.from(keywordMap.entries())
      .filter(([, count]) => count >= threshold)
      .map(([word]) => word)
      .slice(0, 10); // Limit to top 10 keywords
  }

  private extractWordsFromTransaction(transaction: Transaction): string[] {
    const text = `${transaction.merchant.name} ${transaction.description}`
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return text
      .split(" ")
      .filter((word) => word.length > 2) // Filter short words
      .filter((word) => !this.isCommonWord(word)); // Filter common words
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "her",
      "was",
      "one",
      "our",
      "had",
      "have",
      "what",
      "were",
      "said",
      "each",
      "which",
      "she",
      "how",
      "will",
      "may",
      "been",
      "when",
      "who",
      "more",
      "some",
      "very",
      "time",
      "has",
      "its",
      "now",
      "get",
      "use",
      "your",
      "way",
      "about",
      "many",
      "then",
      "them",
      "these",
      "him",
    ]);

    return commonWords.has(word);
  }

  private buildMatchReason(
    transaction: Transaction,
    category: Category,
    confidence: number,
  ): string {
    const reasons: string[] = [];

    if (category.matchesMerchant(transaction.merchant.name)) {
      reasons.push("merchant name match");
    }

    const merchantHints = transaction.merchant.getCategoryHints();
    if (merchantHints.includes(category.name.toLowerCase())) {
      reasons.push("merchant category hint");
    }

    if (this.matchesDescription(transaction.description, category) > 0.3) {
      reasons.push("description keywords");
    }

    const confidencePercent = Math.round(confidence * 100);
    const reasonText =
      reasons.length > 0 ? reasons.join(", ") : "general similarity";

    return `${confidencePercent}% confidence based on ${reasonText}`;
  }

  /**
   * Check if a category type is compatible with a transaction type
   */
  private isCategoryCompatible(categoryType: CategoryType, transactionType: TransactionType): boolean {
    switch (transactionType) {
      case TransactionType.INCOME:
        return categoryType === CategoryType.INCOME;
      case TransactionType.EXPENSE:
        return categoryType === CategoryType.ESSENTIAL ||
               categoryType === CategoryType.DISCRETIONARY ||
               categoryType === CategoryType.DEBT_PAYMENT;
      case TransactionType.INVESTMENT:
        return categoryType === CategoryType.INVESTMENT;
      default:
        return false;
    }
  }
}
