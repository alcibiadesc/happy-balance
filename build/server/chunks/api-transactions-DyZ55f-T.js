import { w as writable, d as derived } from './index-CMV7aPAw.js';

const API_BASE = "http://localhost:3008/api";
function createApiTransactionStore() {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    // Load transactions from API
    async load() {
      try {
        const response = await fetch(
          `${API_BASE}/transactions?includeHidden=true`
        );
        if (!response.ok) {
          throw new Error(`Failed to load transactions: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data.transactions) {
          const transactions = result.data.transactions.map(mapApiToTransaction).filter(
            (t) => t !== void 0
          );
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
    async add(transaction) {
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: Math.abs(transaction.amount),
            currency: "EUR",
            // Default currency
            date: transaction.date.split("T")[0],
            // Format as YYYY-MM-DD
            merchant: transaction.merchant,
            type: transaction.amount < 0 ? "EXPENSE" : "INCOME",
            description: transaction.description || ""
          })
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
    async update(id, updates) {
      let originalTransaction;
      update((transactions) => {
        originalTransaction = transactions.find((t) => t.id === id);
        if (!originalTransaction) return transactions;
        const updatedTransaction = { ...originalTransaction };
        Object.keys(updates).forEach((key) => {
          if (updates[key] !== void 0) {
            updatedTransaction[key] = updates[key];
          }
        });
        return transactions.map((t) => t.id === id ? updatedTransaction : t);
      });
      try {
        const payload = {};
        if (updates.description !== void 0) payload.description = updates.description;
        if (updates.hidden !== void 0) payload.hidden = updates.hidden;
        if (updates.categoryId !== void 0) {
          payload.categoryId = updates.categoryId;
          console.log("🔄 Setting categoryId in payload:", updates.categoryId);
        }
        if (updates.observations !== void 0) payload.observations = updates.observations;
        if (updates.amount !== void 0) {
          payload.amount = Math.abs(updates.amount);
          payload.type = updates.amount < 0 ? "EXPENSE" : "INCOME";
        }
        console.log("🚀 Sending update request:", {
          transactionId: id,
          payload,
          originalUpdates: updates
        });
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update transaction");
        }
        const result = await response.json();
        const updatedTransaction = mapApiToTransaction(result.data);
        update(
          (transactions) => transactions.map((t) => t.id === id ? updatedTransaction : t).filter(
            (t) => t !== void 0
          )
        );
      } catch (error) {
        console.error("Failed to update transaction:", error);
        if (originalTransaction) {
          update(
            (transactions) => transactions.map((t) => t.id === id ? originalTransaction : t).filter(
              (t) => t !== void 0
            )
          );
        }
        throw error;
      }
    },
    // Delete transaction
    async delete(id) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: "DELETE"
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
    async bulkUpdate(ids, updates) {
      try {
        for (const id of ids) {
          await this.update(id, updates);
        }
      } catch (error) {
        console.error("Failed to bulk update transactions:", error);
        throw error;
      }
    },
    // Smart categorization with pattern matching
    async smartCategorize(transactionId, categoryId, options = {}) {
      try {
        const response = await fetch(
          `${API_BASE}/transactions/${transactionId}/categorize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              categoryId,
              applyToAll: options.applyToAll || false,
              applyToFuture: options.applyToFuture ?? true,
              createPattern: options.createPattern ?? true
            })
          }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to categorize transaction");
        }
        const result = await response.json();
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
    async applyCategoryToPattern(transaction, categoryId) {
      return this.smartCategorize(transaction.id, categoryId, {
        applyToAll: true
      });
    },
    // Import from file
    async importFile(file, options = {}) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("currency", options.currency || "EUR");
        formData.append(
          "duplicateDetectionEnabled",
          String(options.duplicateDetectionEnabled ?? true)
        );
        formData.append(
          "skipDuplicates",
          String(options.skipDuplicates ?? true)
        );
        formData.append(
          "autoCategorizationEnabled",
          String(options.autoCategorizationEnabled ?? true)
        );
        const response = await fetch(`${API_BASE}/import/csv`, {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to import file");
        }
        const result = await response.json();
        await this.load();
        return result.data;
      } catch (error) {
        console.error("Failed to import file:", error);
        throw error;
      }
    },
    // Generate hashes using backend service
    async generateHashes(transactions) {
      try {
        const response = await fetch(`${API_BASE}/import/generate-hashes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ transactions })
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
    async checkDuplicates(hashes) {
      try {
        const response = await fetch(`${API_BASE}/import/check-duplicates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ hashes })
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
    async importSelectedTransactions(selectedTransactions) {
      try {
        const requestBody = {
          transactions: selectedTransactions.map((tx) => ({
            hash: tx.hash,
            date: tx.date,
            merchant: tx.partner && tx.partner.trim().length >= 2 ? tx.partner.trim() : "Unknown Merchant",
            amount: tx.amount,
            description: tx.description || "",
            currency: "EUR"
          })),
          currency: "EUR",
          duplicateDetectionEnabled: true,
          skipDuplicates: true,
          autoCategorizationEnabled: true
        };
        const response = await fetch(`${API_BASE}/import/selected`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || "Failed to import selected transactions"
          );
        }
        const result = await response.json();
        await this.load();
        return result.data;
      } catch (error) {
        console.error("Failed to import selected transactions:", error);
        throw error;
      }
    },
    // Get statistics
    async getStats(startDate, endDate, currency = "EUR") {
      try {
        const params = new URLSearchParams({
          startDate: startDate || "2020-01-01",
          endDate: endDate || "2030-12-31",
          currency
        });
        const response = await fetch(
          `${API_BASE}/transactions/statistics?${params}`
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
          transactionCount: 0
        };
      }
    }
  };
}
function mapApiToCategory(apiCategory) {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    type: apiCategory.type,
    color: apiCategory.color || "#3B82F6",
    icon: apiCategory.icon || "💰",
    annualBudget: 0
    // API doesn't have annualBudget yet, keeping for frontend compatibility
  };
}
function mapApiToTransaction(apiTransaction) {
  return {
    id: apiTransaction.id,
    date: apiTransaction.date,
    time: new Date(apiTransaction.createdAt).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    merchant: apiTransaction.merchant,
    description: apiTransaction.description || "",
    amount: apiTransaction.type === "EXPENSE" ? -apiTransaction.amount : apiTransaction.amount,
    categoryId: apiTransaction.categoryId,
    category: void 0,
    // Will be populated separately if needed
    status: "completed",
    tags: [],
    patternHash: void 0,
    hash: apiTransaction.hash,
    createdAt: new Date(apiTransaction.createdAt),
    updatedAt: new Date(apiTransaction.updatedAt || apiTransaction.createdAt),
    hidden: apiTransaction.hidden || false,
    observations: apiTransaction.observations || void 0
  };
}
function createApiCategoryStore() {
  const { subscribe, set, update } = writable([]);
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
    async add(category) {
      try {
        const response = await fetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: category.name,
            type: category.type,
            color: category.color || "#3B82F6",
            icon: category.icon || "💰",
            annualBudget: category.annualBudget || 0
          })
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
    async update(id, updates) {
      try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updates)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update category");
        }
        const result = await response.json();
        if (result.success) {
          const updatedCategory = mapApiToCategory(result.data);
          update(
            (categories) => categories.map((c) => c.id === id ? updatedCategory : c)
          );
        }
      } catch (error) {
        console.error("Failed to update category:", error);
        throw error;
      }
    },
    async delete(id) {
      try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
          method: "DELETE"
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
          method: "DELETE"
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
    }
  };
}
const apiTransactions = createApiTransactionStore();
const apiCategories = createApiCategoryStore();
const apiSelectedTransactions = writable(/* @__PURE__ */ new Set());
derived(
  [apiTransactions, apiSelectedTransactions],
  ([$transactions, $selected]) => {
    return {
      all: $transactions,
      selected: $transactions.filter((t) => $selected.has(t.id))
    };
  }
);
derived(apiTransactions, ($transactions) => {
  const visibleTransactions = $transactions.filter((t) => !t.hidden);
  const income = visibleTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = visibleTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = income - expenses;
  return {
    income,
    expenses,
    balance,
    transactionCount: visibleTransactions.length
  };
});

export { apiCategories as a, apiSelectedTransactions as b, apiTransactions as c };
//# sourceMappingURL=api-transactions-DyZ55f-T.js.map
