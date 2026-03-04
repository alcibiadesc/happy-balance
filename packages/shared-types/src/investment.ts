/**
 * Investment/Portfolio types shared between frontend and backend.
 */

export type InvestmentType =
  | 'STOCKS'
  | 'ETF'
  | 'CRYPTO'
  | 'REAL_ESTATE'
  | 'BONDS'
  | 'SAVINGS'
  | 'OTHER';

export type InvestmentHistoryType = 'CONTRIBUTION' | 'WITHDRAWAL' | 'VALUE_UPDATE';

export interface InvestmentDTO {
  id: string;
  name: string;
  type: InvestmentType;
  symbol?: string | null;
  currentValue: number;
  totalContributed: number;
  currency: string;
  categoryId?: string | null;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentWithMetricsDTO extends InvestmentDTO {
  profit: number;
  profitPercentage: number;
  history?: InvestmentHistoryEntryDTO[];
}

export interface InvestmentHistoryEntryDTO {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  type: InvestmentHistoryType;
}

export interface CreateInvestmentRequest {
  name: string;
  type: InvestmentType;
  symbol?: string;
  currentValue: number;
  totalContributed: number;
  currency?: string;
  categoryId?: string;
  notes?: string;
}

export interface UpdateInvestmentRequest {
  name?: string;
  type?: InvestmentType;
  symbol?: string | null;
  currentValue?: number;
  totalContributed?: number;
  categoryId?: string | null;
  notes?: string;
  isActive?: boolean;
}

export interface PortfolioSummaryDTO {
  totalValue: number;
  totalContributed: number;
  totalProfit: number;
  profitPercentage: number;
  currency: string;
  investments: InvestmentWithMetricsDTO[];
}
