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

  /**
   * Obtiene histórico de trimestres agregados
   */
  async getQuarterlyHistory(quarters: number = 8): Promise<any[]> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const quarterlyData: any[] = [];

      // Fetch data for each quarter
      const promises = [];
      for (let i = 0; i < quarters; i++) {
        const targetQuarter = currentQuarter - i;
        const year = currentYear + Math.floor(targetQuarter / 4);
        const quarter = ((targetQuarter % 4) + 4) % 4;

        // Calculate quarter dates
        const startMonth = quarter * 3;
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, startMonth + 3, 0);

        promises.push(this.getQuarterSummary(startDate, endDate, year, quarter));
      }

      const results = await Promise.all(promises);

      // Filter out null results and format
      for (const result of results) {
        if (result) {
          quarterlyData.push(result);
        }
      }

      // Sort by year and quarter ascending
      return quarterlyData.sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.quarter - b.quarter;
      });
    } catch (error) {
      console.error('[Dashboard] Error fetching quarterly history:', error);
      return [];
    }
  }

  /**
   * Get summary data for a specific quarter
   */
  private async getQuarterSummary(startDate: Date, endDate: Date, year: number, quarter: number): Promise<any> {
    try {
      const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const url = `${this.apiBase}/dashboard/range?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const summary = result.data.summary || {};
        const distribution = result.data.expenseDistribution || result.data.distribution || {};

        // Use actual distribution data if available, otherwise use estimates
        const essential = distribution.essential || (summary.expenses || 0) * 0.6;
        const discretionary = distribution.discretionary || (summary.expenses || 0) * 0.4;
        const debtPayments = distribution.debtPayments || 0;

        return {
          year: year,
          quarter: quarter,
          label: `Q${quarter + 1} ${year}`,
          period: `Q${quarter + 1} ${year}`,
          income: summary.income || 0,
          expenses: summary.expenses || 0,
          investments: summary.investments || 0,
          balance: (summary.income || 0) - (summary.expenses || 0),
          essentialExpenses: essential,
          discretionaryExpenses: discretionary,
          debtPayments: debtPayments
        };
      }

      return null;
    } catch (error) {
      console.error(`[Dashboard] Error fetching quarter ${quarter + 1} ${year}:`, error);
      return null;
    }
  }

  /**
   * Obtiene histórico anual
   */
  async getYearlyHistory(years: number = 12): Promise<any[]> {
    try {
      // Since yearly endpoint doesn't exist, we'll aggregate data from multiple years
      const currentYear = new Date().getFullYear();
      const yearlyData: any[] = [];

      // Fetch data for each year
      const promises = [];
      for (let i = 0; i < years; i++) {
        const year = currentYear - i;
        promises.push(this.getYearSummary(year));
      }

      const results = await Promise.all(promises);

      // Filter out null results and format
      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          const year = currentYear - i;
          yearlyData.push({
            year: year,
            label: year.toString(),
            period: year.toString(),
            ...results[i]
          });
        }
      }

      // Sort by year ascending
      return yearlyData.sort((a, b) => a.year - b.year);
    } catch (error) {
      console.error('[Dashboard] Error fetching yearly history:', error);
      return [];
    }
  }

  /**
   * Get summary data for a specific year
   */
  private async getYearSummary(year: number): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/dashboard/year/${year}`);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Aggregate the year data
        const summary = result.data.summary || {};
        const distribution = result.data.expenseDistribution || result.data.distribution || {};

        // Use actual distribution data if available, otherwise use estimates
        const essential = distribution.essential || (summary.expenses || 0) * 0.6;
        const discretionary = distribution.discretionary || (summary.expenses || 0) * 0.4;
        const debtPayments = distribution.debtPayments || 0;

        return {
          income: summary.income || 0,
          expenses: summary.expenses || 0,
          investments: summary.investments || 0,
          balance: (summary.income || 0) - (summary.expenses || 0),
          essentialExpenses: essential,
          discretionaryExpenses: discretionary,
          debtPayments: debtPayments
        };
      }

      return null;
    } catch (error) {
      console.error(`[Dashboard] Error fetching year ${year}:`, error);
      return null;
    }
  }

  // === Métodos privados ===

  private buildModernUrl(period: Period): string {
    const now = new Date();
    const offset = period.getOffset();

    switch (period.getType()) {
      case 'month': {
        // Calcular año y mes basado en el offset
        const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        return `${this.apiBase}/dashboard/enhanced/${year}/${month}`;
      }

      case 'quarter': {
        // Calcular trimestre basado en el offset
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const targetQuarter = currentQuarter + offset;

        // Calcular año y trimestre real
        const year = now.getFullYear() + Math.floor(targetQuarter / 4);
        const quarter = ((targetQuarter % 4) + 4) % 4; // Normalizar trimestre (0-3)

        // Calcular fechas del trimestre
        const startMonth = quarter * 3;
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, startMonth + 3, 0); // Último día del trimestre

        // Formatear fechas para el API
        const formatDate = (date: Date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        };

        return `${this.apiBase}/dashboard/range?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
      }

      case 'year': {
        const targetDate = new Date(now.getFullYear() + offset, 0, 1);
        const year = targetDate.getFullYear();
        return `${this.apiBase}/dashboard/year/${year}`;
      }

      case 'custom': {
        const params = period.toApiParams();
        return `${this.apiBase}/dashboard/range?startDate=${params.startDate}&endDate=${params.endDate}`;
      }

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

    // Si no hay distribución del API, calcular estimaciones basadas en el total
    const totalExpensesValue = expenses.getValue();
    // Check if we have ANY distribution data (including when essential is 0)
    const hasDistribution = distribution.essential !== undefined ||
                           distribution.discretionary !== undefined ||
                           distribution.debtPayments !== undefined ||
                           distribution.uncategorized !== undefined;

    const expenseDistribution = {
      essential: {
        _amount: distribution.essential?._amount !== undefined ? distribution.essential._amount :
                distribution.essential !== undefined ? distribution.essential :
                (hasDistribution ? 0 : totalExpensesValue * 0.6)
      },
      discretionary: {
        _amount: distribution.discretionary?._amount !== undefined ? distribution.discretionary._amount :
                distribution.discretionary !== undefined ? distribution.discretionary :
                (hasDistribution ? 0 : totalExpensesValue * 0.35)
      },
      debtPayments: {
        _amount: distribution.debtPayments?._amount !== undefined ? distribution.debtPayments._amount :
                distribution.debtPayments !== undefined ? distribution.debtPayments : 0
      },
      uncategorized: {
        _amount: distribution.uncategorized?._amount !== undefined ? distribution.uncategorized._amount :
                distribution.uncategorized !== undefined ? distribution.uncategorized :
                (hasDistribution ? 0 : totalExpensesValue * 0.05)
      }
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