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

      console.log('[Dashboard] Categories in response:', result.data.categoryBreakdown?.length || result.data.categories?.length || 0);
      console.log('[Dashboard] First category:', result.data.categoryBreakdown?.[0] || result.data.categories?.[0]);
      console.log('[Dashboard] Raw API response categoryBreakdown:', result.data.categoryBreakdown);

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
        // Usar el endpoint mejorado que incluye categorías reales
        return `${this.apiBase}/dashboard/enhanced/${year}/${month}`;
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

    // Mapear categorías - usar categoryBreakdown si existe (del endpoint enhanced)
    const categoryData = data.categoryBreakdown || data.categories || [];
    const categories = this.mapCategories(
      categoryData,
      summary.currency || currency,
      expenses
    );

    // Mapear tendencias - usar monthlyTrend si existe (del endpoint enhanced)
    const trendData = data.monthlyTrend || data.trends || [];
    const monthlyTrend = trendData.map((trend: any) => ({
      month: trend.label || trend.month,
      income: trend.income || 0,
      expenses: trend.expenses || 0,
      balance: trend.balance || 0,
      investments: trend.investments || 0
    }));

    // Mapear distribución de gastos - manejar formato del endpoint enhanced
    const distribution = data.expenseDistribution || data.distribution || {};
    const expenseDistribution = {
      essential: { _amount: distribution.essential?._amount || distribution.essential || 0 },
      discretionary: { _amount: distribution.discretionary?._amount || distribution.discretionary || 0 },
      debtPayments: { _amount: distribution.debtPayments?._amount || distribution.debtPayments || 0 }
    };

    // Generar datos para gráficos de barras
    const monthlyBarData = this.generateMonthlyBarData(monthlyTrend, distribution);

    return {
      metrics,
      categories,
      monthlyTrend,
      monthlyBarData,
      expenseDistribution,
      categoryBreakdown: categoryData // Pass raw category data with budgets
    };
  }

  private mapCategories(categoryData: any[], currency: string, totalExpenses: Money): Category[] {
    return categoryData.map(cat => {
      const amount = Money.create(cat.amount || 0, currency);

      // Usar el porcentaje que viene del servidor (ya redondeado)
      // y también incluir color, icono y presupuestos directamente
      const category = Category.createWithPercentage(
        cat.id || null,
        cat.name || 'Unknown',
        amount,
        cat.percentage || 0,
        cat.color,
        cat.icon,
        cat.monthlyBudget,
        cat.quarterlyBudget,
        cat.budgetUsage,
        cat.annualBudget
      );

      return category;
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
      },
      categoryBreakdown: []
    };
  }
}