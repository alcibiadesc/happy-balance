import { Result } from "../../domain/shared/Result";
import { Money } from "../../domain/value-objects/Money";
import { TransactionDate } from "../../domain/value-objects/TransactionDate";
import { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import {
  FinancialCalculationService,
  FinancialSummary,
  CategoryBreakdown,
  TrendData,
} from "../../domain/services/FinancialCalculationService";
import { DashboardQuery } from "../queries/DashboardQuery";

export interface DashboardData {
  summary: FinancialSummary;
  categoryBreakdown: CategoryBreakdown[];
  trends: TrendData[];
  spendingRate: number;
  expenseDistribution: {
    essential: Money;
    discretionary: Money;
    essentialPercentage: number;
    discretionaryPercentage: number;
  };
}

/**
 * Use Case for retrieving dashboard financial data
 * Orchestrates financial calculations and data aggregation
 */
export class GetDashboardDataUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly financialCalculationService: FinancialCalculationService,
  ) {}

  /**
   * Execute dashboard data retrieval
   */
  async execute(query: DashboardQuery): Promise<Result<DashboardData>> {
    // Validate query
    const validation = query.isValid();
    if (!validation.valid) {
      return Result.failWithMessage(
        `Invalid query: ${validation.errors.join(", ")}`,
      );
    }

    try {
      // Get date range
      const { startDate, endDate } = query.getDateRange();
      const startTransactionDate = TransactionDate.create(startDate);
      const endTransactionDate = TransactionDate.create(endDate);

      if (startTransactionDate.isFailure()) {
        return Result.fail(startTransactionDate.getError());
      }

      if (endTransactionDate.isFailure()) {
        return Result.fail(endTransactionDate.getError());
      }

      // Create date period for calculations
      const period = {
        startDate: startTransactionDate.getValue(),
        endDate: endTransactionDate.getValue(),
        label: this.getPeriodLabel(query.period),
      };

      // Get transactions for the period
      const transactionsResult =
        await this.transactionRepository.findByDateRange(
          period.startDate,
          period.endDate,
        );

      if (transactionsResult.isFailure()) {
        return Result.fail(transactionsResult.getError());
      }

      const transactions = transactionsResult.getValue();

      // Get categories for breakdown
      const categoriesResult = await this.categoryRepository.findAll();
      if (categoriesResult.isFailure()) {
        return Result.fail(categoriesResult.getError());
      }

      const categories = categoriesResult.getValue();
      const categoryMap = new Map(
        categories.map((cat) => [cat.id.value, cat.name]),
      );

      // Calculate financial summary
      const summaryResult = this.financialCalculationService.calculateSummary(
        transactions,
        period,
        query.currency,
      );

      if (summaryResult.isFailure()) {
        return Result.fail(summaryResult.getError());
      }

      const summary = summaryResult.getValue();

      // Calculate category breakdown
      const breakdownResult =
        this.financialCalculationService.calculateCategoryBreakdown(
          transactions,
          categoryMap,
          period,
          query.currency,
        );

      if (breakdownResult.isFailure()) {
        return Result.fail(breakdownResult.getError());
      }

      const categoryBreakdown = breakdownResult.getValue();

      // Calculate spending rate
      const spendingRateResult =
        this.financialCalculationService.calculateSpendingRate(
          summary.totalIncome,
          summary.totalExpenses,
        );

      if (spendingRateResult.isFailure()) {
        return Result.fail(spendingRateResult.getError());
      }

      const spendingRate = spendingRateResult.getValue();

      // Calculate expense distribution (essential vs discretionary)
      const essentialCategories = this.getEssentialCategoryIds(categories);
      const distributionResult =
        this.financialCalculationService.calculateExpenseDistribution(
          transactions,
          essentialCategories,
          period,
          query.currency,
        );

      if (distributionResult.isFailure()) {
        return Result.fail(distributionResult.getError());
      }

      const expenseDistribution = distributionResult.getValue();

      // Calculate trends for multiple periods
      const trendPeriods = this.generateTrendPeriods(period, query.period);
      const trendsResult = this.financialCalculationService.calculateTrends(
        transactions,
        trendPeriods,
        query.currency,
      );

      if (trendsResult.isFailure()) {
        return Result.fail(trendsResult.getError());
      }

      const trends = trendsResult.getValue();

      return Result.ok({
        summary,
        categoryBreakdown,
        trends,
        spendingRate,
        expenseDistribution,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Unexpected error retrieving dashboard data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get essential category IDs (categories that represent essential expenses)
   */
  private getEssentialCategoryIds(categories: any[]): Set<string> {
    const essentialKeywords = [
      "utilities",
      "rent",
      "mortgage",
      "insurance",
      "groceries",
      "food",
      "health",
      "medical",
      "transport",
      "gas",
      "electricity",
      "water",
    ];

    const essentialIds = new Set<string>();

    for (const category of categories) {
      const categoryName = category.name.toLowerCase();
      if (essentialKeywords.some((keyword) => categoryName.includes(keyword))) {
        essentialIds.add(category.id.value);
      }
    }

    return essentialIds;
  }

  /**
   * Generate trend periods for historical comparison
   */
  private generateTrendPeriods(currentPeriod: any, periodType: string) {
    const periods = [];
    const endDate = currentPeriod.endDate.value;

    // Generate last 6 periods for trends
    for (let i = 5; i >= 0; i--) {
      const periodEnd = new Date(endDate);
      const periodStart = new Date(endDate);

      switch (periodType) {
        case "week":
          periodEnd.setDate(periodEnd.getDate() - i * 7);
          periodStart.setDate(periodEnd.getDate() - 7);
          break;
        case "month":
          periodEnd.setMonth(periodEnd.getMonth() - i);
          periodStart.setMonth(periodEnd.getMonth() - 1);
          break;
        case "quarter":
          periodEnd.setMonth(periodEnd.getMonth() - i * 3);
          periodStart.setMonth(periodEnd.getMonth() - 3);
          break;
        case "year":
          periodEnd.setFullYear(periodEnd.getFullYear() - i);
          periodStart.setFullYear(periodEnd.getFullYear() - 1);
          break;
      }

      const startResult = TransactionDate.create(periodStart);
      const endResult = TransactionDate.create(periodEnd);

      if (startResult.isSuccess() && endResult.isSuccess()) {
        periods.push({
          startDate: startResult.getValue(),
          endDate: endResult.getValue(),
          label: this.formatPeriodLabel(periodEnd, periodType),
        });
      }
    }

    return periods;
  }

  /**
   * Get period label for display
   */
  private getPeriodLabel(period: string): string {
    const now = new Date();

    switch (period) {
      case "week":
        return `Week of ${now.toLocaleDateString()}`;
      case "month":
        return now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "quarter":
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        return `Q${quarter} ${now.getFullYear()}`;
      case "year":
        return now.getFullYear().toString();
      default:
        return "Current Period";
    }
  }

  /**
   * Format period label for trends
   */
  private formatPeriodLabel(date: Date, periodType: string): string {
    switch (periodType) {
      case "week":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "month":
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      case "quarter":
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        return `Q${quarter} ${date.getFullYear().toString().substr(2)}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  }
}
