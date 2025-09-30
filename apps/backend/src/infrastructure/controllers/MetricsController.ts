import { Request, Response } from "express";
import { z } from "zod";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/GetDashboardMetricsUseCase";
import { DashboardQuery } from "../../application/queries/DashboardQuery";

const PeriodStatsSchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).default("month"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  currency: z.string().min(3).max(3).default("EUR"),
  periodOffset: z.coerce.number().default(0), // Allow negative offsets for previous periods
});

/**
 * Controller for optimized metrics endpoints
 * Provides fast aggregated data without loading all transactions
 */
export class MetricsController {
  private formatPeriodLabel(dateString: string, period: string): string {
    const date = new Date(dateString);

    switch (period) {
      case "week":
        return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      case "month":
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
    }
  }
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  /**
   * Get period statistics (balance, income, expenses) without full transaction list
   * Optimized for dashboard and summary views
   */
  async getPeriodStats(req: Request, res: Response) {
    try {
      const validationResult = PeriodStatsSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: validationResult.error.errors,
        });
      }

      const params = validationResult.data;

      const query = new DashboardQuery(
        params.currency,
        params.period,
        params.startDate,
        params.endDate,
        true, // includeInvestments
        params.periodOffset
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);
      if (result.isFailure()) {
        return res.status(500).json({
          error: "Failed to get period stats",
          message: result.getError()
        });
      }

      const data = result.getValue();

      // Calculate savings rate
      const savingsRate = data.periodBalance.income > 0
        ? (data.periodBalance.balance / data.periodBalance.income) * 100
        : 0;

      // Calculate essential and discretionary percentages
      const totalExpenses = data.periodBalance.expenses;
      const essentialPercentage = totalExpenses > 0 ? (data.expenseDistribution.essential / totalExpenses) * 100 : 0;
      const discretionaryPercentage = totalExpenses > 0 ? (data.expenseDistribution.discretionary / totalExpenses) * 100 : 0;
      const debtPaymentPercentage = totalExpenses > 0 ? (data.periodBalance.debtPayments / totalExpenses) * 100 : 0;
      const uncategorizedPercentage = totalExpenses > 0 ? (data.expenseDistribution.uncategorized / totalExpenses) * 100 : 0;

      // Return only the summary data for fast loading
      res.json({
        success: true,
        data: {
          period: {
            startDate: new Date(data.periodInfo.startDate).toISOString(),
            endDate: new Date(data.periodInfo.endDate).toISOString(),
            label: this.formatPeriodLabel(data.periodInfo.startDate, data.periodInfo.periodType),
          },
          summary: {
            totalIncome: {
              amount: data.periodBalance.income,
              currency: data.periodBalance.currency,
            },
            totalExpenses: {
              amount: data.periodBalance.expenses,
              currency: data.periodBalance.currency,
            },
            totalInvestments: {
              amount: data.periodBalance.investments,
              currency: data.periodBalance.currency,
            },
            totalDebtPayments: {
              amount: data.periodBalance.debtPayments,
              currency: data.periodBalance.currency,
            },
            balance: {
              amount: data.periodBalance.balance,
              currency: data.periodBalance.currency,
            },
            savingsRate: savingsRate,
          },
          spendingRate: totalExpenses > 0 ? (totalExpenses / data.periodBalance.income) * 100 : 0,
          expenseDistribution: {
            essential: {
              amount: data.expenseDistribution.essential,
              currency: data.expenseDistribution.currency,
            },
            discretionary: {
              amount: data.expenseDistribution.discretionary,
              currency: data.expenseDistribution.currency,
            },
            uncategorized: {
              amount: data.expenseDistribution.uncategorized,
              currency: data.expenseDistribution.currency,
            },
            essentialPercentage: essentialPercentage,
            discretionaryPercentage: discretionaryPercentage,
            uncategorizedPercentage: uncategorizedPercentage,
          },
        },
      });
    } catch (error) {
      console.error("Error in getPeriodStats:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get complete dashboard data (unified endpoint for frontend)
   * Combines period stats and trends in one call
   */
  async getDashboardData(req: Request, res: Response) {
    try {
      const validationResult = PeriodStatsSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: validationResult.error.errors,
        });
      }

      const params = validationResult.data;

      const query = new DashboardQuery(
        params.currency,
        params.period,
        params.startDate,
        params.endDate,
        true, // includeInvestments
        params.periodOffset
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);
      if (result.isFailure()) {
        return res.status(500).json({
          error: "Failed to get dashboard data",
          message: result.getError()
        });
      }

      const data = result.getValue();

      // Calculate savings rate
      const savingsRate = data.periodBalance.income > 0
        ? (data.periodBalance.balance / data.periodBalance.income) * 100
        : 0;

      // Calculate spending rate
      const spendingRate = data.periodBalance.income > 0
        ? (data.periodBalance.expenses / data.periodBalance.income) * 100
        : 0;

      // Calculate essential and discretionary percentages
      const totalExpenses = data.periodBalance.expenses;
      const essentialPercentage = totalExpenses > 0 ? (data.expenseDistribution.essential / totalExpenses) * 100 : 0;
      const discretionaryPercentage = totalExpenses > 0 ? (data.expenseDistribution.discretionary / totalExpenses) * 100 : 0;
      const debtPaymentPercentage = totalExpenses > 0 ? (data.periodBalance.debtPayments / totalExpenses) * 100 : 0;
      const uncategorizedPercentage = totalExpenses > 0 ? (data.expenseDistribution.uncategorized / totalExpenses) * 100 : 0;

      // Transform trends data for charts
      const monthlyTrend = data.monthlyTrend.map(trend => ({
        month: trend.month,
        income: trend.income,
        expenses: trend.expenses,
        balance: trend.balance,
        investments: trend.investments || 0
      }));

      // Calculate trends (percentage change from previous period)
      let incomeTrend = 0;
      let expenseTrend = 0;
      let investmentTrend = 0;

      if (data.monthlyTrend.length >= 2) {
        const currentMonth = data.monthlyTrend[data.monthlyTrend.length - 1];
        const previousMonth = data.monthlyTrend[data.monthlyTrend.length - 2];

        if (previousMonth.income > 0) {
          incomeTrend = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100;
        }
        if (previousMonth.expenses > 0) {
          expenseTrend = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
        }
        if (previousMonth.investments > 0) {
          investmentTrend = ((currentMonth.investments - previousMonth.investments) / previousMonth.investments) * 100;
        }
      }

      // Transform monthly bar data for expense distribution charts with proper monthly ratios
      const monthlyBarData = data.monthlyTrend.map((trend, index) => {
        // Use actual monthly expenses for distribution calculation
        const monthExpenses = trend.expenses || 0;
        const totalPeriodExpenses = data.periodBalance.expenses || 1;

        // Calculate proportional distribution for this month
        const monthRatio = totalPeriodExpenses > 0 ? monthExpenses / totalPeriodExpenses : 0;

        return {
          month: trend.month,
          income: trend.income,
          essentialExpenses: data.expenseDistribution.essential * monthRatio,
          discretionaryExpenses: data.expenseDistribution.discretionary * monthRatio,
          debtPayments: trend.debtPayments || 0,
          investments: trend.investments || 0
        };
      });

      // Return complete dashboard data
      res.json({
        success: true,
        data: {
          trends: {
            income: incomeTrend,
            expenses: expenseTrend,
            investments: investmentTrend
          },
          summary: {
            totalIncome: {
              _amount: data.periodBalance.income,
              _currency: data.periodBalance.currency,
            },
            totalExpenses: {
              _amount: data.periodBalance.expenses,
              _currency: data.periodBalance.currency,
            },
            totalInvestments: {
              _amount: data.periodBalance.investments,
              _currency: data.periodBalance.currency,
            },
            totalDebtPayments: {
              _amount: data.periodBalance.debtPayments,
              _currency: data.periodBalance.currency,
            },
            balance: {
              _amount: data.periodBalance.balance,
              _currency: data.periodBalance.currency,
            },
            savingsRate: savingsRate,
            period: {
              startDate: {
                _date: new Date(data.periodInfo.startDate).toISOString(),
              },
              endDate: {
                _date: new Date(data.periodInfo.endDate).toISOString(),
              },
              label: this.formatPeriodLabel(data.periodInfo.startDate, data.periodInfo.periodType),
            }
          },
          monthlyTrend: monthlyTrend,
          spendingRate: spendingRate,
          expenseDistribution: {
            essential: {
              _amount: data.expenseDistribution.essential,
              _currency: data.expenseDistribution.currency,
            },
            discretionary: {
              _amount: data.expenseDistribution.discretionary,
              _currency: data.expenseDistribution.currency,
            },
            debtPayments: {
              _amount: data.periodBalance.debtPayments || 0,
              _currency: data.expenseDistribution.currency,
            },
            essentialPercentage: essentialPercentage,
            discretionaryPercentage: discretionaryPercentage,
            debtPaymentPercentage: debtPaymentPercentage,
          },
          categoryBreakdown: data.categoryBreakdown.map(category => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            amount: category.amount,
            percentage: category.percentage,
            transactionCount: category.transactionCount,
          })),
          monthlyBarData: monthlyBarData
        },
      });
    } catch (error) {
      console.error("Error in getDashboardData:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get trends data for charts (lightweight aggregated data)
   */
  async getTrends(req: Request, res: Response) {
    try {
      const validationResult = PeriodStatsSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: validationResult.error.errors,
        });
      }

      const params = validationResult.data;

      const query = new DashboardQuery(
        params.currency,
        params.period,
        params.startDate,
        params.endDate,
        true,
        params.periodOffset
      );

      const result = await this.getDashboardMetricsUseCase.execute(query);
      if (result.isFailure()) {
        return res.status(500).json({
          error: "Failed to get trends",
          message: result.getError()
        });
      }

      const data = result.getValue();

      // Return only trends data for charts
      const trends = data.monthlyTrend.map(trend => ({
        period: trend.month,
        income: {
          amount: trend.income,
          currency: data.periodBalance.currency,
        },
        expenses: {
          amount: trend.expenses,
          currency: data.periodBalance.currency,
        },
        investments: {
          amount: trend.investments,
          currency: data.periodBalance.currency,
        },
        debtPayments: {
          amount: trend.debtPayments,
          currency: data.periodBalance.currency,
        },
        balance: {
          amount: trend.balance,
          currency: data.periodBalance.currency,
        },
      }));

      res.json({
        success: true,
        data: {
          trends,
          categoryBreakdown: data.categoryBreakdown.map(category => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            amount: {
              amount: category.amount,
              currency: data.periodBalance.currency,
            },
            percentage: category.percentage,
            transactionCount: category.transactionCount,
          })),
        },
      });
    } catch (error) {
      console.error("Error in getTrends:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}