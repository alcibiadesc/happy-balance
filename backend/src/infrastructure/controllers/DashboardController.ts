import { Request, Response } from "express";
import { z } from "zod";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/GetDashboardMetricsUseCase";
import { DashboardQuery } from "../../application/queries/DashboardQuery";
import { PrismaDashboardRepository } from "../repositories/PrismaDashboardRepository";
import { DashboardService } from "../services/DashboardService";
import { DashboardResponseDTO, ErrorResponseDTO, DashboardErrors } from "../dto/DashboardDTO";

// Schemas de validación
const MonthYearSchema = z.object({
  year: z.coerce.number().min(2020).max(2030),
  month: z.coerce.number().min(1).max(12),
});

const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const CurrentPeriodSchema = z.object({
  type: z.enum(["month", "quarter", "year"]).default("month"),
});

/**
 * Controlador modernizado para el dashboard
 * Endpoints claros y RESTful sin offsets confusos
 */
export class DashboardController {
  private dashboardService: DashboardService;

  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly dashboardRepository: PrismaDashboardRepository
  ) {
    this.dashboardService = new DashboardService(
      getDashboardMetricsUseCase,
      dashboardRepository as any
    );
  }

  /**
   * GET /api/dashboard/current
   * Obtiene las métricas del período actual (mes, trimestre o año actual)
   */
  async getCurrentPeriod(req: Request, res: Response) {
    try {
      const { type } = CurrentPeriodSchema.parse(req.query);

      const now = new Date();
      let startDate: string;
      let endDate: string;

      switch (type) {
        case "month":
          startDate = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
          endDate = this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = this.formatDate(new Date(now.getFullYear(), quarter * 3, 1));
          endDate = this.formatDate(new Date(now.getFullYear(), quarter * 3 + 3, 0));
          break;
        case "year":
          startDate = this.formatDate(new Date(now.getFullYear(), 0, 1));
          endDate = this.formatDate(new Date(now.getFullYear(), 11, 31));
          break;
      }

      const query = new DashboardQuery(
        "EUR",
        "custom",
        startDate,
        endDate,
        true,
        0
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);

      if (result.isFailure()) {
        return res.status(500).json({
          success: false,
          error: result.getError()
        });
      }

      return res.json({
        success: true,
        data: this.formatDashboardResponse(result.getValue())
      });
    } catch (error) {
      console.error("Error in getCurrentPeriod:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/dashboard/month/:year/:month
   * Obtiene las métricas de un mes específico
   * Ejemplo: /api/dashboard/month/2025/1 (enero 2025)
   */
  async getMonthMetrics(req: Request, res: Response) {
    try {
      const { year, month } = MonthYearSchema.parse(req.params);

      const startDate = this.formatDate(new Date(year, month - 1, 1));
      const endDate = this.formatDate(new Date(year, month, 0));

      const query = new DashboardQuery(
        "EUR",
        "custom",
        startDate,
        endDate,
        true,
        0
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);

      if (result.isFailure()) {
        return res.status(500).json({
          success: false,
          error: result.getError()
        });
      }

      return res.json({
        success: true,
        period: {
          type: "month",
          year,
          month,
          startDate,
          endDate
        },
        data: this.formatDashboardResponse(result.getValue())
      });
    } catch (error) {
      console.error("Error in getMonthMetrics:", error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Invalid parameters"
      });
    }
  }

  /**
   * GET /api/dashboard/year/:year
   * Obtiene las métricas de un año completo
   */
  async getYearMetrics(req: Request, res: Response) {
    try {
      const year = z.coerce.number().min(2020).max(2030).parse(req.params.year);

      const startDate = this.formatDate(new Date(year, 0, 1));
      const endDate = this.formatDate(new Date(year, 11, 31));

      const query = new DashboardQuery(
        "EUR",
        "custom",
        startDate,
        endDate,
        true,
        0
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);

      if (result.isFailure()) {
        return res.status(500).json({
          success: false,
          error: result.getError()
        });
      }

      return res.json({
        success: true,
        period: {
          type: "year",
          year,
          startDate,
          endDate
        },
        data: this.formatDashboardResponse(result.getValue())
      });
    } catch (error) {
      console.error("Error in getYearMetrics:", error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Invalid year"
      });
    }
  }

  /**
   * GET /api/dashboard/range
   * Obtiene las métricas para un rango de fechas personalizado
   * Query params: startDate, endDate (formato: YYYY-MM-DD)
   */
  async getDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = DateRangeSchema.parse(req.query);

      const query = new DashboardQuery(
        "EUR",
        "custom",
        startDate,
        endDate,
        true,
        0
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);

      if (result.isFailure()) {
        return res.status(500).json({
          success: false,
          error: result.getError()
        });
      }

      return res.json({
        success: true,
        period: {
          type: "custom",
          startDate,
          endDate
        },
        data: this.formatDashboardResponse(result.getValue())
      });
    } catch (error) {
      console.error("Error in getDateRange:", error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Invalid date range"
      });
    }
  }

  /**
   * GET /api/dashboard/history
   * Obtiene el histórico optimizado en una sola consulta
   */
  async getHistory(req: Request, res: Response) {
    try {
      const months = z.coerce.number().min(1).max(24).default(6).parse(req.query.months);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);

      const history = await this.dashboardRepository.getMonthlyHistory(startDate, endDate);

      const formattedHistory = history.map(h => ({
        year: h.year,
        month: h.month,
        monthName: new Date(h.year, h.month - 1).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric"
        }),
        summary: {
          income: Math.round(h.income * 100) / 100,
          expenses: Math.round(h.expenses * 100) / 100,
          investments: Math.round(h.investments * 100) / 100,
          balance: Math.round((h.income - h.expenses - h.investments) * 100) / 100,
          savingsRate: h.income > 0 ?
            Math.round(((h.income - h.expenses - h.investments) / h.income) * 1000) / 10 : 0,
          currency: "EUR"
        },
        transactionCount: h.transactionCount
      }));

      return res.json({
        success: true,
        months: months,
        count: formattedHistory.length,
        data: formattedHistory
      });
    } catch (error) {
      console.error("Error in getHistory:", error);
      const errorResponse = new ErrorResponseDTO(
        DashboardErrors.SERVICE_ERROR,
        "Failed to fetch history",
        error instanceof Error ? error.message : undefined
      );
      return res.status(500).json(errorResponse);
    }
  }

  /**
   * GET /api/dashboard/available-periods
   * Obtiene los períodos que tienen datos disponibles (desde la BD)
   */
  async getAvailablePeriods(req: Request, res: Response) {
    try {
      const limit = z.coerce.number().min(1).max(48).default(24).parse(req.query.limit);
      const periods = await this.dashboardRepository.getAvailablePeriods(limit);

      const formattedPeriods = periods
        .filter(p => p.hasData) // Solo mostrar períodos con datos
        .map(p => ({
          year: p.year,
          month: p.month,
          label: new Date(p.year, p.month - 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
          }),
          hasData: p.hasData,
          transactionCount: p.transactionCount,
          totalAmount: Math.round(p.totalAmount * 100) / 100
        }))
        .sort((a, b) => b.year === a.year ? b.month - a.month : b.year - a.year);

      return res.json({
        success: true,
        count: formattedPeriods.length,
        data: formattedPeriods
      });
    } catch (error) {
      console.error("Error in getAvailablePeriods:", error);
      const errorResponse = new ErrorResponseDTO(
        DashboardErrors.SERVICE_ERROR,
        "Failed to fetch available periods",
        error instanceof Error ? error.message : undefined
      );
      return res.status(500).json(errorResponse);
    }
  }

  /**
   * GET /api/dashboard/comparison/:year/:month
   * Obtiene métricas con comparación al período anterior
   */
  async getMonthWithComparison(req: Request, res: Response) {
    try {
      const { year, month } = MonthYearSchema.parse(req.params);

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

      return res.json({
        success: true,
        period: {
          current: { year, month },
          previous: { year: prevYear, month: prevMonth }
        },
        data: {
          current: {
            income: Math.round(comparison.current.income * 100) / 100,
            expenses: Math.round(comparison.current.expenses * 100) / 100,
            balance: Math.round((comparison.current.income - comparison.current.expenses) * 100) / 100,
          },
          previous: {
            income: Math.round(comparison.previous.income * 100) / 100,
            expenses: Math.round(comparison.previous.expenses * 100) / 100,
            balance: Math.round((comparison.previous.income - comparison.previous.expenses) * 100) / 100,
          },
          changes: {
            income: Math.round(comparison.changes.income * 10) / 10,
            expenses: Math.round(comparison.changes.expenses * 10) / 10,
            transactionCount: Math.round(comparison.changes.transactionCount * 10) / 10,
          }
        }
      });
    } catch (error) {
      console.error("Error in getMonthWithComparison:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/dashboard/trends
   * Obtiene tendencias y predicciones básicas
   */
  async getTrends(req: Request, res: Response) {
    try {
      const months = z.coerce.number().min(3).max(12).default(6).parse(req.query.months);
      const trends = await this.dashboardRepository.getTrendsAndPredictions(months);

      return res.json({
        success: true,
        period: { months },
        data: trends
      });
    } catch (error) {
      console.error("Error in getTrends:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/dashboard/categories/:year/:month
   * Obtiene distribución detallada por categorías
   */
  async getCategoryBreakdown(req: Request, res: Response) {
    try {
      const { year, month } = MonthYearSchema.parse(req.params);
      const limit = z.coerce.number().min(1).max(20).default(10).parse(req.query.limit);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const [categories, topCategories] = await Promise.all([
        this.dashboardRepository.getCategoryDistribution(startDate, endDate),
        this.dashboardRepository.getTopCategories(startDate, endDate, limit)
      ]);

      const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

      const formattedCategories = categories.map(cat => ({
        id: cat.categoryId,
        name: cat.categoryName,
        amount: Math.round(cat.amount * 100) / 100,
        percentage: total > 0 ? Math.round((cat.amount / total) * 1000) / 10 : 0,
        transactionCount: cat.count,
        type: cat.type
      }));

      return res.json({
        success: true,
        period: { year, month },
        data: {
          total: Math.round(total * 100) / 100,
          categories: formattedCategories,
          topCategories: topCategories.map(cat => ({
            name: cat.categoryName,
            amount: Math.round(cat.amount * 100) / 100,
            percentage: total > 0 ? Math.round((cat.amount / total) * 1000) / 10 : 0
          }))
        }
      });
    } catch (error) {
      console.error("Error in getCategoryBreakdown:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/dashboard/savings/:year/:month
   * Obtiene métricas de ahorro y proyecciones
   */
  async getSavingsMetrics(req: Request, res: Response) {
    try {
      const { year, month } = MonthYearSchema.parse(req.params);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const savings = await this.dashboardRepository.getSavingsMetrics(startDate, endDate);

      return res.json({
        success: true,
        period: { year, month },
        data: {
          totalSavings: Math.round(savings.totalSavings * 100) / 100,
          savingsRate: savings.savingsRate,
          expenseRatio: savings.expenseRatio,
          dailyAverageExpense: Math.round(savings.dailyAverageExpense * 100) / 100,
          projectedMonthlySavings: Math.round(savings.projectedMonthlySavings * 100) / 100,
          projectedYearlySavings: Math.round(savings.projectedMonthlySavings * 12 * 100) / 100
        }
      });
    } catch (error) {
      console.error("Error in getSavingsMetrics:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Métodos auxiliares
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDashboardResponse(data: any) {
    const income = data.periodBalance?.income || 0;
    const expenses = data.periodBalance?.expenses || 0;
    const investments = data.periodBalance?.investments || 0;
    const debtPayments = data.periodBalance?.debtPayments || 0;
    const balance = data.periodBalance?.balance || 0;

    return {
      summary: {
        income,
        expenses,
        investments,
        debtPayments,
        balance,
        savingsRate: income > 0 ? parseFloat(((balance / income) * 100).toFixed(1)) : 0,
        currency: data.periodBalance?.currency || "EUR"
      },
      distribution: {
        essential: data.expenseDistribution?.essential || 0,
        discretionary: data.expenseDistribution?.discretionary || 0,
        uncategorized: data.expenseDistribution?.uncategorized || 0,
        currency: data.expenseDistribution?.currency || "EUR"
      },
      categories: (data.categoryBreakdown || []).map((cat: any) => ({
        id: cat.categoryId,
        name: cat.categoryName,
        amount: cat.amount,
        percentage: parseFloat(cat.percentage.toFixed(1)),
        transactionCount: cat.transactionCount
      })),
      trends: (data.monthlyTrend || []).map((trend: any) => ({
        month: trend.month,
        income: trend.income,
        expenses: trend.expenses,
        balance: trend.balance,
        investments: trend.investments || 0
      }))
    };
  }
}