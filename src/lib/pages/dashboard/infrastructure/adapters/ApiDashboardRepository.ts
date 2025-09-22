import type { DashboardRepository, DashboardData } from '../../domain/repositories/DashboardRepository';
import { DashboardMetrics } from '../../domain/entities/DashboardMetrics';
import { Category } from '../../domain/entities/Category';
import { Money } from '../../domain/value-objects/Money';
import { Period } from '../../domain/value-objects/Period';

export class ApiDashboardRepository implements DashboardRepository {
  constructor(private readonly apiBase: string) {}

  async getDashboardData(period: Period, currency: string): Promise<DashboardData> {
    const url = this.buildUrl(period, currency);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid API response');
      }

      return this.mapToDomainModel(result.data, period, currency);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return this.getEmptyDashboardData(period, currency);
    }
  }

  private buildUrl(period: Period, currency: string): string {
    let url = `${this.apiBase}/metrics/dashboard?currency=${currency}`;

    if (period.getType() === 'custom') {
      const params = period.toApiParams();
      url += `&startDate=${params.startDate}&endDate=${params.endDate}`;
    } else {
      url += `&period=${period.getType()}&periodOffset=${period.getOffset()}`;
    }

    return url;
  }

  private mapToDomainModel(data: any, period: Period, currency: string): DashboardData {
    // Map metrics
    const income = Money.create(data.summary?.totalIncome?._amount || 0, currency);
    const expenses = Money.create(
      (data.summary?.totalExpenses?._amount || 0) +
      (data.summary?.totalDebtPayments?._amount || 0),
      currency
    );
    const investments = Money.create(data.summary?.totalInvestments?._amount || 0, currency);

    const metrics = DashboardMetrics.create(period, income, expenses, investments);

    // Map categories
    const categories = this.mapCategories(data.categoryBreakdown || [], currency, expenses);

    // Map trends
    const monthlyTrend = this.mapMonthlyTrend(data.monthlyTrend || []);
    const monthlyBarData = this.mapMonthlyBarData(data.monthlyBarData || [], data);

    // Map expense distribution
    const expenseDistribution = {
      essential: data.expenseDistribution?.essential?._amount || 0,
      discretionary: data.expenseDistribution?.discretionary?._amount || 0,
      debtPayments: data.expenseDistribution?.debtPayments?._amount || 0
    };

    return {
      metrics,
      categories,
      monthlyTrend,
      monthlyBarData,
      expenseDistribution
    };
  }

  private mapCategories(categoryData: any[], currency: string, totalExpenses: Money): Category[] {
    return categoryData.map(cat => {
      const amount = Money.create(cat.amount?._amount || 0, currency);
      const category = Category.create(
        cat.categoryId || cat.id || '',
        cat.categoryName || cat.category || 'Unknown',
        amount,
        totalExpenses
      );

      return cat.color ? category.withColor(cat.color) : category;
    });
  }

  private mapMonthlyTrend(trendData: any[]): any[] {
    if (trendData.length === 0) return [];

    return trendData.map(trend => ({
      month: trend.month,
      income: trend.income || 0,
      expenses: trend.expenses || 0,
      balance: trend.balance || 0
    }));
  }

  private mapMonthlyBarData(barData: any[], data: any): any[] {
    if (barData.length > 0) return barData;

    // Fallback calculation
    const essentialRatio = data.expenseDistribution?.essentialPercentage
      ? data.expenseDistribution.essentialPercentage / 100
      : 0.5;
    const discretionaryRatio = data.expenseDistribution?.discretionaryPercentage
      ? data.expenseDistribution.discretionaryPercentage / 100
      : 0.33;

    return (data.monthlyTrend || []).map((trend: any) => ({
      month: trend.month,
      income: trend.income || 0,
      essentialExpenses: (trend.expenses || 0) * essentialRatio,
      discretionaryExpenses: (trend.expenses || 0) * discretionaryRatio,
      debtPayments: 0,
      investments: 0
    }));
  }

  private getEmptyDashboardData(period: Period, currency: string): DashboardData {
    const zero = Money.zero(currency);
    const metrics = DashboardMetrics.create(period, zero, zero, zero);

    return {
      metrics,
      categories: [],
      monthlyTrend: [],
      monthlyBarData: [],
      expenseDistribution: { essential: 0, discretionary: 0, debtPayments: 0 }
    };
  }
}