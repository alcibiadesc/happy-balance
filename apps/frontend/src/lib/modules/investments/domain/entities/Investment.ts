export type InvestmentHistoryType = 'CONTRIBUTION' | 'WITHDRAWAL' | 'VALUE_UPDATE';

export interface InvestmentHistory {
  id: string;
  investmentId: string;
  amount: number;
  type: InvestmentHistoryType;
  date: string;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  symbol: string | null;
  currentValue: number;
  currency: string;
  categoryId: string | null;
  categoryName?: string | null;
  highlight: boolean;
  color: string;
  icon: string;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
  userId: string;
  createdAt: string;
  history?: InvestmentHistory[];
  // Calculated fields
  totalContributions: number;
  totalWithdrawals: number;
  netContributions: number;
  profit: number;
  profitPercentage: number;
}

export interface InvestmentWithMetrics extends Investment {
  contributionsCount: number;
  lastContributionDate: string | null;
}

export interface PortfolioSummary {
  totalValue: number;
  totalContributions: number;
  totalWithdrawals: number;
  netContributions: number;
  totalProfit: number;
  profitPercentage: number;
  investmentCount: number;
  currency: string;
}

export interface TimelineEntry {
  date: string;
  totalValue: number;
  contributions: number;
  withdrawals: number;
}

export interface CreateInvestmentData {
  name: string;
  symbol?: string;
  currentValue: number;
  currency?: string;
  categoryId?: string;
  highlight?: boolean;
  color?: string;
  icon?: string;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateInvestmentData {
  name?: string;
  symbol?: string | null;
  currentValue?: number;
  currency?: string;
  categoryId?: string | null;
  highlight?: boolean;
  color?: string;
  icon?: string;
  notes?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AddHistoryEntryData {
  amount: number;
  type: InvestmentHistoryType;
  date: string;
  notes?: string;
}
