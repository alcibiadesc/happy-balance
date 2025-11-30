/**
 * Dashboard Widgets Registry
 *
 * This module provides a centralized registry for all dashboard widgets.
 * To add a new widget:
 * 1. Create a folder in widgets/ with your widget component
 * 2. Add an index.ts exporting your component
 * 3. Add the widget to WIDGET_REGISTRY below
 * 4. Add the section type to dashboardSections.ts
 */

// Widget exports
export { SpendingIndicator } from './spending';
export { FireIndicator } from './fire';
export { SavingsGoalCard } from './savings';
export { TopMerchantsCard } from './topMerchants';
export { MetricsGrid } from './metrics';
export { ChartSection, FinancialChart, FinancialBarCharts } from './charts';
export { CategoriesSection } from './categories';

// Types
export type WidgetId =
  | 'spending'
  | 'metrics'
  | 'categories'
  | 'lineChart'
  | 'barChart'
  | 'savingsGoal'
  | 'topMerchants'
  | 'fireIndicator';

export interface WidgetDefinition {
  id: WidgetId;
  /** Path to the widget folder (relative to widgets/) */
  folder: string;
  /** Component name */
  component: string;
  /** i18n key for the widget title */
  i18nKey: string;
  /** Default visibility */
  defaultVisible: boolean;
  /** Default order in dashboard */
  defaultOrder: number;
}

/**
 * Widget Registry - defines all available dashboard widgets
 * Add new widgets here to register them with the dashboard
 */
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'spending',
    folder: 'spending',
    component: 'SpendingIndicator',
    i18nKey: 'dashboard.config.spending_indicator',
    defaultVisible: true,
    defaultOrder: 0,
  },
  {
    id: 'metrics',
    folder: 'metrics',
    component: 'MetricsGrid',
    i18nKey: 'dashboard.config.metrics_cards',
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: 'fireIndicator',
    folder: 'fire',
    component: 'FireIndicator',
    i18nKey: 'dashboard.config.fire_indicator',
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: 'categories',
    folder: 'categories',
    component: 'CategoriesSection',
    i18nKey: 'dashboard.categories.title',
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: 'savingsGoal',
    folder: 'savings',
    component: 'SavingsGoalCard',
    i18nKey: 'dashboard.config.savings_goal',
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: 'topMerchants',
    folder: 'topMerchants',
    component: 'TopMerchantsCard',
    i18nKey: 'dashboard.config.top_merchants',
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: 'lineChart',
    folder: 'charts',
    component: 'ChartSection',
    i18nKey: 'dashboard.charts.temporal_evolution',
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: 'barChart',
    folder: 'charts',
    component: 'FinancialBarCharts',
    i18nKey: 'dashboard.charts.expense_distribution',
    defaultVisible: true,
    defaultOrder: 7,
  },
];

/**
 * Get widget definition by ID
 */
export function getWidgetDefinition(id: WidgetId): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find(w => w.id === id);
}

/**
 * Get all widget IDs
 */
export function getAllWidgetIds(): WidgetId[] {
  return WIDGET_REGISTRY.map(w => w.id);
}
