import { Request, Response } from "express";
import { z } from "zod";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/GetDashboardMetricsUseCase";
import { DashboardQuery } from "../../application/queries/DashboardQuery";
import { PrismaDashboardRepository } from "../repositories/PrismaDashboardRepository";
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
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly dashboardRepository: PrismaDashboardRepository
  ) {}

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
   * Obtiene las métricas de un mes específico con breakdown de categorías real
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

      // Obtener métricas básicas y breakdown de categorías en paralelo
      const [metricsResult, categoryBreakdown] = await Promise.all([
        this.getDashboardMetricsUseCase.execute(query),
        this.dashboardRepository.getCategoryDistribution(
          new Date(year, month - 1, 1),
          new Date(year, month, 0)
        )
      ]);

      if (metricsResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: metricsResult.getError()
        });
      }

      const dashboardData = this.formatDashboardResponse(metricsResult.getValue());
      const totalExpenses = dashboardData.summary.expenses || 1;

      // Reemplazar las categorías con el breakdown real
      const budgetDivisor = 12; // Vista mensual
      const enrichedCategories = categoryBreakdown.map(cat => {
        const periodBudget = cat.annualBudget ? Math.round(cat.annualBudget / budgetDivisor) : null;
        const amount = Math.round(cat.amount);
        const budgetUsage = periodBudget && periodBudget > 0
          ? Math.round((amount / periodBudget) * 100)
          : null;

        return {
          id: cat.categoryId,
          name: cat.categoryName,
          amount: amount,
          percentage: Math.round((cat.amount / totalExpenses) * 100),
          transactionCount: cat.count,
          type: cat.type,
          color: cat.color || this.generateCategoryColor(cat.categoryName),
          icon: this.getCategoryIcon(cat.type),
          budget: periodBudget,
          budgetUsage: budgetUsage,
          annualBudget: cat.annualBudget ? Math.round(cat.annualBudget) : null
        };
      }).filter(cat => cat.amount > 0); // Filtrar categorías sin gastos

      // Calculate expense distribution from enriched categories
      const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

      // Override categories and distribution
      dashboardData.categories = enrichedCategories;
      dashboardData.distribution = {
        ...expenseDistribution,
        currency: "EUR"
      };

      return res.json({
        success: true,
        period: {
          type: "month",
          year,
          month,
          startDate,
          endDate
        },
        data: dashboardData
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

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      // Get both regular metrics and category distribution
      const [metricsResult, categoryBreakdown] = await Promise.all([
        this.getDashboardMetricsUseCase.execute(
          new DashboardQuery(
            "EUR",
            "custom",
            this.formatDate(startDate),
            this.formatDate(endDate),
            true,
            0
          )
        ),
        // Get category distribution directly from repository (includes all categories)
        this.dashboardRepository.getCategoryDistribution(startDate, endDate)
      ]);

      if (metricsResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: metricsResult.getError()
        });
      }

      const dashboardData = metricsResult.getValue();
      const totalExpenses = dashboardData.periodBalance?.expenses || 1;

      // Format categories with all the data
      const enrichedCategories = categoryBreakdown
        .map(cat => ({
          id: cat.categoryId,
          name: cat.categoryName,
          amount: Math.round(cat.amount),
          percentage: Math.round((cat.amount / totalExpenses) * 100),
          transactionCount: cat.count,
          type: cat.type,
          color: cat.color || this.generateCategoryColor(cat.categoryName),
          icon: this.getCategoryIcon(cat.type),
          monthlyBudget: cat.annualBudget ? Math.round(cat.annualBudget / 12) : null,
          quarterlyBudget: cat.annualBudget ? Math.round(cat.annualBudget / 4) : null,
          annualBudget: cat.annualBudget ? Math.round(cat.annualBudget) : null,
          budgetUsage: cat.annualBudget && cat.annualBudget > 0
            ? Math.round((cat.amount / cat.annualBudget) * 100)
            : null
        }))
        .filter(cat => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Calculate expense distribution from enriched categories
      const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

      // Format the response
      const formattedResponse = this.formatDashboardResponse(dashboardData);

      // Override categories with enriched data
      formattedResponse.categories = enrichedCategories;

      // Override expense distribution with calculated values
      formattedResponse.distribution = {
        ...expenseDistribution,
        currency: "EUR"
      };

      return res.json({
        success: true,
        period: {
          type: "year",
          year,
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate)
        },
        data: formattedResponse
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
   * GET /api/dashboard/quarter/:year/:quarter
   * Obtiene las métricas de un trimestre específico
   */
  async getQuarterMetrics(req: Request, res: Response) {
    try {
      const year = z.coerce.number().min(2020).max(2030).parse(req.params.year);
      const quarter = z.coerce.number().min(1).max(4).parse(req.params.quarter);

      // Calculate quarter dates (quarter is 1-4, not 0-3)
      const startMonth = (quarter - 1) * 3;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 3, 0);

      // Get both regular metrics and category distribution
      const [metricsResult, categoryBreakdown] = await Promise.all([
        this.getDashboardMetricsUseCase.execute(
          new DashboardQuery(
            "EUR",
            "custom",
            this.formatDate(startDate),
            this.formatDate(endDate),
            true,
            0
          )
        ),
        // Get category distribution directly from repository (includes all categories)
        this.dashboardRepository.getCategoryDistribution(startDate, endDate)
      ]);

      if (metricsResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: metricsResult.getError()
        });
      }

      const dashboardData = metricsResult.getValue();
      const totalExpenses = dashboardData.periodBalance?.expenses || 1;

      // Format categories with all the data
      const enrichedCategories = categoryBreakdown
        .map(cat => ({
          id: cat.categoryId,
          name: cat.categoryName,
          amount: Math.round(cat.amount),
          percentage: Math.round((cat.amount / totalExpenses) * 100),
          transactionCount: cat.count,
          type: cat.type,
          color: cat.color || this.generateCategoryColor(cat.categoryName),
          icon: this.getCategoryIcon(cat.type),
          monthlyBudget: cat.annualBudget ? Math.round(cat.annualBudget / 12) : null,
          quarterlyBudget: cat.annualBudget ? Math.round(cat.annualBudget / 4) : null,
          annualBudget: cat.annualBudget ? Math.round(cat.annualBudget) : null,
          budgetUsage: cat.annualBudget && cat.annualBudget > 0
            ? Math.round((cat.amount / (cat.annualBudget / 4)) * 100)
            : null
        }))
        .filter(cat => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Calculate expense distribution from enriched categories
      const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

      // Format the response
      const formattedResponse = this.formatDashboardResponse(dashboardData);

      // Override categories with enriched data
      formattedResponse.categories = enrichedCategories;

      // Override expense distribution with calculated values
      formattedResponse.distribution = {
        ...expenseDistribution,
        currency: "EUR"
      };

      return res.json({
        success: true,
        period: {
          type: "quarter",
          year,
          quarter,
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate)
        },
        data: formattedResponse
      });
    } catch (error) {
      console.error("Error in getQuarterMetrics:", error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Invalid quarter"
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
   * GET /api/dashboard/enhanced/:year/:month
   * Endpoint mejorado que combina todas las métricas necesarias para el dashboard
   * Incluye: métricas básicas, breakdown de categorías real, comparación, tendencias y ahorros
   */
  async getEnhancedMonthMetrics(req: Request, res: Response) {
    try {
      const { year, month } = MonthYearSchema.parse(req.params);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Calcular período anterior para comparación
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevStart = new Date(prevYear, prevMonth - 1, 1);
      const prevEnd = new Date(prevYear, prevMonth, 0);

      // Obtener todos los datos en paralelo para mejor performance
      const [
        metricsResult,
        categoryBreakdown,
        comparisonData,
        savingsMetrics,
        monthlyHistory
      ] = await Promise.all([
        // Métricas básicas del período actual
        this.getDashboardMetricsUseCase.execute(
          new DashboardQuery("EUR", "custom", this.formatDate(startDate), this.formatDate(endDate), true, 0)
        ),
        // Breakdown de categorías real
        this.dashboardRepository.getCategoryDistribution(startDate, endDate),
        // Comparación con período anterior
        this.dashboardRepository.getComparisonMetrics(startDate, endDate, prevStart, prevEnd),
        // Métricas de ahorro
        this.dashboardRepository.getSavingsMetrics(startDate, endDate),
        // Histórico de los últimos 6 meses
        this.dashboardRepository.getMonthlyHistory(
          new Date(year, month - 7, 1), // 6 meses atrás
          endDate
        )
      ]);

      if (metricsResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: metricsResult.getError()
        });
      }

      const dashboardData = this.formatDashboardResponse(metricsResult.getValue());
      const totalExpenses = dashboardData.summary.expenses || 1; // Evitar división por cero

      // Calcular el divisor del presupuesto según el período (para mensual = 12)
      const budgetDivisor = 12; // Por ahora solo soportamos vista mensual

      // Enriquecer con breakdown de categorías real
      const enrichedCategories = categoryBreakdown
        .map(cat => {
          // Calcular presupuestos para diferentes períodos
          const monthlyBudget = cat.annualBudget ? Math.round(cat.annualBudget / 12) : null;
          const quarterlyBudget = cat.annualBudget ? Math.round(cat.annualBudget / 4) : null;
          const amount = Math.round(cat.amount);

          // Calcular porcentaje de uso del presupuesto mensual
          const budgetUsagePercentage = monthlyBudget && monthlyBudget > 0
            ? Math.round((amount / monthlyBudget) * 100)
            : null;

          return {
            id: cat.categoryId,
            name: cat.categoryName,
            amount: amount,
            percentage: Math.round((cat.amount / totalExpenses) * 100),
            transactionCount: cat.count,
            type: cat.type,
            color: cat.color || this.generateCategoryColor(cat.categoryName),
            icon: this.getCategoryIcon(cat.type),
            monthlyBudget: monthlyBudget,
            quarterlyBudget: quarterlyBudget,
            budgetUsage: budgetUsagePercentage,
            annualBudget: cat.annualBudget ? Math.round(cat.annualBudget) : null
          };
        })
        .filter(cat => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Calcular distribución de gastos (essential, discretionary, debt)
      const expenseDistribution = this.calculateExpenseDistribution(enrichedCategories);

      // Respuesta completa con todos los datos
      return res.json({
        success: true,
        period: {
          type: "month",
          year,
          month,
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          label: startDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        },
        data: {
          ...dashboardData,
          categories: enrichedCategories,
          categoryBreakdown: enrichedCategories, // Para compatibilidad
          expenseDistribution,
          comparison: {
            current: {
              income: Math.round(comparisonData.current.income * 100) / 100,
              expenses: Math.round(comparisonData.current.expenses * 100) / 100,
              balance: Math.round((comparisonData.current.income - comparisonData.current.expenses) * 100) / 100,
            },
            previous: {
              income: Math.round(comparisonData.previous.income * 100) / 100,
              expenses: Math.round(comparisonData.previous.expenses * 100) / 100,
              balance: Math.round((comparisonData.previous.income - comparisonData.previous.expenses) * 100) / 100,
            },
            changes: {
              income: Math.round(comparisonData.changes.income * 10) / 10,
              expenses: Math.round(comparisonData.changes.expenses * 10) / 10,
              balance: Math.round(comparisonData.changes.transactionCount * 10) / 10,
            }
          },
          savings: {
            totalSavings: Math.round(savingsMetrics.totalSavings * 100) / 100,
            savingsRate: savingsMetrics.savingsRate,
            expenseRatio: savingsMetrics.expenseRatio,
            dailyAverageExpense: Math.round(savingsMetrics.dailyAverageExpense * 100) / 100,
            projectedMonthlySavings: Math.round(savingsMetrics.projectedMonthlySavings * 100) / 100,
            projectedYearlySavings: Math.round(savingsMetrics.projectedMonthlySavings * 12 * 100) / 100
          },
          monthlyTrend: monthlyHistory.map(h => ({
            year: h.year,
            month: h.month,
            label: new Date(h.year, h.month - 1).toLocaleDateString("es-ES", { month: "short" }),
            income: Math.round(h.income * 100) / 100,
            expenses: Math.round(h.expenses * 100) / 100,
            investments: Math.round(h.investments * 100) / 100,
            balance: Math.round((h.income - h.expenses - h.investments) * 100) / 100
          }))
        }
      });
    } catch (error) {
      console.error("Error in getEnhancedMonthMetrics:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch enhanced metrics"
      });
    }
  }

  /**
   * Calcula la distribución de gastos en categorías principales
   */
  private calculateExpenseDistribution(categories: any[]) {
    let essential = 0;
    let discretionary = 0;
    let debtPayments = 0;
    let uncategorized = 0;
    let investments = 0;
    let noCompute = 0;

    categories.forEach(cat => {
      if (!cat.id || cat.name === "Uncategorized") {
        uncategorized += cat.amount;
      } else if (cat.type === "essential") {
        essential += cat.amount;
      } else if (cat.type === "discretionary") {
        discretionary += cat.amount;
      } else if (cat.type === "debt_payment") {
        debtPayments += cat.amount;
      } else if (cat.type === "investment") {
        investments += cat.amount;
      } else if (cat.type === "no_compute") {
        noCompute += cat.amount;
      } else {
        // Categorías sin tipo definido van a uncategorized
        uncategorized += cat.amount;
      }
    });

    return {
      essential: Math.round(essential * 100) / 100,
      discretionary: Math.round(discretionary * 100) / 100,
      debtPayments: Math.round(debtPayments * 100) / 100,
      uncategorized: Math.round(uncategorized * 100) / 100,
      investments: Math.round(investments * 100) / 100,
      noCompute: Math.round(noCompute * 100) / 100
    };
  }

  /**
   * Genera un color para categorías que no lo tienen
   */
  private generateCategoryColor(name: string): string {
    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
      "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Obtiene el icono según el tipo de categoría
   */
  private getCategoryIcon(type: string): string {
    const icons: Record<string, string> = {
      essential: "🏠",
      discretionary: "🎮",
      debt_payment: "💳",
      income: "💰",
      investment: "📈",
      savings: "🏦"
    };
    return icons[type] || "📦";
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