// Transaction Module Services - Public API

// Filter services
export { filterTransactions, filterActions, createInitialFilterState } from './FilterService';
export type { FilterState } from './FilterService';

// Modal state management
export type {
  ModalState,
  CategoryModalState,
  SmartCategorizationState,
  DeleteModalState,
  SplitModalState,
} from './ModalStateService';
export { createInitialModalState, modalActions } from './ModalStateService';

// Category operations
export {
  findMatchingTransactions,
  smartCategorize,
  getCategoryById,
  formatAmount,
  autoCategorizeTransactions,
} from './CategoryService';

// Transaction operations
export { TransactionOperationsService } from './TransactionOperationsService';

// Observations
export { createObservationsHandler } from './ObservationsService';

// Grouping
export { groupTransactionsByDate, formatDate } from './GroupingService';

// Export
export { exportTransactions, getDateRangeFromFilters, createExportService } from './ExportService';
export type { DateRange } from './ExportService';
