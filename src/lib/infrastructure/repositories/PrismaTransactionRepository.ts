import type { Transaction } from '../../domain/entities/Transaction.js';
import type { TransactionId } from '../../domain/value-objects/TransactionId.js';
import type { TransactionRepository, TransactionFilters } from '../../domain/repositories/TransactionRepository.js';
import { prisma } from '../database/prisma.js';

export class PrismaTransactionRepository implements TransactionRepository {
  async findById(id: TransactionId): Promise<Transaction | null> {
    const result = await prisma.transaction.findUnique({
      where: { id: id.value },
      include: { category: true, account: true }
    });
    
    return result ? this.mapToEntity(result) : null;
  }

  async findByHash(hash: string): Promise<Transaction | null> {
    const result = await prisma.transaction.findUnique({
      where: { hash },
      include: { category: true, account: true }
    });
    
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const where = this.buildWhereClause(filters);
    
    const results = await prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { bookingDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { category: true, account: true },
      orderBy: { bookingDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: { categoryId },
      include: { category: true, account: true },
      orderBy: { bookingDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findUncategorized(): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: { categoryId: null },
      include: { category: true, account: true },
      orderBy: { bookingDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findDuplicates(transaction: Transaction): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: {
        partnerName: transaction.partnerName,
        amount: transaction.amount,
        bookingDate: transaction.bookingDate,
        id: { not: transaction.id.value }
      },
      include: { category: true, account: true }
    });
    
    return results.map(this.mapToEntity);
  }

  async findRecurring(): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: { isRecurring: true },
      include: { category: true, account: true },
      orderBy: { bookingDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async save(transaction: Transaction): Promise<void> {
    await prisma.transaction.create({
      data: {
        id: transaction.id.value,
        bookingDate: transaction.bookingDate,
        valueDate: transaction.valueDate,
        partnerName: transaction.partnerName,
        partnerIban: transaction.partnerIban,
        type: transaction.type,
        paymentReference: transaction.paymentReference,
        amount: transaction.amount.amount, // Extract amount from Money object
        originalAmount: transaction.originalAmount?.amount || null,
        originalCurrency: transaction.originalCurrency,
        exchangeRate: transaction.exchangeRate,
        categoryId: transaction.categoryId || null,
        accountId: transaction.accountId,
        isRecurring: transaction.isRecurring,
        confidence: transaction.confidence,
        hash: transaction.hash,
        importJobId: transaction.importJobId || null,
        notes: transaction.notes
      }
    });
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    await prisma.transaction.createMany({
      data: transactions.map(transaction => ({
        id: transaction.id.value,
        bookingDate: transaction.bookingDate,
        valueDate: transaction.valueDate,
        partnerName: transaction.partnerName,
        partnerIban: transaction.partnerIban,
        type: transaction.type,
        paymentReference: transaction.paymentReference,
        amount: transaction.amount.amount, // Extract amount from Money object
        originalAmount: transaction.originalAmount?.amount || null,
        originalCurrency: transaction.originalCurrency,
        exchangeRate: transaction.exchangeRate,
        categoryId: transaction.categoryId || null,
        accountId: transaction.accountId,
        isRecurring: transaction.isRecurring,
        confidence: transaction.confidence,
        hash: transaction.hash,
        importJobId: transaction.importJobId || null,
        notes: transaction.notes
      })),
      skipDuplicates: true
    });
  }

  async update(transaction: Transaction): Promise<void> {
    await prisma.transaction.update({
      where: { id: transaction.id.value },
      data: {
        bookingDate: transaction.bookingDate,
        valueDate: transaction.valueDate,
        partnerName: transaction.partnerName,
        partnerIban: transaction.partnerIban,
        type: transaction.type,
        paymentReference: transaction.paymentReference,
        amount: transaction.amount.amount, // Extract amount from Money object
        originalAmount: transaction.originalAmount?.amount || null,
        originalCurrency: transaction.originalCurrency,
        exchangeRate: transaction.exchangeRate,
        categoryId: transaction.categoryId || null,
        accountId: transaction.accountId,
        isRecurring: transaction.isRecurring,
        confidence: transaction.confidence,
        hash: transaction.hash,
        importJobId: transaction.importJobId || null,
        notes: transaction.notes
      }
    });
  }

  async delete(id: TransactionId): Promise<void> {
    await prisma.transaction.delete({
      where: { id: id.value }
    });
  }

  async updateCategory(id: TransactionId, categoryId: string | null): Promise<void> {
    await prisma.transaction.update({
      where: { id: id.value },
      data: { categoryId }
    });
  }

  async updateDescription(id: TransactionId, description: string | null): Promise<void> {
    await prisma.transaction.update({
      where: { id: id.value },
      data: { notes: description }
    });
  }

  async count(filters?: TransactionFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await prisma.transaction.count({ where });
  }

  async sumByCategory(categoryId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        categoryId,
        ...(startDate && endDate && {
          bookingDate: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      _sum: { amount: true }
    });

    return result._sum.amount || 0;
  }

  async sumByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    });

    return result._sum.amount || 0;
  }

  async getMonthlyTotals(year: number): Promise<{ month: number; total: number }[]> {
    const results = await prisma.transaction.groupBy({
      by: ['bookingDate'],
      where: {
        bookingDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      },
      _sum: { amount: true }
    });

    const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0
    }));

    results.forEach(result => {
      const month = result.bookingDate.getMonth();
      monthlyTotals[month].total += result._sum.amount || 0;
    });

    return monthlyTotals;
  }

  async getCategoryTotals(startDate?: Date, endDate?: Date): Promise<{ categoryId: string; total: number }[]> {
    const results = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: { not: null },
        ...(startDate && endDate && {
          bookingDate: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      _sum: { amount: true }
    });

    return results.map(result => ({
      categoryId: result.categoryId!,
      total: result._sum.amount || 0
    }));
  }

  async findTopPartners(limit = 10, startDate?: Date, endDate?: Date): Promise<{ partnerName: string; total: number; count: number }[]> {
    const results = await prisma.transaction.groupBy({
      by: ['partnerName'],
      where: {
        ...(startDate && endDate && {
          bookingDate: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit
    });

    return results.map(result => ({
      partnerName: result.partnerName,
      total: result._sum.amount || 0,
      count: result._count.id
    }));
  }

  async getSpendingTrends(months: number): Promise<{ date: Date; income: number; expenses: number }[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const results = await prisma.transaction.groupBy({
      by: ['bookingDate'],
      where: {
        bookingDate: { gte: startDate }
      },
      _sum: { amount: true }
    });

    // Group by month and separate income/expenses
    const trends = new Map<string, { date: Date; income: number; expenses: number }>();

    results.forEach(result => {
      const monthKey = `${result.bookingDate.getFullYear()}-${result.bookingDate.getMonth()}`;
      const amount = result._sum.amount || 0;

      if (!trends.has(monthKey)) {
        trends.set(monthKey, {
          date: new Date(result.bookingDate.getFullYear(), result.bookingDate.getMonth(), 1),
          income: 0,
          expenses: 0
        });
      }

      const trend = trends.get(monthKey)!;
      if (amount > 0) {
        trend.income += amount;
      } else {
        trend.expenses += Math.abs(amount);
      }
    });

    return Array.from(trends.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private buildWhereClause(filters?: TransactionFilters) {
    if (!filters) return {};

    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.bookingDate = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    if (filters.categoryIds?.length) {
      where.categoryId = { in: filters.categoryIds };
    }

    if (filters.accountIds?.length) {
      where.accountId = { in: filters.accountIds };
    }

    if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
      where.amount = {
        gte: filters.minAmount,
        lte: filters.maxAmount
      };
    }

    if (filters.partnerName) {
      where.partnerName = {
        contains: filters.partnerName,
        mode: 'insensitive'
      };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isRecurring !== undefined) {
      where.isRecurring = filters.isRecurring;
    }

    if (filters.categoryType) {
      where.category = {
        type: filters.categoryType
      };
    }

    return where;
  }

  private mapToEntity(dbTransaction: any): Transaction {
    return {
      id: { value: dbTransaction.id },
      bookingDate: dbTransaction.bookingDate,
      valueDate: dbTransaction.valueDate,
      partnerName: dbTransaction.partnerName,
      partnerIban: dbTransaction.partnerIban,
      type: dbTransaction.type,
      paymentReference: dbTransaction.paymentReference,
      amount: dbTransaction.amount,
      originalAmount: dbTransaction.originalAmount,
      originalCurrency: dbTransaction.originalCurrency,
      exchangeRate: dbTransaction.exchangeRate,
      categoryId: dbTransaction.categoryId,
      accountId: dbTransaction.accountId,
      isRecurring: dbTransaction.isRecurring,
      confidence: dbTransaction.confidence,
      hash: dbTransaction.hash,
      importJobId: dbTransaction.importJobId,
      notes: dbTransaction.notes,
      createdAt: dbTransaction.createdAt,
      updatedAt: dbTransaction.updatedAt,
      // Include related entities if loaded
      category: dbTransaction.category,
      account: dbTransaction.account
    } as Transaction;
  }
}