import type { Transaction, Category } from '$lib/types/transaction';
import { exportTransactionsToCSV, downloadCSV, generateFilename } from '$lib/utils/csv-export';
import type { FilterState } from './FilterStateService';

export interface DateRange {
  start: string;
  end: string;
}

/**
 * Calculate date range from filter state
 */
export function getDateRangeFromFilters(filterState: FilterState): DateRange | undefined {
  if (filterState.showAllTransactions) {
    return undefined;
  }

  if (filterState.dateRangeMode === 'month' && filterState.selectedPeriod) {
    const date = new Date(filterState.selectedPeriod + '-01');
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      start: date.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  }

  if (
    filterState.dateRangeMode === 'custom' &&
    filterState.customStartDate &&
    filterState.customEndDate
  ) {
    return {
      start: filterState.customStartDate,
      end: filterState.customEndDate,
    };
  }

  return undefined;
}

/**
 * Export transactions to CSV and trigger download
 */
export function exportTransactions(
  transactions: Transaction[],
  categories: Category[],
  dateRange?: DateRange
): void {
  const csv = exportTransactionsToCSV(transactions, categories);
  const filename = generateFilename(dateRange);
  downloadCSV(csv, filename);
}

/**
 * Export service factory - creates a bound export function
 */
export function createExportService(
  getFilterState: () => FilterState,
  getTransactions: () => Transaction[],
  getCategories: () => Category[]
) {
  return {
    exportToCSV(): void {
      const dateRange = getDateRangeFromFilters(getFilterState());
      exportTransactions(getTransactions(), getCategories(), dateRange);
    },
  };
}
