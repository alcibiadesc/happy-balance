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

/**
 * HTTP API implementation of Transaction Repository
 * Communicates with the backend REST API
 */
export class HttpTransactionRepository implements ITransactionRepository {
  private readonly baseUrl: string;

  constructor(
    baseUrl = (typeof window !== "undefined" &&
      (window as any).ENV?.VITE_API_URL) ||
      (import.meta as any).env?.VITE_API_URL ||
      "http://localhost:3004/api",
  ) {
    this.baseUrl = baseUrl;
  }

  async save(transaction: Transaction): Promise<Result<void>> {
    try {
      const snapshot = transaction.toSnapshot();

      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: snapshot.amount,
          currency: snapshot.currency,
          date: snapshot.date,
          merchant: snapshot.merchant,
          type: snapshot.type,
          description: snapshot.description,
          categoryId: snapshot.categoryId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to save transaction",
        );
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save transaction: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async saveMany(transactions: Transaction[]): Promise<Result<number>> {
    try {
      let savedCount = 0;

      // For now, save one by one. In the future, we could implement a bulk endpoint
      for (const transaction of transactions) {
        const result = await this.save(transaction);
        if (result.isSuccess()) {
          savedCount++;
        }
      }

      return Result.ok(savedCount);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save transactions: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findById(id: TransactionId): Promise<Result<Transaction | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id.value}`);

      if (response.status === 404) {
        return Result.ok(null);
      }

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to find transaction",
        );
      }

      const result = await response.json();
      const transactionResult = Transaction.fromSnapshot(result.data);
      return transactionResult;
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transaction: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findAll(): Promise<Result<Transaction[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`);

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to find transactions",
        );
      }

      const result = await response.json();
      const transactions: Transaction[] = [];

      for (const snapshot of result.data.transactions) {
        const transactionResult = Transaction.fromSnapshot(snapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find all transactions: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findWithFilters(
    filters?: TransactionFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<TransactionQueryResult>> {
    try {
      const queryParams = new URLSearchParams();

      if (pagination) {
        queryParams.append(
          "page",
          Math.floor(
            pagination.offset / (pagination.limit || 20) + 1,
          ).toString(),
        );
        queryParams.append("limit", pagination.limit.toString());
      }

      if (filters) {
        if (filters.startDate) {
          queryParams.append("startDate", filters.startDate.toString());
        }
        if (filters.endDate) {
          queryParams.append("endDate", filters.endDate.toString());
        }
        if (filters.type) {
          queryParams.append("type", filters.type);
        }
        if (filters.categoryId) {
          queryParams.append("categoryId", filters.categoryId);
        }
        if (filters.merchantName) {
          queryParams.append("merchantName", filters.merchantName);
        }
        if (filters.minAmount !== undefined) {
          queryParams.append("minAmount", filters.minAmount.toString());
        }
        if (filters.maxAmount !== undefined) {
          queryParams.append("maxAmount", filters.maxAmount.toString());
        }
        if (filters.currency) {
          queryParams.append("currency", filters.currency);
        }
      }

      const response = await fetch(
        `${this.baseUrl}/transactions?${queryParams}`,
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to find transactions with filters",
        );
      }

      const result = await response.json();
      const transactions: Transaction[] = [];

      for (const snapshot of result.data.transactions) {
        const transactionResult = Transaction.fromSnapshot(snapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok({
        transactions,
        totalCount: result.data.pagination.totalCount,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transactions with filters: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findByDateRange(
    startDate: TransactionDate,
    endDate: TransactionDate,
  ): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { startDate, endDate };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByMerchant(merchantName: string): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { merchantName };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByCategory(categoryId: string): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { categoryId };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByType(type: TransactionType): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { type };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async update(transaction: Transaction): Promise<Result<void>> {
    try {
      const snapshot = transaction.toSnapshot();

      const response = await fetch(
        `${this.baseUrl}/transactions/${snapshot.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: snapshot.description,
            // Add other updatable fields as needed
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to update transaction",
        );
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update transaction: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async delete(id: TransactionId): Promise<Result<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id.value}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to delete transaction",
        );
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete transaction: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async deleteMany(ids: TransactionId[]): Promise<Result<number>> {
    try {
      let deletedCount = 0;

      // For now, delete one by one. In the future, we could implement a bulk endpoint
      for (const id of ids) {
        const result = await this.delete(id);
        if (result.isSuccess()) {
          deletedCount++;
        }
      }

      return Result.ok(deletedCount);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete transactions: ${error instanceof Error ? error.message : "Network error"}`,
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
    const result = await this.findWithFilters(filters, { offset: 0, limit: 1 });
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
      const queryParams = new URLSearchParams({
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        currency,
      });

      const response = await fetch(
        `${this.baseUrl}/transactions/statistics?${queryParams}`,
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to get statistics",
        );
      }

      const result = await response.json();
      return Result.ok(result.data);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get statistics: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findPotentialDuplicates(
    transaction: Transaction,
    toleranceHours = 24,
  ): Promise<Result<Transaction[]>> {
    try {
      // This would require a specialized endpoint on the backend
      // For now, we'll implement this client-side by finding similar transactions
      const similarResult = await this.findByMerchant(
        transaction.merchant.name,
      );
      if (similarResult.isFailure()) {
        return Result.fail(similarResult.getError());
      }

      const similar = similarResult.getValue();
      const duplicates = similar.filter(
        (t) =>
          t.isDuplicateOf(transaction, toleranceHours) &&
          !t.equals(transaction),
      );

      return Result.ok(duplicates);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find duplicates: ${error instanceof Error ? error.message : "Network error"}`,
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
      // Use the import endpoint instead
      const snapshots = transactions.map((t) => t.toSnapshot());

      // Convert snapshots to CSV format for the import endpoint
      // This is a workaround - ideally we'd have a bulk import endpoint
      const csvContent = this.snapshotsToCsv(snapshots);

      const formData = new FormData();
      const blob = new Blob([csvContent], { type: "text/csv" });
      formData.append("file", blob, "transactions.csv");
      formData.append("duplicateDetectionEnabled", "true");
      formData.append(
        "skipDuplicates",
        (conflictStrategy === "skip").toString(),
      );

      const response = await fetch(`${this.baseUrl}/import/csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(error.error || "Failed to bulk import");
      }

      const result = await response.json();
      return Result.ok({
        imported: result.data.imported,
        skipped: result.data.duplicatesSkipped,
        errors: result.data.processingErrors,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to bulk import: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async clear(): Promise<Result<void>> {
    // This would require a specialized endpoint or deleting all transactions
    return Result.failWithMessage("Clear operation not supported via API");
  }

  async export(
    filters?: TransactionFilters,
  ): Promise<Result<TransactionSnapshot[]>> {
    const result = await this.findWithFilters(filters);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    const snapshots = result.getValue().transactions.map((t) => t.toSnapshot());
    return Result.ok(snapshots);
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
        `Failed to import: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async updateTags(id: TransactionId, tags: string[]): Promise<Result<void>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transactions/${id.value}/tags`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tags }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(error.error || "Failed to update tags");
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update tags: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findByPatternHash(patternHash: string): Promise<Result<Transaction[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transactions/pattern/${encodeURIComponent(patternHash)}`,
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to find transactions by pattern",
        );
      }

      const result = await response.json();
      const transactions: Transaction[] = [];

      for (const snapshot of result.data) {
        const transactionResult = Transaction.fromSnapshot(snapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find by pattern: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async applyCategoryToPattern(
    sourceTransaction: Transaction,
    categoryId: string,
  ): Promise<Result<number>> {
    try {
      const snapshot = sourceTransaction.toSnapshot();

      const response = await fetch(
        `${this.baseUrl}/transactions/apply-category-pattern`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceTransactionId: snapshot.id,
            categoryId,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to apply category to pattern",
        );
      }

      const result = await response.json();
      return Result.ok(result.data.updatedCount || 0);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to apply category pattern: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  async findMatchingPattern(
    sourceTransaction: Transaction,
  ): Promise<Result<Transaction[]>> {
    try {
      const snapshot = sourceTransaction.toSnapshot();

      const response = await fetch(
        `${this.baseUrl}/transactions/matching-pattern`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchant: snapshot.merchant,
            amount: snapshot.amount,
            description: snapshot.description,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return Result.failWithMessage(
          error.error || "Failed to find matching pattern",
        );
      }

      const result = await response.json();
      const transactions: Transaction[] = [];

      for (const transactionSnapshot of result.data) {
        const transactionResult = Transaction.fromSnapshot(transactionSnapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find matching pattern: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }
  }

  // Helper method to convert snapshots to CSV
  private snapshotsToCsv(snapshots: TransactionSnapshot[]): string {
    if (snapshots.length === 0) return "";

    const headers = [
      "Booking Date",
      "Partner Name",
      "Amount EUR",
      "Payment Reference",
    ];
    const rows = snapshots.map((s) => [
      s.date,
      s.merchant,
      s.type === TransactionType.EXPENSE ? `-${s.amount}` : s.amount.toString(),
      s.description || "",
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }
}
