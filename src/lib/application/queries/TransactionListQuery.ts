import { TransactionType } from "../../domain/entities/TransactionType";

/**
 * Query for transaction list with filtering and pagination
 */
export class TransactionListQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly sortBy: "date" | "amount" | "merchant" = "date",
    public readonly sortOrder: "asc" | "desc" = "desc",
    public readonly searchTerm?: string,
    public readonly type?: TransactionType,
    public readonly categoryId?: string,
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly currency?: string,
    public readonly minAmount?: number,
    public readonly maxAmount?: number,
  ) {}

  /**
   * Validate query parameters
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isInteger(this.page) || this.page < 1) {
      errors.push("Page must be a positive integer");
    }

    if (!Number.isInteger(this.limit) || this.limit < 1 || this.limit > 100) {
      errors.push("Limit must be between 1 and 100");
    }

    const validSortFields = ["date", "amount", "merchant"];
    if (!validSortFields.includes(this.sortBy)) {
      errors.push("Sort field must be one of: date, amount, merchant");
    }

    const validSortOrders = ["asc", "desc"];
    if (!validSortOrders.includes(this.sortOrder)) {
      errors.push("Sort order must be either asc or desc");
    }

    if (this.searchTerm && this.searchTerm.length > 100) {
      errors.push("Search term cannot exceed 100 characters");
    }

    if (this.type && !Object.values(TransactionType).includes(this.type)) {
      errors.push("Invalid transaction type");
    }

    if (this.startDate && isNaN(Date.parse(this.startDate))) {
      errors.push("Start date must be a valid date string");
    }

    if (this.endDate && isNaN(Date.parse(this.endDate))) {
      errors.push("End date must be a valid date string");
    }

    if (
      this.startDate &&
      this.endDate &&
      new Date(this.startDate) > new Date(this.endDate)
    ) {
      errors.push("Start date cannot be after end date");
    }

    if (this.currency && this.currency.length !== 3) {
      errors.push("Currency must be a 3-letter ISO code");
    }

    if (
      this.minAmount !== undefined &&
      (!Number.isFinite(this.minAmount) || this.minAmount < 0)
    ) {
      errors.push("Minimum amount must be a non-negative number");
    }

    if (
      this.maxAmount !== undefined &&
      (!Number.isFinite(this.maxAmount) || this.maxAmount < 0)
    ) {
      errors.push("Maximum amount must be a non-negative number");
    }

    if (
      this.minAmount !== undefined &&
      this.maxAmount !== undefined &&
      this.minAmount > this.maxAmount
    ) {
      errors.push("Minimum amount cannot be greater than maximum amount");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get pagination offset
   */
  getOffset(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Check if query has filters applied
   */
  hasFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.type ||
      this.categoryId ||
      this.startDate ||
      this.endDate ||
      this.currency ||
      this.minAmount !== undefined ||
      this.maxAmount !== undefined
    );
  }
}
