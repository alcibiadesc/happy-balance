/**
 * Tests for centralized Zod validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  createTransactionSchema,
  createCategorySchema,
  createInvestmentSchema,
  paginationSchema,
  transactionFiltersSchema,
} from '../../../infrastructure/validation/schemas';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        username: 'testuser',
        password: 'testpass123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty username', () => {
      const result = loginSchema.safeParse({
        username: '',
        password: 'testpass123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        username: 'testuser',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        email: 'test@example.com',
        password: 'securepass123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short username', () => {
      const result = registerSchema.safeParse({
        username: 'ab',
        email: 'test@example.com',
        password: 'securepass123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        email: 'invalid-email',
        password: 'securepass123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        email: 'test@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Transaction Schemas', () => {
  describe('createTransactionSchema', () => {
    it('should validate correct transaction data', () => {
      const result = createTransactionSchema.safeParse({
        date: '2024-01-15T10:30:00.000Z',
        description: 'Test transaction',
        amount: 100.50,
        type: 'expense',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional categoryId', () => {
      const result = createTransactionSchema.safeParse({
        date: '2024-01-15T10:30:00.000Z',
        description: 'Test transaction',
        amount: 100.50,
        type: 'income',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = createTransactionSchema.safeParse({
        date: '2024-01-15T10:30:00.000Z',
        description: 'Test',
        amount: 100,
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('transactionFiltersSchema', () => {
    it('should apply default pagination', () => {
      const result = transactionFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers', () => {
      const result = transactionFiltersSchema.safeParse({
        page: '2',
        limit: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });
  });
});

describe('Category Schemas', () => {
  describe('createCategorySchema', () => {
    it('should validate minimal category', () => {
      const result = createCategorySchema.safeParse({
        name: 'Food',
      });
      expect(result.success).toBe(true);
    });

    it('should validate full category', () => {
      const result = createCategorySchema.safeParse({
        name: 'Food',
        icon: '🍕',
        color: '#FF5733',
        type: 'expense',
        budget: 500,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const result = createCategorySchema.safeParse({
        name: 'Food',
        color: 'red',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Investment Schemas', () => {
  describe('createInvestmentSchema', () => {
    it('should validate correct investment data', () => {
      const result = createInvestmentSchema.safeParse({
        name: 'Bitcoin',
        currentValue: 50000,
        currency: 'EUR',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative currentValue', () => {
      const result = createInvestmentSchema.safeParse({
        name: 'Bad Investment',
        currentValue: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency code', () => {
      const result = createInvestmentSchema.safeParse({
        name: 'Test',
        currentValue: 1000,
        currency: 'EURO',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Pagination Schema', () => {
  it('should enforce maximum limit', () => {
    const result = paginationSchema.safeParse({
      page: 1,
      limit: 500,
    });
    expect(result.success).toBe(false);
  });

  it('should reject page less than 1', () => {
    const result = paginationSchema.safeParse({
      page: 0,
      limit: 20,
    });
    expect(result.success).toBe(false);
  });
});
