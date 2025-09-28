import { Result } from "@domain/shared/Result";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { Transaction } from "@domain/entities/Transaction";

export interface SimilarTransactionQuery {
  transactionId: string;
  merchantName: string;
  description?: string;
  maxResults?: number;
  includeHidden?: boolean;
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

        const similarity = this.calculateSimilarity(
          transaction,
          normalizedMerchant,
          normalizedDescription,
        );

        // Only include transactions with meaningful similarity
        if (similarity.score > 0.3) {
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

    // Merchant name matching (highest priority)
    if (normalizedMerchant && transactionMerchant) {
      if (transactionMerchant === normalizedMerchant) {
        // Exact match
        merchantMatch = true;
        score += 0.6;
      } else if (
        transactionMerchant.includes(normalizedMerchant) ||
        normalizedMerchant.includes(transactionMerchant)
      ) {
        // Partial match
        merchantMatch = true;
        score += 0.4;
      } else if (
        this.calculateLevenshteinSimilarity(
          transactionMerchant,
          normalizedMerchant,
        ) > 0.8
      ) {
        // Similar strings (typos, etc.)
        merchantMatch = true;
        score += 0.3;
      }
    }

    // Description matching
    if (normalizedDescription && transactionDescription) {
      if (transactionDescription === normalizedDescription) {
        descriptionMatch = true;
        score += 0.3;
      } else if (
        transactionDescription.includes(normalizedDescription) ||
        normalizedDescription.includes(transactionDescription)
      ) {
        descriptionMatch = true;
        score += 0.2;
      }
    }

    // Amount similarity (lower priority)
    const sourceAmount = Math.abs(snapshot.amount);
    if (sourceAmount > 0) {
      const amountDifference =
        Math.abs(sourceAmount - Math.abs(snapshot.amount)) / sourceAmount;
      amountSimilarity = Math.max(0, 1 - amountDifference);

      if (amountSimilarity > 0.9) {
        score += 0.1;
      } else if (amountSimilarity > 0.7) {
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
