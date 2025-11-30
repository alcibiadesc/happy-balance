// ============================================================================
// Investment Types & Interfaces
// ============================================================================

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

// ============================================================================
// API Request/Response Types
// ============================================================================

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

export interface UpdateHistoryEntryData {
  amount?: number;
  date?: string;
  notes?: string;
  type?: string;
}

export interface SortOrderUpdate {
  id: string;
  sortOrder: number;
}

export interface ImportGofireData {
  data: GofireInvestment[];
}

export interface GofireInvestment {
  id: string;
  title: string;
  number: number;
  hightlight?: boolean;
  saving?: GofireSaving[];
}

export interface GofireSaving {
  id_saving: string;
  amount: number;
  today: string;
}

export interface ImportResult {
  imported: number;
  historyCount: number;
}

export interface ExportResult {
  investments: Investment[];
  exportDate: string;
  version: string;
}

// ============================================================================
// Form Types (for UI state management)
// ============================================================================

export interface InvestmentEditForm {
  name: string;
  symbol: string;
  currentValue: number;
  currency: string;
  categoryId: string | null;
  highlight: boolean;
  color: string;
  icon: string;
  notes: string;
}

export interface AddHistoryForm {
  amount: number;
  type: InvestmentHistoryType;
  date: string;
  notes: string;
}

export interface EditHistoryEntryState {
  investmentId: string;
  historyId: string;
  amount: number;
  date: string;
  notes: string;
  type: string;
}

// ============================================================================
// Constants
// ============================================================================

export const INVESTMENT_COLORS = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#EF4444',
  '#14B8A6',
  '#6366F1',
  '#84CC16',
  '#F97316',
  '#06B6D4',
  '#A855F7',
] as const;

export const INVESTMENT_ICONS = [
  '📈',
  '💹',
  '📊',
  '💰',
  '🏦',
  '💎',
  '🪙',
  '📉',
  '💵',
  '💴',
  '💶',
  '💷',
  '🏠',
  '🚗',
  '✈️',
  '🎯',
  '📱',
  '💻',
  '🔒',
  '🌍',
  '⚡',
  '🛢️',
  '🏭',
  '🎨',
] as const;

export const HISTORY_TYPE_LABELS: Record<InvestmentHistoryType, string> = {
  CONTRIBUTION: 'Aportación',
  WITHDRAWAL: 'Retirada',
  VALUE_UPDATE: 'Actualización',
};

export const HISTORY_TYPE_COLORS: Record<InvestmentHistoryType, string> = {
  CONTRIBUTION: 'text-green-600',
  WITHDRAWAL: 'text-red-600',
  VALUE_UPDATE: 'text-blue-600',
};

// ============================================================================
// Factory Functions
// ============================================================================

export function createEmptyInvestmentForm(currency = 'EUR'): InvestmentEditForm {
  return {
    name: '',
    symbol: '',
    currentValue: 0,
    currency,
    categoryId: null,
    highlight: false,
    color: INVESTMENT_COLORS[0],
    icon: '📈',
    notes: '',
  };
}

export function createEmptyHistoryForm(): AddHistoryForm {
  return {
    amount: 0,
    type: 'CONTRIBUTION',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  };
}

export function investmentToForm(investment: Investment): InvestmentEditForm {
  return {
    name: investment.name,
    symbol: investment.symbol || '',
    currentValue: investment.currentValue,
    currency: investment.currency,
    categoryId: investment.categoryId,
    highlight: investment.highlight,
    color: investment.color,
    icon: investment.icon,
    notes: investment.notes || '',
  };
}

export function formToCreateData(form: InvestmentEditForm): CreateInvestmentData {
  return {
    name: form.name,
    symbol: form.symbol || undefined,
    currentValue: form.currentValue,
    currency: form.currency,
    categoryId: form.categoryId || undefined,
    highlight: form.highlight,
    color: form.color,
    icon: form.icon,
    notes: form.notes || undefined,
  };
}

export function formToUpdateData(form: InvestmentEditForm): UpdateInvestmentData {
  return {
    name: form.name,
    symbol: form.symbol || null,
    currentValue: form.currentValue,
    currency: form.currency,
    categoryId: form.categoryId,
    highlight: form.highlight,
    color: form.color,
    icon: form.icon,
    notes: form.notes || null,
  };
}
