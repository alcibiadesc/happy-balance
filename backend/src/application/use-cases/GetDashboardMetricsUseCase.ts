import { Result } from "@domain/shared/Result";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import { TransactionDate } from "@domain/value-objects/TransactionDate";
import { TransactionType } from "@domain/entities/TransactionType";
import { CategoryType } from "@domain/entities/CategoryType";
import { DashboardMetrics, Metrics } from "@domain/entities/Metrics";

export interface DashboardMetricsQuery {
  currency: string;
  period: "week" | "month" | "quarter" | "year" | "custom";
  startDate?: string;
  endDate?: string;
  periodOffset?: number;
  includeInvestments?: boolean;
}

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(
    query: DashboardMetricsQuery,
  ): Promise<Result<DashboardMetrics>> {
    try {
      // Calculate date range
      const dateRange = this.calculateDateRange(query);

      // Get all transactions for the period
      const startDateResult = TransactionDate.fromString(dateRange.startDate);
      const endDateResult = TransactionDate.fromString(dateRange.endDate);

      if (startDateResult.isFailure()) {
        return Result.failWithMessage(startDateResult.getError().message);
      }

      if (endDateResult.isFailure()) {
        return Result.failWithMessage(endDateResult.getError().message);
      }

      const transactionsResult =
        await this.transactionRepository.findWithFilters({
          startDate: startDateResult.getValue(),
          endDate: endDateResult.getValue(),
          currency: query.currency,
          includeHidden: false, // Dashboard should only show visible transactions
        });

      if (transactionsResult.isFailure()) {
        return Result.failWithMessage(transactionsResult.getError().message);
      }

      const { transactions } = transactionsResult.getValue();

      // Get all categories for categorization
      const categoriesResult = await this.categoryRepository.findActive();
      if (categoriesResult.isFailure()) {
        return Result.failWithMessage(categoriesResult.getError().message);
      }

      const categories = categoriesResult.getValue();

      // Filter out no_compute transactions for metrics calculations
      const computedTransactions = this.filterComputedTransactions(transactions, categories);

      // Calculate metrics
      const periodBalance = this.calculatePeriodBalance(
        computedTransactions,
        query.currency,
      );
      const expenseDistribution = this.calculateExpenseDistribution(
        computedTransactions,
        categories,
        query.currency,
      );
      const categoryBreakdown = this.calculateCategoryBreakdown(
        computedTransactions,
        categories,
        query.currency,
      );
      const monthlyTrend = await this.calculateMonthlyTrend(query, dateRange);
      const transactionMetrics = this.calculateTransactionMetrics(computedTransactions);

      const periodInfo = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        periodType: query.period,
      };

      // Create Metrics entity
      const metricsResult = Metrics.create(
        periodBalance,
        expenseDistribution,
        categoryBreakdown,
        monthlyTrend,
        transactionMetrics,
        periodInfo,
      );

      if (metricsResult.isFailure()) {
        return Result.failWithMessage(metricsResult.getError().message);
      }

      return Result.ok(metricsResult.getValue().toSnapshot());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to calculate dashboard metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private calculateDateRange(query: DashboardMetricsQuery): {
    startDate: string;
    endDate: string;
  } {
    if (query.period === "custom" && query.startDate && query.endDate) {
      return {
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }

    const now = new Date();
    const offset = query.periodOffset || 0;
    let startDate: Date;
    let endDate: Date;

    switch (query.period) {
      case "week":
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);

        startDate = new Date(currentWeekStart);
        startDate.setDate(currentWeekStart.getDate() - offset * 7);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3 - offset * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "year":
        startDate = new Date(now.getFullYear() - offset, 0, 1);
        endDate = new Date(now.getFullYear() - offset, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        // Default to current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Ensure endDate is not in the future
    if (endDate > now) {
      endDate = new Date(now);
    }

    // Format dates as YYYY-MM-DD in local timezone to avoid UTC conversion issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
    };
  }

  private calculatePeriodBalance(transactions: any[], currency: string) {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      const snapshot = transaction.toSnapshot();

      if (snapshot.type === TransactionType.INCOME) {
        income += snapshot.amount;
      } else if (snapshot.type === TransactionType.EXPENSE) {
        expenses += snapshot.amount;
      }
    }

    return {
      income,
      expenses,
      balance: income - expenses,
      currency,
    };
  }

  private calculateExpenseDistribution(
    transactions: any[],
    categories: any[],
    currency: string,
  ) {
    let essential = 0;
    let discretionary = 0;
    let uncategorized = 0;

    // Get essential category IDs (you might want to mark categories as essential in your schema)
    const essentialCategoryNames = [
      "groceries",
      "utilities",
      "rent",
      "mortgage",
      "insurance",
      "healthcare",
      "transportation",
      "gas",
      "electricity",
      "water",
      "internet",
      "phone",
    ];

    const essentialCategoryIds = new Set(
      categories
        .filter((cat) =>
          essentialCategoryNames.some((name) =>
            cat.name.toLowerCase().includes(name.toLowerCase()),
          ),
        )
        .map((cat) => cat.id),
    );

    for (const transaction of transactions) {
      const snapshot = transaction.toSnapshot();

      if (snapshot.type === TransactionType.EXPENSE) {
        if (!snapshot.categoryId) {
          uncategorized += snapshot.amount;
        } else if (essentialCategoryIds.has(snapshot.categoryId)) {
          essential += snapshot.amount;
        } else {
          discretionary += snapshot.amount;
        }
      }
    }

    return {
      essential,
      discretionary,
      uncategorized,
      currency,
    };
  }

  private calculateCategoryBreakdown(
    transactions: any[],
    categories: any[],
    currency: string,
  ) {
    const categoryTotals = new Map<
      string,
      { amount: number; count: number; name: string }
    >();
    let totalExpenses = 0;

    // Initialize with all categories
    for (const category of categories) {
      categoryTotals.set(category.id, {
        amount: 0,
        count: 0,
        name: category.name,
      });
    }

    // Add uncategorized
    categoryTotals.set("uncategorized", {
      amount: 0,
      count: 0,
      name: "Uncategorized",
    });

    // Calculate totals
    for (const transaction of transactions) {
      const snapshot = transaction.toSnapshot();

      if (snapshot.type === TransactionType.EXPENSE) {
        totalExpenses += snapshot.amount;

        const categoryId = snapshot.categoryId || "uncategorized";
        const existing = categoryTotals.get(categoryId);

        if (existing) {
          existing.amount += snapshot.amount;
          existing.count += 1;
        }
      }
    }

    // Convert to array and calculate percentages
    const breakdown = Array.from(categoryTotals.entries())
      .filter(([_, data]) => data.amount > 0)
      .map(([categoryId, data]) => ({
        categoryId: categoryId === "uncategorized" ? null : categoryId,
        categoryName: data.name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactionCount: data.count,
        isEssential: this.isEssentialCategory(data.name),
      }))
      .sort((a, b) => b.amount - a.amount);

    return breakdown;
  }

  private isEssentialCategory(categoryName: string): boolean {
    const essentialKeywords = [
      "groceries",
      "utilities",
      "rent",
      "mortgage",
      "insurance",
      "healthcare",
      "transportation",
      "gas",
      "electricity",
      "water",
      "internet",
      "phone",
    ];

    return essentialKeywords.some((keyword) =>
      categoryName.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  private async calculateMonthlyTrend(
    query: DashboardMetricsQuery,
    currentRange: { startDate: string; endDate: string },
  ) {
    // Calculate trend for the last 6 months or periods
    const trends = [];
    const periodsToShow = 6;

    for (let i = 0; i < periodsToShow; i++) {
      // Calculate offset to go back in time from current period
      // i=0 should be the oldest (5 months ago), i=5 should be current
      const monthOffset = periodsToShow - 1 - i;
      const trendQuery = {
        ...query,
        periodOffset: (query.periodOffset || 0) + monthOffset,
      };
      const trendRange = this.calculateDateRange(trendQuery);

      const startDateResult = TransactionDate.fromString(trendRange.startDate);
      const endDateResult = TransactionDate.fromString(trendRange.endDate);

      if (startDateResult.isSuccess() && endDateResult.isSuccess()) {
        const transactionsResult =
          await this.transactionRepository.findWithFilters({
            startDate: startDateResult.getValue(),
            endDate: endDateResult.getValue(),
            currency: query.currency,
            includeHidden: false,
          });

        if (transactionsResult.isSuccess()) {
          const { transactions } = transactionsResult.getValue();

          // Get categories for filtering
          const categoriesResult = await this.categoryRepository.findActive();
          if (categoriesResult.isSuccess()) {
            const categories = categoriesResult.getValue();
            const computedTransactions = this.filterComputedTransactions(transactions, categories);

            const periodBalance = this.calculatePeriodBalance(
              computedTransactions,
              query.currency,
            );

            trends.push({
              month: this.formatPeriodLabel(trendRange.startDate, query.period),
              income: periodBalance.income,
              expenses: periodBalance.expenses,
              balance: periodBalance.balance,
            });
          }
        }
      }
    }

    return trends;
  }

  private formatPeriodLabel(dateString: string, period: string): string {
    // Parse date string safely to avoid timezone issues
    // dateString is in format YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor

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

  private filterComputedTransactions(transactions: any[], categories: any[]) {
    // Create a map of category ID to category type for quick lookup
    const categoryTypeMap = new Map<string, CategoryType>();
    for (const category of categories) {
      const snapshot = category.toSnapshot ? category.toSnapshot() : category;
      categoryTypeMap.set(snapshot.id, snapshot.type);
    }

    // Filter out transactions with NO_COMPUTE category type
    return transactions.filter(transaction => {
      const snapshot = transaction.toSnapshot ? transaction.toSnapshot() : transaction;

      // If transaction has no category, include it
      if (!snapshot.categoryId) {
        return true;
      }

      // Check if the category type is NO_COMPUTE
      const categoryType = categoryTypeMap.get(snapshot.categoryId);
      return categoryType !== CategoryType.NO_COMPUTE;
    });
  }

  private calculateTransactionMetrics(transactions: any[]) {
    if (transactions.length === 0) {
      return {
        totalCount: 0,
        avgTransactionAmount: 0,
        largestTransaction: 0,
        smallestTransaction: 0,
        mostFrequentMerchant: "N/A",
        transactionCountByType: {
          income: 0,
          expense: 0,
          investment: 0,
        },
      };
    }

    let totalAmount = 0;
    let largestTransaction = 0;
    let smallestTransaction = Number.MAX_VALUE;
    const merchantCounts = new Map<string, number>();
    const typeCounts = { income: 0, expense: 0, investment: 0 };

    for (const transaction of transactions) {
      const snapshot = transaction.toSnapshot();
      const amount = Math.abs(snapshot.amount);

      totalAmount += amount;
      largestTransaction = Math.max(largestTransaction, amount);
      smallestTransaction = Math.min(smallestTransaction, amount);

      // Count merchants
      const merchant = snapshot.merchant;
      merchantCounts.set(merchant, (merchantCounts.get(merchant) || 0) + 1);

      // Count by type
      switch (snapshot.type) {
        case TransactionType.INCOME:
          typeCounts.income++;
          break;
        case TransactionType.EXPENSE:
          typeCounts.expense++;
          break;
        case TransactionType.INVESTMENT:
          typeCounts.investment++;
          break;
      }
    }

    // Find most frequent merchant
    let mostFrequentMerchant = "N/A";
    let maxCount = 0;
    for (const [merchant, count] of merchantCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentMerchant = merchant;
      }
    }

    return {
      totalCount: transactions.length,
      avgTransactionAmount: totalAmount / transactions.length,
      largestTransaction,
      smallestTransaction:
        smallestTransaction === Number.MAX_VALUE ? 0 : smallestTransaction,
      mostFrequentMerchant,
      transactionCountByType: typeCounts,
    };
  }
}
