import type {
  InvestmentDTO,
  InvestmentWithMetricsDTO,
  InvestmentHistoryEntryDTO,
  InvestmentType as SharedInvestmentType,
  InvestmentHistoryType as SharedHistoryType,
} from '@happy-balance/shared-types';
import { Investment } from '@domain/entities/Investment';

/**
 * Maps domain Investment to API InvestmentDTO.
 */
export function mapInvestmentToDTO(investment: Investment): InvestmentDTO {
  const snapshot = investment.toSnapshot();
  return {
    id: snapshot.id,
    name: snapshot.name,
    type: (snapshot.symbol ? 'STOCKS' : 'OTHER') as SharedInvestmentType,
    symbol: snapshot.symbol ?? undefined,
    currentValue: snapshot.currentValue,
    totalContributed: snapshot.totalContributions ?? 0,
    currency: snapshot.currency,
    categoryId: snapshot.categoryId ?? undefined,
    notes: snapshot.notes ?? undefined,
    isActive: snapshot.isActive,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.createdAt,
  };
}

/**
 * Maps domain Investment (with history) to InvestmentWithMetricsDTO.
 */
export function mapInvestmentWithMetricsToDTO(investment: Investment): InvestmentWithMetricsDTO {
  const snapshot = investment.toSnapshot();
  return {
    ...mapInvestmentToDTO(investment),
    profit: snapshot.profit ?? 0,
    profitPercentage: snapshot.profitPercentage ?? 0,
    history: snapshot.history?.map((entry) => mapHistoryEntryToDTO(entry)),
  };
}

/**
 * Maps a single investment history snapshot to InvestmentHistoryEntryDTO.
 */
function mapHistoryEntryToDTO(entry: {
  id: string;
  amount: number;
  date: string;
  notes?: string | null;
  type: string;
}): InvestmentHistoryEntryDTO {
  return {
    id: entry.id,
    amount: entry.amount,
    date: entry.date,
    notes: entry.notes ?? undefined,
    type: entry.type as SharedHistoryType,
  };
}
