import type { Transaction, Category } from '$lib/types/transaction';

export interface ModalState {
  showFilters: boolean;
  showCategoryModal: boolean;
  categoryModalTransaction: Transaction | null;
  showAddModal: boolean;
  showSmartCategorization: boolean;
  smartCategorizationTransaction: Transaction | null;
  smartCategorizationCategory: Category | null;
  smartMatchingTransactions: Transaction[];
  smartSuggestions: Array<{
    categoryId: string;
    confidence: number;
    reason: string;
    potentialMatches: number;
  }>;
  showDeleteSelectedModal: boolean;
  showDeleteSingleModal: boolean;
  transactionToDelete: string | null;
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
  smartSuggestions: [],
  showDeleteSelectedModal: false,
  showDeleteSingleModal: false,
  transactionToDelete: null
});

export const modalActions = {
  openCategoryModal: (state: ModalState, transaction: Transaction): ModalState => ({
    ...state,
    showCategoryModal: true,
    categoryModalTransaction: transaction
  }),

  closeCategoryModal: (state: ModalState): ModalState => ({
    ...state,
    showCategoryModal: false,
    categoryModalTransaction: null
  }),

  openAddModal: (state: ModalState): ModalState => ({
    ...state,
    showAddModal: true
  }),

  closeAddModal: (state: ModalState): ModalState => ({
    ...state,
    showAddModal: false
  }),

  toggleFilters: (state: ModalState): ModalState => ({
    ...state,
    showFilters: !state.showFilters
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
    smartMatchingTransactions: matchingTransactions
  }),

  closeSmartCategorization: (state: ModalState): ModalState => ({
    ...state,
    showSmartCategorization: false,
    smartCategorizationTransaction: null,
    smartCategorizationCategory: null,
    smartMatchingTransactions: [],
    smartSuggestions: []
  }),

  openDeleteSelectedModal: (state: ModalState): ModalState => ({
    ...state,
    showDeleteSelectedModal: true
  }),

  closeDeleteSelectedModal: (state: ModalState): ModalState => ({
    ...state,
    showDeleteSelectedModal: false
  }),

  openDeleteSingleModal: (state: ModalState, transactionId: string): ModalState => ({
    ...state,
    showDeleteSingleModal: true,
    transactionToDelete: transactionId
  }),

  closeDeleteSingleModal: (state: ModalState): ModalState => ({
    ...state,
    showDeleteSingleModal: false,
    transactionToDelete: null
  })
};