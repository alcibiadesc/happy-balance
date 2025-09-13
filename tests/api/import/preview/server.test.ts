import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './+server.js';

// Mock the dependencies
vi.mock('$lib/infrastructure/repositories/PrismaTransactionRepository.js', () => ({
  PrismaTransactionRepository: vi.fn(() => ({
    findByHash: vi.fn().mockResolvedValue(null) // No duplicates by default
  }))
}));

vi.mock('$lib/infrastructure/repositories/PrismaAccountRepository.js', () => ({
  PrismaAccountRepository: vi.fn(() => ({
    findById: vi.fn().mockResolvedValue({
      id: 'test-account-id',
      name: 'Test Account',
      type: 'CHECKING',
      balance: 0
    })
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

// Mock crypto for hash generation
vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => ({
      substring: vi.fn(() => 'test-hash')
    }))
  }))
}));

describe('Import Preview API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/import/preview', () => {
    it('should process valid CSV file successfully', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,Test Income,Salary
2025-09-02,-25.30,Test Expense,Grocery Store`;

      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.transactions).toBeDefined();
      expect(data.data.summary).toBeDefined();
      expect(data.data.fileName).toBe('test.csv');
      expect(data.data.accountId).toBe('test-account-id');
    });

    it('should return error when no file is provided', async () => {
      const formData = new FormData();
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('No file provided');
      expect(data.code).toBe('MISSING_FILE');
      expect(response.status).toBe(400);
    });

    it('should return error when no account ID is provided', async () => {
      const csvContent = `Date,Amount,Description,Reference\n2025-09-01,100.50,Test Income,Salary`;
      
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Account ID is required');
      expect(data.code).toBe('MISSING_ACCOUNT_ID');
      expect(response.status).toBe(400);
    });

    it('should return error for non-CSV files', async () => {
      const formData = new FormData();
      const blob = new Blob(['not a csv'], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Only CSV files are supported');
      expect(data.code).toBe('INVALID_FILE_TYPE');
      expect(response.status).toBe(400);
    });

    it('should return error for files that are too large', async () => {
      const formData = new FormData();
      // Create a large content string (> 5MB)
      const largeContent = 'a'.repeat(6 * 1024 * 1024); // 6MB
      const blob = new Blob([largeContent], { type: 'text/csv' });
      const file = new File([blob], 'large.csv', { type: 'text/csv' });
      
      // Mock the file size
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('File size exceeds 5MB limit');
      expect(data.code).toBe('FILE_TOO_LARGE');
      expect(response.status).toBe(400);
    });

    it('should return error when account is not found', async () => {
      // Mock account not found
      vi.doMock('$lib/infrastructure/repositories/PrismaAccountRepository.js', () => ({
        PrismaAccountRepository: vi.fn(() => ({
          findById: vi.fn().mockResolvedValue(null)
        }))
      }));

      const csvContent = `Date,Amount,Description,Reference\n2025-09-01,100.50,Test Income,Salary`;
      
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('accountId', 'nonexistent-account');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Account not found');
      expect(data.code).toBe('ACCOUNT_NOT_FOUND');
      expect(response.status).toBe(404);
    });

    it('should detect duplicate transactions', async () => {
      // Mock duplicate found
      vi.doMock('$lib/infrastructure/repositories/PrismaTransactionRepository.js', () => ({
        PrismaTransactionRepository: vi.fn(() => ({
          findByHash: vi.fn().mockResolvedValue({
            id: 'existing-transaction-id',
            hash: 'duplicate-hash'
          })
        }))
      }));

      const csvContent = `Date,Amount,Description,Reference\n2025-09-01,100.50,Test Income,Salary`;
      
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.summary.duplicates).toBe(1);
      expect(data.data.transactions[0].isDuplicate).toBe(true);
      expect(data.data.transactions[0].status).toBe('duplicate');
      expect(data.data.transactions[0].selected).toBe(false);
    });

    it('should handle parsing errors gracefully', async () => {
      const csvContent = `Date,Amount,Description,Reference\ninvalid-date,not-a-number,Test,Ref`;
      
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.summary.errors).toBeGreaterThan(0);
      expect(data.data.transactions.some(tx => tx.status === 'error')).toBe(true);
    });

    it('should calculate summary statistics correctly', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,Valid Transaction,Salary
2025-09-02,-25.30,Another Valid,Expense
invalid-date,abc,Invalid Transaction,Test`;
      
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.summary.totalTransactions).toBe(3);
      expect(data.data.summary.newTransactions).toBe(2);
      expect(data.data.summary.errors).toBe(1);
      expect(data.data.summary.duplicates).toBe(0);
      expect(data.data.summary.dateRange).toBeDefined();
      expect(data.data.summary.dateRange.from).toBe('2025-09-01');
      expect(data.data.summary.dateRange.to).toBe('2025-09-02');
    });

    it('should handle UniversalCSVParser correctly', async () => {
      // This test ensures the UniversalCSVParser import fix is working
      const csvContent = `Date,Amount,Description,Reference\n2025-09-01,100.50,Test Transaction,Test`;
      
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('accountId', 'test-account-id');

      const request = new Request('http://localhost:3000/api/import/preview', {
        method: 'POST',
        body: formData
      });

      // This should NOT throw "UniversalCSVParser is not defined" error
      const response = await POST({ request } as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.transactions).toHaveLength(1);
      expect(data.data.transactions[0].amount).toBe(100.50);
      expect(data.data.transactions[0].description).toBe('Test Transaction');
    });
  });
});
