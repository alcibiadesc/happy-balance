import type { DashboardRepository, DashboardData } from '../../domain/repositories/DashboardRepository';
import { DashboardMetrics } from '../../domain/entities/DashboardMetrics';
import { Category } from '../../domain/entities/Category';
import { Money } from '../../domain/value-objects/Money';
import { Period } from '../../domain/value-objects/Period';
import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';

export class ApiDashboardRepository implements DashboardRepository {
  constructor(private readonly apiBase: string) {}

  /**
   * Helper method to create authenticated headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = authStore.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async getDashboardData(period: Period, currency: string): Promise<DashboardData> {
    const url = this.buildUrl(period, currency);

    console.log('[Dashboard API] Fetching from:', url);

    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('[Dashboard API] Response not OK:', response.status);
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[Dashboard API] Response data:', JSON.stringify(result.data?.summary, null, 2));

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
    // Map metrics - extract amounts from backend Money objects
    const incomeAmount = this.extractAmount(data.summary?.totalIncome);
    const expensesAmount = this.extractAmount(data.summary?.totalExpenses);
    const investmentsAmount = this.extractAmount(data.summary?.totalInvestments);
    const debtPaymentsAmount = this.extractAmount(data.summary?.totalDebtPayments);

    const income = Money.create(incomeAmount, currency);
    const expenses = Money.create(expensesAmount + debtPaymentsAmount, currency);
    const investments = Money.create(investmentsAmount, currency);

    const metrics = DashboardMetrics.create(period, income, expenses, investments);

    // Map categories
    const categories = this.mapCategories(data.categoryBreakdown || [], currency, expenses);

    // Map trends - use data.trends or data.monthlyTrend
    const monthlyTrend = this.mapMonthlyTrend(data.trends || data.monthlyTrend || []);

    // Map monthly bar data - use actual data if available
    const monthlyBarData = data.monthlyBarData && data.monthlyBarData.length > 0
      ? this.mapMonthlyBarData(data.monthlyBarData, data)
      : this.generateMonthlyBarData(monthlyTrend, data.expenseDistribution);

    // Map expense distribution - extract amounts properly
    const expenseDistribution = {
      essential: { _amount: this.extractAmount(data.expenseDistribution?.essential) },
      discretionary: { _amount: this.extractAmount(data.expenseDistribution?.discretionary) },
      debtPayments: { _amount: this.extractAmount(data.expenseDistribution?.debtPayments) }
    };

    return {
      metrics,
      categories,
      monthlyTrend,
      monthlyBarData,
      expenseDistribution
    };
  }

  private extractAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      if ('_amount' in value) return value._amount || 0;
      if ('amount' in value) return value.amount || 0;
    }
    return 0;
  }

  private mapCategories(categoryData: any[], currency: string, totalExpenses: Money): Category[] {
    return categoryData.map(cat => {
      const amount = Money.create(this.extractAmount(cat.amount), currency);
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
    return barData.map(item => ({
      month: item.month || item.period,
      income: this.extractAmount(item.income),
      essentialExpenses: this.extractAmount(item.essentialExpenses),
      discretionaryExpenses: this.extractAmount(item.discretionaryExpenses),
      debtPayments: this.extractAmount(item.debtPayments),
      investments: this.extractAmount(item.investments)
    }));
  }

  private generateMonthlyBarData(monthlyTrend: any[], expenseDistribution: any): any[] {
    if (!monthlyTrend || monthlyTrend.length === 0) return [];

    // Calculate distribution ratios
    const totalExpenses = this.extractAmount(expenseDistribution?.essential) +
                         this.extractAmount(expenseDistribution?.discretionary);

    const essentialRatio = totalExpenses > 0
      ? this.extractAmount(expenseDistribution?.essential) / totalExpenses
      : 0.5;
    const discretionaryRatio = totalExpenses > 0
      ? this.extractAmount(expenseDistribution?.discretionary) / totalExpenses
      : 0.5;

    return monthlyTrend.map(trend => ({
      month: trend.month,
      income: trend.income || 0,
      essentialExpenses: (trend.expenses || 0) * essentialRatio,
      discretionaryExpenses: (trend.expenses || 0) * discretionaryRatio,
      debtPayments: trend.debtPayments || 0,
      investments: trend.investments || 0
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
      expenseDistribution: {
        essential: { _amount: 0 },
        discretionary: { _amount: 0 },
        debtPayments: { _amount: 0 }
      }
    };
  }
}