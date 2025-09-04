import type { ITransactionRepository } from '$lib/domain/repositories/ITransactionRepository.js';
import { Transaction } from '$lib/domain/entities/Transaction.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
import { demoTransactions } from './DemoData.js';

export class DemoTransactionRepository implements ITransactionRepository {
  private transactions: Transaction[] = [...demoTransactions];

  async findById(id: TransactionId): Promise<Transaction | null> {
    const transaction = this.transactions.find(t => t.id.equals(id));
    return transaction || null;
  }

  async findAll(filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: CategoryId;
    accountId?: AccountId;
    partnerName?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<Transaction[]> {
    let filtered = [...this.transactions];

    if (filters?.startDate) {
      filtered = filtered.filter(t => t.bookingDate >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(t => t.bookingDate <= filters.endDate!);
    }

    if (filters?.categoryId) {
      filtered = filtered.filter(t => t.categoryId?.equals(filters.categoryId!));
    }

    if (filters?.accountId) {
      filtered = filtered.filter(t => t.accountId.equals(filters.accountId!));
    }

    if (filters?.partnerName) {
      const searchTerm = filters.partnerName.toLowerCase();
      filtered = filtered.filter(t => t.partnerName.toLowerCase().includes(searchTerm));
    }

    if (filters?.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filters.minAmount!);
    }

    if (filters?.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
    }

    // Sort by date descending
    return filtered.sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime());
  }

  async save(transaction: Transaction): Promise<void> {
    const existingIndex = this.transactions.findIndex(t => t.id.equals(transaction.id));
    
    if (existingIndex >= 0) {
      this.transactions[existingIndex] = transaction;
    } else {
      this.transactions.push(transaction);
    }
  }

  async delete(id: TransactionId): Promise<void> {
    this.transactions = this.transactions.filter(t => !t.id.equals(id));
  }

  async findByCategory(categoryId: CategoryId): Promise<Transaction[]> {
    return this.transactions.filter(t => t.categoryId?.equals(categoryId));
  }

  async findByAccount(accountId: AccountId): Promise<Transaction[]> {
    return this.transactions.filter(t => t.accountId.equals(accountId));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactions.filter(t => 
      t.bookingDate >= startDate && t.bookingDate <= endDate
    ).sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime());
  }

  async countByCategory(categoryId: CategoryId): Promise<number> {
    return this.transactions.filter(t => t.categoryId?.equals(categoryId)).length;
  }

  async getTotalAmountByCategory(categoryId: CategoryId): Promise<number> {
    return this.transactions
      .filter(t => t.categoryId?.equals(categoryId))
      .reduce((sum, t) => sum + t.amount, 0);
  }
}