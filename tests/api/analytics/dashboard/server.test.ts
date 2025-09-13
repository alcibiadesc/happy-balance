import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './+server.js';

// Mock dependencies
vi.mock('$lib/infrastructure/repositories/PrismaTransactionRepository.js', () => ({
  PrismaTransactionRepository: vi.fn(() => ({
    findByDateRange: vi.fn()
  }))
}));

vi.mock('$lib/shared/utils/AppLogger.js', () => ({
  logger: {
    createChildLogger: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    }))
  }
}));

describe('Analytics Dashboard API', () => {
  let mockTransactionRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { PrismaTransactionRepository } = require('$lib/infrastructure/repositories/PrismaTransactionRepository.js');
    mockTransactionRepo = new PrismaTransactionRepository();
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard analytics successfully', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.50,
          description: 'Grocery Store',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE',
          accountId: 'account-1'
        },
        {
          id: '2',
          amount: -50.00,
          description: 'Gas Station',
          category: 'TRANSPORTATION',
          date: new Date('2025-01-16'),
          type: 'EXPENSE',
          accountId: 'account-1'
        },
        {
          id: '3',
          amount: 2500.00,
          description: 'Salary',
          category: 'INCOME',
          date: new Date('2025-01-01'),
          type: 'INCOME',
          accountId: 'account-1'
        },
        {
          id: '4',
          amount: 500.00,
          description: 'Freelance Work',
          category: 'INCOME',
          date: new Date('2025-01-10'),
          type: 'INCOME',
          accountId: 'account-2'
        }
      ];

      mockTransactionRepo.findByDateRange.mockResolvedValue(mockTransactions);

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      // Check summary
      expect(data.data.summary).toBeDefined();
      expect(data.data.summary.totalTransactions).toBe(4);
      expect(data.data.summary.totalIncome).toBe(3000.00);
      expect(data.data.summary.totalExpenses).toBe(150.50);
      expect(data.data.summary.netIncome).toBe(2849.50);
      
      // Check categories
      expect(data.data.categories).toBeDefined();
      expect(data.data.categories.income).toHaveLength(1);
      expect(data.data.categories.expenses).toHaveLength(2);
      expect(data.data.categories.income[0].category).toBe('INCOME');
      expect(data.data.categories.income[0].amount).toBe(3000.00);
      
      // Check time series
      expect(data.data.timeSeries).toBeDefined();
      expect(Array.isArray(data.data.timeSeries)).toBe(true);
      
      // Check accounts breakdown
      expect(data.data.accountsBreakdown).toBeDefined();
      expect(Array.isArray(data.data.accountsBreakdown)).toBe(true);
    });

    it('should handle custom date range', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -75.00,
          description: 'Coffee',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE',
          accountId: 'account-1'
        }
      ];

      mockTransactionRepo.findByDateRange.mockResolvedValue(mockTransactions);

      const url = new URL('http://localhost:3000/api/analytics/dashboard?from=2025-01-01&to=2025-01-31');
      const request = new Request(url.toString());
      
      const response = await GET({ request, url } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockTransactionRepo.findByDateRange).toHaveBeenCalledWith(
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-31T23:59:59.999Z')
      );
    });

    it('should default to last 6 months when no date range provided', async () => {
      mockTransactionRepo.findByDateRange.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockTransactionRepo.findByDateRange).toHaveBeenCalled();
      
      // Verify it was called with dates approximately 6 months ago to now
      const calls = mockTransactionRepo.findByDateRange.mock.calls;
      expect(calls).toHaveLength(1);
      const [fromDate, toDate] = calls[0];
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      expect(fromDate.getTime()).toBeLessThanOrEqual(sixMonthsAgo.getTime());
      expect(toDate.getTime()).toBeGreaterThanOrEqual(now.getTime() - 86400000); // Within last day
    });

    it('should handle empty transaction list', async () => {
      mockTransactionRepo.findByDateRange.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.summary.totalTransactions).toBe(0);
      expect(data.data.summary.totalIncome).toBe(0);
      expect(data.data.summary.totalExpenses).toBe(0);
      expect(data.data.summary.netIncome).toBe(0);
      expect(data.data.categories.income).toEqual([]);
      expect(data.data.categories.expenses).toEqual([]);
      expect(data.data.timeSeries).toEqual([]);
      expect(data.data.accountsBreakdown).toEqual([]);
    });

    it('should handle invalid date parameters', async () => {
      const url = new URL('http://localhost:3000/api/analytics/dashboard?from=invalid-date');
      const request = new Request(url.toString());
      
      const response = await GET({ request, url } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid date format');
      expect(response.status).toBe(400);
    });

    it('should handle repository errors', async () => {
      mockTransactionRepo.findByDateRange.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch dashboard analytics');
      expect(response.status).toBe(500);
    });

    it('should categorize expenses correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.00,
          description: 'Grocery',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE',
          accountId: 'account-1'
        },
        {
          id: '2',
          amount: -50.00,
          description: 'Another grocery',
          category: 'FOOD',
          date: new Date('2025-01-16'),
          type: 'EXPENSE',
          accountId: 'account-1'
        },
        {
          id: '3',
          amount: -25.00,
          description: 'Gas',
          category: 'TRANSPORTATION',
          date: new Date('2025-01-17'),
          type: 'EXPENSE',
          accountId: 'account-1'
        }
      ];

      mockTransactionRepo.findByDateRange.mockResolvedValue(mockTransactions);

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.categories.expenses).toHaveLength(2);
      
      const foodCategory = data.data.categories.expenses.find(cat => cat.category === 'FOOD');
      const transportCategory = data.data.categories.expenses.find(cat => cat.category === 'TRANSPORTATION');
      
      expect(foodCategory).toBeDefined();
      expect(foodCategory.amount).toBe(150.00);
      expect(foodCategory.count).toBe(2);
      expect(foodCategory.percentage).toBeCloseTo(85.7, 1); // 150/175 * 100
      
      expect(transportCategory).toBeDefined();
      expect(transportCategory.amount).toBe(25.00);
      expect(transportCategory.count).toBe(1);
      expect(transportCategory.percentage).toBeCloseTo(14.3, 1); // 25/175 * 100
    });

    it('should generate time series data correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.00,
          description: 'Expense',
          category: 'FOOD',
          date: new Date('2025-01-01'),
          type: 'EXPENSE',
          accountId: 'account-1'
        },
        {
          id: '2',
          amount: 500.00,
          description: 'Income',
          category: 'INCOME',
          date: new Date('2025-01-01'),
          type: 'INCOME',
          accountId: 'account-1'
        },
        {
          id: '3',
          amount: -50.00,
          description: 'Another expense',
          category: 'FOOD',
          date: new Date('2025-01-02'),
          type: 'EXPENSE',
          accountId: 'account-1'
        }
      ];

      mockTransactionRepo.findByDateRange.mockResolvedValue(mockTransactions);

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.timeSeries).toHaveLength(2); // Two unique dates
      
      const day1 = data.data.timeSeries.find(item => item.date === '2025-01-01');
      const day2 = data.data.timeSeries.find(item => item.date === '2025-01-02');
      
      expect(day1).toBeDefined();
      expect(day1.income).toBe(500.00);
      expect(day1.expenses).toBe(100.00);
      expect(day1.net).toBe(400.00);
      
      expect(day2).toBeDefined();
      expect(day2.income).toBe(0);
      expect(day2.expenses).toBe(50.00);
      expect(day2.net).toBe(-50.00);
    });

    it('should generate accounts breakdown correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.00,
          description: 'Expense',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE',
          accountId: 'account-1'
        },
        {
          id: '2',
          amount: 1000.00,
          description: 'Income',
          category: 'INCOME',
          date: new Date('2025-01-01'),
          type: 'INCOME',
          accountId: 'account-1'
        },
        {
          id: '3',
          amount: -25.00,
          description: 'Expense',
          category: 'TRANSPORTATION',
          date: new Date('2025-01-16'),
          type: 'EXPENSE',
          accountId: 'account-2'
        },
        {
          id: '4',
          amount: 500.00,
          description: 'Income',
          category: 'INCOME',
          date: new Date('2025-01-10'),
          type: 'INCOME',
          accountId: 'account-2'
        }
      ];

      mockTransactionRepo.findByDateRange.mockResolvedValue(mockTransactions);

      const request = new Request('http://localhost:3000/api/analytics/dashboard');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/analytics/dashboard') } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.accountsBreakdown).toHaveLength(2);
      
      const account1 = data.data.accountsBreakdown.find(acc => acc.accountId === 'account-1');
      const account2 = data.data.accountsBreakdown.find(acc => acc.accountId === 'account-2');
      
      expect(account1).toBeDefined();
      expect(account1.income).toBe(1000.00);
      expect(account1.expenses).toBe(100.00);
      expect(account1.net).toBe(900.00);
      expect(account1.transactionCount).toBe(2);
      
      expect(account2).toBeDefined();
      expect(account2.income).toBe(500.00);
      expect(account2.expenses).toBe(25.00);
      expect(account2.net).toBe(475.00);
      expect(account2.transactionCount).toBe(2);
    });

    it('should filter by account ID when provided', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.00,
          description: 'Expense',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE',
          accountId: 'target-account'
        }
      ];

      mockTransactionRepo.findByDateRange.mockResolvedValue(mockTransactions);

      const url = new URL('http://localhost:3000/api/analytics/dashboard?accountId=target-account');
      const request = new Request(url.toString());
      
      const response = await GET({ request, url } as any);
      const data = await response.json();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.summary.totalTransactions).toBe(1);
      expect(data.data.accountsBreakdown).toHaveLength(1);
      expect(data.data.accountsBreakdown[0].accountId).toBe('target-account');
    });
  });
});
