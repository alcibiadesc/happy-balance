import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './+server.js';

// Mock dependencies
vi.mock('$lib/infrastructure/repositories/PrismaTransactionRepository.js', () => ({
  PrismaTransactionRepository: vi.fn(() => ({
    findAll: vi.fn()
  }))
}));

vi.mock('$lib/domain/services/TransactionAnalyticsService.js', () => ({
  TransactionAnalyticsService: vi.fn(() => ({
    generateSpendingCategories: vi.fn(),
    calculateAveragesByPeriod: vi.fn(),
    detectUnusualTransactions: vi.fn(),
    analyzeTrends: vi.fn()
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

describe('Intelligence API', () => {
  let mockTransactionRepo: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get the mocked instances
    const { PrismaTransactionRepository } = require('$lib/infrastructure/repositories/PrismaTransactionRepository.js');
    const { TransactionAnalyticsService } = require('$lib/domain/services/TransactionAnalyticsService.js');
    
    mockTransactionRepo = new PrismaTransactionRepository();
    mockAnalyticsService = new TransactionAnalyticsService();
  });

  describe('GET /api/intelligence', () => {
    it('should return intelligence analysis successfully', async () => {
      // Mock data
      const mockTransactions = [
        {
          id: '1',
          amount: -100.50,
          description: 'Grocery Store',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE'
        },
        {
          id: '2',
          amount: 2500.00,
          description: 'Salary',
          category: 'INCOME',
          date: new Date('2025-01-01'),
          type: 'INCOME'
        }
      ];

      const mockSpendingCategories = [
        { category: 'FOOD', amount: 100.50, percentage: 4.0, transactionCount: 1 },
        { category: 'INCOME', amount: 2500.00, percentage: 96.0, transactionCount: 1 }
      ];

      const mockAverages = {
        daily: 25.00,
        weekly: 175.00,
        monthly: 750.00
      };

      const mockUnusualTransactions = [
        {
          id: '1',
          amount: -100.50,
          description: 'Unusual large purchase',
          reason: 'Amount significantly higher than average',
          severity: 'medium'
        }
      ];

      const mockTrends = {
        spendingTrend: 'increasing',
        incomeTrend: 'stable',
        savingsRate: 85.7,
        monthlyGrowth: 12.5
      };

      // Set up mocks
      mockTransactionRepo.findAll.mockResolvedValue(mockTransactions);
      mockAnalyticsService.generateSpendingCategories.mockReturnValue(mockSpendingCategories);
      mockAnalyticsService.calculateAveragesByPeriod.mockReturnValue(mockAverages);
      mockAnalyticsService.detectUnusualTransactions.mockReturnValue(mockUnusualTransactions);
      mockAnalyticsService.analyzeTrends.mockReturnValue(mockTrends);

      const request = new Request('http://localhost:3000/api/intelligence');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/intelligence') } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.spendingCategories).toEqual(mockSpendingCategories);
      expect(data.data.averages).toEqual(mockAverages);
      expect(data.data.unusualTransactions).toEqual(mockUnusualTransactions);
      expect(data.data.trends).toEqual(mockTrends);
      expect(data.data.summary).toBeDefined();
      expect(data.data.summary.totalTransactions).toBe(2);
      expect(data.data.summary.totalExpenses).toBe(100.50);
      expect(data.data.summary.totalIncome).toBe(2500.00);
      expect(data.data.summary.netFlow).toBe(2399.50);
    });

    it('should handle date range filtering', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -50.00,
          description: 'Coffee',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE'
        }
      ];

      mockTransactionRepo.findAll.mockResolvedValue(mockTransactions);
      mockAnalyticsService.generateSpendingCategories.mockReturnValue([]);
      mockAnalyticsService.calculateAveragesByPeriod.mockReturnValue({ daily: 0, weekly: 0, monthly: 0 });
      mockAnalyticsService.detectUnusualTransactions.mockReturnValue([]);
      mockAnalyticsService.analyzeTrends.mockReturnValue({
        spendingTrend: 'stable',
        incomeTrend: 'stable',
        savingsRate: 0,
        monthlyGrowth: 0
      });

      const url = new URL('http://localhost:3000/api/intelligence?from=2025-01-01&to=2025-01-31');
      const request = new Request(url.toString());
      
      const response = await GET({ request, url } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockTransactionRepo.findAll).toHaveBeenCalledWith({
        dateFrom: new Date('2025-01-01T00:00:00.000Z'),
        dateTo: new Date('2025-01-31T23:59:59.999Z')
      });
    });

    it('should handle empty transaction list', async () => {
      mockTransactionRepo.findAll.mockResolvedValue([]);
      mockAnalyticsService.generateSpendingCategories.mockReturnValue([]);
      mockAnalyticsService.calculateAveragesByPeriod.mockReturnValue({ daily: 0, weekly: 0, monthly: 0 });
      mockAnalyticsService.detectUnusualTransactions.mockReturnValue([]);
      mockAnalyticsService.analyzeTrends.mockReturnValue({
        spendingTrend: 'stable',
        incomeTrend: 'stable',
        savingsRate: 0,
        monthlyGrowth: 0
      });

      const request = new Request('http://localhost:3000/api/intelligence');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/intelligence') } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.summary.totalTransactions).toBe(0);
      expect(data.data.summary.totalExpenses).toBe(0);
      expect(data.data.summary.totalIncome).toBe(0);
      expect(data.data.summary.netFlow).toBe(0);
      expect(data.data.spendingCategories).toEqual([]);
      expect(data.data.unusualTransactions).toEqual([]);
    });

    it('should handle invalid date parameters', async () => {
      const url = new URL('http://localhost:3000/api/intelligence?from=invalid-date&to=2025-01-31');
      const request = new Request(url.toString());
      
      const response = await GET({ request, url } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid date format');
      expect(response.status).toBe(400);
    });

    it('should handle repository errors', async () => {
      mockTransactionRepo.findAll.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/intelligence');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/intelligence') } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch intelligence data');
      expect(response.status).toBe(500);
    });

    it('should handle analytics service errors gracefully', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.50,
          description: 'Test',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE'
        }
      ];

      mockTransactionRepo.findAll.mockResolvedValue(mockTransactions);
      mockAnalyticsService.generateSpendingCategories.mockImplementation(() => {
        throw new Error('Analytics calculation failed');
      });

      const request = new Request('http://localhost:3000/api/intelligence');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/intelligence') } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to generate intelligence analysis');
      expect(response.status).toBe(500);
    });

    it('should calculate summary statistics correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -150.00, // Expense
          description: 'Grocery',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE'
        },
        {
          id: '2',
          amount: -75.50, // Expense
          description: 'Gas',
          category: 'TRANSPORTATION',
          date: new Date('2025-01-16'),
          type: 'EXPENSE'
        },
        {
          id: '3',
          amount: 3000.00, // Income
          description: 'Salary',
          category: 'INCOME',
          date: new Date('2025-01-01'),
          type: 'INCOME'
        },
        {
          id: '4',
          amount: 500.00, // Income
          description: 'Freelance',
          category: 'INCOME',
          date: new Date('2025-01-10'),
          type: 'INCOME'
        }
      ];

      mockTransactionRepo.findAll.mockResolvedValue(mockTransactions);
      mockAnalyticsService.generateSpendingCategories.mockReturnValue([]);
      mockAnalyticsService.calculateAveragesByPeriod.mockReturnValue({ daily: 0, weekly: 0, monthly: 0 });
      mockAnalyticsService.detectUnusualTransactions.mockReturnValue([]);
      mockAnalyticsService.analyzeTrends.mockReturnValue({
        spendingTrend: 'stable',
        incomeTrend: 'stable',
        savingsRate: 0,
        monthlyGrowth: 0
      });

      const request = new Request('http://localhost:3000/api/intelligence');
      const response = await GET({ request, url: new URL('http://localhost:3000/api/intelligence') } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.summary.totalTransactions).toBe(4);
      expect(data.data.summary.totalExpenses).toBe(225.50); // 150 + 75.5
      expect(data.data.summary.totalIncome).toBe(3500.00); // 3000 + 500
      expect(data.data.summary.netFlow).toBe(3274.50); // 3500 - 225.5
    });

    it('should respect account filtering', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100.00,
          description: 'Test',
          category: 'FOOD',
          date: new Date('2025-01-15'),
          type: 'EXPENSE',
          accountId: 'account-1'
        }
      ];

      mockTransactionRepo.findAll.mockResolvedValue(mockTransactions);
      mockAnalyticsService.generateSpendingCategories.mockReturnValue([]);
      mockAnalyticsService.calculateAveragesByPeriod.mockReturnValue({ daily: 0, weekly: 0, monthly: 0 });
      mockAnalyticsService.detectUnusualTransactions.mockReturnValue([]);
      mockAnalyticsService.analyzeTrends.mockReturnValue({
        spendingTrend: 'stable',
        incomeTrend: 'stable',
        savingsRate: 0,
        monthlyGrowth: 0
      });

      const url = new URL('http://localhost:3000/api/intelligence?accountId=account-1');
      const request = new Request(url.toString());
      
      const response = await GET({ request, url } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockTransactionRepo.findAll).toHaveBeenCalledWith({
        accountId: 'account-1'
      });
    });
  });
});
