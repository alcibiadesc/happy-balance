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

  async findByReference(paymentReference: string, transactionDate: Date, amount: number): Promise<Transaction | null> {
    const result = await prisma.transaction.findFirst({
      where: {
        paymentReference,
        transactionDate,
        amount
      },
      include: { category: true, account: true }
    });
    
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const where = this.buildWhereClause(filters);
    
    const results = await prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { transactionDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { category: true, account: true },
      orderBy: { transactionDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: { categoryId },
      include: { category: true, account: true },
      orderBy: { transactionDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findUncategorized(): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: { categoryId: null },
      include: { category: true, account: true },
      orderBy: { transactionDate: 'desc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findDuplicates(transaction: Transaction): Promise<Transaction[]> {
    const results = await prisma.transaction.findMany({
      where: {
        counterparty: transaction.partnerName,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        id: { not: transaction.id.value }
      },
      include: { category: true, account: true }
    });
    
    return results.map(this.mapToEntity);
  }

  async findRecurring(): Promise<Transaction[]> {
    // Since isRecurring field doesn't exist in schema, return empty array
    // TODO: Implement recurring transaction logic based on pattern analysis
    return [];
  }

  async save(transaction: Transaction): Promise<void> {
    await prisma.transaction.create({
      data: {
        id: transaction.id.value,
        transactionDate: transaction.bookingDate,
        description: transaction.partnerName,
        paymentReference: transaction.paymentReference,
        counterparty: transaction.partnerName,
        amount: transaction.amount.amount, // Extract amount from Money object
        categoryId: transaction.categoryId || null,
        accountId: transaction.accountId,
        isHidden: transaction.isHidden || false,
        hash: transaction.hash
      }
    });
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    await prisma.transaction.createMany({
      data: transactions.map(transaction => ({
        id: transaction.id.value,
        transactionDate: transaction.bookingDate,
        description: transaction.partnerName,
        paymentReference: transaction.paymentReference,
        counterparty: transaction.partnerName,
        amount: transaction.amount.amount, // Extract amount from Money object
        categoryId: transaction.categoryId || null,
        accountId: transaction.accountId,
        isHidden: transaction.isHidden || false,
        hash: transaction.hash
      })),
      skipDuplicates: true
    });
  }

  async update(transaction: Transaction): Promise<void> {
    await prisma.transaction.update({
      where: { id: transaction.id.value },
      data: {
        transactionDate: transaction.bookingDate,
        description: transaction.partnerName,
        paymentReference: transaction.paymentReference,
        counterparty: transaction.partnerName,
        amount: transaction.amount.amount, // Extract amount from Money object
        categoryId: transaction.categoryId || null,
        accountId: transaction.accountId,
        isHidden: transaction.isHidden || false,
        hash: transaction.hash
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
      data: { description: description || '' }
    });
  }

  async updateHidden(id: TransactionId, isHidden: boolean): Promise<void> {
    await prisma.transaction.update({
      where: { id: id.value },
      data: { isHidden }
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
          transactionDate: {
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
        transactionDate: {
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
      by: ['transactionDate'],
      where: {
        transactionDate: {
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
      const month = result.transactionDate.getMonth();
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
          transactionDate: {
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
      by: ['counterparty'],
      where: {
        ...(startDate && endDate && {
          transactionDate: {
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
      partnerName: result.counterparty || 'Unknown',
      total: result._sum.amount || 0,
      count: result._count.id
    }));
  }

  async getSpendingTrends(months: number): Promise<{ date: Date; income: number; expenses: number }[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const results = await prisma.transaction.groupBy({
      by: ['transactionDate'],
      where: {
        transactionDate: { gte: startDate }
      },
      _sum: { amount: true }
    });

    // Group by month and separate income/expenses
    const trends = new Map<string, { date: Date; income: number; expenses: number }>();

    results.forEach(result => {
      const monthKey = `${result.transactionDate.getFullYear()}-${result.transactionDate.getMonth()}`;
      const amount = result._sum.amount || 0;

      if (!trends.has(monthKey)) {
        trends.set(monthKey, {
          date: new Date(result.transactionDate.getFullYear(), result.transactionDate.getMonth(), 1),
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

  async calculateTotalByAccount(accountId: string): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: { 
        accountId,
        isHidden: false // Exclude hidden transactions from balance calculations
      },
      _sum: { amount: true }
    });

    return result._sum.amount || 0;
  }

  private buildWhereClause(filters?: TransactionFilters) {
    if (!filters) return {};

    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.transactionDate = {
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
      where.counterparty = {
        contains: filters.partnerName,
        mode: 'insensitive'
      };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // isRecurring field not available in current schema
    // TODO: Implement recurring logic based on pattern analysis

    if (filters.categoryType) {
      where.category = {
        type: filters.categoryType
      };
    }

    return where;
  }

  private mapToEntity(dbTransaction: any): any {
    // Map to a structure that the frontend expects, not the domain entity
    return {
      id: dbTransaction.id,
      transactionDate: dbTransaction.transactionDate,
      bookingDate: dbTransaction.transactionDate,
      partnerName: dbTransaction.counterparty || dbTransaction.description,
      description: dbTransaction.description,
      counterparty: dbTransaction.counterparty,
      paymentReference: dbTransaction.paymentReference,
      amount: dbTransaction.amount, // Numeric value for frontend
      categoryId: dbTransaction.categoryId,
      accountId: dbTransaction.accountId,
      isHidden: dbTransaction.isHidden || false,
      hash: dbTransaction.hash,
      createdAt: dbTransaction.createdAt,
      updatedAt: dbTransaction.updatedAt,
      // Include related entities if loaded
      category: dbTransaction.category,
      account: dbTransaction.account
    };
  }
}