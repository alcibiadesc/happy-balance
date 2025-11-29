import {
  Activity,
  LayoutGrid,
  FolderKanban,
  LineChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Store,
  Infinity
} from 'lucide-svelte';

export type MetricType = 'income' | 'expenses' | 'investments' | 'balance';
export type SectionType = 'spending' | 'metrics' | 'categories' | 'lineChart' | 'barChart' | 'savingsGoal' | 'topMerchants' | 'fireIndicator';

export interface MetricDefinition {
  id: MetricType;
  icon: typeof TrendingUp;
  i18nKey: string;
  defaultVisible: boolean;
  defaultOrder: number;
}

export interface SectionDefinition {
  id: SectionType;
  icon: typeof Activity;
  i18nKey: string;
  defaultVisible: boolean;
  defaultOrder: number;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { id: 'income', icon: TrendingUp, i18nKey: 'dashboard.metrics.income', defaultVisible: true, defaultOrder: 0 },
  { id: 'expenses', icon: TrendingDown, i18nKey: 'dashboard.metrics.expenses', defaultVisible: true, defaultOrder: 1 },
  { id: 'investments', icon: PiggyBank, i18nKey: 'dashboard.metrics.investments', defaultVisible: true, defaultOrder: 2 },
  { id: 'balance', icon: Wallet, i18nKey: 'dashboard.metrics.balance', defaultVisible: false, defaultOrder: 3 },
];

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: 'spending', icon: Activity, i18nKey: 'dashboard.config.spending_indicator', defaultVisible: true, defaultOrder: 0 },
  { id: 'metrics', icon: LayoutGrid, i18nKey: 'dashboard.config.metrics_cards', defaultVisible: true, defaultOrder: 1 },
  { id: 'fireIndicator', icon: Infinity, i18nKey: 'dashboard.config.fire_indicator', defaultVisible: true, defaultOrder: 2 },
  { id: 'categories', icon: FolderKanban, i18nKey: 'dashboard.categories.title', defaultVisible: true, defaultOrder: 3 },
  { id: 'savingsGoal', icon: TrendingUp, i18nKey: 'dashboard.config.savings_goal', defaultVisible: true, defaultOrder: 4 },
  { id: 'topMerchants', icon: Store, i18nKey: 'dashboard.config.top_merchants', defaultVisible: true, defaultOrder: 5 },
  { id: 'lineChart', icon: LineChart, i18nKey: 'dashboard.charts.temporal_evolution', defaultVisible: true, defaultOrder: 6 },
  { id: 'barChart', icon: BarChart3, i18nKey: 'dashboard.charts.expense_distribution', defaultVisible: true, defaultOrder: 7 },
];

// Helper functions
export function getMetricDefinition(id: MetricType): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find(m => m.id === id);
}

export function getSectionDefinition(id: SectionType): SectionDefinition | undefined {
  return SECTION_DEFINITIONS.find(s => s.id === id);
}

export function getMetricIcon(id: MetricType): typeof TrendingUp {
  return getMetricDefinition(id)?.icon ?? TrendingUp;
}

export function getSectionIcon(id: SectionType): typeof Activity {
  return getSectionDefinition(id)?.icon ?? Activity;
}
