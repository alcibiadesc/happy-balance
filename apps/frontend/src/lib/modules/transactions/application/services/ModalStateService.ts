import type { Transaction, Category } from '$lib/types/transaction';

// Focused modal state types for better separation of concerns

/** Category selection modal state */
export interface CategoryModalState {
  isOpen: boolean;
  transaction: Transaction | null;
}

/** Smart categorization modal state */
export interface SmartCategorizationState {
  isOpen: boolean;
  transaction: Transaction | null;
  category: Category | null;
  matchingTransactions: Transaction[];
}

/** Delete confirmation modal state */
export interface DeleteModalState {
  showBulkDelete: boolean;
  showSingleDelete: boolean;
  transactionId: string | null;
}

/** Split transaction modal state */
export interface SplitModalState {
  isOpen: boolean;
  transaction: Transaction | null;
}

/** Combined modal state for backwards compatibility */
export interface ModalState {
  showFilters: boolean;
  showCategoryModal: boolean;
  categoryModalTransaction: Transaction | null;
  showAddModal: boolean;
  showSmartCategorization: boolean;
  smartCategorizationTransaction: Transaction | null;
  smartCategorizationCategory: Category | null;
  smartMatchingTransactions: Transaction[];
  showDeleteSelectedModal: boolean;
  showDeleteSingleModal: boolean;
  transactionToDelete: string | null;
  showSplitModal: boolean;
  splitModalTransaction: Transaction | null;
}

export const createInitialModalState = (): ModalState => ({
  showFilters: false,
  showCategoryModal: false,
  categoryModalTransaction: null,
  showAddModal: false,
  showSmartCategorization: false,
  smartCategorizationTransaction: null,
  smartCategorizationCategory: null,
  smartMatchingTransactions: [],
  showDeleteSelectedModal: false,
  showDeleteSingleModal: false,
  transactionToDelete: null,
  showSplitModal: false,
  splitModalTransaction: null,
});

export const modalActions = {
  openCategoryModal: (state: ModalState, transaction: Transaction): ModalState => ({
    ...state,
    showCategoryModal: true,
    categoryModalTransaction: transaction,
  }),

  closeCategoryModal: (state: ModalState): ModalState => ({
    ...state,
    showCategoryModal: false,
    categoryModalTransaction: null,
  }),

  openAddModal: (state: ModalState): ModalState => ({
    ...state,
    showAddModal: true,
  }),

  closeAddModal: (state: ModalState): ModalState => ({
    ...state,
    showAddModal: false,
  }),

  toggleFilters: (state: ModalState): ModalState => ({
    ...state,
    showFilters: !state.showFilters,
  }),

  openSmartCategorization: (
    state: ModalState,
    transaction: Transaction,
    category: Category,
    matchingTransactions: Transaction[]
  ): ModalState => ({
    ...state,
    showSmartCategorization: true,
    smartCategorizationTransaction: transaction,
    smartCategorizationCategory: category,
    smartMatchingTransactions: matchingTransactions,
  }),

  closeSmartCategorization: (state: ModalState): ModalState => ({
    ...state,
    showSmartCategorization: false,
    smartCategorizationTransaction: null,
    smartCategorizationCategory: null,
    smartMatchingTransactions: [],
  }),

  openDeleteSelectedModal: (state: ModalState): ModalState => ({
    ...state,
    showDeleteSelectedModal: true,
  }),

  closeDeleteSelectedModal: (state: ModalState): ModalState => ({
    ...state,
    showDeleteSelectedModal: false,
  }),

  openDeleteSingleModal: (state: ModalState, transactionId: string): ModalState => ({
    ...state,
    showDeleteSingleModal: true,
    transactionToDelete: transactionId,
  }),

  closeDeleteSingleModal: (state: ModalState): ModalState => ({
    ...state,
    showDeleteSingleModal: false,
    transactionToDelete: null,
  }),

  openSplitModal: (state: ModalState, transaction: Transaction): ModalState => ({
    ...state,
    showSplitModal: true,
    splitModalTransaction: transaction,
  }),

  closeSplitModal: (state: ModalState): ModalState => ({
    ...state,
    showSplitModal: false,
    splitModalTransaction: null,
  }),
};
