import { Result } from "../shared/Result";
import {
  Investment,
  InvestmentId,
  InvestmentSnapshot,
  InvestmentHistory,
  InvestmentHistoryId,
  InvestmentHistorySnapshot,
} from "../entities/Investment";
import { InvestmentHistoryType } from "../entities/InvestmentHistoryType";

export interface InvestmentFilters {
  isActive?: boolean;
  categoryId?: string;
  searchTerm?: string;
  highlight?: boolean;
}

export interface InvestmentHistoryFilters {
  investmentId?: string;
  type?: InvestmentHistoryType;
  dateFrom?: Date;
  dateTo?: Date;
  transactionId?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalContributions: number;
  totalWithdrawals: number;
  netContributions: number;
  totalProfit: number;
  profitPercentage: number;
  investmentCount: number;
  currency: string;
}

export interface InvestmentWithMetrics extends InvestmentSnapshot {
  categoryName?: string | null;
  contributionsCount: number;
  lastContributionDate: Date | null;
}

/**
 * Investment repository interface (Port in hexagonal architecture)
 * Defines the contract for investment persistence operations
 */
export interface IInvestmentRepository {
  /**
   * Save a new investment
   */
  save(investment: Investment): Promise<Result<void>>;

  /**
   * Find investment by ID
   */
  findById(id: InvestmentId): Promise<Result<Investment | null>>;

  /**
   * Find investment by ID with history loaded
   */
  findByIdWithHistory(id: InvestmentId): Promise<Result<Investment | null>>;

  /**
   * Find all investments for user
   */
  findAll(): Promise<Result<Investment[]>>;

  /**
   * Find investments with filters
   */
  findWithFilters(filters?: InvestmentFilters): Promise<Result<Investment[]>>;

  /**
   * Find investments by category ID
   */
  findByCategoryId(categoryId: string): Promise<Result<Investment[]>>;

  /**
   * Find active investments
   */
  findActive(): Promise<Result<Investment[]>>;

  /**
   * Find highlighted investments
   */
  findHighlighted(): Promise<Result<Investment[]>>;

  /**
   * Update an existing investment
   */
  update(investment: Investment): Promise<Result<void>>;

  /**
   * Delete an investment (soft delete - mark as inactive)
   */
  delete(id: InvestmentId): Promise<Result<void>>;

  /**
   * Permanently delete an investment (hard delete)
   */
  permanentDelete(id: InvestmentId): Promise<Result<void>>;

  /**
   * Check if an investment exists
   */
  exists(id: InvestmentId): Promise<Result<boolean>>;

  /**
   * Check if investment name exists for user
   */
  existsByName(name: string): Promise<Result<boolean>>;

  /**
   * Count total investments
   */
  count(filters?: InvestmentFilters): Promise<Result<number>>;

  /**
   * Update sort order for multiple investments
   */
  updateSortOrder(sortOrders: { id: string; sortOrder: number }[]): Promise<Result<void>>;

  // History operations

  /**
   * Add history entry to investment
   */
  addHistoryEntry(entry: InvestmentHistory): Promise<Result<void>>;

  /**
   * Find history entry by ID
   */
  findHistoryById(id: InvestmentHistoryId): Promise<Result<InvestmentHistory | null>>;

  /**
   * Find history entries for investment
   */
  findHistoryByInvestmentId(investmentId: InvestmentId): Promise<Result<InvestmentHistory[]>>;

  /**
   * Find history entries with filters
   */
  findHistoryWithFilters(filters: InvestmentHistoryFilters): Promise<Result<InvestmentHistory[]>>;

  /**
   * Find history entry linked to a transaction
   */
  findHistoryByTransactionId(transactionId: string): Promise<Result<InvestmentHistory | null>>;

  /**
   * Update history entry
   */
  updateHistoryEntry(entry: InvestmentHistory): Promise<Result<void>>;

  /**
   * Delete history entry
   */
  deleteHistoryEntry(id: InvestmentHistoryId): Promise<Result<void>>;

  // Portfolio summary operations

  /**
   * Get portfolio summary statistics
   */
  getPortfolioSummary(): Promise<Result<PortfolioSummary>>;

  /**
   * Get investments with metrics for display
   */
  getInvestmentsWithMetrics(): Promise<Result<InvestmentWithMetrics[]>>;

  /**
   * Get history timeline for charts (grouped by period)
   */
  getHistoryTimeline(
    period: "day" | "week" | "month" | "year",
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<
    Result<
      {
        date: string;
        totalValue: number;
        contributions: number;
        withdrawals: number;
      }[]
    >
  >;

  // Export/Import operations

  /**
   * Export investments to snapshots
   */
  export(filters?: InvestmentFilters): Promise<Result<InvestmentSnapshot[]>>;

  /**
   * Import investments from snapshots
   */
  import(snapshots: InvestmentSnapshot[]): Promise<Result<number>>;

  /**
   * Clear all investments (for testing/reset)
   */
  clear(): Promise<Result<void>>;
}
