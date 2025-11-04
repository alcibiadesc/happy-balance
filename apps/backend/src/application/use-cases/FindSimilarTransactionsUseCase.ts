import { Result } from "@domain/shared/Result";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { Transaction } from "@domain/entities/Transaction";

export interface SimilarTransactionQuery {
  transactionId: string;
  merchantName: string;
  description?: string;
  maxResults?: number;
  includeHidden?: boolean;
  transactionType?: string; // "INCOME", "EXPENSE", or "INVESTMENT"
}

export interface SimilarTransactionResult {
  transaction: Transaction;
  similarity: {
    merchantMatch: boolean;
    descriptionMatch: boolean;
    amountSimilarity: number;
    score: number;
  };
}

export class FindSimilarTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(
    query: SimilarTransactionQuery,
  ): Promise<Result<SimilarTransactionResult[]>> {
    try {
      const {
        transactionId,
        merchantName,
        description,
        maxResults = 50,
        includeHidden = false,
        transactionType,
      } = query;

      // Get all transactions from database (not limited by frontend pagination)
      const allTransactionsResult =
        await this.transactionRepository.findWithFilters(
          { includeHidden },
          { offset: 0, limit: 10000 }, // Large limit to get all transactions
        );

      if (allTransactionsResult.isFailure()) {
        return Result.fail(allTransactionsResult.getError());
      }

      const { transactions } = allTransactionsResult.getValue();
      const similarTransactions: SimilarTransactionResult[] = [];

      // Normalize search patterns
      const normalizedMerchant = this.normalizeText(merchantName);
      const normalizedDescription = this.normalizeText(description || "");

      for (const transaction of transactions) {
        // Skip the source transaction itself
        const snapshot = transaction.toSnapshot();
        if (snapshot.id === transactionId) continue;

        // Filter by transaction type if specified
        // Only show transactions of the same type to avoid categorization errors
        // (e.g., don't suggest expense categories for income transactions)
        if (transactionType && snapshot.type !== transactionType) {
          continue;
        }

        const similarity = this.calculateSimilarity(
          transaction,
          normalizedMerchant,
          normalizedDescription,
        );

        // Only include transactions with meaningful similarity
        // ULTRA-STRICT: Increased threshold to 0.85 for near-perfect matches
        // This ensures only highly confident matches are shown to users
        if (similarity.score >= 0.85) {
          similarTransactions.push({
            transaction,
            similarity,
          });
        }
      }

      // Sort by similarity score (highest first) and limit results
      const sortedResults = similarTransactions
        .sort((a, b) => b.similarity.score - a.similarity.score)
        .slice(0, maxResults);

      return Result.ok(sortedResults);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find similar transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private calculateSimilarity(
    transaction: Transaction,
    normalizedMerchant: string,
    normalizedDescription: string,
  ): SimilarTransactionResult["similarity"] {
    const snapshot = transaction.toSnapshot();
    const transactionMerchant = this.normalizeText(snapshot.merchant);
    const transactionDescription = this.normalizeText(
      snapshot.description || "",
    );

    let score = 0;
    let merchantMatch = false;
    let descriptionMatch = false;
    let amountSimilarity = 0;

    // Merchant name matching (highest priority) - STRICTER RULES
    if (normalizedMerchant && transactionMerchant) {
      // 1. EXACT MATCH - Highest confidence
      if (transactionMerchant === normalizedMerchant) {
        merchantMatch = true;
        score += 0.7; // Increased from 0.6
      }
      // 2. TOKEN-BASED MATCHING - Compare significant words
      else {
        const merchantTokens = this.extractSignificantTokens(normalizedMerchant);
        const transactionTokens = this.extractSignificantTokens(transactionMerchant);

        // Calculate token overlap
        const tokenOverlap = this.calculateTokenOverlap(merchantTokens, transactionTokens);

        // Require at least 70% token overlap for a match
        if (tokenOverlap >= 0.7 && merchantTokens.length > 0) {
          merchantMatch = true;
          score += 0.5 * tokenOverlap; // 0.35 to 0.5 depending on overlap
        }
        // 3. SUBSTRING MATCHING - Only for longer strings (minimum 5 chars)
        else if (normalizedMerchant.length >= 5 && transactionMerchant.length >= 5) {
          // Check if one contains the other, but require meaningful length
          const shorter = normalizedMerchant.length < transactionMerchant.length
            ? normalizedMerchant
            : transactionMerchant;
          const longer = normalizedMerchant.length >= transactionMerchant.length
            ? normalizedMerchant
            : transactionMerchant;

          // Only match if the shorter string is at least 60% of the longer
          const lengthRatio = shorter.length / longer.length;

          if (lengthRatio >= 0.6 && longer.includes(shorter)) {
            merchantMatch = true;
            score += 0.4 * lengthRatio; // 0.24 to 0.4
          }
          // 4. LEVENSHTEIN - Very strict, only for near-identical strings
          else if (
            this.calculateLevenshteinSimilarity(
              transactionMerchant,
              normalizedMerchant,
            ) >= 0.9 // Increased from 0.8
          ) {
            merchantMatch = true;
            score += 0.35;
          }
        }
      }
    }

    // Description matching - ONLY if we have a merchant match
    // This prevents random matches based on description alone
    if (merchantMatch && normalizedDescription && transactionDescription) {
      if (transactionDescription === normalizedDescription) {
        descriptionMatch = true;
        score += 0.2; // Reduced from 0.3
      } else if (normalizedDescription.length >= 5 && transactionDescription.length >= 5) {
        // Token-based description matching
        const descTokens = this.extractSignificantTokens(normalizedDescription);
        const transDescTokens = this.extractSignificantTokens(transactionDescription);
        const descOverlap = this.calculateTokenOverlap(descTokens, transDescTokens);

        if (descOverlap >= 0.7) {
          descriptionMatch = true;
          score += 0.15 * descOverlap;
        }
      }
    }

    // Amount similarity (lower priority, bonus only)
    const sourceAmount = Math.abs(snapshot.amount);
    if (sourceAmount > 0) {
      const amountDifference =
        Math.abs(sourceAmount - Math.abs(snapshot.amount)) / sourceAmount;
      amountSimilarity = Math.max(0, 1 - amountDifference);

      // Only give small bonus for exact or very similar amounts
      if (amountSimilarity > 0.95) {
        score += 0.1;
      } else if (amountSimilarity > 0.85) {
        score += 0.05;
      }
    }

    return {
      merchantMatch,
      descriptionMatch,
      amountSimilarity,
      score: Math.min(1, score), // Cap at 1.0
    };
  }

  /**
   * Extract significant tokens (words) from text, filtering out:
   * - Common words (stop words)
   * - Very short words (< 3 characters)
   * - Numbers in isolation
   */
  private extractSignificantTokens(text: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'at', 'by',
      'de', 'la', 'el', 'en', 'y', 'del', 'los', 'las', 'con', 'por'
    ]);

    return text
      .split(/\s+/)
      .filter(token => {
        // Filter out empty, short, stop words, and pure numbers
        return (
          token.length >= 3 &&
          !stopWords.has(token) &&
          !/^\d+$/.test(token)
        );
      });
  }

  /**
   * Calculate token overlap between two sets of tokens
   * Returns a value between 0 and 1 representing the similarity
   */
  private calculateTokenOverlap(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    // Count how many tokens from set1 are in set2
    let matches = 0;
    for (const token of set1) {
      if (set2.has(token)) {
        matches++;
      }
    }

    // Calculate Jaccard similarity: intersection / union
    const union = new Set([...set1, ...set2]).size;
    const intersection = matches;

    return union > 0 ? intersection / union : 0;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\b(ltd|llc|inc|corp|sa|sl|slu|s\.l\.)\b/g, "") // Remove common company suffixes
      .trim();
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}
