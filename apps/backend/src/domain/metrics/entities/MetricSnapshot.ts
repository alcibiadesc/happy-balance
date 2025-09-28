import { Money } from '../../value-objects/Money';
import { SignedMoney } from '../../value-objects/SignedMoney';
import { MetricsPeriod } from '../value-objects/MetricsPeriod';
import { MetricsType } from '../value-objects/MetricsType';

export class MetricSnapshot {
  constructor(
    public readonly period: MetricsPeriod,
    public readonly type: MetricsType,
    public readonly totalIncome: Money,
    public readonly totalExpenses: Money,
    public readonly totalInvestments: Money,
    public readonly totalDebtPayments: Money,
    public readonly balance: SignedMoney,
    public readonly savingsRate: number,
    public readonly spendingRate: number,
    public readonly timestamp: Date = new Date()
  ) {}

  public static create(params: {
    period: MetricsPeriod;
    type: MetricsType;
    totalIncome: Money;
    totalExpenses: Money;
    totalInvestments: Money;
    totalDebtPayments: Money;
    balance: SignedMoney;
    savingsRate: number;
    spendingRate: number;
  }): MetricSnapshot {
    return new MetricSnapshot(
      params.period,
      params.type,
      params.totalIncome,
      params.totalExpenses,
      params.totalInvestments,
      params.totalDebtPayments,
      params.balance,
      params.savingsRate,
      params.spendingRate
    );
  }

  public toPeriodSummary() {
    return {
      period: this.period.toLabel(),
      totalIncome: this.totalIncome,
      totalExpenses: this.totalExpenses,
      totalInvestments: this.totalInvestments,
      totalDebtPayments: this.totalDebtPayments,
      balance: this.balance,
      savingsRate: this.savingsRate,
      spendingRate: this.spendingRate
    };
  }

  public toTrendData() {
    return {
      period: this.period.toLabel(),
      income: this.totalIncome,
      expenses: this.totalExpenses,
      investments: this.totalInvestments,
      debtPayments: this.totalDebtPayments,
      balance: this.balance
    };
  }
}