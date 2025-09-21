import { writable, derived } from "svelte/store";
import type { Transaction, Category } from "$lib/types/transaction";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3005/api";

interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'income' | 'expenses';
  categoryId?: string;
  merchantName?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  includeHidden?: boolean;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface TransactionStoreState {
  transactions: Transaction[];
  pagination: PaginationState;
  loading: boolean;
  filters: TransactionFilters;
  cache: Map<string, { transactions: Transaction[]; timestamp: number }>;
}

const INITIAL_STATE: TransactionStoreState = {
  transactions: [],
  pagination: {
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  },
  loading: false,
  filters: { includeHidden: true },
  cache: new Map(),
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function createPaginatedTransactionStore() {
  const { subscribe, update, set } = writable<TransactionStoreState>(INITIAL_STATE);

  // Helper function to generate cache key
  function getCacheKey(filters: TransactionFilters, page: number): string {
    return JSON.stringify({ ...filters, page });
  }

  // Helper function to check if cache is valid
  function isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL;
  }

  // Helper function to map API transaction to frontend format
  function mapApiToTransaction(apiTransaction: any): Transaction {
    return {
      id: apiTransaction.id,
      date: apiTransaction.date,
      time: new Date(apiTransaction.createdAt).toLocaleTimeString(),
      merchant: apiTransaction.merchant,
      description: apiTransaction.description || "",
      amount:
        apiTransaction.type === "EXPENSE"
          ? -apiTransaction.amount
          : apiTransaction.amount,
      categoryId: apiTransaction.categoryId,
      category: undefined,
      status: "completed" as const,
      tags: [],
      patternHash: undefined,
      hash: apiTransaction.hash,
      createdAt: new Date(apiTransaction.createdAt),
      updatedAt: new Date(apiTransaction.updatedAt || apiTransaction.createdAt),
      hidden: apiTransaction.hidden || false,
      notes: undefined,
    };
  }

  return {
    subscribe,

    // Load initial page or specific page
    async loadPage(page: number = 1, newFilters?: Partial<TransactionFilters>) {
      return new Promise<void>((resolve, reject) => {
        update((state) => {
          // Update filters if provided
          if (newFilters) {
            state.filters = { ...state.filters, ...newFilters };
          }

          const cacheKey = getCacheKey(state.filters, page);
          const cached = state.cache.get(cacheKey);

          // Check cache first
          if (cached && isCacheValid(cached.timestamp)) {
            console.log(`📦 Cache hit for page ${page}`);

            if (page === 1) {
              // Replace transactions for first page
              state.transactions = cached.transactions;
            } else {
              // Append for subsequent pages
              const existingIds = new Set(state.transactions.map(t => t.id));
              const newTransactions = cached.transactions.filter(t => !existingIds.has(t.id));
              state.transactions = [...state.transactions, ...newTransactions];
            }

            state.pagination.currentPage = page;
            resolve();
            return state;
          }

          // Set loading state
          state.loading = true;

          // Build query parameters
          const params = new URLSearchParams({
            page: page.toString(),
            limit: state.pagination.pageSize.toString(),
            ...(state.filters.includeHidden && { includeHidden: 'true' }),
            ...(state.filters.startDate && { startDate: state.filters.startDate }),
            ...(state.filters.endDate && { endDate: state.filters.endDate }),
            ...(state.filters.type && state.filters.type !== 'all' && {
              type: state.filters.type === 'income' ? 'INCOME' : 'EXPENSE'
            }),
            ...(state.filters.categoryId && { categoryId: state.filters.categoryId }),
            ...(state.filters.merchantName && { merchantName: state.filters.merchantName }),
            ...(state.filters.minAmount && { minAmount: state.filters.minAmount.toString() }),
            ...(state.filters.maxAmount && { maxAmount: state.filters.maxAmount.toString() }),
            ...(state.filters.currency && { currency: state.filters.currency }),
          });

          // Fetch from API
          fetch(`${API_BASE}/transactions?${params}`)
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to load transactions: ${response.status}`);
              }

              const result = await response.json();

              if (result.success && result.data) {
                const { transactions: apiTransactions, pagination } = result.data;
                const transactions = apiTransactions.map(mapApiToTransaction);

                // Cache the results
                state.cache.set(cacheKey, {
                  transactions,
                  timestamp: Date.now()
                });

                // Update state
                if (page === 1) {
                  // Replace transactions for first page/new filters
                  state.transactions = transactions;
                } else {
                  // Append for subsequent pages
                  const existingIds = new Set(state.transactions.map(t => t.id));
                  const newTransactions = transactions.filter((t: Transaction) => !existingIds.has(t.id));
                  state.transactions = [...state.transactions, ...newTransactions];
                }

                // Update pagination
                state.pagination = {
                  currentPage: pagination.page,
                  pageSize: pagination.limit,
                  totalCount: pagination.totalCount,
                  totalPages: pagination.totalPages,
                  hasMore: pagination.page < pagination.totalPages,
                };

                console.log(`✅ Loaded page ${page}: ${transactions.length} transactions`);
              } else {
                console.warn("No transaction data received");
                if (page === 1) {
                  state.transactions = [];
                }
              }

              state.loading = false;
              resolve();
            })
            .catch((error) => {
              console.error("❌ Failed to load transactions:", error);
              state.loading = false;
              reject(error);
            });

          return state;
        });
      });
    },

    // Load next page
    async loadMore() {
      let currentPage: number;
      let hasMore: boolean;

      // Get current state
      const unsubscribe = subscribe((state) => {
        currentPage = state.pagination.currentPage;
        hasMore = state.pagination.hasMore;
      });
      unsubscribe();

      if (hasMore!) {
        await this.loadPage(currentPage! + 1);
      }
    },

    // Apply new filters (resets to page 1)
    async applyFilters(filters: Partial<TransactionFilters>) {
      await this.loadPage(1, filters);
    },

    // Clear cache and reload
    async refresh() {
      update((state) => {
        state.cache.clear();
        return state;
      });
      await this.loadPage(1);
    },

    // Clear cache only
    clearCache() {
      update((state) => {
        state.cache.clear();
        return state;
      });
    },

    // Add new transaction (optimistic update + cache invalidation)
    async add(transaction: Omit<Transaction, "id" | "createdAt">) {
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.abs(transaction.amount),
            currency: "EUR",
            date: transaction.date.split("T")[0],
            merchant: transaction.merchant,
            type: transaction.amount < 0 ? "EXPENSE" : "INCOME",
            description: transaction.description || "",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create transaction");
        }

        const result = await response.json();
        if (result.success) {
          const newTransaction = mapApiToTransaction(result.data);

          // Optimistic update
          update((state) => {
            state.transactions = [newTransaction, ...state.transactions];
            state.pagination.totalCount += 1;
            // Clear cache to ensure consistency
            state.cache.clear();
            return state;
          });

          return newTransaction;
        }
      } catch (error) {
        console.error("Failed to add transaction:", error);
        throw error;
      }
    },

    // Update transaction with cache invalidation
    async update(id: string, updates: Partial<Transaction>) {
      try {
        const payload: any = {
          description: updates.description,
          hidden: updates.hidden,
          categoryId: updates.categoryId,
        };

        if (updates.amount !== undefined) {
          payload.amount = Math.abs(updates.amount);
          payload.type = updates.amount < 0 ? "EXPENSE" : "INCOME";
        }

        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update transaction");
        }

        const result = await response.json();
        const updatedTransaction = mapApiToTransaction(result.data);

        // Update in store and clear cache
        update((state) => {
          state.transactions = state.transactions.map((t) =>
            t.id === id ? updatedTransaction : t
          );
          // Clear cache to ensure consistency
          state.cache.clear();
          return state;
        });

        return updatedTransaction;
      } catch (error) {
        console.error("Failed to update transaction:", error);
        throw error;
      }
    },

    // Delete transaction with cache invalidation
    async delete(id: string) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete transaction");
        }

        // Remove from store and clear cache
        update((state) => {
          state.transactions = state.transactions.filter((t) => t.id !== id);
          state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);
          state.cache.clear();
          return state;
        });
      } catch (error) {
        console.error("Failed to delete transaction:", error);
        throw error;
      }
    },

    // Get current state snapshot
    getState(): TransactionStoreState {
      let currentState: TransactionStoreState;
      const unsubscribe = subscribe((state) => {
        currentState = state;
      });
      unsubscribe();
      return currentState!;
    }
  };
}

// Create store instance
export const paginatedTransactions = createPaginatedTransactionStore();

// Derived stores for convenience
export const transactions = derived(
  paginatedTransactions,
  ($store) => $store.transactions
);

export const pagination = derived(
  paginatedTransactions,
  ($store) => $store.pagination
);

export const loading = derived(
  paginatedTransactions,
  ($store) => $store.loading
);

export const transactionFilters = derived(
  paginatedTransactions,
  ($store) => $store.filters
);