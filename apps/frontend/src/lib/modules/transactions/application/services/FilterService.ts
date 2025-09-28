import type { Transaction, Category } from '$lib/types/transaction';

export interface FilterState {
  searchQuery: string;
  selectedPeriod: string;
  selectedCategories: string[];
  transactionTypeFilter: 'all' | 'income' | 'expenses' | 'uncategorized';
  showAllTransactions: boolean;
  showHiddenTransactions: boolean;
  dateRangeMode: 'month' | 'custom';
  customStartDate: string;
  customEndDate: string;
}

export const createInitialFilterState = (): FilterState => ({
  searchQuery: '',
  selectedPeriod: new Date().toISOString().slice(0, 7),
  selectedCategories: [],
  transactionTypeFilter: 'all',
  showAllTransactions: typeof window !== 'undefined'
    ? localStorage.getItem('showAllTransactions') === 'true' || localStorage.getItem('showAllTransactions') === null
    : true,
  showHiddenTransactions: typeof window !== 'undefined'
    ? localStorage.getItem('showHiddenTransactions') !== 'false'
    : true,
  dateRangeMode: 'month',
  customStartDate: '',
  customEndDate: ''
});

const matchesSearch = (transaction: Transaction, query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  const numericQuery = parseFloat(query);
  const isNumeric = !isNaN(numericQuery) && isFinite(numericQuery);

  // Text-based search
  const textMatch =
    transaction.merchant.toLowerCase().includes(lowerQuery) ||
    transaction.description.toLowerCase().includes(lowerQuery);

  // Amount-based search
  if (isNumeric) {
    const transactionAmount = Math.abs(transaction.amount);
    const amountMatch =
      Math.abs(transactionAmount - numericQuery) < 0.01 ||
      transactionAmount.toString().includes(numericQuery.toString());
    return textMatch || amountMatch;
  }

  return textMatch;
};

const matchesPeriod = (
  transaction: Transaction,
  filters: FilterState
): boolean => {
  if (filters.showAllTransactions) return true;

  if (filters.dateRangeMode === 'month' && filters.selectedPeriod) {
    return transaction.date.startsWith(filters.selectedPeriod);
  }

  if (filters.dateRangeMode === 'custom' && filters.customStartDate && filters.customEndDate) {
    const transactionDate = new Date(transaction.date);
    const startDate = new Date(filters.customStartDate);
    const endDate = new Date(filters.customEndDate);
    return transactionDate >= startDate && transactionDate <= endDate;
  }

  return true;
};

const matchesCategory = (
  transaction: Transaction,
  filters: FilterState
): boolean => {
  if (filters.selectedCategories.length > 0) {
    return transaction.categoryId
      ? filters.selectedCategories.includes(transaction.categoryId)
      : false;
  }

  switch (filters.transactionTypeFilter) {
    case 'income':
      return transaction.amount > 0;
    case 'expenses':
      return transaction.amount < 0;
    case 'uncategorized':
      return !transaction.categoryId;
    default:
      return true;
  }
};

export const filterTransactions = (
  transactions: Transaction[],
  filters: FilterState,
  categories: Category[]
): Transaction[] => {
  return transactions.filter(transaction => {
    // Period filter
    if (!matchesPeriod(transaction, filters)) return false;

    // Category/type filter
    if (!matchesCategory(transaction, filters)) return false;

    // Search filter
    if (filters.searchQuery && !matchesSearch(transaction, filters.searchQuery)) {
      return false;
    }

    // Hidden filter
    if (!filters.showHiddenTransactions && transaction.hidden) {
      return false;
    }

    return true;
  });
};

export const filterActions = {
  setSearchQuery: (state: FilterState, query: string): FilterState => ({
    ...state,
    searchQuery: query
  }),

  toggleAllTransactions: (state: FilterState): FilterState => {
    const newValue = !state.showAllTransactions;
    if (typeof window !== 'undefined') {
      localStorage.setItem('showAllTransactions', newValue.toString());
    }
    return { ...state, showAllTransactions: newValue };
  },

  toggleHiddenTransactions: (state: FilterState): FilterState => {
    const newValue = !state.showHiddenTransactions;
    if (typeof window !== 'undefined') {
      localStorage.setItem('showHiddenTransactions', newValue.toString());
    }
    return { ...state, showHiddenTransactions: newValue };
  },

  toggleDateRangeMode: (state: FilterState): FilterState => ({
    ...state,
    dateRangeMode: state.dateRangeMode === 'month' ? 'custom' : 'month'
  }),

  clearFilters: (state: FilterState): FilterState => ({
    ...state,
    selectedCategories: [],
    transactionTypeFilter: 'all'
  }),

  setTransactionTypeFilter: (
    state: FilterState,
    type: 'all' | 'income' | 'expenses' | 'uncategorized'
  ): FilterState => ({
    ...state,
    transactionTypeFilter: type
  }),

  toggleCategory: (state: FilterState, categoryId: string): FilterState => {
    const newCategories = state.selectedCategories.includes(categoryId)
      ? state.selectedCategories.filter(id => id !== categoryId)
      : [...state.selectedCategories, categoryId];

    return { ...state, selectedCategories: newCategories };
  }
};