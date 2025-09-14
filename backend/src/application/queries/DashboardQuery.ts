import { TransactionType } from '../../domain/entities/TransactionType';

/**
 * Query for dashboard financial data
 * Following CQRS pattern - Queries only read data
 */
export class DashboardQuery {
  constructor(
    public readonly currency: string = 'EUR',
    public readonly period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly includeInvestments: boolean = true
  ) {}

  /**
   * Validate query parameters
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.currency || this.currency.length !== 3) {
      errors.push('Currency must be a 3-letter ISO code');
    }

    const validPeriods = ['week', 'month', 'quarter', 'year'];
    if (!validPeriods.includes(this.period)) {
      errors.push('Period must be one of: week, month, quarter, year');
    }

    if (this.startDate && isNaN(Date.parse(this.startDate))) {
      errors.push('Start date must be a valid date string');
    }

    if (this.endDate && isNaN(Date.parse(this.endDate))) {
      errors.push('End date must be a valid date string');
    }

    if (this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
      errors.push('Start date cannot be after end date');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get calculated date range for the period
   */
  getDateRange(): { startDate: Date; endDate: Date } {
    if (this.startDate && this.endDate) {
      return {
        startDate: new Date(this.startDate),
        endDate: new Date(this.endDate)
      };
    }

    const endDate = new Date();
    const startDate = new Date();

    switch (this.period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }
}