import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Transaction, Category, CategoryRule } from '$lib/types/transaction';

// Transaction Store with persistence
function createTransactionStore() {
  const { subscribe, set, update } = writable<Transaction[]>([]);
  
  return {
    subscribe,
    
    // Load transactions from DB
    async load() {
      if (!browser) return;
      
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        set(data);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    },
    
    // Add new transaction
    async add(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      
      if (response.ok) {
        const newTransaction = await response.json();
        update(transactions => [newTransaction, ...transactions]);
        return newTransaction;
      }
    },
    
    // Update transaction
    async update(id: string, updates: Partial<Transaction>) {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updated = await response.json();
        update(transactions => 
          transactions.map(t => t.id === id ? updated : t)
        );
      }
    },
    
    // Delete transaction
    async delete(id: string) {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        update(transactions => 
          transactions.filter(t => t.id !== id)
        );
      }
    },
    
    // Bulk actions
    async bulkUpdate(ids: string[], updates: Partial<Transaction>) {
      const response = await fetch('/api/transactions/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates })
      });
      
      if (response.ok) {
        update(transactions => 
          transactions.map(t => 
            ids.includes(t.id) ? { ...t, ...updates } : t
          )
        );
      }
    },
    
    // Apply category to all similar transactions
    async applyCategoryToPattern(transaction: Transaction, categoryId: string) {
      const patternHash = generatePatternHash(transaction);
      
      const response = await fetch('/api/transactions/categorize-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patternHash, 
          categoryId,
          merchant: transaction.merchant 
        })
      });
      
      if (response.ok) {
        const updated = await response.json();
        set(updated);
      }
    }
  };
}

// Category Store
function createCategoryStore() {
  const { subscribe, set, update } = writable<Category[]>([
    // Default categories
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
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      
      if (response.ok) {
        const newCategory = await response.json();
        update(categories => [...categories, newCategory]);
        return newCategory;
      }
    },
    
    async update(id: string, updates: Partial<Category>) {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        update(categories => 
          categories.map(c => c.id === id ? { ...c, ...updates } : c)
        );
      }
    }
  };
}

// Category Rules Store (for automatic categorization)
function createCategoryRulesStore() {
  const { subscribe, set, update } = writable<CategoryRule[]>([]);
  
  return {
    subscribe,
    
    async load() {
      const response = await fetch('/api/category-rules');
      const rules = await response.json();
      set(rules);
    },
    
    async add(rule: Omit<CategoryRule, 'id'>) {
      const response = await fetch('/api/category-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      
      if (response.ok) {
        const newRule = await response.json();
        update(rules => [...rules, newRule]);
        return newRule;
      }
    }
  };
}

// Helper function to generate pattern hash
export function generatePatternHash(transaction: Transaction): string {
  // Create a normalized string from merchant and description
  // Remove amounts, dates, and variable parts
  const normalized = `${transaction.merchant.toLowerCase()}_${
    transaction.description
      .toLowerCase()
      .replace(/\d+/g, '') // Remove numbers
      .replace(/\s+/g, '_') // Replace spaces
      .trim()
  }`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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
      selected: $transactions.filter(t => $selected.has(t.id))
    };
  }
);

export const transactionStats = derived(
  transactions,
  ($transactions) => {
    const income = $transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = $transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    return {
      income,
      expenses,
      balance,
      transactionCount: $transactions.length
    };
  }
);
