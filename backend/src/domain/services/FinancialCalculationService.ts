import { Transaction } from "../entities/Transaction";
import { Money } from "../value-objects/Money";
import { SignedMoney } from "../value-objects/SignedMoney";
import { TransactionDate } from "../value-objects/TransactionDate";
import { TransactionType } from "../entities/TransactionType";
import { Result } from "../shared/Result";

export interface FinancialSummary {
  totalIncome: Money;
  totalExpenses: Money;
  totalInvestments: Money;
  totalDebtPayments: Money;
  balance: SignedMoney;
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
  balance: SignedMoney;
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
        t.isInDateRange(period.startDate, period.endDate) &&
        t.amount.currency === currency,
    );

    const zeroMoney = Money.zero(currency);
    if (zeroMoney.isFailure()) {
      return Result.fail(zeroMoney.getError());
    }

    const zero = zeroMoney.getValue();

    let totalIncome = zero;
    let totalExpenses = zero;
    let totalInvestments = zero;
    let totalDebtPayments = zero;

    for (const transaction of filteredTransactions) {
      switch (transaction.type) {
        case TransactionType.INCOME:
          const incomeResult = totalIncome.add(transaction.amount);
          if (incomeResult.isFailure())
            return Result.fail(incomeResult.getError());
          totalIncome = incomeResult.getValue();
          break;

        case TransactionType.EXPENSE:
          // Check if this expense is a debt payment
          const isDebtPayment =
            categories &&
            transaction.categoryId &&
            categories.get(transaction.categoryId.value)?.type ===
              "debt_payment";

          if (isDebtPayment) {
            const debtResult = totalDebtPayments.add(transaction.amount);
            if (debtResult.isFailure())
              return Result.fail(debtResult.getError());
            totalDebtPayments = debtResult.getValue();
          } else {
            const expenseResult = totalExpenses.add(transaction.amount);
            if (expenseResult.isFailure())
              return Result.fail(expenseResult.getError());
            totalExpenses = expenseResult.getValue();
          }
          break;

        case TransactionType.INVESTMENT:
          const investmentResult = totalInvestments.add(transaction.amount);
          if (investmentResult.isFailure())
            return Result.fail(investmentResult.getError());
          totalInvestments = investmentResult.getValue();
          break;
      }
    }

    // Calculate balance (income - expenses - investments - debt payments)
    // Use SignedMoney to allow negative balances
    console.log('About to calculate balance with SignedMoney...');
    const signedIncome = SignedMoney.fromMoney(totalIncome);
    const balanceStep1 = signedIncome.subtract(totalExpenses);
    if (balanceStep1.isFailure()) return Result.fail(balanceStep1.getError());

    const balanceStep2 = balanceStep1.getValue().subtract(totalInvestments);
    if (balanceStep2.isFailure()) return Result.fail(balanceStep2.getError());

    const balance = balanceStep2.getValue().subtract(totalDebtPayments);
    if (balance.isFailure()) return Result.fail(balance.getError());

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
      balance: balance.getValue(),
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
        t.amount.currency === currency &&
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

    const zero = Money.zero(currency);
    if (zero.isFailure()) return Result.fail(zero.getError());

    let totalAmount = zero.getValue();

    // Group transactions by category
    for (const transaction of filteredTransactions) {
      if (!transaction.categoryId) continue;

      const categoryId = transaction.categoryId.value;
      const existing = categoryTotals.get(categoryId);

      if (existing) {
        const newAmount = existing.amount.add(transaction.amount);
        if (newAmount.isFailure()) return Result.fail(newAmount.getError());

        categoryTotals.set(categoryId, {
          amount: newAmount.getValue(),
          count: existing.count + 1,
        });
      } else {
        categoryTotals.set(categoryId, {
          amount: transaction.amount,
          count: 1,
        });
      }

      const totalResult = totalAmount.add(transaction.amount);
      if (totalResult.isFailure()) return Result.fail(totalResult.getError());
      totalAmount = totalResult.getValue();
    }

    // Convert to breakdown array
    const breakdown: CategoryBreakdown[] = [];

    for (const [categoryId, data] of categoryTotals.entries()) {
      const categoryName = categories.get(categoryId) || "Unknown Category";
      const percentage =
        totalAmount.amount > 0
          ? (data.amount.amount / totalAmount.amount) * 100
          : 0;

      breakdown.push({
        categoryName,
        amount: data.amount,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        transactionCount: data.count,
      });
    }

    // Sort by amount (descending)
    breakdown.sort((a, b) => b.amount.amount - a.amount.amount);

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
    if (income.amount <= 0) {
      return Result.ok(0);
    }

    if (income.currency !== expenses.currency) {
      return Result.failWithMessage(
        "Cannot calculate spending rate for different currencies",
      );
    }

    const rate = (expenses.amount / income.amount) * baseAmount;
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
        t.isInDateRange(period.startDate, period.endDate) &&
        t.amount.currency === currency,
    );

    const zero = Money.zero(currency);
    if (zero.isFailure()) return Result.fail(zero.getError());

    let essentialTotal = zero.getValue();
    let discretionaryTotal = zero.getValue();
    let debtPaymentTotal = zero.getValue();

    for (const transaction of expenses) {
      const isDebtPayment =
        categories &&
        transaction.categoryId &&
        categories.get(transaction.categoryId.value)?.type === "debt_payment";

      if (isDebtPayment) {
        const result = debtPaymentTotal.add(transaction.amount);
        if (result.isFailure()) return Result.fail(result.getError());
        debtPaymentTotal = result.getValue();
      } else {
        const isEssential =
          transaction.categoryId &&
          essentialCategoryIds.has(transaction.categoryId.value);

        if (isEssential) {
          const result = essentialTotal.add(transaction.amount);
          if (result.isFailure()) return Result.fail(result.getError());
          essentialTotal = result.getValue();
        } else {
          const result = discretionaryTotal.add(transaction.amount);
          if (result.isFailure()) return Result.fail(result.getError());
          discretionaryTotal = result.getValue();
        }
      }
    }

    const totalExpensesStep1 = essentialTotal.add(discretionaryTotal);
    if (totalExpensesStep1.isFailure())
      return Result.fail(totalExpensesStep1.getError());

    const totalExpenses = totalExpensesStep1.getValue().add(debtPaymentTotal);
    if (totalExpenses.isFailure()) return Result.fail(totalExpenses.getError());

    const total = totalExpenses.getValue();
    const essentialPercentage =
      total.amount > 0 ? (essentialTotal.amount / total.amount) * 100 : 0;
    const discretionaryPercentage =
      total.amount > 0 ? (discretionaryTotal.amount / total.amount) * 100 : 0;
    const debtPaymentPercentage =
      total.amount > 0 ? (debtPaymentTotal.amount / total.amount) * 100 : 0;

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
          const monthEnd = new Date(currentDate.value);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0); // Last day of current month

          const monthEndResult = TransactionDate.create(monthEnd);
          if (monthEndResult.isFailure())
            return Result.fail(monthEndResult.getError());
          nextDate = monthEndResult.getValue();

          label = currentDate.value.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          });
          break;

        case "quarter":
          const quarterEnd = new Date(currentDate.value);
          quarterEnd.setMonth(quarterEnd.getMonth() + 3);
          quarterEnd.setDate(0);

          const quarterEndResult = TransactionDate.create(quarterEnd);
          if (quarterEndResult.isFailure())
            return Result.fail(quarterEndResult.getError());
          nextDate = quarterEndResult.getValue();

          const quarter = Math.ceil(currentDate.getMonth() / 3);
          label = `Q${quarter} ${currentDate.getYear()}`;
          break;

        case "year":
          const yearEnd = new Date(currentDate.getYear(), 11, 31);

          const yearEndResult = TransactionDate.create(yearEnd);
          if (yearEndResult.isFailure())
            return Result.fail(yearEndResult.getError());
          nextDate = yearEndResult.getValue();

          label = currentDate.getYear().toString();
          break;
      }

      periods.push({
        startDate: currentDate,
        endDate: nextDate.isBefore(endDate) ? nextDate : endDate,
        label,
      });

      // Move to next period
      const nextPeriodStart = nextDate.addDays(1);
      if (nextPeriodStart.isFailure()) break;
      currentDate = nextPeriodStart.getValue();
    }

    return Result.ok(periods);
  }

  private calculateSavingsRate(
    income: Money,
    expenses: Money,
    investments: Money,
    debtPayments: Money,
  ): number {
    if (income.amount <= 0) {
      return 0;
    }

    const totalSaved = investments.amount;
    const totalSpent = expenses.amount + debtPayments.amount;
    const netSavings = Math.max(0, income.amount - totalSpent);
    const totalSavings = totalSaved + netSavings;

    return Math.round((totalSavings / income.amount) * 100 * 100) / 100; // Round to 2 decimal places
  }
}
