import { PrismaClient, Prisma } from '@prisma/client';
import { TransactionType } from '@domain/entities/TransactionType';

interface MonthlyMetrics {
  year: number;
  month: number;
  income: number;
  expenses: number;
  investments: number;
  transactionCount: number;
}

interface CategoryMetrics {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  count: number;
  type: string;
  color?: string;
  annualBudget?: number | null;
}

interface AvailablePeriod {
  year: number;
  month: number;
  transactionCount: number;
  totalAmount: number;
  hasData: boolean;
}

/**
 * Repository optimizado para el Dashboard usando Prisma
 * Implementa consultas agregadas eficientes
 */
export class PrismaDashboardRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string = 'default'
  ) {}

  /**
   * Obtiene métricas agregadas para un período usando SQL nativo
   * Mucho más eficiente que cargar todas las transacciones
   */
  async getAggregatedMetrics(startDate: Date, endDate: Date) {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        type,
        SUM(amount)::float as total,
        COUNT(*)::int as count,
        AVG(amount)::float as average,
        MIN(amount)::float as min_amount,
        MAX(amount)::float as max_amount
      FROM transactions
      WHERE
        date >= ${startDate}
        AND date <= ${endDate}
        AND hidden = false
        AND "userId" = ${this.userId}
        AND "userId" = ${this.userId}
      GROUP BY type
    `;

    const typeMetrics = result.reduce((acc, row) => {
      const total = parseFloat(row.total) || 0;
      const count = parseInt(row.count) || 0;
      const maxAmount = parseFloat(row.max_amount) || 0;

      const typeMap: Record<string, string> = {
        'INCOME': 'income',
        'EXPENSE': 'expenses',
        'INVESTMENT': 'investments',
        'DEBT_PAYMENT': 'debtPayments'
      };

      const metricKey = typeMap[row.type] || 'expenses';

      return {
        ...acc,
        [metricKey]: total,
        transactionCount: acc.transactionCount + count,
        largestTransaction: Math.max(acc.largestTransaction, maxAmount)
      };
    }, {
      income: 0,
      expenses: 0,
      investments: 0,
      debtPayments: 0,
      transactionCount: 0,
      largestTransaction: 0
    });

    const metrics = {
      ...typeMetrics,
      averageTransaction: typeMetrics.transactionCount > 0
        ? (typeMetrics.income + typeMetrics.expenses) / typeMetrics.transactionCount
        : 0
    };

    return metrics;
  }

  /**
   * Obtiene distribución por categorías de manera eficiente
   */
  async getCategoryDistribution(startDate: Date, endDate: Date): Promise<CategoryMetrics[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        t."categoryId",
        COALESCE(c.name, 'Uncategorized') as "categoryName",
        c.type as "categoryType",
        c.color,
        c."annualBudget"::float as "annualBudget",
        SUM(t.amount)::float as amount,
        COUNT(t.id)::int as count
      FROM transactions t
      LEFT JOIN categories c ON t."categoryId" = c.id
      WHERE
        t.date >= ${startDate}
        AND t.date <= ${endDate}
        AND t.hidden = false
        AND t."userId" = ${this.userId}
        AND t.type = 'EXPENSE'
      GROUP BY t."categoryId", c.name, c.type, c.color, c."annualBudget"
      ORDER BY amount DESC
    `;

    return result.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      amount: parseFloat(row.amount) || 0,
      count: parseInt(row.count) || 0,
      type: row.categoryType || 'GENERAL',
      color: row.color,
      annualBudget: row.annualBudget ? parseFloat(row.annualBudget) : null,
    }));
  }

  /**
   * Obtiene histórico mensual agregado en una sola consulta
   */
  async getMonthlyHistory(startDate: Date, endDate: Date): Promise<MonthlyMetrics[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        EXTRACT(YEAR FROM date)::int as year,
        EXTRACT(MONTH FROM date)::int as month,
        type,
        SUM(amount)::float as total,
        COUNT(*)::int as count
      FROM transactions
      WHERE
        date >= ${startDate}
        AND date <= ${endDate}
        AND hidden = false
        AND "userId" = ${this.userId}
      GROUP BY
        EXTRACT(YEAR FROM date),
        EXTRACT(MONTH FROM date),
        type
      ORDER BY year DESC, month DESC
    `;

    // Agrupar por mes usando reduce
    const monthlyMap = result.reduce((acc, row) => {
      const key = `${row.year}-${row.month}`;
      const total = parseFloat(row.total) || 0;
      const count = parseInt(row.count) || 0;

      const existing = acc.get(key) || {
        year: row.year,
        month: row.month,
        income: 0,
        expenses: 0,
        investments: 0,
        transactionCount: 0
      };

      const typeMap: Record<string, keyof MonthlyMetrics> = {
        'INCOME': 'income',
        'EXPENSE': 'expenses',
        'INVESTMENT': 'investments'
      };

      const metricKey = typeMap[row.type];
      if (metricKey) {
        existing[metricKey] = total;
      }

      return acc.set(key, {
        ...existing,
        transactionCount: existing.transactionCount + count
      });
    }, new Map<string, MonthlyMetrics>());

    return Array.from(monthlyMap.values())
      .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
  }

  /**
   * Obtiene períodos que tienen datos disponibles
   */
  async getAvailablePeriods(limit: number = 24): Promise<AvailablePeriod[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        EXTRACT(YEAR FROM date)::int as year,
        EXTRACT(MONTH FROM date)::int as month,
        COUNT(*)::int as transaction_count,
        SUM(amount)::float as total_amount
      FROM transactions
      WHERE hidden = false
        AND "userId" = ${this.userId}
      GROUP BY
        EXTRACT(YEAR FROM date),
        EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
      LIMIT ${limit}
    `;

    return result.map(row => ({
      year: row.year,
      month: row.month,
      transactionCount: row.transaction_count,
      totalAmount: parseFloat(row.total_amount) || 0,
      hasData: row.transaction_count > 0,
    }));
  }

  /**
   * Obtiene estadísticas por tipo de transacción
   */
  async getTransactionTypeStats(startDate: Date, endDate: Date) {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        type,
        DATE_TRUNC('week', date) as week,
        COUNT(*)::int as count,
        SUM(amount)::float as total,
        AVG(amount)::float as average
      FROM transactions
      WHERE
        date >= ${startDate}
        AND date <= ${endDate}
        AND hidden = false
        AND "userId" = ${this.userId}
      GROUP BY type, DATE_TRUNC('week', date)
      ORDER BY week DESC
    `;

    return result;
  }

  /**
   * Obtiene métricas de comparación entre dos períodos
   */
  async getComparisonMetrics(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ) {
    const [current, previous] = await Promise.all([
      this.getAggregatedMetrics(currentStart, currentEnd),
      this.getAggregatedMetrics(previousStart, previousEnd),
    ]);

    return {
      current,
      previous,
      changes: {
        income: this.calculateChange(previous.income, current.income),
        expenses: this.calculateChange(previous.expenses, current.expenses),
        investments: this.calculateChange(previous.investments, current.investments),
        transactionCount: this.calculateChange(previous.transactionCount, current.transactionCount),
      },
    };
  }

  /**
   * Obtiene tendencias y predicciones basadas en datos históricos
   */
  async getTrendsAndPredictions(months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const history = await this.getMonthlyHistory(startDate, endDate);

    // Calcular tendencias simples
    if (history.length < 2) {
      return { trends: [], predictions: [] };
    }

    const incomes = history.map(h => h.income);
    const expenses = history.map(h => h.expenses);

    // Tendencia lineal simple
    const incomeTrend = this.calculateLinearTrend(incomes);
    const expenseTrend = this.calculateLinearTrend(expenses);

    // Predicción para el próximo mes (muy básica)
    const nextMonthPrediction = {
      income: Math.max(0, incomes[0] + incomeTrend.slope),
      expenses: Math.max(0, expenses[0] + expenseTrend.slope),
    };

    return {
      trends: {
        income: incomeTrend,
        expenses: expenseTrend,
      },
      predictions: {
        nextMonth: nextMonthPrediction,
        confidence: 0.6, // Baja confianza en predicción simple
      },
    };
  }

  /**
   * Obtiene las top categorías por gasto
   */
  async getTopCategories(startDate: Date, endDate: Date, limit: number = 5) {
    const categories = await this.getCategoryDistribution(startDate, endDate);
    return categories.slice(0, limit);
  }

  /**
   * Obtiene métricas de ahorro y gasto
   */
  async getSavingsMetrics(startDate: Date, endDate: Date) {
    const metrics = await this.getAggregatedMetrics(startDate, endDate);

    const savings = metrics.income - metrics.expenses - metrics.investments;
    const savingsRate = metrics.income > 0 ? (savings / metrics.income) * 100 : 0;
    const expenseRatio = metrics.income > 0 ? (metrics.expenses / metrics.income) * 100 : 0;

    return {
      totalSavings: savings,
      savingsRate: Math.round(savingsRate * 10) / 10,
      expenseRatio: Math.round(expenseRatio * 10) / 10,
      dailyAverageExpense: metrics.expenses / 30, // Aproximado
      projectedMonthlySavings: savings,
    };
  }

  // Métodos auxiliares privados

  private calculateChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private calculateLinearTrend(values: number[]): { slope: number; direction: 'up' | 'down' | 'stable' } {
    if (values.length < 2) return { slope: 0, direction: 'stable' };

    // Regresión lineal simple
    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);

    return {
      slope,
      direction: slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable',
    };
  }
}