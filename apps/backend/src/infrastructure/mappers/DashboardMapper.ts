import type {
  DashboardResponseDTO,
  PeriodInfo,
  PeriodMetricsDTO,
  CategoryBreakdownDTO,
  ExpenseDistributionDTO,
  MonthlyTrendDTO,
} from '@happy-balance/shared-types';

/**
 * Raw dashboard metrics as returned by the use case.
 */
interface DashboardMetricsData {
  periodInfo: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
  periodBalance: {
    income: number;
    expenses: number;
    investments: number;
    debtPayments: number;
    balance: number;
    currency: string;
  };
  expenseDistribution: {
    essential: number;
    discretionary: number;
    uncategorized: number;
    currency: string;
  };
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    investments: number;
    debtPayments: number;
    balance: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    color?: string;
    icon?: string;
    type?: string;
    monthlyBudget?: number | null;
    budgetUsage?: number | null;
  }>;
}

/**
 * Maps use case metrics data to the shared DashboardResponseDTO.
 */
export function mapDashboardToDTO(
  data: DashboardMetricsData,
  periodLabel: string
): DashboardResponseDTO {
  const income = data.periodBalance.income;
  const savingsRate = income > 0 ? (data.periodBalance.balance / income) * 100 : 0;

  const period: PeriodInfo = {
    type: data.periodInfo.periodType,
    startDate: new Date(data.periodInfo.startDate).toISOString(),
    endDate: new Date(data.periodInfo.endDate).toISOString(),
    label: periodLabel,
  };

  const summary: PeriodMetricsDTO = {
    income: data.periodBalance.income,
    expenses: data.periodBalance.expenses,
    investments: data.periodBalance.investments,
    debtPayments: data.periodBalance.debtPayments,
    balance: data.periodBalance.balance,
    savingsRate,
    currency: data.periodBalance.currency,
  };

  const categories: CategoryBreakdownDTO[] = data.categoryBreakdown.map((cat) => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    amount: cat.amount,
    percentage: cat.percentage,
    transactionCount: cat.transactionCount,
    color: cat.color,
    icon: cat.icon,
    type: cat.type,
    monthlyBudget: cat.monthlyBudget,
    budgetUsage: cat.budgetUsage,
  }));

  const distribution: ExpenseDistributionDTO = {
    essential: data.expenseDistribution.essential,
    discretionary: data.expenseDistribution.discretionary,
    investments: data.periodBalance.investments,
    uncategorized: data.expenseDistribution.uncategorized,
    currency: data.expenseDistribution.currency,
  };

  const monthlyTrend: MonthlyTrendDTO[] = data.monthlyTrend.map((trend) => ({
    month: trend.month,
    income: trend.income,
    expenses: trend.expenses,
    investments: trend.investments,
    debtPayments: trend.debtPayments,
    balance: trend.balance,
  }));

  return {
    period,
    summary,
    categories,
    distribution,
    monthlyTrend,
  };
}
