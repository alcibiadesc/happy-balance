import type { Transaction, Category } from '$lib/types/transaction';

export interface FilterState {
  searchQuery: string;
  selectedPeriod: string;
  selectedCategories: string[];
  selectedPrimaryTypes: string[]; // essential, discretionary, investment, debt_payment, income, no_compute
  transactionTypeFilter: 'all' | 'income' | 'expenses' | 'uncategorized';
  showUncategorized: boolean;
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
  selectedPrimaryTypes: [],
  transactionTypeFilter: 'all',
  showUncategorized: false,
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

// Normalize string for search: remove accents, lowercase, and normalize spaces
const normalizeForSearch = (text: string): string => {
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
};

const matchesSearch = (transaction: Transaction, query: string): boolean => {
  const normalizedQuery = normalizeForSearch(query);
  const numericQuery = parseFloat(query);
  const isNumeric = !isNaN(numericQuery) && isFinite(numericQuery);

  // Text-based search with normalized comparison
  const textMatch =
    normalizeForSearch(transaction.merchant).includes(normalizedQuery) ||
    normalizeForSearch(transaction.description).includes(normalizedQuery);

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
  filters: FilterState,
  categories: Category[]
): boolean => {
  // Check if transaction matches uncategorized filter
  const isUncategorized = !transaction.categoryId;
  const matchesUncategorizedFilter = !filters.showUncategorized || isUncategorized;

  // If showUncategorized is true and transaction is categorized, exclude it
  if (filters.showUncategorized && !isUncategorized) {
    return false;
  }

  // Check transaction type filter (income/expenses)
  let matchesTypeFilter = true;
  switch (filters.transactionTypeFilter) {
    case 'income':
      matchesTypeFilter = transaction.amount > 0;
      break;
    case 'expenses':
      matchesTypeFilter = transaction.amount < 0;
      break;
    case 'uncategorized':
      return isUncategorized;
    case 'all':
    default:
      matchesTypeFilter = true;
  }

  // Check specific categories filter
  if (filters.selectedCategories.length > 0) {
    const matchesSpecificCategory = transaction.categoryId
      ? filters.selectedCategories.includes(transaction.categoryId)
      : false;
    return matchesSpecificCategory && matchesTypeFilter && matchesUncategorizedFilter;
  }

  // Check primary category types filter (essential, discretionary, etc.)
  if (filters.selectedPrimaryTypes.length > 0) {
    if (!transaction.categoryId) {
      // Uncategorized transactions don't match primary type filters
      return matchesTypeFilter && matchesUncategorizedFilter;
    }
    const category = categories.find(c => c.id === transaction.categoryId);
    if (!category) {
      return false;
    }
    const matchesPrimaryType = filters.selectedPrimaryTypes.includes(category.type);
    return matchesPrimaryType && matchesTypeFilter && matchesUncategorizedFilter;
  }

  return matchesTypeFilter && matchesUncategorizedFilter;
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
    if (!matchesCategory(transaction, filters, categories)) return false;

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
    selectedPrimaryTypes: [],
    transactionTypeFilter: 'all',
    showUncategorized: false
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
  },

  togglePrimaryType: (state: FilterState, primaryType: string): FilterState => {
    const newTypes = state.selectedPrimaryTypes.includes(primaryType)
      ? state.selectedPrimaryTypes.filter(t => t !== primaryType)
      : [...state.selectedPrimaryTypes, primaryType];

    return { ...state, selectedPrimaryTypes: newTypes };
  },

  toggleShowUncategorized: (state: FilterState): FilterState => ({
    ...state,
    showUncategorized: !state.showUncategorized
  })
};