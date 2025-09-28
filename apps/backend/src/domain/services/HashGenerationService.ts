import { Result } from "../shared/Result";

/**
 * Domain service for generating transaction hashes
 * Centralizes hash generation logic following DDD principles
 * Single source of truth for hash generation across the system
 */
export class HashGenerationService {
  /**
   * Generate a hash for a transaction based on its key attributes
   * This is the single source of truth for hash generation
   */
  generateTransactionHash(params: {
    date: string; // YYYY-MM-DD format
    merchant: string; // Raw merchant name
    amount: number; // Absolute amount
    currency: string; // Currency code
    uniqueSuffix?: string; // Optional unique suffix for collision resolution
  }): string {
    // Normalize merchant name consistently
    const normalizedMerchant = this.normalizeMerchant(params.merchant);

    // Ensure consistent date format (YYYY-MM-DD)
    const normalizedDate = this.normalizeDate(params.date);

    // Use absolute amount for consistency
    const absoluteAmount = Math.abs(params.amount);

    // Build hash data string with optional unique suffix
    const baseData = `${normalizedDate}_${normalizedMerchant}_${absoluteAmount}_${params.currency}`;
    const hashData = params.uniqueSuffix
      ? `${baseData}_${params.uniqueSuffix}`
      : baseData;

    // Generate hash using simple hash function
    return this.computeHash(hashData);
  }

  /**
   * Generate hashes for multiple transactions
   */
  generateBulkHashes(
    transactions: Array<{
      date: string;
      merchant: string;
      amount: number;
      currency: string;
      uniqueSuffix?: string;
    }>,
  ): Result<Map<number, string>> {
    try {
      const hashes = new Map<number, string>();
      const hashCount = new Map<string, number>();

      transactions.forEach((tx, index) => {
        // Generate base hash
        let hash = this.generateTransactionHash(tx);

        // Check for collisions and add index suffix if needed
        const count = hashCount.get(hash) || 0;
        if (count > 0) {
          // Re-generate hash with unique suffix to avoid collision
          hash = this.generateTransactionHash({
            ...tx,
            uniqueSuffix: `idx_${index}`,
          });
        }
        hashCount.set(hash, count + 1);

        hashes.set(index, hash);
      });

      return Result.ok(hashes);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to generate hashes: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Normalize merchant name for consistent hashing
   */
  private normalizeMerchant(merchant: string): string {
    const normalized = merchant
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters but keep word chars and spaces
      .replace(/\s+/g, " ") // Normalize whitespace to single spaces
      .trim();

    // If normalization results in empty string (e.g., "." or other special chars only)
    // use a consistent placeholder to ensure consistent hashing
    return normalized || "unknown";
  }

  /**
   * Normalize date to ensure consistent format
   */
  private normalizeDate(date: string): string {
    // Expect YYYY-MM-DD format, but handle Date objects if needed
    if (date.includes("T")) {
      // ISO string, extract date part
      return date.split("T")[0];
    }
    return date;
  }

  /**
   * Compute hash using simple hash function
   * Consistent with existing implementation
   */
  private computeHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate if a hash looks valid
   */
  isValidHash(hash: string): boolean {
    // Hash should be a base36 string
    return /^[0-9a-z]+$/.test(hash) && hash.length > 0 && hash.length <= 20;
  }

  /**
   * Compare two hashes
   */
  compareHashes(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
  }
}
