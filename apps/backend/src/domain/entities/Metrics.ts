import { Result } from "@domain/shared/Result";

export interface PeriodBalance {
  income: number;
  expenses: number;
  investments: number;
  debtPayments: number;
  balance: number;
  currency: string;
}

export interface ExpenseDistribution {
  essential: number;
  discretionary: number;
  uncategorized: number;
  currency: string;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  isEssential: boolean;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM format
  income: number;
  expenses: number;
  investments: number;
  debtPayments: number;
  balance: number;
}

export interface TransactionMetrics {
  totalCount: number;
  avgTransactionAmount: number;
  largestTransaction: number;
  smallestTransaction: number;
  mostFrequentMerchant: string;
  transactionCountByType: {
    income: number;
    expense: number;
    investment: number;
  };
}

export interface DashboardMetrics {
  periodBalance: PeriodBalance;
  expenseDistribution: ExpenseDistribution;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
  transactionMetrics: TransactionMetrics;
  lastUpdated: Date;
  periodInfo: {
    startDate: string;
    endDate: string;
    periodType: "week" | "month" | "quarter" | "year" | "custom";
  };
}

export class Metrics {
  private constructor(
    private readonly _periodBalance: PeriodBalance,
    private readonly _expenseDistribution: ExpenseDistribution,
    private readonly _categoryBreakdown: CategoryBreakdown[],
    private readonly _monthlyTrend: MonthlyTrend[],
    private readonly _transactionMetrics: TransactionMetrics,
    private readonly _lastUpdated: Date,
    private readonly _periodInfo: DashboardMetrics["periodInfo"],
  ) {}

  static create(
    periodBalance: PeriodBalance,
    expenseDistribution: ExpenseDistribution,
    categoryBreakdown: CategoryBreakdown[],
    monthlyTrend: MonthlyTrend[],
    transactionMetrics: TransactionMetrics,
    periodInfo: DashboardMetrics["periodInfo"],
  ): Result<Metrics> {
    // Validation
    if (periodBalance.income < 0) {
      return Result.failWithMessage("Income cannot be negative");
    }

    if (periodBalance.expenses < 0) {
      return Result.failWithMessage("Expenses cannot be negative");
    }

    if (periodBalance.investments < 0) {
      return Result.failWithMessage("Investments cannot be negative");
    }

    if (periodBalance.debtPayments < 0) {
      return Result.failWithMessage("Debt payments cannot be negative");
    }

    if (!periodBalance.currency || periodBalance.currency.length !== 3) {
      return Result.failWithMessage("Currency must be a valid 3-letter code");
    }

    // Validate expense distribution adds up correctly
    const totalDistribution =
      expenseDistribution.essential +
      expenseDistribution.discretionary +
      expenseDistribution.uncategorized;

    const tolerance = 0.01; // Allow for small rounding differences
    if (Math.abs(totalDistribution - periodBalance.expenses) > tolerance) {
      return Result.failWithMessage(
        "Expense distribution must equal total expenses",
      );
    }


    return Result.ok(
      new Metrics(
        periodBalance,
        expenseDistribution,
        categoryBreakdown,
        monthlyTrend,
        transactionMetrics,
        new Date(),
        periodInfo,
      ),
    );
  }

  get periodBalance(): PeriodBalance {
    return { ...this._periodBalance };
  }

  get expenseDistribution(): ExpenseDistribution {
    return { ...this._expenseDistribution };
  }

  get categoryBreakdown(): CategoryBreakdown[] {
    return [...this._categoryBreakdown];
  }

  get monthlyTrend(): MonthlyTrend[] {
    return [...this._monthlyTrend];
  }

  get transactionMetrics(): TransactionMetrics {
    return { ...this._transactionMetrics };
  }

  get lastUpdated(): Date {
    return new Date(this._lastUpdated);
  }

  get periodInfo(): DashboardMetrics["periodInfo"] {
    return { ...this._periodInfo };
  }

  toSnapshot(): DashboardMetrics {
    return {
      periodBalance: this.periodBalance,
      expenseDistribution: this.expenseDistribution,
      categoryBreakdown: this.categoryBreakdown,
      monthlyTrend: this.monthlyTrend,
      transactionMetrics: this.transactionMetrics,
      lastUpdated: this.lastUpdated,
      periodInfo: this.periodInfo,
    };
  }

  // Helper methods for common calculations
  getSavingsRate(): number {
    if (this._periodBalance.income === 0) return 0;
    return (this._periodBalance.balance / this._periodBalance.income) * 100;
  }

  getExpenseRatio(): number {
    if (this._periodBalance.income === 0) return 0;
    return (this._periodBalance.expenses / this._periodBalance.income) * 100;
  }

  getTopCategories(limit: number = 5): CategoryBreakdown[] {
    return this._categoryBreakdown
      .filter((cat) => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  getEssentialExpenseRatio(): number {
    if (this._periodBalance.expenses === 0) return 0;
    return (
      (this._expenseDistribution.essential / this._periodBalance.expenses) * 100
    );
  }
}
