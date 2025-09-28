import { GetDashboardMetricsUseCase } from "../../application/use-cases/GetDashboardMetricsUseCase";
import { DashboardQuery } from "../../application/queries/DashboardQuery";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";

interface PeriodMetrics {
  income: number;
  expenses: number;
  investments: number;
  debtPayments: number;
  balance: number;
  savingsRate: number;
  currency: string;
}

interface ExpenseDistribution {
  essential: number;
  discretionary: number;
  uncategorized: number;
  currency: string;
}

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface DashboardData {
  summary: PeriodMetrics;
  distribution: ExpenseDistribution;
  categories: CategoryData[];
  trends: any[];
  comparison?: {
    income: { value: number; change: number; };
    expenses: { value: number; change: number; };
    savingsRate: { value: number; change: number; };
  };
}

/**
 * Service layer para encapsular la lógica de negocio del dashboard
 * Mejora la separación de responsabilidades y facilita el testing
 */
export class DashboardService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private readonly metricsUseCase: GetDashboardMetricsUseCase,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  /**
   * Obtiene métricas con caché opcional
   */
  async getMetricsWithCache(
    startDate: string,
    endDate: string,
    useCache: boolean = true
  ): Promise<DashboardData> {
    const cacheKey = `${startDate}-${endDate}`;

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    const query = new DashboardQuery("EUR", "custom", startDate, endDate, true, 0);
    const result = await this.metricsUseCase.execute(query);

    if (result.isFailure()) {
      throw new Error(result.getError());
    }

    const data = this.formatMetrics(result.getValue());

    if (useCache) {
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  }

  /**
   * Obtiene métricas con comparación al período anterior
   */
  async getMetricsWithComparison(
    year: number,
    month: number
  ): Promise<DashboardData> {
    // Período actual
    const currentStart = this.formatDate(new Date(year, month - 1, 1));
    const currentEnd = this.formatDate(new Date(year, month, 0));

    // Período anterior
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = this.formatDate(new Date(prevYear, prevMonth - 1, 1));
    const prevEnd = this.formatDate(new Date(prevYear, prevMonth, 0));

    const [current, previous] = await Promise.all([
      this.getMetricsWithCache(currentStart, currentEnd),
      this.getMetricsWithCache(prevStart, prevEnd)
    ]);

    // Calcular cambios porcentuales
    current.comparison = {
      income: {
        value: current.summary.income,
        change: this.calculateChange(previous.summary.income, current.summary.income)
      },
      expenses: {
        value: current.summary.expenses,
        change: this.calculateChange(previous.summary.expenses, current.summary.expenses)
      },
      savingsRate: {
        value: current.summary.savingsRate,
        change: current.summary.savingsRate - previous.summary.savingsRate
      }
    };

    return current;
  }

  /**
   * Obtiene histórico optimizado con una sola consulta
   */
  async getOptimizedHistory(months: number): Promise<any[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const query = new DashboardQuery(
      "EUR",
      "custom",
      this.formatDate(startDate),
      this.formatDate(endDate),
      true,
      0
    );

    const result = await this.metricsUseCase.execute(query);

    if (result.isFailure()) {
      throw new Error(result.getError());
    }

    // Agrupar por mes desde los datos ya obtenidos
    return this.groupByMonth(result.getValue());
  }

  /**
   * Obtiene períodos disponibles consultando la BD
   */
  async getAvailablePeriodsFromDB(): Promise<any[]> {
    const query = `
      SELECT
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE hidden = false
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
      LIMIT 24
    `;

    // Esto debería implementarse en el repository
    // Por ahora retornamos un placeholder
    return [];
  }

  /**
   * Limpia el caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Métodos privados de utilidad

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private calculateChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Number(((newValue - oldValue) / oldValue * 100).toFixed(1));
  }

  private formatMetrics(data: any): DashboardData {
    const income = this.roundMoney(data.periodBalance?.income || 0);
    const expenses = this.roundMoney(data.periodBalance?.expenses || 0);
    const investments = this.roundMoney(data.periodBalance?.investments || 0);
    const debtPayments = this.roundMoney(data.periodBalance?.debtPayments || 0);
    const balance = this.roundMoney(data.periodBalance?.balance || 0);

    return {
      summary: {
        income,
        expenses,
        investments,
        debtPayments,
        balance,
        savingsRate: income > 0 ? Number(((balance / income) * 100).toFixed(1)) : 0,
        currency: data.periodBalance?.currency || "EUR"
      },
      distribution: {
        essential: this.roundMoney(data.expenseDistribution?.essential || 0),
        discretionary: this.roundMoney(data.expenseDistribution?.discretionary || 0),
        uncategorized: this.roundMoney(data.expenseDistribution?.uncategorized || 0),
        currency: data.expenseDistribution?.currency || "EUR"
      },
      categories: (data.categoryBreakdown || []).map((cat: any) => ({
        id: cat.categoryId,
        name: cat.categoryName,
        amount: this.roundMoney(cat.amount),
        percentage: Number(cat.percentage.toFixed(1)),
        transactionCount: cat.transactionCount
      })),
      trends: (data.monthlyTrend || []).map((trend: any) => ({
        month: trend.month,
        income: this.roundMoney(trend.income),
        expenses: this.roundMoney(trend.expenses),
        balance: this.roundMoney(trend.balance),
        investments: this.roundMoney(trend.investments || 0)
      }))
    };
  }

  private roundMoney(amount: number): number {
    return Number(amount.toFixed(2));
  }

  private groupByMonth(data: any): any[] {
    // Implementar agrupación por mes
    // Por ahora retornamos los trends existentes
    return data.monthlyTrend || [];
  }
}