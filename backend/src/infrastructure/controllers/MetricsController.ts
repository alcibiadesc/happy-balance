import { Request, Response } from "express";
import { z } from "zod";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/GetDashboardMetricsUseCase";
import { DashboardQuery } from "../../application/queries/DashboardQuery";

const PeriodStatsSchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).default("month"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  currency: z.string().min(3).max(3).default("EUR"),
  periodOffset: z.coerce.number().min(0).default(0),
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

      console.log("MetricsController - data structure:", JSON.stringify(data, null, 2));

      // Calculate savings rate
      const savingsRate = data.periodBalance.income > 0
        ? (data.periodBalance.balance / data.periodBalance.income) * 100
        : 0;

      // Calculate essential and discretionary percentages
      const totalExpenses = data.periodBalance.expenses;
      const essentialPercentage = totalExpenses > 0 ? (data.expenseDistribution.essential / totalExpenses) * 100 : 0;
      const discretionaryPercentage = totalExpenses > 0 ? (data.expenseDistribution.discretionary / totalExpenses) * 100 : 0;
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
              amount: 0, // Not in current metrics structure
              currency: data.periodBalance.currency,
            },
            totalDebtPayments: {
              amount: 0, // Not in current metrics structure
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
          amount: 0, // Not in current structure
          currency: data.periodBalance.currency,
        },
        debtPayments: {
          amount: 0, // Not in current structure
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