import { Transaction } from '../entities/Transaction';
import { Result } from '../shared/Result';

export interface DuplicateDetectionResult {
  original: Transaction;
  duplicates: Transaction[];
  reason: string;
}

export interface DuplicateCheckResult {
  hash: string;
  isDuplicate: boolean;
  duplicateId?: string;
}

/**
 * Domain service for detecting duplicate transactions
 * Implements complex business logic for financial duplicate detection
 */
export class DuplicateDetectionService {
  private readonly DEFAULT_TOLERANCE_HOURS = 24;

  /**
   * Detect duplicates in a list of transactions
   */
  detectDuplicates(
    transactions: Transaction[],
    toleranceHours = this.DEFAULT_TOLERANCE_HOURS
  ): DuplicateDetectionResult[] {
    const results: DuplicateDetectionResult[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      if (processed.has(transaction.id.value)) {
        continue;
      }

      const duplicates: Transaction[] = [];

      for (let j = i + 1; j < transactions.length; j++) {
        const candidate = transactions[j];

        if (processed.has(candidate.id.value)) {
          continue;
        }

        if (this.areDuplicates(transaction, candidate, toleranceHours)) {
          duplicates.push(candidate);
          processed.add(candidate.id.value);
        }
      }

      if (duplicates.length > 0) {
        results.push({
          original: transaction,
          duplicates,
          reason: this.buildDuplicateReason(transaction, duplicates[0])
        });
        processed.add(transaction.id.value);
      }
    }

    return results;
  }

  /**
   * Filter out duplicate transactions, keeping only unique ones
   */
  filterUnique(
    transactions: Transaction[],
    toleranceHours = this.DEFAULT_TOLERANCE_HOURS
  ): Transaction[] {
    const unique: Transaction[] = [];
    const hashMap = new Map<string, Transaction>();

    for (const transaction of transactions) {
      const hash = transaction.getHash();
      const existing = hashMap.get(hash);

      if (!existing) {
        hashMap.set(hash, transaction);
        unique.push(transaction);
      } else {
        // If we find a hash collision, do a detailed comparison
        if (!this.areDuplicates(transaction, existing, toleranceHours)) {
          // Not actually a duplicate, add with modified hash
          const modifiedHash = `${hash}_${unique.length}`;
          hashMap.set(modifiedHash, transaction);
          unique.push(transaction);
        }
        // Otherwise, it's a duplicate, so we skip it
      }
    }

    return unique;
  }

  /**
   * Check if two transactions are duplicates
   */
  areDuplicates(
    transaction1: Transaction,
    transaction2: Transaction,
    toleranceHours = this.DEFAULT_TOLERANCE_HOURS
  ): boolean {
    return transaction1.isDuplicateOf(transaction2, toleranceHours);
  }

  /**
   * Detect potential duplicates against existing transactions
   */
  detectAgainstExisting(
    newTransactions: Transaction[],
    existingTransactions: Transaction[],
    toleranceHours = this.DEFAULT_TOLERANCE_HOURS
  ): Result<{
    unique: Transaction[];
    duplicates: Transaction[];
    duplicateReasons: Map<string, string>;
  }> {
    const unique: Transaction[] = [];
    const duplicates: Transaction[] = [];
    const duplicateReasons = new Map<string, string>();

    for (const newTransaction of newTransactions) {
      let isDuplicate = false;

      for (const existingTransaction of existingTransactions) {
        if (this.areDuplicates(newTransaction, existingTransaction, toleranceHours)) {
          duplicates.push(newTransaction);
          duplicateReasons.set(
            newTransaction.id.value,
            `Duplicate of existing transaction from ${existingTransaction.date.toDisplayString()}`
          );
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(newTransaction);
      }
    }

    return Result.ok({
      unique,
      duplicates,
      duplicateReasons
    });
  }

  /**
   * Advanced duplicate detection with multiple criteria
   */
  detectWithCriteria(
    transactions: Transaction[],
    criteria: {
      amountTolerance?: number; // percentage tolerance for amount differences
      timeTolerance?: number;   // hours tolerance
      merchantSimilarity?: number; // similarity threshold (0-1)
    } = {}
  ): DuplicateDetectionResult[] {
    const {
      amountTolerance = 0,
      timeTolerance = this.DEFAULT_TOLERANCE_HOURS,
      merchantSimilarity = 0.9
    } = criteria;

    const results: DuplicateDetectionResult[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      if (processed.has(transaction.id.value)) {
        continue;
      }

      const duplicates: Transaction[] = [];

      for (let j = i + 1; j < transactions.length; j++) {
        const candidate = transactions[j];

        if (processed.has(candidate.id.value)) {
          continue;
        }

        if (this.areDuplicatesWithCriteria(
          transaction,
          candidate,
          { amountTolerance, timeTolerance, merchantSimilarity }
        )) {
          duplicates.push(candidate);
          processed.add(candidate.id.value);
        }
      }

      if (duplicates.length > 0) {
        results.push({
          original: transaction,
          duplicates,
          reason: this.buildAdvancedDuplicateReason(transaction, duplicates[0], criteria)
        });
        processed.add(transaction.id.value);
      }
    }

    return results;
  }

  private areDuplicatesWithCriteria(
    t1: Transaction,
    t2: Transaction,
    criteria: {
      amountTolerance: number;
      timeTolerance: number;
      merchantSimilarity: number;
    }
  ): boolean {
    // Check currency match
    if (t1.amount.currency !== t2.amount.currency) {
      return false;
    }

    // Check amount within tolerance
    const amountDiff = Math.abs(t1.amount.amount - t2.amount.amount);
    const amountAvg = (t1.amount.amount + t2.amount.amount) / 2;
    const amountToleranceValue = (criteria.amountTolerance / 100) * amountAvg;

    if (amountDiff > amountToleranceValue) {
      return false;
    }

    // Check merchant similarity
    if (!t1.merchant.isSimilarTo(t2.merchant, criteria.merchantSimilarity)) {
      return false;
    }

    // Check time tolerance
    const timeDiffMs = Math.abs(t1.date.value.getTime() - t2.date.value.getTime());
    const toleranceMs = criteria.timeTolerance * 60 * 60 * 1000;

    return timeDiffMs <= toleranceMs;
  }

  private buildDuplicateReason(original: Transaction, duplicate: Transaction): string {
    const timeDiff = Math.abs(
      original.date.value.getTime() - duplicate.date.value.getTime()
    );
    const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));

    return `Same amount (${original.amount.format()}) and merchant (${original.merchant.name}) within ${hoursDiff} hours`;
  }

  /**
   * Check multiple hashes against existing transactions
   * Domain service method for hash-based duplicate detection
   */
  checkHashesDuplicates(
    hashes: string[],
    existingTransactions: Transaction[]
  ): Result<DuplicateCheckResult[]> {
    try {
      const existingHashes = new Set(existingTransactions.map(tx => tx.getHash()));

      const results = hashes.map(hash => ({
        hash,
        isDuplicate: existingHashes.has(hash),
        duplicateId: existingTransactions.find(tx => tx.getHash() === hash)?.id.value
      }));

      return Result.ok(results);
    } catch (error) {
      return Result.failWithMessage(`Failed to check hashes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAdvancedDuplicateReason(
    original: Transaction,
    duplicate: Transaction,
    criteria: any
  ): string {
    const reasons: string[] = [];

    if (original.amount.equals(duplicate.amount)) {
      reasons.push('identical amount');
    } else {
      reasons.push(`similar amount (${criteria.amountTolerance}% tolerance)`);
    }

    if (original.merchant.equals(duplicate.merchant)) {
      reasons.push('identical merchant');
    } else {
      reasons.push(`similar merchant (${criteria.merchantSimilarity} similarity)`);
    }

    const timeDiff = Math.abs(
      original.date.value.getTime() - duplicate.date.value.getTime()
    );
    const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));
    reasons.push(`within ${hoursDiff} hours`);

    return reasons.join(', ');
  }
}