import type { DashboardRepository, DashboardData } from '../../domain/repositories/DashboardRepository';
import { DashboardMetrics } from '../../domain/entities/DashboardMetrics';
import { Category } from '../../domain/entities/Category';
import { Money } from '../../domain/value-objects/Money';
import { Period } from '../../domain/value-objects/Period';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  period?: any;
}

interface SummaryData {
  income: number;
  expenses: number;
  investments: number;
  debtPayments?: number;
  balance: number;
  savingsRate: number;
  currency: string;
}

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color?: string;
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  investments?: number;
}

interface AvailablePeriod {
  year: number;
  month: number;
  label: string;
  hasData: boolean;
  transactionCount: number;
  totalAmount: number;
}

/**
 * Repository moderno para el dashboard usando las nuevas APIs RESTful
 * Sin offsets confusos, sin underscores, estructura limpia
 */
export class ModernApiDashboardRepository implements DashboardRepository {
  constructor(private readonly apiBase: string) {}

  /**
   * Obtiene datos del dashboard para un período específico
   */
  async getDashboardData(period: Period, currency: string): Promise<DashboardData> {
    try {
      const url = this.buildModernUrl(period);
      console.log('[Modern Dashboard API] Fetching:', url);

      const response = await fetch(url);

      if (!response.ok) {
        console.error('[Dashboard] HTTP Error:', response.status);
        return this.getEmptyDashboardData(period, currency);
      }

      const result: ApiResponse<any> = await response.json();

      if (!result.success || !result.data) {
        console.error('[Dashboard] API Error:', result.error);
        return this.getEmptyDashboardData(period, currency);
      }

      return this.mapToDomainModel(result.data, period, currency);
    } catch (error) {
      console.error('[Dashboard] Network Error:', error);
      return this.getEmptyDashboardData(period, currency);
    }
  }

  /**
   * Obtiene los períodos disponibles con datos
   */
  async getAvailablePeriods(): Promise<AvailablePeriod[]> {
    try {
      const response = await fetch(`${this.apiBase}/dashboard/available-periods?limit=24`);

      if (!response.ok) {
        return [];
      }

      const result: ApiResponse<AvailablePeriod[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('[Dashboard] Error fetching periods:', error);
      return [];
    }
  }

  /**
   * Obtiene comparación con el período anterior
   */
  async getComparison(year: number, month: number): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/dashboard/comparison/${year}/${month}`);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[Dashboard] Error fetching comparison:', error);
      return null;
    }
  }

  /**
   * Obtiene distribución por categorías
   */
  async getCategoryBreakdown(year: number, month: number): Promise<CategoryData[]> {
    try {
      const response = await fetch(`${this.apiBase}/dashboard/categories/${year}/${month}?limit=10`);

      if (!response.ok) {
        return [];
      }

      const result: ApiResponse<{ categories: CategoryData[] }> = await response.json();
      return result.data?.categories || [];
    } catch (error) {
      console.error('[Dashboard] Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Obtiene métricas de ahorro
   */
  async getSavingsMetrics(year: number, month: number): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/dashboard/savings/${year}/${month}`);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[Dashboard] Error fetching savings:', error);
      return null;
    }
  }

  /**
   * Obtiene histórico de varios meses
   */
  async getHistory(months: number = 6): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBase}/dashboard/history?months=${months}`);

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('[Dashboard] Error fetching history:', error);
      return [];
    }
  }

  // === Métodos privados ===

  private buildModernUrl(period: Period): string {
    const now = new Date();
    const offset = period.getOffset();

    // Calcular año y mes basado en el offset
    let targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    switch (period.getType()) {
      case 'month':
        return `${this.apiBase}/dashboard/month/${year}/${month}`;
      case 'year':
        return `${this.apiBase}/dashboard/year/${year}`;
      case 'custom':
        const params = period.toApiParams();
        return `${this.apiBase}/dashboard/range?startDate=${params.startDate}&endDate=${params.endDate}`;
      default:
        return `${this.apiBase}/dashboard/current?type=month`;
    }
  }

  private mapToDomainModel(data: any, period: Period, currency: string): DashboardData {
    // Extraer datos limpios sin underscores
    const summary = data.summary || {};
    const income = Money.create(summary.income || 0, summary.currency || currency);
    const expenses = Money.create(summary.expenses || 0, summary.currency || currency);
    const investments = Money.create(summary.investments || 0, summary.currency || currency);

    const metrics = DashboardMetrics.create(period, income, expenses, investments);

    // Mapear categorías
    const categories = this.mapCategories(
      data.categories || [],
      summary.currency || currency,
      expenses
    );

    // Mapear tendencias
    const monthlyTrend = (data.trends || []).map((trend: any) => ({
      month: trend.month,
      income: trend.income || 0,
      expenses: trend.expenses || 0,
      balance: trend.balance || 0,
      investments: trend.investments || 0
    }));

    // Mapear distribución de gastos (sin underscores)
    const distribution = data.distribution || {};
    const expenseDistribution = {
      essential: { amount: distribution.essential || 0 },
      discretionary: { amount: distribution.discretionary || 0 },
      debtPayments: { amount: distribution.debtPayments || 0 }
    };

    // Generar datos para gráficos de barras
    const monthlyBarData = this.generateMonthlyBarData(monthlyTrend, distribution);

    return {
      metrics,
      categories,
      monthlyTrend,
      monthlyBarData,
      expenseDistribution
    };
  }

  private mapCategories(categoryData: CategoryData[], currency: string, totalExpenses: Money): Category[] {
    return categoryData.map(cat => {
      const amount = Money.create(cat.amount, currency);
      const category = Category.create(
        cat.id,
        cat.name,
        amount,
        totalExpenses
      );

      return cat.color ? category.withColor(cat.color) : category;
    });
  }

  private generateMonthlyBarData(trends: TrendData[], distribution: any): any[] {
    if (!trends || trends.length === 0) return [];

    const totalExpenses = (distribution.essential || 0) + (distribution.discretionary || 0);
    const essentialRatio = totalExpenses > 0 ? distribution.essential / totalExpenses : 0.5;
    const discretionaryRatio = totalExpenses > 0 ? distribution.discretionary / totalExpenses : 0.5;

    return trends.map(trend => ({
      month: trend.month,
      income: trend.income,
      essentialExpenses: trend.expenses * essentialRatio,
      discretionaryExpenses: trend.expenses * discretionaryRatio,
      debtPayments: 0,
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
        essential: { amount: 0 },
        discretionary: { amount: 0 },
        debtPayments: { amount: 0 }
      }
    };
  }
}