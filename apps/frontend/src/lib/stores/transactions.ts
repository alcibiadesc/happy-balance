import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import type {
  Transaction,
  Category,
  CategoryRule,
} from "$lib/types/transaction";

// Transaction Store with persistence
function createTransactionStore() {
  const { subscribe, set, update } = writable<Transaction[]>([]);

  return {
    subscribe,

    // Load transactions from localStorage
    async load() {
      if (!browser) return;

      try {
        // Load from localStorage
        const stored = localStorage.getItem("transactions");
        if (stored) {
          const transactions = JSON.parse(stored);
          set(transactions);
          return;
        }
      } catch (error) {
        console.warn("Failed to load from localStorage:", error);
      }

      // If localStorage fails or is empty, use empty array
      set([]);
    },

    // Add new transaction
    async add(transaction: Omit<Transaction, "id" | "createdAt">) {
      const newTransaction = {
        ...transaction,
        id: crypto.randomUUID?.() || `tx-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
      };

      try {
        const existing = JSON.parse(
          localStorage.getItem("transactions") || "[]",
        );
        const updated = [newTransaction, ...existing];
        localStorage.setItem("transactions", JSON.stringify(updated));
        update((transactions) => [newTransaction, ...transactions]);
        return newTransaction;
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
        // At least update the store
        update((transactions) => [newTransaction, ...transactions]);
        return newTransaction;
      }
    },

    // Update transaction
    async update(id: string, updates: Partial<Transaction>) {
      update((transactions) => {
        const updated = transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        );
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },

    // Delete transaction
    async delete(id: string) {
      update((transactions) => {
        const updated = transactions.filter((t) => t.id !== id);
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },

    // Bulk actions
    async bulkUpdate(ids: string[], updates: Partial<Transaction>) {
      update((transactions) => {
        const updated = transactions.map((t) =>
          ids.includes(t.id) ? { ...t, ...updates } : t,
        );
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },

    // Apply category to all similar transactions
    async applyCategoryToPattern(transaction: Transaction, categoryId: string) {
      const patternHash = generatePatternHash(transaction);
      update((transactions) => {
        const updated = transactions.map((t) =>
          generatePatternHash(t) === patternHash ? { ...t, categoryId } : t,
        );
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },
  };
}

// Category Store
function createCategoryStore() {
  const { subscribe, set, update } = writable<Category[]>([
    // Default categories
    {
      id: "1",
      name: "Food & Groceries",
      type: "essential",
      color: "#f5796c",
      icon: "🍽️",
    },
    {
      id: "2",
      name: "Transport",
      type: "essential",
      color: "#7abaa5",
      icon: "🚇",
    },
    {
      id: "3",
      name: "Entertainment",
      type: "discretionary",
      color: "#fecd2c",
      icon: "🎬",
    },
    {
      id: "4",
      name: "Utilities",
      type: "essential",
      color: "#023c46",
      icon: "⚡",
    },
    { id: "5", name: "Income", type: "income", color: "#7abaa5", icon: "💰" },
    {
      id: "6",
      name: "Investment",
      type: "investment",
      color: "#023c46",
      icon: "📈",
    },
  ]);

  return {
    subscribe,

    async add(category: Omit<Category, "id">) {
      const newCategory = {
        ...category,
        id: crypto.randomUUID?.() || `cat-${Date.now()}-${Math.random()}`,
      };
      update((categories) => [...categories, newCategory]);
      return newCategory;
    },

    async update(id: string, updates: Partial<Category>) {
      update((categories) =>
        categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
  };
}

// Category Rules Store (for automatic categorization)
function createCategoryRulesStore() {
  const { subscribe, set, update } = writable<CategoryRule[]>([]);

  return {
    subscribe,

    async load() {
      // For now, just set empty rules - we can add localStorage support later if needed
      set([]);
    },

    async add(rule: Omit<CategoryRule, "id">) {
      const newRule = {
        ...rule,
        id: crypto.randomUUID?.() || `rule-${Date.now()}-${Math.random()}`,
      };
      update((rules) => [...rules, newRule]);
      return newRule;
    },
  };
}

// Helper function to generate pattern hash
export function generatePatternHash(transaction: Transaction): string {
  // Create a normalized string from merchant and description
  // Remove amounts, dates, and variable parts
  const normalized = `${transaction.merchant.toLowerCase()}_${transaction.description
    .toLowerCase()
    .replace(/\d+/g, "") // Remove numbers
    .replace(/\s+/g, "_") // Replace spaces
    .trim()}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(36);
}

// Export stores
export const transactions = createTransactionStore();
export const categories = createCategoryStore();
export const categoryRules = createCategoryRulesStore();

// Derived stores for filtering and calculations
export const selectedTransactions = writable<Set<string>>(new Set());

export const filteredTransactions = derived(
  [transactions, selectedTransactions],
  ([$transactions, $selected]) => {
    return {
      all: $transactions,
      selected: $transactions.filter((t) => $selected.has(t.id)),
    };
  },
);

export const transactionStats = derived(transactions, ($transactions) => {
  const income = $transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = $transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = income - expenses;

  return {
    income,
    expenses,
    balance,
    transactionCount: $transactions.length,
  };
});
