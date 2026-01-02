import { describe, it, expect } from 'vitest';
import {
  mapApiToTransaction,
  mapApiToCategory,
  prepareTransactionUpdatePayload,
} from '../transaction-mapper';

describe('Transaction Mapper', () => {
  describe('mapApiToTransaction', () => {
    it('should map expense transaction correctly', () => {
      const apiTransaction = {
        id: 'tx-123',
        date: '2025-01-15',
        merchant: 'Supermarket',
        description: 'Weekly groceries',
        amount: 150.5,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        hash: 'abc123',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
        hidden: false,
        observations: 'Test observation',
        splitPercentage: 50,
        linkedTransactionId: 'tx-456',
        isReimbursement: false,
      };

      const result = mapApiToTransaction(apiTransaction);

      expect(result.id).toBe('tx-123');
      expect(result.date).toBe('2025-01-15');
      expect(result.merchant).toBe('Supermarket');
      expect(result.description).toBe('Weekly groceries');
      expect(result.amount).toBe(-150.5); // Negative for expense
      expect(result.categoryId).toBe('cat-1');
      expect(result.hash).toBe('abc123');
      expect(result.hidden).toBe(false);
      expect(result.observations).toBe('Test observation');
      expect(result.splitPercentage).toBe(50);
      expect(result.linkedTransactionId).toBe('tx-456');
      expect(result.isReimbursement).toBe(false);
      expect(result.status).toBe('completed');
      expect(result.tags).toEqual([]);
    });

    it('should map income transaction with positive amount', () => {
      const apiTransaction = {
        id: 'tx-456',
        date: '2025-01-20',
        merchant: 'Company Inc',
        description: 'Salary',
        amount: 3000,
        type: 'INCOME',
        categoryId: 'cat-income',
        createdAt: '2025-01-20T09:00:00Z',
      };

      const result = mapApiToTransaction(apiTransaction);

      expect(result.amount).toBe(3000); // Positive for income
    });

    it('should handle missing optional fields', () => {
      const apiTransaction = {
        id: 'tx-789',
        date: '2025-01-25',
        merchant: 'Store',
        amount: 50,
        type: 'EXPENSE',
        createdAt: '2025-01-25T14:00:00Z',
      };

      const result = mapApiToTransaction(apiTransaction);

      expect(result.description).toBe('');
      expect(result.categoryId).toBeUndefined();
      expect(result.hidden).toBe(false);
      expect(result.observations).toBeUndefined();
      expect(result.isReimbursement).toBe(false);
    });

    it('should format time correctly', () => {
      const apiTransaction = {
        id: 'tx-1',
        date: '2025-01-15',
        merchant: 'Test',
        amount: 10,
        type: 'EXPENSE',
        createdAt: '2025-01-15T14:30:00Z',
      };

      const result = mapApiToTransaction(apiTransaction);

      // Time should be in HH:MM format
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should create Date objects for timestamps', () => {
      const apiTransaction = {
        id: 'tx-1',
        date: '2025-01-15',
        merchant: 'Test',
        amount: 10,
        type: 'EXPENSE',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-16T11:00:00Z',
      };

      const result = mapApiToTransaction(apiTransaction);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('mapApiToCategory', () => {
    it('should map category with all fields', () => {
      const apiCategory = {
        id: 'cat-123',
        name: 'Food & Groceries',
        type: 'essential',
        color: '#FF5733',
        icon: '🍕',
        annualBudget: 6000,
      };

      const result = mapApiToCategory(apiCategory);

      expect(result.id).toBe('cat-123');
      expect(result.name).toBe('Food & Groceries');
      expect(result.type).toBe('essential');
      expect(result.color).toBe('#FF5733');
      expect(result.icon).toBe('🍕');
      expect(result.annualBudget).toBe(6000);
    });

    it('should use default values for missing fields', () => {
      const apiCategory = {
        id: 'cat-456',
        name: 'New Category',
        type: 'discretionary',
      };

      const result = mapApiToCategory(apiCategory);

      expect(result.color).toBe('#3B82F6'); // Default blue
      expect(result.icon).toBe('💰'); // Default icon
      expect(result.annualBudget).toBe(0);
    });
  });

  describe('prepareTransactionUpdatePayload', () => {
    it('should include only provided fields', () => {
      const updates = {
        description: 'Updated description',
        hidden: true,
      };

      const payload = prepareTransactionUpdatePayload(updates);

      expect(payload.description).toBe('Updated description');
      expect(payload.hidden).toBe(true);
      expect(payload.categoryId).toBeUndefined();
      expect(payload.observations).toBeUndefined();
    });

    it('should handle categoryId including null', () => {
      const updates = {
        categoryId: null,
      };

      const payload = prepareTransactionUpdatePayload(updates as any);

      expect(payload.categoryId).toBeNull(); // Allow null to clear category
    });

    it('should convert amount to absolute and set type', () => {
      const expenseUpdates = { amount: -100 };
      const incomeUpdates = { amount: 200 };

      const expensePayload = prepareTransactionUpdatePayload(expenseUpdates);
      const incomePayload = prepareTransactionUpdatePayload(incomeUpdates);

      expect(expensePayload.amount).toBe(100);
      expect(expensePayload.type).toBe('EXPENSE');

      expect(incomePayload.amount).toBe(200);
      expect(incomePayload.type).toBe('INCOME');
    });

    it('should include observations when provided', () => {
      const updates = {
        observations: 'This is a note',
      };

      const payload = prepareTransactionUpdatePayload(updates);

      expect(payload.observations).toBe('This is a note');
    });

    it('should include splitPercentage when provided', () => {
      const updates = {
        splitPercentage: 75,
      };

      const payload = prepareTransactionUpdatePayload(updates);

      expect(payload.splitPercentage).toBe(75);
    });

    it('should return empty object for empty updates', () => {
      const payload = prepareTransactionUpdatePayload({});

      expect(Object.keys(payload).length).toBe(0);
    });

    it('should not include undefined values except categoryId', () => {
      const updates = {
        description: 'Test',
        hidden: undefined,
      };

      const payload = prepareTransactionUpdatePayload(updates);

      expect(payload.description).toBe('Test');
      expect('hidden' in payload).toBe(false);
    });

    it('should include categoryId when explicitly set (even as undefined)', () => {
      // categoryId uses 'in' check to allow clearing category with null/undefined
      const updates = {
        categoryId: undefined,
      };

      const payload = prepareTransactionUpdatePayload(updates as any);

      // The 'in' check means categoryId is included if property exists
      expect('categoryId' in payload).toBe(true);
    });
  });
});
