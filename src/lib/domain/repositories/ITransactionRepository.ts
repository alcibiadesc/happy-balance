import { Result } from "../shared/Result";
import { Transaction, TransactionSnapshot } from "../entities/Transaction";
import { TransactionId } from "../value-objects/TransactionId";
import { TransactionDate } from "../value-objects/TransactionDate";
import { TransactionType } from "../entities/TransactionType";

export interface TransactionFilters {
  startDate?: TransactionDate;
  endDate?: TransactionDate;
  type?: TransactionType;
  categoryId?: string;
  merchantName?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

export interface PaginationOptions {
  offset: number;
  limit: number;
}

export interface TransactionQueryResult {
  transactions: Transaction[];
  totalCount: number;
}

/**
 * Transaction repository interface (Port in hexagonal architecture)
 * Defines the contract for transaction persistence operations
 */
export interface ITransactionRepository {
  /**
   * Save a single transaction
   */
  save(transaction: Transaction): Promise<Result<void>>;

  /**
   * Save multiple transactions
   */
  saveMany(transactions: Transaction[]): Promise<Result<number>>;

  /**
   * Find transaction by ID
   */
  findById(id: TransactionId): Promise<Result<Transaction | null>>;

  /**
   * Find all transactions
   */
  findAll(): Promise<Result<Transaction[]>>;

  /**
   * Find transactions with filters and pagination
   */
  findWithFilters(
    filters?: TransactionFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<TransactionQueryResult>>;

  /**
   * Find transactions by date range
   */
  findByDateRange(
    startDate: TransactionDate,
    endDate: TransactionDate,
  ): Promise<Result<Transaction[]>>;

  /**
   * Find transactions by merchant
   */
  findByMerchant(merchantName: string): Promise<Result<Transaction[]>>;

  /**
   * Find transactions by category
   */
  findByCategory(categoryId: string): Promise<Result<Transaction[]>>;

  /**
   * Find transactions by type
   */
  findByType(type: TransactionType): Promise<Result<Transaction[]>>;

  /**
   * Update an existing transaction
   */
  update(transaction: Transaction): Promise<Result<void>>;

  /**
   * Delete a transaction
   */
  delete(id: TransactionId): Promise<Result<void>>;

  /**
   * Delete multiple transactions
   */
  deleteMany(ids: TransactionId[]): Promise<Result<number>>;

  /**
   * Check if a transaction exists
   */
  exists(id: TransactionId): Promise<Result<boolean>>;

  /**
   * Count total transactions
   */
  count(filters?: TransactionFilters): Promise<Result<number>>;

  /**
   * Get transaction statistics for a date range
   */
  getStatistics(
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
  >;

  /**
   * Find potential duplicates
   */
  findPotentialDuplicates(
    transaction: Transaction,
    toleranceHours?: number,
  ): Promise<Result<Transaction[]>>;

  /**
   * Bulk import transactions with conflict resolution
   */
  bulkImport(
    transactions: Transaction[],
    conflictStrategy: "skip" | "update" | "fail",
  ): Promise<
    Result<{
      imported: number;
      skipped: number;
      errors: string[];
    }>
  >;

  /**
   * Clear all transactions (for testing/reset purposes)
   */
  clear(): Promise<Result<void>>;

  /**
   * Export transactions to snapshots
   */
  export(filters?: TransactionFilters): Promise<Result<TransactionSnapshot[]>>;

  /**
   * Import transactions from snapshots
   */
  import(snapshots: TransactionSnapshot[]): Promise<Result<number>>;
}
