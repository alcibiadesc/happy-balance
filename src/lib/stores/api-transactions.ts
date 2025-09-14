import { writable, derived } from 'svelte/store';
import type { Transaction, Category } from '$lib/types/transaction';

const API_BASE = (typeof window !== 'undefined' && (window as any).ENV?.VITE_API_URL) || (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// Transaction Store using Backend APIs
function createApiTransactionStore() {
  // Start with fake data for debugging
  const fakeTransaction: Transaction = {
    id: 'fake-1',
    amount: -50,
    currency: 'EUR',
    date: '2025-01-15',
    merchant: 'Test Store',
    description: 'Test transaction',
    createdAt: '2025-01-15T00:00:00Z'
  };

  const { subscribe, set, update } = writable<Transaction[]>([]);

  return {
    subscribe,

    // Load transactions from API
    async load() {
      console.log('🔄 Loading transactions from API...');
      try {
        const response = await fetch(`${API_BASE}/transactions`);
        console.log('📡 API Response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to load transactions: ${response.status}`);
        }

        const result = await response.json();
        console.log('📊 API Result:', result);
        if (result.success && result.data.transactions) {
          const transactions = result.data.transactions.map(mapApiToTransaction);
          console.log('✅ Loaded transactions from API:', transactions.length, transactions);
          set(transactions);
        } else {
          console.log('❌ No transactions found in API response');
          set([]);
        }
      } catch (error) {
        console.error('❌ Failed to load transactions from API:', error);
        set([]);
      }
    },

    // Add new transaction
    async add(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.abs(transaction.amount),
            currency: transaction.currency,
            date: transaction.date.split('T')[0], // Format as YYYY-MM-DD
            merchant: transaction.merchant,
            type: transaction.amount < 0 ? 'EXPENSE' : 'INCOME',
            description: transaction.description || ''
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create transaction');
        }

        const result = await response.json();
        if (result.success) {
          const newTransaction = mapApiToTransaction(result.data);
          update(transactions => [newTransaction, ...transactions]);
          return newTransaction;
        }
      } catch (error) {
        console.error('Failed to add transaction:', error);
        throw error;
      }
    },

    // Update transaction
    async update(id: string, updates: Partial<Transaction>) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: updates.description
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update transaction');
        }

        update(transactions =>
          transactions.map(t => t.id === id ? { ...t, ...updates } : t)
        );
      } catch (error) {
        console.error('Failed to update transaction:', error);
        throw error;
      }
    },

    // Delete transaction
    async delete(id: string) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete transaction');
        }

        update(transactions => transactions.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete transaction:', error);
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
        console.error('Failed to bulk update transactions:', error);
        throw error;
      }
    },

    // Apply category to pattern (for now, just update the single transaction)
    async applyCategoryToPattern(transaction: Transaction, categoryId: string) {
      try {
        // For now, just update the single transaction
        // TODO: Implement pattern matching API endpoint
        await this.update(transaction.id, { categoryId });
      } catch (error) {
        console.error('Failed to apply category to pattern:', error);
        throw error;
      }
    },

    // Import from file
    async importFile(file: File, options = {}) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('currency', options.currency || 'EUR');
        formData.append('duplicateDetectionEnabled', String(options.duplicateDetectionEnabled ?? true));
        formData.append('skipDuplicates', String(options.skipDuplicates ?? true));
        formData.append('autoCategorizationEnabled', String(options.autoCategorizationEnabled ?? true));

        const response = await fetch(`${API_BASE}/import/csv`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import file');
        }

        const result = await response.json();
        console.log('Import result:', result.data);

        // Reload transactions after successful import
        await this.load();

        return result.data;
      } catch (error) {
        console.error('Failed to import file:', error);
        throw error;
      }
    },

    // Check which hashes are duplicates
    async checkDuplicates(hashes: string[]) {
      try {
        console.log('🔍 Frontend: Checking duplicates for hashes:', hashes.length);

        const response = await fetch(`${API_BASE}/import/check-duplicates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ hashes })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to check duplicates');
        }

        const result = await response.json();
        console.log('✅ Frontend: Duplicate check result:', result.data);

        return result.data;
      } catch (error) {
        console.error('❌ Frontend: Failed to check duplicates:', error);
        throw error;
      }
    },

    // Import selected transactions only
    async importSelectedTransactions(selectedTransactions: any[]) {
      try {
        console.log('🔄 Frontend: Preparing to import selected transactions:', selectedTransactions.length);

        const requestBody = {
          transactions: selectedTransactions.map(tx => ({
            hash: tx.hash,
            date: tx.date,
            merchant: tx.partner && tx.partner.trim().length >= 2 ? tx.partner.trim() : 'Unknown Merchant',
            amount: tx.amount,
            description: tx.description || '',
            currency: 'EUR'
          })),
          currency: 'EUR',
          duplicateDetectionEnabled: true,
          skipDuplicates: true,
          autoCategorizationEnabled: true
        };

        console.log('📤 Frontend: Request body:', requestBody);

        const response = await fetch(`${API_BASE}/import/selected`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import selected transactions');
        }

        const result = await response.json();
        console.log('Import selected transactions result:', result.data);

        // Reload transactions after successful import
        await this.load();

        return result.data;
      } catch (error) {
        console.error('Failed to import selected transactions:', error);
        throw error;
      }
    },

    // Get statistics
    async getStats(startDate?: string, endDate?: string, currency = 'EUR') {
      try {
        const params = new URLSearchParams({
          startDate: startDate || '2020-01-01',
          endDate: endDate || '2030-12-31',
          currency
        });

        const response = await fetch(`${API_BASE}/transactions/statistics?${params}`);
        if (!response.ok) {
          throw new Error('Failed to get statistics');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Failed to get statistics:', error);
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

// Helper function to map API transaction to frontend format
function mapApiToTransaction(apiTransaction: any): Transaction {
  return {
    id: apiTransaction.id,
    date: apiTransaction.date,
    time: new Date(apiTransaction.createdAt).toLocaleTimeString(),
    merchant: apiTransaction.merchant,
    description: apiTransaction.description || '',
    amount: apiTransaction.type === 'EXPENSE' ? -apiTransaction.amount : apiTransaction.amount,
    categoryId: apiTransaction.categoryId,
    category: undefined, // Will be populated separately if needed
    status: 'completed' as const,
    tags: [],
    patternHash: undefined,
    hash: apiTransaction.hash,
    createdAt: new Date(apiTransaction.createdAt),
    updatedAt: new Date(apiTransaction.updatedAt || apiTransaction.createdAt),
    hidden: false,
    notes: undefined
  };
}

// Category Store using Backend APIs (placeholder for now)
function createApiCategoryStore() {
  const { subscribe, set } = writable<Category[]>([
    // Default categories - in the future we'll load from API
    { id: '1', name: 'Food & Groceries', type: 'essential', color: '#f5796c', icon: '🍽️' },
    { id: '2', name: 'Transport', type: 'essential', color: '#7abaa5', icon: '🚇' },
    { id: '3', name: 'Entertainment', type: 'discretionary', color: '#fecd2c', icon: '🎬' },
    { id: '4', name: 'Utilities', type: 'essential', color: '#023c46', icon: '⚡' },
    { id: '5', name: 'Income', type: 'income', color: '#7abaa5', icon: '💰' },
    { id: '6', name: 'Investment', type: 'investment', color: '#023c46', icon: '📈' }
  ]);

  return {
    subscribe,
    async add(category: Omit<Category, 'id'>) {
      // TODO: Implement API call when categories API is ready
      const newCategory = {
        ...category,
        id: crypto.randomUUID?.() || `cat-${Date.now()}`
      };
      return newCategory;
    }
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
      selected: $transactions.filter(t => $selected.has(t.id))
    };
  }
);

export const apiTransactionStats = derived(
  apiTransactions,
  ($transactions) => {
    // Exclude hidden transactions from statistics
    const visibleTransactions = $transactions.filter(t => !t.hidden);

    const income = visibleTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = visibleTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;

    return {
      income,
      expenses,
      balance,
      transactionCount: visibleTransactions.length
    };
  }
);