import { writable, derived } from "svelte/store";
import type { Transaction, Category } from "$lib/types/transaction";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3006/api";

// Transaction Store using Backend APIs
function createApiTransactionStore() {
  // Start with fake data for debugging
  const fakeTransaction: Transaction = {
    id: "fake-1",
    amount: -50,
    date: "2025-01-15",
    merchant: "Test Store",
    description: "Test transaction",
    createdAt: new Date("2025-01-15T00:00:00Z"),
    time: "12:00:00",
    categoryId: undefined,
    category: undefined,
    status: "completed" as const,
    tags: [],
    patternHash: undefined,
    hash: undefined,
    updatedAt: new Date("2025-01-15T00:00:00Z"),
    hidden: false,
    notes: undefined,
  };

  const { subscribe, set, update } = writable<Transaction[]>([]);

  return {
    subscribe,

    // Load transactions from API
    async load() {
      try {
        // Always load ALL transactions including hidden ones
        // The frontend will handle filtering based on user preference
        const response = await fetch(
          `${API_BASE}/transactions?includeHidden=true`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load transactions: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data.transactions) {
          const transactions =
            result.data.transactions.map(mapApiToTransaction).filter((t: Transaction | undefined): t is Transaction => t !== undefined);
          set(transactions);
        } else {
          set([]);
        }
      } catch (error) {
        console.error("❌ Failed to load transactions from API:", error);
        set([]);
      }
    },

    // Add new transaction
    async add(transaction: Omit<Transaction, "id" | "createdAt">) {
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.abs(transaction.amount),
            currency: "EUR", // Default currency
            date: transaction.date.split("T")[0], // Format as YYYY-MM-DD
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
          update((transactions) => [newTransaction, ...transactions]);
          return newTransaction;
        }
      } catch (error) {
        console.error("Failed to add transaction:", error);
        throw error;
      }
    },

    // Update transaction with optimistic updates
    async update(id: string, updates: Partial<Transaction>) {
      // Store the original transaction for rollback
      let originalTransaction: Transaction | undefined;

      // Optimistic update - update UI immediately
      update((transactions) => {
        originalTransaction = transactions.find((t) => t.id === id);
        if (!originalTransaction) return transactions;

        // Apply ONLY the provided updates, keeping all other fields intact
        const updatedTransaction = { ...originalTransaction };

        // Only update fields that are explicitly provided (not undefined)
        Object.keys(updates).forEach((key) => {
          if (updates[key as keyof Transaction] !== undefined) {
            (updatedTransaction as any)[key] =
              updates[key as keyof Transaction];
          }
        });

        return transactions.map((t) => (t.id === id ? updatedTransaction : t));
      });

      try {
        // Prepare update payload for backend
        const payload: any = {
          description: updates.description,
          hidden: updates.hidden,
          categoryId: updates.categoryId,
        };

        // If amount is being updated, handle the type change
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

        // Update with the server response (in case server modified something)
        update((transactions) =>
          transactions.map((t) => (t.id === id ? updatedTransaction : t)).filter((t: Transaction | undefined): t is Transaction => t !== undefined),
        );
      } catch (error) {
        console.error("Failed to update transaction:", error);

        // Rollback on error
        if (originalTransaction) {
          update((transactions) =>
            transactions.map((t) => (t.id === id ? originalTransaction : t)).filter((t: Transaction | undefined): t is Transaction => t !== undefined),
          );
        }

        throw error;
      }
    },

    // Delete transaction
    async delete(id: string) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete transaction");
        }

        update((transactions) => transactions.filter((t) => t.id !== id));
      } catch (error) {
        console.error("Failed to delete transaction:", error);
        throw error;
      }
    },

    // Bulk update transactions (for now, update one by one - can be optimized later)
    async bulkUpdate(ids: string[], updates: Partial<Transaction>) {
      try {
        // For now, update each transaction individually
        // TODO: Implement bulk update API endpoint
        for (const id of ids) {
          await this.update(id, updates);
        }
      } catch (error) {
        console.error("Failed to bulk update transactions:", error);
        throw error;
      }
    },

    // Smart categorization with pattern matching
    async smartCategorize(
      transactionId: string,
      categoryId: string,
      options: {
        applyToAll?: boolean;
        applyToFuture?: boolean;
        createPattern?: boolean;
      } = {},
    ) {
      try {
        const response = await fetch(
          `${API_BASE}/transactions/${transactionId}/categorize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              categoryId,
              applyToAll: options.applyToAll || false,
              applyToFuture: options.applyToFuture ?? true,
              createPattern: options.createPattern ?? true,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to categorize transaction");
        }

        const result = await response.json();

        // Reload transactions to reflect changes
        if (result.success && result.categorizedCount > 0) {
          await this.load();
        }

        return result;
      } catch (error) {
        console.error("Failed to smart categorize:", error);
        throw error;
      }
    },

    // Apply category to pattern (backwards compatibility)
    async applyCategoryToPattern(transaction: Transaction, categoryId: string) {
      return this.smartCategorize(transaction.id, categoryId, {
        applyToAll: true,
      });
    },

    // Import from file
    async importFile(file: File, options: {
      currency?: string;
      duplicateDetectionEnabled?: boolean;
      skipDuplicates?: boolean;
      autoCategorizationEnabled?: boolean;
    } = {}) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("currency", options.currency || "EUR");
        formData.append(
          "duplicateDetectionEnabled",
          String(options.duplicateDetectionEnabled ?? true),
        );
        formData.append(
          "skipDuplicates",
          String(options.skipDuplicates ?? true),
        );
        formData.append(
          "autoCategorizationEnabled",
          String(options.autoCategorizationEnabled ?? true),
        );

        const response = await fetch(`${API_BASE}/import/csv`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to import file");
        }

        const result = await response.json();

        // Reload transactions after successful import
        await this.load();

        return result.data;
      } catch (error) {
        console.error("Failed to import file:", error);
        throw error;
      }
    },

    // Generate hashes using backend service
    async generateHashes(
      transactions: Array<{
        date: string;
        merchant: string;
        amount: number;
        currency?: string;
      }>,
    ) {
      try {
        const response = await fetch(`${API_BASE}/import/generate-hashes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transactions }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate hashes");
        }

        const result = await response.json();

        return result.data;
      } catch (error) {
        console.error("❌ Frontend: Failed to generate hashes:", error);
        throw error;
      }
    },

    // Check which hashes are duplicates
    async checkDuplicates(hashes: string[]) {
      try {
        const response = await fetch(`${API_BASE}/import/check-duplicates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hashes }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to check duplicates");
        }

        const result = await response.json();

        return result.data;
      } catch (error) {
        console.error("❌ Frontend: Failed to check duplicates:", error);
        throw error;
      }
    },

    // Import selected transactions only
    async importSelectedTransactions(selectedTransactions: any[]) {
      try {
        const requestBody = {
          transactions: selectedTransactions.map((tx) => ({
            hash: tx.hash,
            date: tx.date,
            merchant:
              tx.partner && tx.partner.trim().length >= 2
                ? tx.partner.trim()
                : "Unknown Merchant",
            amount: tx.amount,
            description: tx.description || "",
            currency: "EUR",
          })),
          currency: "EUR",
          duplicateDetectionEnabled: true,
          skipDuplicates: true,
          autoCategorizationEnabled: true,
        };

        const response = await fetch(`${API_BASE}/import/selected`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || "Failed to import selected transactions",
          );
        }

        const result = await response.json();

        // Reload transactions after successful import
        await this.load();

        return result.data;
      } catch (error) {
        console.error("Failed to import selected transactions:", error);
        throw error;
      }
    },

    // Get statistics
    async getStats(startDate?: string, endDate?: string, currency = "EUR") {
      try {
        const params = new URLSearchParams({
          startDate: startDate || "2020-01-01",
          endDate: endDate || "2030-12-31",
          currency,
        });

        const response = await fetch(
          `${API_BASE}/transactions/statistics?${params}`,
        );
        if (!response.ok) {
          throw new Error("Failed to get statistics");
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error("Failed to get statistics:", error);
        return {
          totalIncome: 0,
          totalExpenses: 0,
          totalInvestments: 0,
          transactionCount: 0,
        };
      }
    },
  };
}

// Helper function to map API category to frontend format
function mapApiToCategory(apiCategory: any): Category {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    type: apiCategory.type,
    color: apiCategory.color || "#3B82F6",
    icon: apiCategory.icon || "💰",
    annualBudget: 0, // API doesn't have annualBudget yet, keeping for frontend compatibility
  };
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
    category: undefined, // Will be populated separately if needed
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

// Category Store using Backend APIs
function createApiCategoryStore() {
  const { subscribe, set, update } = writable<Category[]>([]);

  return {
    subscribe,

    async load() {
      try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          // Map API response to frontend Category format
          const categories = result.data.map(mapApiToCategory);
          set(categories);
        } else {
          console.warn("No categories found, setting empty array");
          set([]);
        }
      } catch (error) {
        console.error("❌ Failed to load categories from API:", error);
        set([]);
      }
    },

    async add(category: Omit<Category, "id">) {
      try {
        const response = await fetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: category.name,
            type: category.type,
            color: category.color || "#3B82F6",
            icon: category.icon || "💰",
            annualBudget: category.annualBudget || 0,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create category");
        }

        const result = await response.json();
        if (result.success) {
          const newCategory = mapApiToCategory(result.data);
          update((categories) => [...categories, newCategory]);
          return newCategory;
        }
      } catch (error) {
        console.error("Failed to add category:", error);
        throw error;
      }
    },

    async update(id: string, updates: Partial<Category>) {
      try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update category");
        }

        const result = await response.json();
        if (result.success) {
          const updatedCategory = mapApiToCategory(result.data);
          update((categories) =>
            categories.map((c) => (c.id === id ? updatedCategory : c)),
          );
        }
      } catch (error) {
        console.error("Failed to update category:", error);
        throw error;
      }
    },

    async delete(id: string) {
      try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete category");
        }

        update((categories) => categories.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Failed to delete category:", error);
        throw error;
      }
    },

    async clear() {
      try {
        const response = await fetch(`${API_BASE}/categories`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to clear categories");
        }

        set([]);
      } catch (error) {
        console.error("Failed to clear categories:", error);
        throw error;
      }
    },
  };
}

// Export API-based stores
export const apiTransactions = createApiTransactionStore();
export const apiCategories = createApiCategoryStore();

// Derived stores
export const apiSelectedTransactions = writable<Set<string>>(new Set());

export const apiFilteredTransactions = derived(
  [apiTransactions, apiSelectedTransactions],
  ([$transactions, $selected]) => {
    return {
      all: $transactions,
      selected: $transactions.filter((t) => $selected.has(t.id)),
    };
  },
);

export const apiTransactionStats = derived(apiTransactions, ($transactions) => {
  // Exclude hidden transactions from statistics
  const visibleTransactions = $transactions.filter((t) => !t.hidden);

  const income = visibleTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = visibleTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = income - expenses;

  return {
    income,
    expenses,
    balance,
    transactionCount: visibleTransactions.length,
  };
});
