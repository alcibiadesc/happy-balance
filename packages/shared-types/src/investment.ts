/**
 * Investment/Portfolio types shared between frontend and backend.
 */

export type InvestmentHistoryType = 'CONTRIBUTION' | 'WITHDRAWAL' | 'VALUE_UPDATE';

export interface InvestmentDTO {
  id: string;
  name: string;
  symbol?: string | null;
  currentValue: number;
  totalContributed: number;
  currency: string;
  categoryId?: string | null;
  highlight: boolean;
  color: string;
  icon: string;
  notes?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentWithMetricsDTO extends InvestmentDTO {
  profit: number;
  profitPercentage: number;
  totalWithdrawals: number;
  netContributions: number;
  history?: InvestmentHistoryEntryDTO[];
}

export interface InvestmentHistoryEntryDTO {
  id: string;
  amount: number;
  date: string;
  notes?: string | null;
  type: InvestmentHistoryType;
}

export interface CreateInvestmentRequest {
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

export interface UpdateInvestmentRequest {
  name?: string;
  symbol?: string | null;
  currentValue?: number;
  categoryId?: string | null;
  highlight?: boolean;
  color?: string;
  icon?: string;
  notes?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PortfolioSummaryDTO {
  totalValue: number;
  totalContributed: number;
  totalProfit: number;
  profitPercentage: number;
  currency: string;
  investments: InvestmentWithMetricsDTO[];
}
