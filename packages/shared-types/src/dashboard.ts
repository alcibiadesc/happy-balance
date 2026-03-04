/**
 * Dashboard types shared between frontend and backend.
 */

export interface PeriodInfo {
  type: string;
  year?: number;
  month?: number;
  startDate: string;
  endDate: string;
  label: string;
}

export interface PeriodMetricsDTO {
  income: number;
  expenses: number;
  investments: number;
  debtPayments: number;
  balance: number;
  savingsRate: number;
  currency: string;
}

export interface CategoryBreakdownDTO {
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
}

export interface ExpenseDistributionDTO {
  essential: number;
  discretionary: number;
  investments: number;
  uncategorized: number;
  currency: string;
}

export interface MonthlyTrendDTO {
  month: string;
  income: number;
  expenses: number;
  investments: number;
  debtPayments: number;
  balance: number;
}

/**
 * Complete dashboard response from GET /api/dashboard/metrics/:year/:month
 */
export interface DashboardResponseDTO {
  period: PeriodInfo;
  summary: PeriodMetricsDTO;
  categories?: CategoryBreakdownDTO[];
  distribution?: ExpenseDistributionDTO;
  monthlyTrend?: MonthlyTrendDTO[];
  comparison?: {
    income: ComparisonDTO;
    expenses: ComparisonDTO;
    savingsRate: ComparisonDTO;
  };
}

export interface ComparisonDTO {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}
