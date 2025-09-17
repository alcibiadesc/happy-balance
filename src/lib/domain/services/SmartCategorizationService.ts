import { Transaction } from "../entities/Transaction";
import { Category } from "../entities/Category";
import { Result } from "../shared/Result";

export interface PatternMatch {
  field: "merchant" | "description" | "amount" | "combined";
  pattern: string;
  normalizedPattern: string;
  confidence: number;
}

export interface SmartCategorizationSuggestion {
  categoryId: string;
  confidence: number;
  reason: string;
  potentialMatches: number;
  patterns: PatternMatch[];
}

/**
 * Service for extracting patterns and providing smart categorization suggestions
 */
export class SmartCategorizationService {
  private readonly MIN_PATTERN_LENGTH = 3;
  private readonly MIN_CONFIDENCE = 0.6;

  /**
   * Extract patterns from a transaction for potential auto-categorization
   */
  extractPatterns(transaction: Transaction): PatternMatch[] {
    const patterns: PatternMatch[] = [];

    // Merchant name patterns
    const merchantPatterns = this.extractMerchantPatterns(
      transaction.merchant.name,
    );
    patterns.push(...merchantPatterns);

    // Description patterns
    const descriptionPatterns = this.extractDescriptionPatterns(
      transaction.description,
    );
    patterns.push(...descriptionPatterns);

    // Combined patterns (merchant + description keywords)
    const combinedPatterns = this.extractCombinedPatterns(transaction);
    patterns.push(...combinedPatterns);

    return patterns
      .filter((p) => p.pattern.length >= this.MIN_PATTERN_LENGTH)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find transactions that match the given patterns
   */
  findMatchingTransactions(
    patterns: PatternMatch[],
    allTransactions: Transaction[],
    excludeTransactionId?: string,
  ): Transaction[] {
    const matchingTransactions = new Set<Transaction>();

    for (const pattern of patterns) {
      const matches = allTransactions.filter((t) => {
        if (excludeTransactionId && t.id.value === excludeTransactionId) {
          return false;
        }
        return this.transactionMatchesPattern(t, pattern);
      });

      matches.forEach((t) => matchingTransactions.add(t));
    }

    return Array.from(matchingTransactions);
  }

  /**
   * Suggest categorization scope and show potential impact
   */
  suggestCategorizationScope(
    transaction: Transaction,
    allTransactions: Transaction[],
  ): SmartCategorizationSuggestion[] {
    const patterns = this.extractPatterns(transaction);
    const suggestions: SmartCategorizationSuggestion[] = [];

    // Analyze patterns to suggest categorization scope
    for (const pattern of patterns.slice(0, 3)) {
      // Top 3 patterns
      const matches = this.findMatchingTransactions(
        [pattern],
        allTransactions,
        transaction.id.value,
      );

      if (matches.length > 0) {
        // Analyze existing categories in matches to suggest category
        const categoryFreq = new Map<string, number>();
        matches.forEach((t) => {
          if (t.categoryId) {
            const count = categoryFreq.get(t.categoryId.value) || 0;
            categoryFreq.set(t.categoryId.value, count + 1);
          }
        });

        // Find most common category
        let mostCommonCategory = "";
        let maxCount = 0;
        for (const [categoryId, count] of categoryFreq.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonCategory = categoryId;
          }
        }

        if (
          mostCommonCategory &&
          maxCount >= Math.min(matches.length * 0.5, 2)
        ) {
          const confidence = this.calculateSuggestionConfidence(
            pattern,
            matches,
            maxCount,
          );

          suggestions.push({
            categoryId: mostCommonCategory,
            confidence,
            reason: this.buildSuggestionReason(
              pattern,
              matches.length,
              maxCount,
            ),
            potentialMatches: matches.length,
            patterns: [pattern],
          });
        }
      }
    }

    return suggestions
      .filter((s) => s.confidence >= this.MIN_CONFIDENCE)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate hash for a transaction to enable pattern-based lookups
   */
  calculatePatternHash(transaction: Transaction): string {
    const patterns = this.extractPatterns(transaction);
    const primaryPattern = patterns[0];

    if (!primaryPattern) {
      return "";
    }

    // Create a hash based on the primary pattern
    const hashInput = `${primaryPattern.field}:${primaryPattern.normalizedPattern}`;
    return this.simpleHash(hashInput);
  }

  private extractMerchantPatterns(merchantName: string): PatternMatch[] {
    const patterns: PatternMatch[] = [];
    const normalized = this.normalizeName(merchantName);

    // Exact merchant match
    patterns.push({
      field: "merchant",
      pattern: merchantName.trim(),
      normalizedPattern: normalized,
      confidence: 0.95,
    });

    // Common merchant keywords
    const keywords = this.extractKeywords(normalized);
    keywords.forEach((keyword) => {
      if (keyword.length >= this.MIN_PATTERN_LENGTH) {
        patterns.push({
          field: "merchant",
          pattern: keyword,
          normalizedPattern: keyword,
          confidence: 0.75,
        });
      }
    });

    return patterns;
  }

  private extractDescriptionPatterns(description: string): PatternMatch[] {
    const patterns: PatternMatch[] = [];

    if (!description || description.trim().length === 0) {
      return patterns;
    }

    const normalized = this.normalizeName(description);

    // Important keywords from description
    const keywords = this.extractKeywords(normalized);
    keywords.forEach((keyword) => {
      if (keyword.length >= this.MIN_PATTERN_LENGTH) {
        patterns.push({
          field: "description",
          pattern: keyword,
          normalizedPattern: keyword,
          confidence: 0.65,
        });
      }
    });

    return patterns;
  }

  private extractCombinedPatterns(transaction: Transaction): PatternMatch[] {
    const patterns: PatternMatch[] = [];

    // Combine significant keywords from both merchant and description
    const merchantKeywords = this.extractKeywords(
      this.normalizeName(transaction.merchant.name),
    );
    const descriptionKeywords = this.extractKeywords(
      this.normalizeName(transaction.description),
    );

    const allKeywords = [...merchantKeywords, ...descriptionKeywords]
      .filter((k) => k.length >= this.MIN_PATTERN_LENGTH)
      .filter((k, i, arr) => arr.indexOf(k) === i); // Remove duplicates

    // Create combined pattern from most significant keywords
    if (allKeywords.length > 0) {
      const primaryKeyword = allKeywords[0];
      patterns.push({
        field: "combined",
        pattern: primaryKeyword,
        normalizedPattern: primaryKeyword,
        confidence: 0.8,
      });
    }

    return patterns;
  }

  private transactionMatchesPattern(
    transaction: Transaction,
    pattern: PatternMatch,
  ): boolean {
    switch (pattern.field) {
      case "merchant":
        return this.normalizeName(transaction.merchant.name).includes(
          pattern.normalizedPattern,
        );

      case "description":
        return this.normalizeName(transaction.description).includes(
          pattern.normalizedPattern,
        );

      case "combined":
        const merchantText = this.normalizeName(transaction.merchant.name);
        const descriptionText = this.normalizeName(transaction.description);
        return (
          merchantText.includes(pattern.normalizedPattern) ||
          descriptionText.includes(pattern.normalizedPattern)
        );

      default:
        return false;
    }
  }

  private calculateSuggestionConfidence(
    pattern: PatternMatch,
    matches: Transaction[],
    categoryCount: number,
  ): number {
    const baseConfidence = pattern.confidence;
    const categoryRatio = categoryCount / matches.length;
    const volumeBonus = Math.min(matches.length / 10, 0.2); // Bonus for higher volume

    return Math.min(baseConfidence * categoryRatio + volumeBonus, 1.0);
  }

  private buildSuggestionReason(
    pattern: PatternMatch,
    matchCount: number,
    categoryCount: number,
  ): string {
    const percentage = Math.round((categoryCount / matchCount) * 100);
    return `${categoryCount}/${matchCount} transactions (${percentage}%) with "${pattern.pattern}" have this category`;
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Replace special chars with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  private extractKeywords(text: string): string[] {
    return text
      .split(" ")
      .filter((word) => word.length > 2)
      .filter((word) => !this.isCommonWord(word))
      .slice(0, 5); // Limit to top 5 keywords
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
      "payment",
      "transaction",
      "purchase",
      "sale",
      "from",
      "online",
      "via",
      "card",
    ]);

    return commonWords.has(word);
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
