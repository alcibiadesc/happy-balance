import { DashboardMetrics } from '../entities/DashboardMetrics';
import { Category } from '../entities/Category';
import { Period } from '../value-objects/Period';

export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface MonthlyBarData {
  month: string;
  income: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  debtPayments: number;
  investments: number;
}

export interface ExpenseDistribution {
  essential: number;
  discretionary: number;
  debtPayments: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  categories: Category[];
  monthlyTrend: MonthlyTrendData[];
  monthlyBarData: MonthlyBarData[];
  expenseDistribution: ExpenseDistribution;
}

// Repository Interface (Port)
export interface DashboardRepository {
  getDashboardData(period: Period, currency: string): Promise<DashboardData>;
}