import type { Transaction } from '../entities/Transaction.js';
import type { TransactionId } from '../value-objects/TransactionId.js';

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  accountIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  partnerName?: string;
  type?: string;
  isRecurring?: boolean;
}

export interface TransactionRepository {
  findById(id: TransactionId): Promise<Transaction | null>;
  findByHash(hash: string): Promise<Transaction | null>;
  findAll(filters?: TransactionFilters): Promise<Transaction[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  findByCategory(categoryId: string): Promise<Transaction[]>;
  findUncategorized(): Promise<Transaction[]>;
  findDuplicates(transaction: Transaction): Promise<Transaction[]>;
  findRecurring(): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<void>;
  saveMany(transactions: Transaction[]): Promise<void>;
  update(transaction: Transaction): Promise<void>;
  delete(id: TransactionId): Promise<void>;
  count(filters?: TransactionFilters): Promise<number>;
  
  // Aggregation methods
  sumByCategory(categoryId: string, startDate?: Date, endDate?: Date): Promise<number>;
  sumByDateRange(startDate: Date, endDate: Date): Promise<number>;
  getMonthlyTotals(year: number): Promise<{ month: number; total: number }[]>;
  getCategoryTotals(startDate?: Date, endDate?: Date): Promise<{ categoryId: string; total: number }[]>;
  
  // Analytics methods
  findTopPartners(limit?: number, startDate?: Date, endDate?: Date): Promise<{ partnerName: string; total: number; count: number }[]>;
  getSpendingTrends(months: number): Promise<{ date: Date; income: number; expenses: number }[]>;
}