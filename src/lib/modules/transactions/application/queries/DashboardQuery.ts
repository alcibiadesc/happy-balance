import { TransactionType } from "../../domain/entities/TransactionType";

/**
 * Query for dashboard financial data
 * Following CQRS pattern - Queries only read data
 */
export class DashboardQuery {
  constructor(
    public readonly currency: string = "EUR",
    public readonly period: "week" | "month" | "quarter" | "year" = "month",
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly includeInvestments: boolean = true,
    public readonly periodOffset: number = 0,
  ) {}

  /**
   * Validate query parameters
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.currency || this.currency.length !== 3) {
      errors.push("Currency must be a 3-letter ISO code");
    }

    const validPeriods = ["week", "month", "quarter", "year"];
    if (!validPeriods.includes(this.period)) {
      errors.push("Period must be one of: week, month, quarter, year");
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

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get calculated date range for the period
   */
  getDateRange(): { startDate: Date; endDate: Date } {
    if (this.startDate && this.endDate) {
      return {
        startDate: new Date(this.startDate),
        endDate: new Date(this.endDate),
      };
    }

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (this.period) {
      case "week":
        // Get start of current week and apply offset
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);

        startDate = new Date(currentWeekStart);
        startDate.setDate(currentWeekStart.getDate() - this.periodOffset * 7);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "month":
        // Get start of current month and apply offset
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - this.periodOffset,
          1,
        );
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() - this.periodOffset + 1,
          0,
        );
        endDate.setHours(23, 59, 59, 999);
        break;

      case "quarter":
        // Get start of current quarter and apply offset
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3 - this.periodOffset * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "year":
        // Get start of current year and apply offset
        startDate = new Date(now.getFullYear() - this.periodOffset, 0, 1);
        endDate = new Date(now.getFullYear() - this.periodOffset, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Ensure endDate is not in the future
    if (endDate > now) {
      endDate = new Date(now);
      // Don't set to end of day if it would make it future
    }

    return { startDate, endDate };
  }
}
