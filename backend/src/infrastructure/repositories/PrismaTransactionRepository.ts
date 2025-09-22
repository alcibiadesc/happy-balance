import { PrismaClient, Transaction as PrismaTransaction } from "@prisma/client";
import { Result } from "@domain/shared/Result";
import { Transaction, TransactionSnapshot } from "@domain/entities/Transaction";
import { TransactionId } from "@domain/value-objects/TransactionId";
import { TransactionDate } from "@domain/value-objects/TransactionDate";
import { TransactionType } from "@domain/entities/TransactionType";
import { Money } from "@domain/value-objects/Money";
import { Merchant } from "@domain/value-objects/Merchant";
import {
  ITransactionRepository,
  TransactionFilters,
  PaginationOptions,
  TransactionQueryResult,
} from "@domain/repositories/ITransactionRepository";

/**
 * PostgreSQL implementation of Transaction Repository using Prisma
 * Adapter pattern - implements domain repository interface using Prisma client
 */
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: Transaction): Promise<Result<void>> {
    try {
      const snapshot = transaction.toSnapshot();

      await this.prisma.transaction.upsert({
        where: { id: snapshot.id },
        update: {
          amount: snapshot.amount,
          currency: snapshot.currency,
          date: this.createDateFromDateString(snapshot.date),
          merchant: snapshot.merchant,
          type: snapshot.type,
          description: snapshot.description,
          observations: snapshot.observations,
          categoryId: snapshot.categoryId,
          isSelected: snapshot.isSelected,
          hash: snapshot.hash,
          hidden: (transaction as any).hidden || false,
        },
        create: {
          id: snapshot.id,
          amount: snapshot.amount,
          currency: snapshot.currency,
          date: this.createDateFromDateString(snapshot.date),
          merchant: snapshot.merchant,
          type: snapshot.type,
          description: snapshot.description,
          observations: snapshot.observations,
          categoryId: snapshot.categoryId,
          isSelected: snapshot.isSelected,
          hash: snapshot.hash,
          hidden: (transaction as any).hidden || false,
          createdAt: new Date(snapshot.createdAt),
        },
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async saveMany(transactions: Transaction[]): Promise<Result<number>> {
    try {
      const snapshots = transactions.map((t) => t.toSnapshot());

      const result = await this.prisma.$transaction(async (tx) => {
        let savedCount = 0;

        for (const snapshot of snapshots) {
          try {
            await tx.transaction.create({
              data: {
                id: snapshot.id,
                amount: snapshot.amount,
                currency: snapshot.currency,
                date: this.createDateFromDateString(snapshot.date),
                merchant: snapshot.merchant,
                type: snapshot.type,
                description: snapshot.description,
                observations: snapshot.observations,
                categoryId: snapshot.categoryId,
                isSelected: snapshot.isSelected,
                hash: snapshot.hash,
                hidden: false,
                createdAt: new Date(snapshot.createdAt),
              },
            });
            savedCount++;
          } catch (error) {
            // Skip if already exists (unique constraint violation)
            if (
              error instanceof Error &&
              error.message.includes("unique constraint")
            ) {
              continue;
            }
            throw error;
          }
        }

        return savedCount;
      });

      return Result.ok(result);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findById(id: TransactionId): Promise<Result<Transaction | null>> {
    try {
      const prismaTransaction = await this.prisma.transaction.findUnique({
        where: { id: id.value },
      });

      if (!prismaTransaction) {
        return Result.ok(null);
      }

      const transactionResult = this.mapFromPrisma(prismaTransaction);
      return transactionResult;
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findAll(): Promise<Result<Transaction[]>> {
    try {
      const prismaTransactions = await this.prisma.transaction.findMany({
        orderBy: { date: "desc" },
      });

      const transactions: Transaction[] = [];
      for (const prismaTransaction of prismaTransactions) {
        const transactionResult = this.mapFromPrisma(prismaTransaction);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find all transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findWithFilters(
    filters?: TransactionFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<TransactionQueryResult>> {
    try {
      const where = this.buildWhereClause(filters);

      const [prismaTransactions, totalCount] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          orderBy: { date: "desc" },
          skip: pagination?.offset,
          take: pagination?.limit,
        }),
        this.prisma.transaction.count({ where }),
      ]);

      const transactions: Transaction[] = [];
      for (const prismaTransaction of prismaTransactions) {
        const transactionResult = this.mapFromPrisma(prismaTransaction);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok({
        transactions,
        totalCount,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transactions with filters: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByDateRange(
    startDate: TransactionDate,
    endDate: TransactionDate,
  ): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { startDate, endDate };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByMerchant(merchantName: string): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { merchantName };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByCategory(categoryId: string): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { categoryId };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByType(type: TransactionType): Promise<Result<Transaction[]>> {
    const filters: TransactionFilters = { type };
    const result = await this.findWithFilters(filters);

    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(result.getValue().transactions);
  }

  async findByHash(hash: string): Promise<Result<Transaction[]>> {
    try {
      const prismaTransactions = await this.prisma.transaction.findMany({
        where: { hash },
      });

      const transactions: Transaction[] = [];
      for (const prismaTransaction of prismaTransactions) {
        const transactionResult = this.mapFromPrisma(prismaTransaction);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find transactions by hash: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async update(transaction: Transaction): Promise<Result<void>> {
    try {
      const snapshot = transaction.toSnapshot();

      // Build update data object with only the fields that should be updated
      const updateData: any = {
        amount: snapshot.amount,
        currency: snapshot.currency,
        merchant: snapshot.merchant,
        type: snapshot.type,
        description: snapshot.description,
        observations: snapshot.observations,
        categoryId: snapshot.categoryId,
        isSelected: snapshot.isSelected,
        hash: snapshot.hash,
        hidden: (transaction as any).hidden || false,
        updatedAt: new Date(),
      };

      // IMPORTANT: Only update date if it has actually changed
      // We need to preserve the original date to avoid timezone issues
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { id: snapshot.id },
      });

      if (existingTransaction) {
        // Format existing date to compare
        const existingDateStr = this.formatDateToString(
          existingTransaction.date,
        );

        // Only update date if it's different from the current one
        if (existingDateStr !== snapshot.date) {
          updateData.date = this.createDateFromDateString(snapshot.date);
        }
      }

      await this.prisma.transaction.update({
        where: { id: snapshot.id },
        data: updateData,
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(id: TransactionId): Promise<Result<void>> {
    try {
      await this.prisma.transaction.delete({
        where: { id: id.value },
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async deleteMany(ids: TransactionId[]): Promise<Result<number>> {
    try {
      const result = await this.prisma.transaction.deleteMany({
        where: { id: { in: ids.map((id) => id.value) } },
      });

      return Result.ok(result.count);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async exists(id: TransactionId): Promise<Result<boolean>> {
    try {
      const count = await this.prisma.transaction.count({
        where: { id: id.value },
      });

      return Result.ok(count > 0);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check transaction existence: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async count(filters?: TransactionFilters): Promise<Result<number>> {
    try {
      const where = this.buildWhereClause(filters);
      const count = await this.prisma.transaction.count({ where });
      return Result.ok(count);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to count transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatistics(
    startDate: TransactionDate,
    endDate: TransactionDate,
    currency: string,
  ): Promise<
    Result<{
      totalIncome: number;
      totalExpenses: number;
      totalInvestments: number;
      transactionCount: number;
    }>
  > {
    try {
      const where = {
        date: {
          gte: startDate.value,
          lte: endDate.value,
        },
        currency,
      };

      const [income, expenses, investments, transactionCount] =
        await Promise.all([
          this.prisma.transaction.aggregate({
            where: { ...where, type: TransactionType.INCOME },
            _sum: { amount: true },
          }),
          this.prisma.transaction.aggregate({
            where: { ...where, type: TransactionType.EXPENSE },
            _sum: { amount: true },
          }),
          this.prisma.transaction.aggregate({
            where: { ...where, type: TransactionType.INVESTMENT },
            _sum: { amount: true },
          }),
          this.prisma.transaction.count({ where }),
        ]);

      return Result.ok({
        totalIncome: Number(income._sum.amount) || 0,
        totalExpenses: Number(expenses._sum.amount) || 0,
        totalInvestments: Number(investments._sum.amount) || 0,
        transactionCount,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findPotentialDuplicates(
    transaction: Transaction,
    toleranceHours = 24,
  ): Promise<Result<Transaction[]>> {
    try {
      const startTime = new Date(
        transaction.date.value.getTime() - toleranceHours * 60 * 60 * 1000,
      );
      const endTime = new Date(
        transaction.date.value.getTime() + toleranceHours * 60 * 60 * 1000,
      );

      const prismaTransactions = await this.prisma.transaction.findMany({
        where: {
          id: { not: transaction.id.value },
          amount: transaction.amount.amount,
          currency: transaction.amount.currency,
          date: {
            gte: startTime,
            lte: endTime,
          },
          merchant: {
            contains: transaction.merchant.name,
            mode: "insensitive",
          },
        },
      });

      const transactions: Transaction[] = [];
      for (const prismaTransaction of prismaTransactions) {
        const transactionResult = this.mapFromPrisma(prismaTransaction);
        if (transactionResult.isSuccess()) {
          const mappedTransaction = transactionResult.getValue();
          if (mappedTransaction.isDuplicateOf(transaction, toleranceHours)) {
            transactions.push(mappedTransaction);
          }
        }
      }

      return Result.ok(transactions);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find duplicates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async bulkImport(
    transactions: Transaction[],
    conflictStrategy: "skip" | "update" | "fail",
  ): Promise<
    Result<{
      imported: number;
      skipped: number;
      errors: string[];
    }>
  > {
    try {
      const snapshots = transactions.map((t) => t.toSnapshot());

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const snapshot of snapshots) {
        try {
          if (conflictStrategy === "skip") {
            await this.prisma.transaction.create({
              data: {
                id: snapshot.id,
                amount: snapshot.amount,
                currency: snapshot.currency,
                date: this.createDateFromDateString(snapshot.date),
                merchant: snapshot.merchant,
                type: snapshot.type,
                description: snapshot.description,
                categoryId: snapshot.categoryId,
                isSelected: snapshot.isSelected,
                hash: snapshot.hash,
                createdAt: new Date(snapshot.createdAt),
              },
            });
            imported++;
          } else {
            await this.prisma.transaction.upsert({
              where: { id: snapshot.id },
              update: {
                amount: snapshot.amount,
                currency: snapshot.currency,
                date: this.createDateFromDateString(snapshot.date),
                merchant: snapshot.merchant,
                type: snapshot.type,
                description: snapshot.description,
                categoryId: snapshot.categoryId,
                isSelected: snapshot.isSelected,
                hash: snapshot.hash,
              },
              create: {
                id: snapshot.id,
                amount: snapshot.amount,
                currency: snapshot.currency,
                date: this.createDateFromDateString(snapshot.date),
                merchant: snapshot.merchant,
                type: snapshot.type,
                description: snapshot.description,
                categoryId: snapshot.categoryId,
                isSelected: snapshot.isSelected,
                hash: snapshot.hash,
                createdAt: new Date(snapshot.createdAt),
              },
            });
            imported++;
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("unique constraint")
          ) {
            skipped++;
          } else {
            errors.push(
              `Transaction ${snapshot.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      }

      return Result.ok({ imported, skipped, errors });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to bulk import: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async clear(): Promise<Result<void>> {
    try {
      await this.prisma.transaction.deleteMany();
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to clear transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async export(
    filters?: TransactionFilters,
  ): Promise<Result<TransactionSnapshot[]>> {
    try {
      const where = this.buildWhereClause(filters);
      const prismaTransactions = await this.prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
      });

      const snapshots: TransactionSnapshot[] = [];
      for (const prismaTransaction of prismaTransactions) {
        const transactionResult = this.mapFromPrisma(prismaTransaction);
        if (transactionResult.isSuccess()) {
          snapshots.push(transactionResult.getValue().toSnapshot());
        }
      }

      return Result.ok(snapshots);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async import(snapshots: TransactionSnapshot[]): Promise<Result<number>> {
    try {
      const transactions: Transaction[] = [];

      for (const snapshot of snapshots) {
        const transactionResult = Transaction.fromSnapshot(snapshot);
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        }
      }

      const result = await this.saveMany(transactions);
      return result;
    } catch (error) {
      return Result.failWithMessage(
        `Failed to import: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Private helper methods
  private createDateFromDateString(dateString: string): Date {
    // Parse YYYY-MM-DD format consistently
    // to avoid timezone issues that can shift dates
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  }

  private formatDateToString(date: Date): string {
    // Format date to YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private buildWhereClause(filters?: TransactionFilters) {
    if (!filters) {
      // Default: show all transactions (no filter)
      return {};
    }

    const where: any = {};

    // Date range filters - optimize with proper date handling
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate.value;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate.value;
      }
    }

    // Transaction type filter
    if (filters.type) {
      where.type = filters.type;
    }

    // Category filter - use null check for uncategorized
    if (filters.categoryId !== undefined) {
      if (filters.categoryId === null || filters.categoryId === "") {
        where.categoryId = null;
      } else {
        where.categoryId = filters.categoryId;
      }
    }

    // Merchant name filter - optimized for search
    if (filters.merchantName && filters.merchantName.trim()) {
      const searchTerm = filters.merchantName.trim();

      // Use exact match for short terms, contains for longer terms
      if (searchTerm.length <= 3) {
        where.merchant = {
          startsWith: searchTerm,
          mode: "insensitive",
        };
      } else {
        where.merchant = {
          contains: searchTerm,
          mode: "insensitive",
        };
      }
    }

    // Amount range filters
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    // Currency filter
    if (filters.currency) {
      where.currency = filters.currency;
    }

    // Hidden transactions filter - optimize for common case
    const includeHidden = (filters as any).includeHidden;
    if (!includeHidden) {
      where.hidden = false;
    }
    // If includeHidden is true, we don't add any hidden filter (show all)

    return where;
  }

  private mapFromPrisma(
    prismaTransaction: PrismaTransaction,
  ): Result<Transaction> {
    const snapshot: TransactionSnapshot = {
      id: prismaTransaction.id,
      amount: Number(prismaTransaction.amount),
      currency: prismaTransaction.currency,
      date: this.formatDateToString(prismaTransaction.date),
      merchant: prismaTransaction.merchant,
      type: prismaTransaction.type as TransactionType,
      description: prismaTransaction.description,
      observations: prismaTransaction.observations || undefined,
      categoryId: prismaTransaction.categoryId || undefined,
      isSelected: prismaTransaction.isSelected,
      hash: prismaTransaction.hash || undefined,
      createdAt: prismaTransaction.createdAt.toISOString(),
    };

    const result = Transaction.fromSnapshot(snapshot);
    if (result.isSuccess()) {
      (result.getValue() as any).hidden = prismaTransaction.hidden;
    }
    return result;
  }


  async findByPattern(pattern: string): Promise<Transaction[]> {
    try {
      const prismaTransactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            {
              merchant: {
                contains: pattern,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: pattern,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: { date: "desc" },
      });

      const transactions: Transaction[] = [];
      for (const pt of prismaTransactions) {
        const result = this.mapFromPrisma(pt);
        if (result.isSuccess()) {
          transactions.push(result.getValue());
        }
      }

      return transactions;
    } catch (error) {
      console.error("Error finding transactions by pattern:", error);
      return [];
    }
  }

  async updateMany(transactions: Transaction[]): Promise<void> {
    try {
      const updates = transactions.map((t) => {
        const snapshot = t.toSnapshot();
        return this.prisma.transaction.update({
          where: { id: snapshot.id },
          data: {
            categoryId: snapshot.categoryId,
            description: snapshot.description,
            isSelected: snapshot.isSelected,
          },
        });
      });

      await this.prisma.$transaction(updates);
    } catch (error) {
      console.error("Error updating multiple transactions:", error);
      throw error;
    }
  }
}
