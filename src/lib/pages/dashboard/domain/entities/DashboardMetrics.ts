import { Money } from '../value-objects/Money';
import { Period } from '../value-objects/Period';

// Entity: Dashboard Metrics
export class DashboardMetrics {
  constructor(
    private readonly period: Period,
    private readonly income: Money,
    private readonly expenses: Money,
    private readonly investments: Money,
    private readonly balance: Money,
    private readonly spendingRate: number,
    private readonly savingsRate: number
  ) {}

  static create(
    period: Period,
    income: Money,
    expenses: Money,
    investments: Money
  ): DashboardMetrics {
    const balance = income.subtract(expenses).subtract(investments);
    const totalIncome = income.getValue();
    const spendingRate = totalIncome > 0 ? (expenses.getValue() / totalIncome) * 100 : 0;
    const savingsRate = 100 - spendingRate;

    return new DashboardMetrics(
      period,
      income,
      expenses,
      investments,
      balance,
      spendingRate,
      savingsRate
    );
  }

  getPeriod(): Period {
    return this.period;
  }

  getIncome(): Money {
    return this.income;
  }

  getExpenses(): Money {
    return this.expenses;
  }

  getInvestments(): Money {
    return this.investments;
  }

  getBalance(): Money {
    return this.balance;
  }

  getSpendingRate(): number {
    return this.spendingRate;
  }

  getSavingsRate(): number {
    return this.savingsRate;
  }

  toJSON() {
    return {
      period: this.period.getLabel(),
      income: this.income.getValue(),
      expenses: this.expenses.getValue(),
      investments: this.investments.getValue(),
      balance: this.balance.getValue(),
      spendingRate: this.spendingRate,
      savingsRate: this.savingsRate
    };
  }
}