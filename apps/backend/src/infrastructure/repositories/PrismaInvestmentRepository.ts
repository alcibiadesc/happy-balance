import {
  PrismaClient,
  Investment as PrismaInvestment,
  InvestmentHistory as PrismaInvestmentHistory,
} from "@prisma/client";
import { Result } from "@domain/shared/Result";
import {
  IInvestmentRepository,
  InvestmentFilters,
  InvestmentHistoryFilters,
  PortfolioSummary,
  InvestmentWithMetrics,
} from "@domain/repositories/IInvestmentRepository";
import {
  Investment,
  InvestmentId,
  InvestmentSnapshot,
  InvestmentHistory,
  InvestmentHistoryId,
  InvestmentHistorySnapshot,
} from "@domain/entities/Investment";
import {
  InvestmentHistoryType,
  InvestmentHistoryTypeHelper,
} from "@domain/entities/InvestmentHistoryType";

type PrismaInvestmentWithHistory = PrismaInvestment & {
  history?: PrismaInvestmentHistory[];
};

export class PrismaInvestmentRepository implements IInvestmentRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string
  ) {}

  private prismaToDomain(
    prismaInvestment: PrismaInvestmentWithHistory,
    includeHistory: boolean = false
  ): Result<Investment> {
    const investmentIdResult = InvestmentId.create(prismaInvestment.id);
    if (investmentIdResult.isFailure()) {
      return Result.fail(investmentIdResult.getError());
    }

    // Build history if included
    const history: InvestmentHistorySnapshot[] = [];
    if (includeHistory && prismaInvestment.history) {
      for (const h of prismaInvestment.history) {
        history.push({
          id: h.id,
          investmentId: h.investmentId,
          amount: Number(h.amount),
          type: h.type,
          date: h.date.toISOString(),
          notes: h.notes,
          transactionId: h.transactionId,
          createdAt: h.createdAt.toISOString(),
        });
      }
    }

    return Investment.fromSnapshot({
      id: prismaInvestment.id,
      name: prismaInvestment.name,
      symbol: prismaInvestment.symbol,
      currentValue: Number(prismaInvestment.currentValue),
      currency: prismaInvestment.currency,
      categoryId: prismaInvestment.categoryId,
      highlight: prismaInvestment.highlight,
      color: prismaInvestment.color,
      icon: prismaInvestment.icon,
      notes: prismaInvestment.notes,
      isActive: prismaInvestment.isActive,
      sortOrder: prismaInvestment.sortOrder,
      userId: prismaInvestment.userId,
      createdAt: prismaInvestment.createdAt.toISOString(),
      history: history,
      // Calculated fields will be computed by the entity
      totalContributions: 0,
      totalWithdrawals: 0,
      netContributions: 0,
      profit: 0,
      profitPercentage: 0,
    });
  }

  private domainToPrisma(investment: Investment) {
    return {
      id: investment.id.value,
      name: investment.name,
      symbol: investment.symbol,
      currentValue: investment.currentValue,
      currency: investment.currency,
      categoryId: investment.categoryId,
      highlight: investment.highlight,
      color: investment.color,
      icon: investment.icon,
      notes: investment.notes,
      isActive: investment.isActive,
      sortOrder: investment.sortOrder,
      userId: this.userId,
    };
  }

  private prismaHistoryToDomain(
    prismaHistory: PrismaInvestmentHistory
  ): Result<InvestmentHistory> {
    const historyIdResult = InvestmentHistoryId.create(prismaHistory.id);
    if (historyIdResult.isFailure()) {
      return Result.fail(historyIdResult.getError());
    }

    const investmentIdResult = InvestmentId.create(prismaHistory.investmentId);
    if (investmentIdResult.isFailure()) {
      return Result.fail(investmentIdResult.getError());
    }

    const type = InvestmentHistoryTypeHelper.fromString(prismaHistory.type);
    if (!type) {
      return Result.failWithMessage(`Invalid history type: ${prismaHistory.type}`);
    }

    return InvestmentHistory.fromSnapshot({
      id: prismaHistory.id,
      investmentId: prismaHistory.investmentId,
      amount: Number(prismaHistory.amount),
      type: prismaHistory.type,
      date: prismaHistory.date.toISOString(),
      notes: prismaHistory.notes,
      transactionId: prismaHistory.transactionId,
      createdAt: prismaHistory.createdAt.toISOString(),
    });
  }

  private domainHistoryToPrisma(history: InvestmentHistory) {
    return {
      id: history.id.value,
      investmentId: history.investmentId.value,
      amount: history.amount,
      type: history.type,
      date: history.date,
      notes: history.notes,
      transactionId: history.transactionId,
    };
  }

  async save(investment: Investment): Promise<Result<void>> {
    try {
      await this.prisma.investment.create({
        data: this.domainToPrisma(investment),
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save investment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findById(id: InvestmentId): Promise<Result<Investment | null>> {
    try {
      const investment = await this.prisma.investment.findUnique({
        where: { id: id.value, userId: this.userId },
      });

      if (!investment) {
        return Result.ok(null);
      }

      const domainResult = this.prismaToDomain(investment);
      if (domainResult.isFailure()) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch investment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findByIdWithHistory(id: InvestmentId): Promise<Result<Investment | null>> {
    try {
      const investment = await this.prisma.investment.findUnique({
        where: { id: id.value, userId: this.userId },
        include: {
          history: {
            orderBy: { date: "desc" },
          },
        },
      });

      if (!investment) {
        return Result.ok(null);
      }

      const domainResult = this.prismaToDomain(investment, true);
      if (domainResult.isFailure()) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch investment with history: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findAll(): Promise<Result<Investment[]>> {
    try {
      const investments = await this.prisma.investment.findMany({
        where: { userId: this.userId },
        include: {
          history: {
            orderBy: { date: "desc" },
          },
        },
        orderBy: [{ highlight: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      });

      const domainInvestments: Investment[] = [];
      for (const inv of investments) {
        const domainResult = this.prismaToDomain(inv, true);
        if (domainResult.isFailure()) {
          return Result.fail(domainResult.getError());
        }
        domainInvestments.push(domainResult.getValue());
      }

      return Result.ok(domainInvestments);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch investments: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findWithFilters(filters?: InvestmentFilters): Promise<Result<Investment[]>> {
    try {
      const where: any = { userId: this.userId };

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters?.highlight !== undefined) {
        where.highlight = filters.highlight;
      }

      if (filters?.searchTerm) {
        where.OR = [
          { name: { contains: filters.searchTerm, mode: "insensitive" } },
          { symbol: { contains: filters.searchTerm, mode: "insensitive" } },
        ];
      }

      const investments = await this.prisma.investment.findMany({
        where,
        include: {
          history: {
            orderBy: { date: "desc" },
          },
        },
        orderBy: [{ highlight: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      });

      const domainInvestments: Investment[] = [];
      for (const inv of investments) {
        const domainResult = this.prismaToDomain(inv, true);
        if (domainResult.isFailure()) {
          return Result.fail(domainResult.getError());
        }
        domainInvestments.push(domainResult.getValue());
      }

      return Result.ok(domainInvestments);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch investments with filters: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findByCategoryId(categoryId: string): Promise<Result<Investment[]>> {
    return this.findWithFilters({ categoryId });
  }

  async findActive(): Promise<Result<Investment[]>> {
    return this.findWithFilters({ isActive: true });
  }

  async findHighlighted(): Promise<Result<Investment[]>> {
    return this.findWithFilters({ highlight: true, isActive: true });
  }

  async update(investment: Investment): Promise<Result<void>> {
    try {
      const { id, userId, ...updateData } = this.domainToPrisma(investment);
      await this.prisma.investment.update({
        where: { id: investment.id.value },
        data: updateData,
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update investment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async delete(id: InvestmentId): Promise<Result<void>> {
    try {
      await this.prisma.investment.update({
        where: { id: id.value },
        data: { isActive: false },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete investment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async permanentDelete(id: InvestmentId): Promise<Result<void>> {
    try {
      await this.prisma.investment.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to permanently delete investment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async exists(id: InvestmentId): Promise<Result<boolean>> {
    try {
      const count = await this.prisma.investment.count({
        where: { id: id.value, userId: this.userId },
      });
      return Result.ok(count > 0);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check investment existence: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async existsByName(name: string): Promise<Result<boolean>> {
    try {
      const count = await this.prisma.investment.count({
        where: { name, userId: this.userId },
      });
      return Result.ok(count > 0);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check investment name existence: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async count(filters?: InvestmentFilters): Promise<Result<number>> {
    try {
      const where: any = { userId: this.userId };

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters?.highlight !== undefined) {
        where.highlight = filters.highlight;
      }

      const count = await this.prisma.investment.count({ where });
      return Result.ok(count);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to count investments: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async updateSortOrder(
    sortOrders: { id: string; sortOrder: number }[]
  ): Promise<Result<void>> {
    try {
      await this.prisma.$transaction(
        sortOrders.map((item) =>
          this.prisma.investment.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update sort order: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // History operations

  async addHistoryEntry(entry: InvestmentHistory): Promise<Result<void>> {
    try {
      await this.prisma.investmentHistory.create({
        data: this.domainHistoryToPrisma(entry),
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to add history entry: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findHistoryById(
    id: InvestmentHistoryId
  ): Promise<Result<InvestmentHistory | null>> {
    try {
      const history = await this.prisma.investmentHistory.findUnique({
        where: { id: id.value },
      });

      if (!history) {
        return Result.ok(null);
      }

      const domainResult = this.prismaHistoryToDomain(history);
      if (domainResult.isFailure()) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch history entry: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findHistoryByInvestmentId(
    investmentId: InvestmentId
  ): Promise<Result<InvestmentHistory[]>> {
    try {
      const historyEntries = await this.prisma.investmentHistory.findMany({
        where: { investmentId: investmentId.value },
        orderBy: { date: "desc" },
      });

      const domainEntries: InvestmentHistory[] = [];
      for (const entry of historyEntries) {
        const domainResult = this.prismaHistoryToDomain(entry);
        if (domainResult.isFailure()) {
          return Result.fail(domainResult.getError());
        }
        domainEntries.push(domainResult.getValue());
      }

      return Result.ok(domainEntries);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch history entries: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findHistoryWithFilters(
    filters: InvestmentHistoryFilters
  ): Promise<Result<InvestmentHistory[]>> {
    try {
      const where: any = {};

      if (filters.investmentId) {
        where.investmentId = filters.investmentId;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.transactionId) {
        where.transactionId = filters.transactionId;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
          where.date.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.date.lte = filters.dateTo;
        }
      }

      const historyEntries = await this.prisma.investmentHistory.findMany({
        where,
        orderBy: { date: "desc" },
      });

      const domainEntries: InvestmentHistory[] = [];
      for (const entry of historyEntries) {
        const domainResult = this.prismaHistoryToDomain(entry);
        if (domainResult.isFailure()) {
          return Result.fail(domainResult.getError());
        }
        domainEntries.push(domainResult.getValue());
      }

      return Result.ok(domainEntries);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch history with filters: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findHistoryByTransactionId(
    transactionId: string
  ): Promise<Result<InvestmentHistory | null>> {
    try {
      const history = await this.prisma.investmentHistory.findFirst({
        where: { transactionId },
      });

      if (!history) {
        return Result.ok(null);
      }

      const domainResult = this.prismaHistoryToDomain(history);
      if (domainResult.isFailure()) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch history by transaction: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async updateHistoryEntry(entry: InvestmentHistory): Promise<Result<void>> {
    try {
      const { id, investmentId, ...updateData } = this.domainHistoryToPrisma(entry);
      await this.prisma.investmentHistory.update({
        where: { id: entry.id.value },
        data: updateData,
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update history entry: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async deleteHistoryEntry(id: InvestmentHistoryId): Promise<Result<void>> {
    try {
      await this.prisma.investmentHistory.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete history entry: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Portfolio summary operations

  async getPortfolioSummary(): Promise<Result<PortfolioSummary>> {
    try {
      // Get all active investments with history
      const investments = await this.prisma.investment.findMany({
        where: { userId: this.userId, isActive: true },
        include: {
          history: true,
        },
      });

      let totalValue = 0;
      let totalContributions = 0;
      let totalWithdrawals = 0;
      let investmentValueWithContributions = 0; // Only investments that have contributions

      for (const inv of investments) {
        totalValue += Number(inv.currentValue);

        let invContributions = 0;
        let invWithdrawals = 0;

        for (const h of inv.history) {
          if (h.type === InvestmentHistoryType.CONTRIBUTION) {
            invContributions += Number(h.amount);
            totalContributions += Number(h.amount);
          } else if (h.type === InvestmentHistoryType.WITHDRAWAL) {
            invWithdrawals += Number(h.amount);
            totalWithdrawals += Number(h.amount);
          }
        }

        // Only count this investment's value for profit if it has contributions (not a "colchón")
        const invNetContributions = invContributions - invWithdrawals;
        if (invNetContributions > 0) {
          investmentValueWithContributions += Number(inv.currentValue);
        }
      }

      const netContributions = totalContributions - totalWithdrawals;
      // Profit is only calculated from investments that have contributions
      const totalProfit = investmentValueWithContributions - netContributions;
      const profitPercentage =
        netContributions > 0 ? (totalProfit / netContributions) * 100 : 0;

      return Result.ok({
        totalValue,
        totalContributions,
        totalWithdrawals,
        netContributions,
        totalProfit,
        profitPercentage,
        investmentCount: investments.length,
        currency: "EUR", // Default currency, could be configurable
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get portfolio summary: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getInvestmentsWithMetrics(): Promise<Result<InvestmentWithMetrics[]>> {
    try {
      const investments = await this.prisma.investment.findMany({
        where: { userId: this.userId, isActive: true },
        include: {
          history: {
            orderBy: { date: "desc" },
          },
          category: {
            select: { name: true },
          },
        },
        orderBy: [{ highlight: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      });

      const results: InvestmentWithMetrics[] = [];

      for (const inv of investments) {
        const domainResult = this.prismaToDomain(inv, true);
        if (domainResult.isFailure()) {
          continue;
        }

        const domain = domainResult.getValue();
        const contributions = inv.history.filter(
          (h) => h.type === InvestmentHistoryType.CONTRIBUTION
        );

        results.push({
          ...domain.toSnapshot(),
          categoryName: (inv as any).category?.name || null,
          contributionsCount: contributions.length,
          lastContributionDate:
            contributions.length > 0 ? contributions[0].date : null,
        });
      }

      return Result.ok(results);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get investments with metrics: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getHistoryTimeline(
    period: "day" | "week" | "month" | "year",
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<
    Result<
      {
        date: string;
        totalValue: number;
        contributions: number;
        withdrawals: number;
      }[]
    >
  > {
    try {
      const where: any = {
        investment: { userId: this.userId },
      };

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) where.date.lte = dateTo;
      }

      const historyEntries = await this.prisma.investmentHistory.findMany({
        where,
        orderBy: { date: "asc" },
      });

      // Group by period
      const grouped: Map<
        string,
        { totalValue: number; contributions: number; withdrawals: number }
      > = new Map();

      for (const entry of historyEntries) {
        const dateKey = this.getDateKey(entry.date, period);

        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, { totalValue: 0, contributions: 0, withdrawals: 0 });
        }

        const group = grouped.get(dateKey)!;
        const amount = Number(entry.amount);

        if (entry.type === InvestmentHistoryType.CONTRIBUTION) {
          group.contributions += amount;
        } else if (entry.type === InvestmentHistoryType.WITHDRAWAL) {
          group.withdrawals += amount;
        } else if (entry.type === InvestmentHistoryType.VALUE_UPDATE) {
          group.totalValue = amount; // Latest value for the period
        }
      }

      const result = Array.from(grouped.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      return Result.ok(result);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get history timeline: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private getDateKey(date: Date, period: "day" | "week" | "month" | "year"): string {
    const d = new Date(date);
    switch (period) {
      case "day":
        return d.toISOString().split("T")[0];
      case "week":
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split("T")[0];
      case "month":
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      case "year":
        return String(d.getFullYear());
      default:
        return d.toISOString().split("T")[0];
    }
  }

  // Export/Import operations

  async export(filters?: InvestmentFilters): Promise<Result<InvestmentSnapshot[]>> {
    const investmentsResult = await this.findWithFilters(filters);
    if (investmentsResult.isFailure()) {
      return Result.fail(investmentsResult.getError());
    }

    const investments = investmentsResult.getValue();
    const snapshots = investments.map((inv) => inv.toSnapshot());

    return Result.ok(snapshots);
  }

  async import(snapshots: InvestmentSnapshot[]): Promise<Result<number>> {
    try {
      let imported = 0;

      for (const snap of snapshots) {
        // Create investment
        await this.prisma.investment.create({
          data: {
            id: snap.id,
            name: snap.name,
            symbol: snap.symbol,
            currentValue: snap.currentValue,
            currency: snap.currency,
            categoryId: snap.categoryId,
            highlight: snap.highlight,
            color: snap.color,
            icon: snap.icon,
            notes: snap.notes,
            isActive: snap.isActive,
            sortOrder: snap.sortOrder,
            userId: this.userId,
            createdAt: new Date(snap.createdAt),
          },
        });

        // Create history entries
        if (snap.history && snap.history.length > 0) {
          await this.prisma.investmentHistory.createMany({
            data: snap.history.map((h) => ({
              id: h.id,
              investmentId: h.investmentId,
              amount: h.amount,
              type: h.type,
              date: new Date(h.date),
              notes: h.notes,
              transactionId: h.transactionId,
              createdAt: new Date(h.createdAt),
            })),
          });
        }

        imported++;
      }

      return Result.ok(imported);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to import investments: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async clear(): Promise<Result<void>> {
    try {
      // Delete all history first (due to foreign key)
      await this.prisma.investmentHistory.deleteMany({
        where: {
          investment: { userId: this.userId },
        },
      });

      // Then delete investments
      await this.prisma.investment.deleteMany({
        where: { userId: this.userId },
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to clear investments: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
