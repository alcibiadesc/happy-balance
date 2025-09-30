import { Transaction } from "../entities/Transaction";
import { Money } from "../value-objects/Money";
import { TransactionDate } from "../value-objects/TransactionDate";
import { TransactionType } from "../entities/TransactionType";
import { Result } from "../shared/Result";

export interface FinancialSummary {
  totalIncome: Money;
  totalExpenses: Money;
  totalInvestments: Money;
  totalDebtPayments: Money;
  balance: Money;
  savingsRate: number; // Percentage (0-100)
  period: DatePeriod;
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: Money;
  percentage: number;
  transactionCount: number;
}

export interface DatePeriod {
  startDate: TransactionDate;
  endDate: TransactionDate;
  label: string;
}

export interface TrendData {
  period: string;
  income: Money;
  expenses: Money;
  investments: Money;
  debtPayments: Money;
  balance: Money;
}

/**
 * Domain service for financial calculations
 * Implements complex business logic for financial metrics and analysis
 */
export class FinancialCalculationService {
  /**
   * Calculate financial summary for a given period
   */
  calculateSummary(
    transactions: Transaction[],
    period: DatePeriod,
    currency: string,
    categories?: Map<string, any>, // categoryId -> category object
  ): Result<FinancialSummary> {
    const filteredTransactions = transactions.filter(
      (t) =>
        t.isInDateRange(period.startDate, period.endDate),
    );

    const zero = Money.create(0);

    let totalIncome = zero;
    let totalExpenses = zero;
    let totalInvestments = zero;
    let totalDebtPayments = zero;

    for (const transaction of filteredTransactions) {
      switch (transaction.type) {
        case TransactionType.INCOME:
          totalIncome = totalIncome.add(transaction.amount);
          break;

        case TransactionType.EXPENSE:
          // Check if this expense is a debt payment
          const isDebtPayment =
            categories &&
            transaction.categoryId &&
            categories.get(transaction.categoryId.value)?.type ===
              "debt_payment";

          if (isDebtPayment) {
            totalDebtPayments = totalDebtPayments.add(transaction.amount);
          } else {
            totalExpenses = totalExpenses.add(transaction.amount);
          }
          break;

        case TransactionType.INVESTMENT:
          totalInvestments = totalInvestments.add(transaction.amount);
          break;
      }
    }

    // Calculate balance (income - expenses - investments - debt payments)
    const balance = totalIncome
      .subtract(totalExpenses)
      .subtract(totalInvestments)
      .subtract(totalDebtPayments);

    // Calculate savings rate
    const savingsRate = this.calculateSavingsRate(
      totalIncome,
      totalExpenses,
      totalInvestments,
      totalDebtPayments,
    );

    return Result.ok({
      totalIncome,
      totalExpenses,
      totalInvestments,
      totalDebtPayments,
      balance,
      savingsRate,
      period,
    });
  }

  /**
   * Calculate category breakdown for expenses
   */
  calculateCategoryBreakdown(
    transactions: Transaction[],
    categories: Map<string, string>, // categoryId -> categoryName
    period: DatePeriod,
    currency: string,
    transactionType: TransactionType = TransactionType.EXPENSE,
  ): Result<CategoryBreakdown[]> {
    const filteredTransactions = transactions.filter(
      (t) =>
        t.isInDateRange(period.startDate, period.endDate) &&
        t.type === transactionType &&
        t.categoryId,
    );

    const categoryTotals = new Map<
      string,
      {
        amount: Money;
        count: number;
      }
    >();

    let totalAmount = Money.create(0);

    // Group transactions by category
    for (const transaction of filteredTransactions) {
      if (!transaction.categoryId) continue;

      const categoryId = transaction.categoryId.value;
      const existing = categoryTotals.get(categoryId);

      if (existing) {
        categoryTotals.set(categoryId, {
          amount: existing.amount.add(transaction.amount),
          count: existing.count + 1,
        });
      } else {
        categoryTotals.set(categoryId, {
          amount: transaction.amount,
          count: 1,
        });
      }

      totalAmount = totalAmount.add(transaction.amount);
    }

    // Convert to breakdown array
    const breakdown: CategoryBreakdown[] = [];

    for (const [categoryId, data] of categoryTotals.entries()) {
      const categoryName = categories.get(categoryId) || "Unknown Category";
      const percentage =
        totalAmount.getValue() > 0
          ? (data.amount.getValue() / totalAmount.getValue()) * 100
          : 0;

      breakdown.push({
        categoryName,
        amount: data.amount,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        transactionCount: data.count,
      });
    }

    // Sort by amount (descending)
    breakdown.sort((a, b) => b.amount.getValue() - a.amount.getValue());

    return Result.ok(breakdown);
  }

  /**
   * Calculate trend data for multiple periods
   */
  calculateTrends(
    transactions: Transaction[],
    periods: DatePeriod[],
    currency: string,
    categories?: Map<string, any>,
  ): Result<TrendData[]> {
    const trends: TrendData[] = [];

    for (const period of periods) {
      const summaryResult = this.calculateSummary(
        transactions,
        period,
        currency,
        categories,
      );
      if (summaryResult.isFailure()) {
        return Result.fail(summaryResult.getError());
      }

      const summary = summaryResult.getValue();
      trends.push({
        period: period.label,
        income: summary.totalIncome,
        expenses: summary.totalExpenses,
        investments: summary.totalInvestments,
        debtPayments: summary.totalDebtPayments,
        balance: summary.balance,
      });
    }

    return Result.ok(trends);
  }

  /**
   * Calculate spending rate (how much of income is spent)
   */
  calculateSpendingRate(
    income: Money,
    expenses: Money,
    baseAmount = 10,
  ): Result<number> {
    if (income.getValue() <= 0) {
      return Result.ok(0);
    }

    const rate = (expenses.getValue() / income.getValue()) * baseAmount;
    return Result.ok(Math.round(rate * 100) / 100); // Round to 2 decimal places
  }

  /**
   * Calculate expense distribution (essential vs discretionary)
   */
  calculateExpenseDistribution(
    transactions: Transaction[],
    essentialCategoryIds: Set<string>,
    period: DatePeriod,
    currency: string,
    categories?: Map<string, any>,
  ): Result<{
    essential: Money;
    discretionary: Money;
    debtPayments: Money;
    essentialPercentage: number;
    discretionaryPercentage: number;
    debtPaymentPercentage: number;
  }> {
    const expenses = transactions.filter(
      (t) =>
        t.type === TransactionType.EXPENSE &&
        t.isInDateRange(period.startDate, period.endDate),
    );

    let essentialTotal = Money.create(0);
    let discretionaryTotal = Money.create(0);
    let debtPaymentTotal = Money.create(0);

    for (const transaction of expenses) {
      const isDebtPayment =
        categories &&
        transaction.categoryId &&
        categories.get(transaction.categoryId.value)?.type === "debt_payment";

      if (isDebtPayment) {
        debtPaymentTotal = debtPaymentTotal.add(transaction.amount);
      } else {
        const isEssential =
          transaction.categoryId &&
          essentialCategoryIds.has(transaction.categoryId.value);

        if (isEssential) {
          essentialTotal = essentialTotal.add(transaction.amount);
        } else {
          discretionaryTotal = discretionaryTotal.add(transaction.amount);
        }
      }
    }

    const total = essentialTotal.add(discretionaryTotal).add(debtPaymentTotal);
    const essentialPercentage =
      total.getValue() > 0 ? (essentialTotal.getValue() / total.getValue()) * 100 : 0;
    const discretionaryPercentage =
      total.getValue() > 0 ? (discretionaryTotal.getValue() / total.getValue()) * 100 : 0;
    const debtPaymentPercentage =
      total.getValue() > 0 ? (debtPaymentTotal.getValue() / total.getValue()) * 100 : 0;

    return Result.ok({
      essential: essentialTotal,
      discretionary: discretionaryTotal,
      debtPayments: debtPaymentTotal,
      essentialPercentage: Math.round(essentialPercentage * 100) / 100,
      discretionaryPercentage: Math.round(discretionaryPercentage * 100) / 100,
      debtPaymentPercentage: Math.round(debtPaymentPercentage * 100) / 100,
    });
  }

  /**
   * Generate date periods for analysis
   */
  generatePeriods(
    startDate: TransactionDate,
    endDate: TransactionDate,
    periodType: "month" | "quarter" | "year",
  ): Result<DatePeriod[]> {
    const periods: DatePeriod[] = [];
    let currentDate = startDate;

    while (!currentDate.isAfter(endDate)) {
      let nextDate: TransactionDate;
      let label: string;

      switch (periodType) {
        case "month":
          const monthEnd = new Date(currentDate.getDate());
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0); // Last day of current month

          nextDate = TransactionDate.fromDate(monthEnd);

          label = currentDate.getDate().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          });
          break;

        case "quarter":
          const quarterEnd = new Date(currentDate.getDate());
          quarterEnd.setMonth(quarterEnd.getMonth() + 3);
          quarterEnd.setDate(0);

          nextDate = TransactionDate.fromDate(quarterEnd);

          const quarter = Math.ceil(currentDate.getMonth() / 3);
          label = `Q${quarter} ${currentDate.getYear()}`;
          break;

        case "year":
          const yearEnd = new Date(currentDate.getYear(), 11, 31);

          nextDate = TransactionDate.fromDate(yearEnd);

          label = currentDate.getYear().toString();
          break;
      }

      periods.push({
        startDate: currentDate,
        endDate: nextDate.isBefore(endDate) ? nextDate : endDate,
        label,
      });

      // Move to next period
      currentDate = nextDate.addDays(1);
    }

    return Result.ok(periods);
  }

  private calculateSavingsRate(
    income: Money,
    expenses: Money,
    investments: Money,
    debtPayments: Money,
  ): number {
    if (income.getValue() <= 0) {
      return 0;
    }

    const totalSaved = investments.getValue();
    const totalSpent = expenses.getValue() + debtPayments.getValue();
    const netSavings = Math.max(0, income.getValue() - totalSpent);
    const totalSavings = totalSaved + netSavings;

    return Math.round((totalSavings / income.getValue()) * 100 * 100) / 100; // Round to 2 decimal places
  }
}
