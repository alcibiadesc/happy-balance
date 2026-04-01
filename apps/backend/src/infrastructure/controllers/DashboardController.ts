import { Request, Response } from 'express';
import { z } from 'zod';
import { GetDashboardMetricsUseCase } from '@application/use-cases/GetDashboardMetricsUseCase';
import { DashboardQuery } from '@application/queries/DashboardQuery';
import { PrismaDashboardRepository } from '../repositories/PrismaDashboardRepository';
import {
  BadRequestError,
  validateQuery,
  validateParams,
  handleResult,
  successResponse,
} from '@infrastructure/errors';

// Validation Schemas
const MonthYearSchema = z.object({
  year: z.coerce.number().min(2020).max(2030),
  month: z.coerce.number().min(1).max(12),
});

const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const CurrentPeriodSchema = z.object({
  type: z.enum(['month', 'quarter', 'year']).default('month'),
});

const HistorySchema = z.object({
  months: z.coerce.number().min(1).max(24).default(6),
});

const PeriodsLimitSchema = z.object({
  limit: z.coerce.number().min(1).max(48).default(24),
});

const TrendsSchema = z.object({
  months: z.coerce.number().min(3).max(12).default(6),
});

const CategoryLimitSchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
});

const YearSchema = z.object({
  year: z.coerce.number().min(2020).max(2030),
});

const QuarterSchema = z.object({
  year: z.coerce.number().min(2020).max(2030),
  quarter: z.coerce.number().min(1).max(4),
});

export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly dashboardRepository: PrismaDashboardRepository
  ) {}

  async getCurrentPeriod(req: Request, res: Response): Promise<void> {
    const { type } = validateQuery(CurrentPeriodSchema, req);
    const periodType = type ?? 'month';

    const now = new Date();
    const { startDate, endDate } = this.calculatePeriodDates(periodType, now);

    const query = new DashboardQuery('EUR', 'custom', startDate, endDate, true, 0);
    const result = await this.getDashboardMetricsUseCase.execute(query);
    const data = handleResult(result, 'Failed to get dashboard data');

    successResponse(res, this.formatDashboardResponse(data));
  }

  async getMonthMetrics(req: Request, res: Response): Promise<void> {
    const { year, month } = validateParams(MonthYearSchema, req);

    const startDate = this.formatDate(new Date(year, month - 1, 1));
    const endDate = this.formatDate(new Date(year, month, 0));

    const [metricsResult, categoryBreakdown] = await Promise.all([
      this.getDashboardMetricsUseCase.execute(
        new DashboardQuery('EUR', 'custom', startDate, endDate, true, 0)
      ),
      this.dashboardRepository.getCategoryDistribution(
        new Date(year, month - 1, 1),
        new Date(year, month, 0)
      ),
    ]);

    const metricsData = handleResult(metricsResult, 'Failed to get month metrics');
    const dashboardData = this.formatDashboardResponse(metricsData);
    const enrichedCategories = this.enrichCategoriesWithBudgets(
      categoryBreakdown,
      dashboardData.summary.expenses || 1,
      'month'
    );
    const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

    dashboardData.categories = enrichedCategories;
    dashboardData.distribution = { ...expenseDistribution, currency: 'EUR' };

    successResponse(res, {
      period: { type: 'month', year, month, startDate, endDate },
      ...dashboardData,
    });
  }

  async getYearMetrics(req: Request, res: Response): Promise<void> {
    const { year } = validateParams(YearSchema, req);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const [metricsResult, categoryBreakdown] = await Promise.all([
      this.getDashboardMetricsUseCase.execute(
        new DashboardQuery(
          'EUR',
          'custom',
          this.formatDate(startDate),
          this.formatDate(endDate),
          true,
          0
        )
      ),
      this.dashboardRepository.getCategoryDistribution(startDate, endDate),
    ]);

    const metricsData = handleResult(metricsResult, 'Failed to get year metrics');
    const dashboardData = this.formatDashboardResponse(metricsData);
    const totalExpenses = metricsData.periodBalance?.expenses || 1;
    const enrichedCategories = this.enrichCategoriesWithBudgets(
      categoryBreakdown,
      totalExpenses,
      'year'
    );
    const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

    dashboardData.categories = enrichedCategories;
    dashboardData.distribution = { ...expenseDistribution, currency: 'EUR' };

    successResponse(res, {
      period: {
        type: 'year',
        year,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      },
      ...dashboardData,
    });
  }

  async getQuarterMetrics(req: Request, res: Response): Promise<void> {
    const { year, quarter } = validateParams(QuarterSchema, req);

    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);

    const [metricsResult, categoryBreakdown] = await Promise.all([
      this.getDashboardMetricsUseCase.execute(
        new DashboardQuery(
          'EUR',
          'custom',
          this.formatDate(startDate),
          this.formatDate(endDate),
          true,
          0
        )
      ),
      this.dashboardRepository.getCategoryDistribution(startDate, endDate),
    ]);

    const metricsData = handleResult(metricsResult, 'Failed to get quarter metrics');
    const dashboardData = this.formatDashboardResponse(metricsData);
    const totalExpenses = metricsData.periodBalance?.expenses || 1;
    const enrichedCategories = this.enrichCategoriesWithBudgets(
      categoryBreakdown,
      totalExpenses,
      'quarter'
    );
    const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

    dashboardData.categories = enrichedCategories;
    dashboardData.distribution = { ...expenseDistribution, currency: 'EUR' };

    successResponse(res, {
      period: {
        type: 'quarter',
        year,
        quarter,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      },
      ...dashboardData,
    });
  }

  async getDateRange(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = validateQuery(DateRangeSchema, req);

    const query = new DashboardQuery('EUR', 'custom', startDate, endDate, true, 0);
    const result = await this.getDashboardMetricsUseCase.execute(query);
    const data = handleResult(result, 'Failed to get date range metrics');

    successResponse(res, {
      period: { type: 'custom', startDate, endDate },
      ...this.formatDashboardResponse(data),
    });
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const { months } = validateQuery(HistorySchema, req);
    const monthsNum = months ?? 6;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum + 1);
    startDate.setDate(1);

    const history = await this.dashboardRepository.getMonthlyHistory(startDate, endDate);

    successResponse(res, {
      months: monthsNum,
      count: history.length,
      data: history.map((h) => ({
        year: h.year,
        month: h.month,
        monthName: new Date(h.year, h.month - 1).toLocaleDateString('es-ES', {
          month: 'short',
          year: 'numeric',
        }),
        summary: {
          income: Math.round(h.income * 100) / 100,
          expenses: Math.round(h.expenses * 100) / 100,
          investments: Math.round(h.investments * 100) / 100,
          balance: Math.round((h.income - h.expenses) * 100) / 100,
          savingsRate:
            h.income > 0 ? Math.round(((h.income - h.expenses) / h.income) * 1000) / 10 : 0,
          currency: 'EUR',
        },
        transactionCount: h.transactionCount,
      })),
    });
  }

  async getAvailablePeriods(req: Request, res: Response): Promise<void> {
    const { limit } = validateQuery(PeriodsLimitSchema, req);
    const periods = await this.dashboardRepository.getAvailablePeriods(limit);

    successResponse(res, {
      count: periods.filter((p) => p.hasData).length,
      data: periods
        .filter((p) => p.hasData)
        .map((p) => ({
          year: p.year,
          month: p.month,
          label: new Date(p.year, p.month - 1).toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric',
          }),
          hasData: p.hasData,
          transactionCount: p.transactionCount,
          totalAmount: Math.round(p.totalAmount * 100) / 100,
        }))
        .sort((a, b) => (b.year === a.year ? b.month - a.month : b.year - a.year)),
    });
  }

  async getMonthWithComparison(req: Request, res: Response): Promise<void> {
    const { year, month } = validateParams(MonthYearSchema, req);

    const currentStart = new Date(year, month - 1, 1);
    const currentEnd = new Date(year, month, 0);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = new Date(prevYear, prevMonth - 1, 1);
    const prevEnd = new Date(prevYear, prevMonth, 0);

    const comparison = await this.dashboardRepository.getComparisonMetrics(
      currentStart,
      currentEnd,
      prevStart,
      prevEnd
    );

    successResponse(res, {
      period: { current: { year, month }, previous: { year: prevYear, month: prevMonth } },
      current: {
        income: Math.round(comparison.current.income * 100) / 100,
        expenses: Math.round(comparison.current.expenses * 100) / 100,
        balance: Math.round((comparison.current.income - comparison.current.expenses) * 100) / 100,
      },
      previous: {
        income: Math.round(comparison.previous.income * 100) / 100,
        expenses: Math.round(comparison.previous.expenses * 100) / 100,
        balance:
          Math.round((comparison.previous.income - comparison.previous.expenses) * 100) / 100,
      },
      changes: {
        income: Math.round(comparison.changes.income * 10) / 10,
        expenses: Math.round(comparison.changes.expenses * 10) / 10,
        transactionCount: Math.round(comparison.changes.transactionCount * 10) / 10,
      },
    });
  }

  async getTrends(req: Request, res: Response): Promise<void> {
    const { months } = validateQuery(TrendsSchema, req);
    const trends = await this.dashboardRepository.getTrendsAndPredictions(months);

    successResponse(res, { period: { months }, ...trends });
  }

  async getCategoryBreakdown(req: Request, res: Response): Promise<void> {
    const { year, month } = validateParams(MonthYearSchema, req);
    const { limit } = validateQuery(CategoryLimitSchema, req);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [categories, topCategories] = await Promise.all([
      this.dashboardRepository.getCategoryDistribution(startDate, endDate),
      this.dashboardRepository.getTopCategories(startDate, endDate, limit),
    ]);

    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

    successResponse(res, {
      period: { year, month },
      total: Math.round(total * 100) / 100,
      categories: categories.map((cat) => ({
        id: cat.categoryId,
        name: cat.categoryName,
        amount: Math.round(cat.amount * 100) / 100,
        percentage: total > 0 ? Math.round((cat.amount / total) * 1000) / 10 : 0,
        transactionCount: cat.count,
        type: cat.type,
      })),
      topCategories: topCategories.map((cat) => ({
        name: cat.categoryName,
        amount: Math.round(cat.amount * 100) / 100,
        percentage: total > 0 ? Math.round((cat.amount / total) * 1000) / 10 : 0,
      })),
    });
  }

  async getEnhancedMonthMetrics(req: Request, res: Response): Promise<void> {
    const { year, month } = validateParams(MonthYearSchema, req);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = new Date(prevYear, prevMonth - 1, 1);
    const prevEnd = new Date(prevYear, prevMonth, 0);

    const [metricsResult, comparisonData, savingsMetrics, monthlyHistory] = await Promise.all([
      this.getDashboardMetricsUseCase.execute(
        new DashboardQuery(
          'EUR',
          'custom',
          this.formatDate(startDate),
          this.formatDate(endDate),
          true,
          0
        )
      ),
      this.dashboardRepository.getComparisonMetrics(startDate, endDate, prevStart, prevEnd),
      this.dashboardRepository.getSavingsMetrics(startDate, endDate),
      this.dashboardRepository.getMonthlyHistory(new Date(year, month - 7, 1), endDate),
    ]);

    const metricsData = handleResult(metricsResult, 'Failed to get enhanced metrics');
    const categoryBreakdown = metricsData.categoryBreakdown || [];
    const enrichedCategories = this.enrichCategoryBreakdown(categoryBreakdown, {
      includeBudgets: true,
    });
    const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

    successResponse(res, {
      period: {
        type: 'month',
        year,
        month,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        label: startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      },
      ...this.formatDashboardResponse(metricsData),
      categories: enrichedCategories,
      categoryBreakdown: enrichedCategories,
      expenseDistribution,
      comparison: {
        current: {
          income: Math.round(comparisonData.current.income * 100) / 100,
          expenses: Math.round(comparisonData.current.expenses * 100) / 100,
          balance:
            Math.round((comparisonData.current.income - comparisonData.current.expenses) * 100) /
            100,
        },
        previous: {
          income: Math.round(comparisonData.previous.income * 100) / 100,
          expenses: Math.round(comparisonData.previous.expenses * 100) / 100,
          balance:
            Math.round((comparisonData.previous.income - comparisonData.previous.expenses) * 100) /
            100,
        },
        changes: {
          income: Math.round(comparisonData.changes.income * 10) / 10,
          expenses: Math.round(comparisonData.changes.expenses * 10) / 10,
          balance: Math.round(comparisonData.changes.transactionCount * 10) / 10,
        },
      },
      savings: {
        totalSavings: Math.round(savingsMetrics.totalSavings * 100) / 100,
        savingsRate: savingsMetrics.savingsRate,
        expenseRatio: savingsMetrics.expenseRatio,
        dailyAverageExpense: Math.round(savingsMetrics.dailyAverageExpense * 100) / 100,
        projectedMonthlySavings: Math.round(savingsMetrics.projectedMonthlySavings * 100) / 100,
        projectedYearlySavings: Math.round(savingsMetrics.projectedMonthlySavings * 12 * 100) / 100,
      },
      monthlyTrend: monthlyHistory.map((h) => ({
        year: h.year,
        month: h.month,
        label: new Date(h.year, h.month - 1).toLocaleDateString('es-ES', { month: 'short' }),
        income: Math.round(h.income * 100) / 100,
        expenses: Math.round(h.expenses * 100) / 100,
        investments: Math.round(h.investments * 100) / 100,
        balance: Math.round((h.income - h.expenses) * 100) / 100,
      })),
    });
  }

  async getSavingsMetrics(req: Request, res: Response): Promise<void> {
    const { year, month } = validateParams(MonthYearSchema, req);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const savings = await this.dashboardRepository.getSavingsMetrics(startDate, endDate);

    successResponse(res, {
      period: { year, month },
      totalSavings: Math.round(savings.totalSavings * 100) / 100,
      savingsRate: savings.savingsRate,
      expenseRatio: savings.expenseRatio,
      dailyAverageExpense: Math.round(savings.dailyAverageExpense * 100) / 100,
      projectedMonthlySavings: Math.round(savings.projectedMonthlySavings * 100) / 100,
      projectedYearlySavings: Math.round(savings.projectedMonthlySavings * 12 * 100) / 100,
    });
  }

  // Helper Methods
  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private calculatePeriodDates(type: string, now: Date): { startDate: string; endDate: string } {
    switch (type) {
      case 'month':
        return {
          startDate: this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
          endDate: this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
        };
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          startDate: this.formatDate(new Date(now.getFullYear(), quarter * 3, 1)),
          endDate: this.formatDate(new Date(now.getFullYear(), quarter * 3 + 3, 0)),
        };
      }
      case 'year':
        return {
          startDate: this.formatDate(new Date(now.getFullYear(), 0, 1)),
          endDate: this.formatDate(new Date(now.getFullYear(), 11, 31)),
        };
      default:
        throw new BadRequestError('Invalid period type');
    }
  }

  private enrichCategoriesWithBudgets(
    categoryBreakdown: any[],
    totalExpenses: number,
    periodType: 'month' | 'quarter' | 'year'
  ): any[] {
    return categoryBreakdown
      .map((cat) => {
        const amount = Math.round(cat.amount);
        const periodBudget = cat.annualBudget
          ? Math.round(
              cat.annualBudget / (periodType === 'year' ? 1 : periodType === 'quarter' ? 4 : 12)
            )
          : null;
        const budgetUsage =
          periodBudget && periodBudget > 0 ? Math.round((amount / periodBudget) * 100) : null;

        return {
          id: cat.categoryId,
          name: cat.categoryName,
          amount,
          percentage: Math.round((cat.amount / totalExpenses) * 100),
          transactionCount: cat.count,
          type: cat.type,
          color: cat.color || this.generateCategoryColor(cat.categoryName),
          icon: this.getCategoryIcon(cat.type),
          budget: periodBudget,
          budgetUsage,
          annualBudget: cat.annualBudget ? Math.round(cat.annualBudget) : null,
        };
      })
      .filter((cat) => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  private enrichCategoryBreakdown(
    categoryBreakdown: any[],
    options: { includeBudgets?: boolean } = {}
  ): any[] {
    return categoryBreakdown
      .map((cat) => ({
        id: cat.categoryId,
        name: cat.categoryName,
        amount: Math.round(cat.amount),
        percentage: Math.round(cat.percentage),
        transactionCount: cat.transactionCount,
        type: cat.type,
        color: this.generateCategoryColor(cat.categoryName),
        icon: this.getCategoryIcon(cat.type),
        ...(options.includeBudgets && {
          monthlyBudget: null,
          quarterlyBudget: null,
          budgetUsage: null,
          annualBudget: null,
        }),
      }))
      .filter((cat) => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  private calculateExpenseDistribution(categories: any[]): Record<string, number> {
    const distribution = {
      essential: 0,
      discretionary: 0,
      debtPayments: 0,
      uncategorized: 0,
      investments: 0,
      noCompute: 0,
    };

    categories.forEach((cat) => {
      const amount = cat.amount;
      if (!cat.id || cat.name === 'Uncategorized') distribution.uncategorized += amount;
      else if (cat.type === 'essential') distribution.essential += amount;
      else if (cat.type === 'discretionary') distribution.discretionary += amount;
      else if (cat.type === 'debt_payment') distribution.debtPayments += amount;
      else if (cat.type === 'investment') distribution.investments += amount;
      else if (cat.type === 'no_compute') distribution.noCompute += amount;
      else distribution.uncategorized += amount;
    });

    return Object.fromEntries(
      Object.entries(distribution).map(([k, v]) => [k, Math.round(v * 100) / 100])
    );
  }

  private generateCategoryColor(name: string): string {
    const colors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#84CC16',
      '#F97316',
      '#6366F1',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  private getCategoryIcon(type: string): string {
    const icons: Record<string, string> = {
      essential: '🏠',
      discretionary: '🎮',
      debt_payment: '💳',
      income: '💰',
      investment: '📈',
      savings: '🏦',
    };
    return icons[type] || '📦';
  }

  private formatDashboardResponse(data: any): any {
    const income = data.periodBalance?.income || 0;
    const expenses = data.periodBalance?.expenses || 0;
    const investments = data.periodBalance?.investments || 0;
    const debtPayments = data.periodBalance?.debtPayments || 0;
    const balance = data.periodBalance?.balance || 0;

    const categoryBreakdown = this.enrichCategoryBreakdown(data.categoryBreakdown || [], {
      includeBudgets: false,
    });

    return {
      summary: {
        income,
        expenses,
        investments,
        debtPayments,
        balance,
        savingsRate: income > 0 ? parseFloat(((balance / income) * 100).toFixed(1)) : 0,
        currency: data.periodBalance?.currency || 'EUR',
      },
      distribution: {
        essential: data.expenseDistribution?.essential || 0,
        discretionary: data.expenseDistribution?.discretionary || 0,
        uncategorized: data.expenseDistribution?.uncategorized || 0,
        currency: data.expenseDistribution?.currency || 'EUR',
      },
      categories: categoryBreakdown,
      categoryBreakdown,
      trends: (data.monthlyTrend || []).map((trend: any) => ({
        month: trend.month,
        income: trend.income,
        expenses: trend.expenses,
        balance: trend.balance,
        investments: trend.investments || 0,
      })),
    };
  }
}
