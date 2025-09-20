import { Result } from "../../domain/shared/Result";
import {
  Transaction,
  type TransactionSnapshot,
} from "../../domain/entities/Transaction";
import { TransactionId } from "../../domain/value-objects/TransactionId";
import { TransactionDate } from "../../domain/value-objects/TransactionDate";
import { TransactionType } from "../../domain/entities/TransactionType";
import {
  type ITransactionRepository,
  type TransactionFilters,
  type PaginationOptions,
  type TransactionQueryResult,
} from "../../domain/repositories/ITransactionRepository";
import type { IStorageAdapter } from "../adapters/StorageAdapter";

/**
 * LocalStorage implementation of Transaction Repository
 * Adapter pattern - implements domain repository interface using storage adapter
 */
export class LocalStorageTransactionRepository
  implements ITransactionRepository
{
  private readonly TRANSACTIONS_KEY = "transactions";
  private readonly TRANSACTION_INDEX_KEY = "transaction_index";

  constructor(private readonly storageAdapter: IStorageAdapter) {}

  async save(transaction: Transaction): Promise<Result<void>> {
    try {
      // Get existing transactions
      const existingResult = await this.loadTransactions();
      if (existingResult.isFailure()) {
        return Result.fail(existingResult.getError());
      }

      const existing = existingResult.getValue();
      const snapshot = transaction.toSnapshot();

      // Update or add transaction
      const index = existing.findIndex((t) => t.id === snapshot.id);
      if (index >= 0) {
        existing[index] = snapshot;
      } else {
        existing.push(snapshot);
      }

      // Save back to storage
      const saveResult = await this.saveTransactions(existing);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      // Update index
      await this.updateIndex(existing);

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async saveMany(transactions: Transaction[]): Promise<Result<number>> {
    try {
      // Get existing transactions
      const existingResult = await this.loadTransactions();
      if (existingResult.isFailure()) {
        return Result.fail(existingResult.getError());
      }

      const existing = existingResult.getValue();
      const existingIds = new Set(existing.map((t) => t.id));

      let savedCount = 0;

      // Add new transactions
      for (const transaction of transactions) {
        const snapshot = transaction.toSnapshot();

        if (!existingIds.has(snapshot.id)) {
          existing.push(snapshot);
          savedCount++;
        }
      }

      // Save all transactions
      const saveResult = await this.saveTransactions(existing);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      // Update index
      await this.updateIndex(existing);

      return Result.ok(savedCount);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findById(id: TransactionId): Promise<Result<Transaction | null>> {
    try {
      const transactionsResult = await this.loadTransactions();
      if (transactionsResult.isFailure()) {
        return Result.fail(transactionsResult.getError());
      }

      const snapshot = transactionsResult
        .getValue()
        .find((t) => t.id === id.value);
      if (!snapshot) {
        return Result.ok(null);
      }

      const transactionResult = Transaction.fromSnapshot(snapshot);
      if (transactionResult.isFailure()) {
        return Result.fail(transactionResult.getError());
      }

      return Result.ok(transactionResult.getValue());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findAll(): Promise<Result<Transaction[]>> {
    try {
      const snapshotsResult = await this.loadTransactions();
      if (snapshotsResult.isFailure()) {
        return Result.fail(snapshotsResult.getError());
      }

      const transactions: Transaction[] = [];

      for (const snapshot of snapshotsResult.getValue()) {
        const transactionResult = Transaction.fromSnapshot(snapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      // Sort by date (newest first)
      transactions.sort(
        (a, b) => b.date.value.getTime() - a.date.value.getTime(),
      );

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find all transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findWithFilters(
    filters?: TransactionFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<TransactionQueryResult>> {
    try {
      const allResult = await this.findAll();
      if (allResult.isFailure()) {
        return Result.fail(allResult.getError());
      }

      let transactions = allResult.getValue();

      // Apply filters
      if (filters) {
        transactions = this.applyFilters(transactions, filters);
      }

      const totalCount = transactions.length;

      // Apply pagination
      if (pagination) {
        const start = pagination.offset;
        const end = start + pagination.limit;
        transactions = transactions.slice(start, end);
      }

      return Result.ok({
        transactions,
        totalCount,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transactions with filters: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByDateRange(
    startDate: TransactionDate,
    endDate: TransactionDate,
  ): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = {
      startDate,
      endDate,
    };

    const result = await this.findWithFilters(filters);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByMerchant(merchantName: string): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = {
      merchantName,
    };

    const result = await this.findWithFilters(filters);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByCategory(categoryId: string): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = {
      categoryId,
    };

    const result = await this.findWithFilters(filters);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByType(type: TransactionType): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = {
      type,
    };

    const result = await this.findWithFilters(filters);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async update(transaction: Transaction): Promise<Result<void>> {
    // Same as save for localStorage implementation
    return this.save(transaction);
  }

  async delete(id: TransactionId): Promise<Result<void>> {
    try {
      const existingResult = await this.loadTransactions();
      if (existingResult.isFailure()) {
        return Result.fail(existingResult.getError());
      }

      const existing = existingResult.getValue();
      const filtered = existing.filter((t) => t.id !== id.value);

      const saveResult = await this.saveTransactions(filtered);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      await this.updateIndex(filtered);

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async deleteMany(ids: TransactionId[]): Promise<Result<number>> {
    try {
      const existingResult = await this.loadTransactions();
      if (existingResult.isFailure()) {
        return Result.fail(existingResult.getError());
      }

      const existing = existingResult.getValue();
      const idsToDelete = new Set(ids.map((id) => id.value));
      const initialCount = existing.length;

      const filtered = existing.filter((t) => !idsToDelete.has(t.id));
      const deletedCount = initialCount - filtered.length;

      const saveResult = await this.saveTransactions(filtered);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      await this.updateIndex(filtered);

      return Result.ok(deletedCount);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async exists(id: TransactionId): Promise<Result<boolean>> {
    const result = await this.findById(id);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue() !== null);
  }

  async count(filters?: TransactionFilters): Promise<Result<number>> {
    const result = await this.findWithFilters(filters);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().totalCount);
  }

  async getStatistics(
    startDate: TransactionDate,
    endDate: TransactionDate,
    currency: string,
  ): Promise<
    Result<{
      totalIncome: number;
      totalExpenses: number;
      totalInvestments: number;
      transactionCount: number;
    }>
  > {
    try {
      const transactionsResult = await this.findByDateRange(startDate, endDate);
      if (transactionsResult.isFailure()) {
        return Result.fail(transactionsResult.getError());
      }

      const transactions = transactionsResult
        .getValue()
        .filter((t) => t.amount.currency === currency);

      let totalIncome = 0;
      let totalExpenses = 0;
      let totalInvestments = 0;

      for (const transaction of transactions) {
        switch (transaction.type) {
          case TransactionType.INCOME:
            totalIncome += transaction.amount.amount;
            break;
          case TransactionType.EXPENSE:
            totalExpenses += transaction.amount.amount;
            break;
          case TransactionType.INVESTMENT:
            totalInvestments += transaction.amount.amount;
            break;
        }
      }

      return Result.ok({
        totalIncome,
        totalExpenses,
        totalInvestments,
        transactionCount: transactions.length,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findPotentialDuplicates(
    transaction: Transaction,
    toleranceHours = 24,
  ): Promise<Result<Transaction[]>> {
    try {
      const allResult = await this.findAll();
      if (allResult.isFailure()) {
        return Result.fail(allResult.getError());
      }

      const duplicates = allResult
        .getValue()
        .filter(
          (existing) =>
            existing.isDuplicateOf(transaction, toleranceHours) &&
            !existing.equals(transaction),
        );

      return Result.ok(duplicates);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find duplicates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async bulkImport(
    transactions: Transaction[],
    conflictStrategy: "skip" | "update" | "fail",
  ): Promise<
    Result<{
      imported: number;
      skipped: number;
      errors: string[];
    }>
  > {
    try {
      const existingResult = await this.loadTransactions();
      if (existingResult.isFailure()) {
        return Result.fail(existingResult.getError());
      }

      const existing = existingResult.getValue();
      const existingIds = new Set(existing.map((t) => t.id));

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const transaction of transactions) {
        const snapshot = transaction.toSnapshot();
        const exists = existingIds.has(snapshot.id);

        if (exists) {
          switch (conflictStrategy) {
            case "skip":
              skipped++;
              break;
            case "update":
              const index = existing.findIndex((t) => t.id === snapshot.id);
              existing[index] = snapshot;
              imported++;
              break;
            case "fail":
              errors.push(`Transaction ${snapshot.id} already exists`);
              break;
          }
        } else {
          existing.push(snapshot);
          imported++;
        }
      }

      if (errors.length > 0 && conflictStrategy === "fail") {
        return Result.ok({ imported: 0, skipped: 0, errors });
      }

      const saveResult = await this.saveTransactions(existing);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      await this.updateIndex(existing);

      return Result.ok({ imported, skipped, errors });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to bulk import: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async clear(): Promise<Result<void>> {
    const result = await this.storageAdapter.removeItem(this.TRANSACTIONS_KEY);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    await this.storageAdapter.removeItem(this.TRANSACTION_INDEX_KEY);
    return Result.ok(undefined);
  }

  async export(
    filters?: TransactionFilters,
  ): Promise<Result<TransactionSnapshot[]>> {
    try {
      const result = await this.findWithFilters(filters);
      if (result.isFailure()) {
        return Result.fail(result.getError());
      }

      const snapshots = result
        .getValue()
        .transactions.map((t) => t.toSnapshot());
      return Result.ok(snapshots);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async import(snapshots: TransactionSnapshot[]): Promise<Result<number>> {
    try {
      const transactions: Transaction[] = [];

      for (const snapshot of snapshots) {
        const transactionResult = Transaction.fromSnapshot(snapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      const result = await this.saveMany(transactions);
      return result;
    } catch (error) {
      return Result.failWithMessage(
        `Failed to import: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateTags(id: TransactionId, tags: string[]): Promise<Result<void>> {
    try {
      const transactionsResult = await this.loadTransactions();
      if (transactionsResult.isFailure()) {
        return Result.fail(transactionsResult.getError());
      }

      const transactions = transactionsResult.getValue();
      const transactionIndex = transactions.findIndex(t => t.id === id.value);

      if (transactionIndex === -1) {
        return Result.failWithMessage("Transaction not found");
      }

      // Update tags
      transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        tags,
      };

      const saveResult = await this.saveTransactions(transactions);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      await this.updateIndex(transactions);
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update tags: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByPatternHash(patternHash: string): Promise<Result<Transaction[]>> {
    try {
      const allResult = await this.findAll();
      if (allResult.isFailure()) {
        return Result.fail(allResult.getError());
      }

      const transactions = allResult.getValue();
      // Simple pattern matching based on merchant and description similarity
      const matches = transactions.filter(t => {
        const transactionPattern = `${t.merchant.name}-${t.description || ''}`.toLowerCase();
        return transactionPattern.includes(patternHash.toLowerCase()) ||
               patternHash.toLowerCase().includes(transactionPattern);
      });

      return Result.ok(matches);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find by pattern: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async applyCategoryToPattern(
    sourceTransaction: Transaction,
    categoryId: string,
  ): Promise<Result<number>> {
    try {
      const matchingResult = await this.findMatchingPattern(sourceTransaction);
      if (matchingResult.isFailure()) {
        return Result.fail(matchingResult.getError());
      }

      const matchingTransactions = matchingResult.getValue();
      let updatedCount = 0;

      for (const transaction of matchingTransactions) {
        // Update the category for each matching transaction
        const updatedTransaction = Transaction.fromSnapshot({
          ...transaction.toSnapshot(),
          categoryId,
        });

        if (updatedTransaction.isSuccess()) {
          const updateResult = await this.update(updatedTransaction.getValue());
          if (updateResult.isSuccess()) {
            updatedCount++;
          }
        }
      }

      return Result.ok(updatedCount);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to apply category pattern: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findMatchingPattern(
    sourceTransaction: Transaction,
  ): Promise<Result<Transaction[]>> {
    try {
      const allResult = await this.findAll();
      if (allResult.isFailure()) {
        return Result.fail(allResult.getError());
      }

      const transactions = allResult.getValue();
      const sourceMerchant = sourceTransaction.merchant.name.toLowerCase();
      const sourceAmount = sourceTransaction.amount.amount;

      // Find transactions with similar merchant names and similar amounts
      const matches = transactions.filter(t => {
        if (t.id.equals(sourceTransaction.id)) {
          return false; // Don't match self
        }

        const merchantMatch = t.merchant.name.toLowerCase().includes(sourceMerchant) ||
                            sourceMerchant.includes(t.merchant.name.toLowerCase());

        const amountMatch = Math.abs(t.amount.amount - sourceAmount) < 0.01; // Similar amounts

        return merchantMatch || amountMatch;
      });

      return Result.ok(matches);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find matching pattern: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Private helper methods

  private async loadTransactions(): Promise<Result<TransactionSnapshot[]>> {
    const result = await this.storageAdapter.getItem<TransactionSnapshot[]>(
      this.TRANSACTIONS_KEY,
    );
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue() || []);
  }

  private async saveTransactions(
    transactions: TransactionSnapshot[],
  ): Promise<Result<void>> {
    return this.storageAdapter.setItem(this.TRANSACTIONS_KEY, transactions);
  }

  private async updateIndex(
    transactions: TransactionSnapshot[],
  ): Promise<void> {
    // Create simple index for faster lookups
    const index = {
      byDate: new Map<string, string[]>(),
      byMerchant: new Map<string, string[]>(),
      byType: new Map<TransactionType, string[]>(),
      updatedAt: new Date().toISOString(),
    };

    for (const transaction of transactions) {
      const date = transaction.date;
      const merchant = transaction.merchant.toLowerCase();
      const type = transaction.type;

      // Date index
      if (!index.byDate.has(date)) {
        index.byDate.set(date, []);
      }
      index.byDate.get(date)!.push(transaction.id);

      // Merchant index
      if (!index.byMerchant.has(merchant)) {
        index.byMerchant.set(merchant, []);
      }
      index.byMerchant.get(merchant)!.push(transaction.id);

      // Type index
      if (!index.byType.has(type)) {
        index.byType.set(type, []);
      }
      index.byType.get(type)!.push(transaction.id);
    }

    await this.storageAdapter.setItem(this.TRANSACTION_INDEX_KEY, {
      byDate: Object.fromEntries(index.byDate),
      byMerchant: Object.fromEntries(index.byMerchant),
      byType: Object.fromEntries(index.byType),
      updatedAt: index.updatedAt,
    });
  }

  private applyFilters(
    transactions: Transaction[],
    filters: TransactionFilters,
  ): Transaction[] {
    return transactions.filter((transaction) => {
      // Date range filter
      if (filters.startDate && transaction.date.isBefore(filters.startDate)) {
        return false;
      }

      if (filters.endDate && transaction.date.isAfter(filters.endDate)) {
        return false;
      }

      // Type filter
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (
        filters.categoryId &&
        transaction.categoryId?.value !== filters.categoryId
      ) {
        return false;
      }

      // Merchant filter
      if (filters.merchantName) {
        const searchTerm = filters.merchantName.toLowerCase();
        if (!transaction.merchant.name.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Amount filters
      if (
        filters.minAmount !== undefined &&
        transaction.amount.amount < filters.minAmount
      ) {
        return false;
      }

      if (
        filters.maxAmount !== undefined &&
        transaction.amount.amount > filters.maxAmount
      ) {
        return false;
      }

      // Currency filter
      if (
        filters.currency &&
        transaction.amount.currency !== filters.currency
      ) {
        return false;
      }

      return true;
    });
  }
}
