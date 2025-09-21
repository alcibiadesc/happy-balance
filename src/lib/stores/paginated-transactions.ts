import { writable, derived } from 'svelte/store';
import type { Transaction } from '$lib/types/transaction';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export interface PaginatedQuery {
  page: number;
  limit: number;
  sortBy?: 'date' | 'amount' | 'merchant';
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  includeHidden?: boolean;
}

export interface PaginatedResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedTransactionState {
  transactions: Transaction[];
  totalCount: number;
  currentPage: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
}

// Create paginated transaction store for lazy loading
function createPaginatedTransactionStore() {
  const initialState: PaginatedTransactionState = {
    transactions: [],
    totalCount: 0,
    currentPage: 0,
    isLoading: false,
    hasMore: true,
    error: null,
  };

  const { subscribe, set, update } = writable<PaginatedTransactionState>(initialState);

  return {
    subscribe,

    // Reset store to initial state
    reset() {
      set(initialState);
    },

    // Load first page of transactions
    async loadFirstPage(query: Partial<PaginatedQuery> = {}) {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const fullQuery: PaginatedQuery = {
          page: 1,
          limit: 50,
          sortBy: 'date',
          sortOrder: 'desc',
          includeHidden: true,
          ...query,
        };

        const response = await this.fetchTransactions(fullQuery);

        set({
          transactions: response.transactions,
          totalCount: response.pagination.total,
          currentPage: response.pagination.page,
          isLoading: false,
          hasMore: response.pagination.hasNext,
          error: null,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Load next page and append to existing transactions
    async loadNextPage(query: Partial<PaginatedQuery> = {}) {
      let currentState: PaginatedTransactionState;
      const unsubscribe = subscribe(state => currentState = state);
      unsubscribe();

      if (currentState!.isLoading || !currentState!.hasMore) {
        return null;
      }

      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const fullQuery: PaginatedQuery = {
          page: currentState!.currentPage + 1,
          limit: 50,
          sortBy: 'date',
          sortOrder: 'desc',
          includeHidden: true,
          ...query,
        };

        const response = await this.fetchTransactions(fullQuery);

        update(state => ({
          ...state,
          transactions: [...state.transactions, ...response.transactions],
          currentPage: response.pagination.page,
          isLoading: false,
          hasMore: response.pagination.hasNext,
          error: null,
        }));

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Fetch transactions from API
    async fetchTransactions(query: PaginatedQuery): Promise<PaginatedResponse> {
      const params = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}/transactions/paginated?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load transactions');
      }

      return {
        transactions: result.data.transactions.map(mapApiToTransaction),
        pagination: result.data.pagination,
      };
    },

    // Update a single transaction optimistically
    async updateTransaction(id: string, updates: Partial<Transaction>) {
      // Optimistic update
      update(state => ({
        ...state,
        transactions: state.transactions.map(t =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));

      try {
        const payload: any = {
          description: updates.description,
          hidden: updates.hidden,
          categoryId: updates.categoryId,
        };

        if (updates.amount !== undefined) {
          payload.amount = Math.abs(updates.amount);
          payload.type = updates.amount < 0 ? 'EXPENSE' : 'INCOME';
        }

        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update transaction');
        }

        const result = await response.json();
        const updatedTransaction = mapApiToTransaction(result.data);

        // Update with server response
        update(state => ({
          ...state,
          transactions: state.transactions.map(t =>
            t.id === id ? updatedTransaction : t
          ),
        }));

        return updatedTransaction;
      } catch (error) {
        // Rollback on error by reloading
        console.error('Failed to update transaction, rolling back:', error);
        throw error;
      }
    },

    // Delete a transaction
    async deleteTransaction(id: string) {
      // Optimistic removal
      update(state => ({
        ...state,
        transactions: state.transactions.filter(t => t.id !== id),
        totalCount: Math.max(0, state.totalCount - 1),
      }));

      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete transaction');
        }
      } catch (error) {
        // Rollback on error by reloading
        console.error('Failed to delete transaction, rolling back:', error);
        throw error;
      }
    },
  };
}

// Helper function to map API transaction to frontend format
function mapApiToTransaction(apiTransaction: any): Transaction {
  return {
    id: apiTransaction.id,
    date: apiTransaction.date,
    time: new Date(apiTransaction.createdAt).toLocaleTimeString(),
    merchant: apiTransaction.merchant,
    description: apiTransaction.description || '',
    amount: apiTransaction.type === 'EXPENSE'
      ? -apiTransaction.amount
      : apiTransaction.amount,
    categoryId: apiTransaction.categoryId,
    category: undefined,
    status: 'completed' as const,
    tags: [],
    patternHash: undefined,
    hash: apiTransaction.hash,
    createdAt: new Date(apiTransaction.createdAt),
    updatedAt: new Date(apiTransaction.updatedAt || apiTransaction.createdAt),
    hidden: apiTransaction.hidden || false,
    notes: undefined,
  };
}

// Export the store
export const paginatedTransactions = createPaginatedTransactionStore();

// Derived stores for easy access
export const paginatedTransactionsList = derived(
  paginatedTransactions,
  $store => $store.transactions
);

export const paginatedTransactionsLoading = derived(
  paginatedTransactions,
  $store => $store.isLoading
);

export const paginatedTransactionsHasMore = derived(
  paginatedTransactions,
  $store => $store.hasMore
);

export const paginatedTransactionsTotalCount = derived(
  paginatedTransactions,
  $store => $store.totalCount
);