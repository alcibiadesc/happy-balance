import { PrismaClient } from '@prisma/client';
import { MetricsRepository } from '../../domain/metrics/repositories/MetricsRepository';
import { MetricSnapshot } from '../../domain/metrics/entities/MetricSnapshot';
import { MetricsPeriod } from '../../domain/metrics/value-objects/MetricsPeriod';
import { MetricsType } from '../../domain/metrics/value-objects/MetricsType';
import { Currency } from '../../domain/value-objects/Currency';
import { Money } from '../../domain/value-objects/Money';
import { SignedMoney } from '../../domain/value-objects/SignedMoney';

export class PrismaMetricsRepository implements MetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCurrentMetrics(period: MetricsPeriod, currency: Currency): Promise<MetricSnapshot> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        hidden: false,
      },
      include: {
        category: true,
      },
    });

    return this.calculateMetricsFromTransactions(transactions, period, MetricsType.current());
  }

  async getHistoricalMetrics(periods: MetricsPeriod[], currency: Currency): Promise<MetricSnapshot[]> {
    const snapshots: MetricSnapshot[] = [];

    for (const period of periods) {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          date: {
            gte: period.startDate,
            lte: period.endDate,
          },
          hidden: false,
        },
        include: {
          category: true,
        },
      });

      const snapshot = this.calculateMetricsFromTransactions(
        transactions,
        period,
        MetricsType.historical()
      );
      snapshots.push(snapshot);
    }

    return snapshots;
  }

  async getComparisonMetrics(
    currentPeriod: MetricsPeriod,
    previousPeriod: MetricsPeriod,
    currency: Currency
  ): Promise<{ current: MetricSnapshot; previous: MetricSnapshot }> {
    const [currentSnapshot, previousSnapshot] = await Promise.all([
      this.getCurrentMetrics(currentPeriod, currency),
      this.getCurrentMetrics(previousPeriod, currency),
    ]);

    return {
      current: currentSnapshot,
      previous: previousSnapshot,
    };
  }

  async getCategoryBreakdown(
    period: MetricsPeriod,
    currency: Currency
  ): Promise<Array<{ categoryName: string; amount: Money; percentage: number }>> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        hidden: false,
        type: 'EXPENSE', // Only expenses for category breakdown
      },
      include: {
        category: true,
      },
    });

    const totalExpenses = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (totalExpenses === 0) {
      return [];
    }

    const categoryTotals = new Map<string, number>();

    transactions.forEach((transaction) => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const current = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, current + Math.abs(transaction.amount));
    });

    return Array.from(categoryTotals.entries()).map(([categoryName, amount]) => ({
      categoryName,
      amount: Money.create(amount, currency.value),
      percentage: Number(((amount / totalExpenses) * 100).toFixed(1)),
    }));
  }

  private calculateMetricsFromTransactions(
    transactions: any[],
    period: MetricsPeriod,
    type: MetricsType
  ): MetricSnapshot {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInvestments = 0;
    let totalDebtPayments = 0;

    transactions.forEach((transaction) => {
      const amount = Math.abs(transaction.amount);

      // Handle both uppercase and lowercase transaction types
      const transactionType = transaction.type?.toLowerCase();

      switch (transactionType) {
        case 'income':
          totalIncome += amount;
          break;
        case 'expense':
          // Classify expenses based on category type or name
          if (this.isInvestmentCategory(transaction.category)) {
            totalInvestments += amount;
          } else if (this.isDebtPaymentCategory(transaction.category)) {
            totalDebtPayments += amount;
          } else {
            totalExpenses += amount;
          }
          break;
        case 'investment':
          totalInvestments += amount;
          break;
        case 'debt_payment':
          totalDebtPayments += amount;
          break;
      }
    });

    const balance = totalIncome - totalExpenses - totalInvestments - totalDebtPayments;
    const spendingRate = totalIncome > 0 ? ((totalExpenses + totalDebtPayments) / totalIncome) * 100 : 0;
    const savingsRate = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;

    return MetricSnapshot.create({
      period,
      type,
      totalIncome: Money.create(totalIncome, 'EUR'), // Should use actual currency
      totalExpenses: Money.create(totalExpenses, 'EUR'),
      totalInvestments: Money.create(totalInvestments, 'EUR'),
      totalDebtPayments: Money.create(totalDebtPayments, 'EUR'),
      balance: SignedMoney.create(balance, 'EUR'),
      savingsRate,
      spendingRate,
    });
  }

  private isInvestmentCategory(category: any): boolean {
    if (!category) return false;
    const investmentKeywords = ['investment', 'savings', 'stock', 'retirement', 'pension'];
    return investmentKeywords.some(keyword =>
      category.name.toLowerCase().includes(keyword)
    );
  }

  private isDebtPaymentCategory(category: any): boolean {
    if (!category) return false;
    const debtKeywords = ['loan', 'debt', 'credit', 'mortgage', 'payment'];
    return debtKeywords.some(keyword =>
      category.name.toLowerCase().includes(keyword)
    );
  }
}