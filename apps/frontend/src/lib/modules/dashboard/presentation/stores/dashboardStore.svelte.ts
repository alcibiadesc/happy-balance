import { Period, type PeriodType } from '../../domain/value-objects/Period';
import { ModernApiDashboardRepository } from '../../infrastructure/adapters/ModernApiDashboardRepository';
import { LoadDashboardDataUseCase } from '../../application/use-cases/LoadDashboardDataUseCase';
import { CalculateTrendsUseCase } from '../../application/use-cases/CalculateTrendsUseCase';
import { PeriodNavigationService } from '../../application/services/PeriodNavigationService';
import type { DashboardData } from '../../domain/repositories/DashboardRepository';
import type { Trend } from '../../domain/entities/Trend';
import { pipe, memoize } from '../utils/functional';
import { formatMoney, formatTrend, createCurrencyFormatter } from '../utils/formatters';

// Dashboard Store using Svelte 5 runes
export function createDashboardStore(apiBase: string) {
  // Infrastructure
  const repository = new ModernApiDashboardRepository(apiBase);

  // Use cases
  const loadDashboardDataUseCase = new LoadDashboardDataUseCase(repository);
  const calculateTrendsUseCase = new CalculateTrendsUseCase();
  const navigationService = new PeriodNavigationService();

  // State (using $state rune)
  let selectedPeriodType = $state<PeriodType>('month');
  let periodOffset = $state(0);
  let customStartDate = $state('');
  let customEndDate = $state('');
  let loading = $state(false);
  let dashboardData = $state<DashboardData | null>(null);
  let currentCurrency = $state('EUR');

  // Computed values (using $derived rune)
  const currentPeriod = $derived(
    Period.create(
      selectedPeriodType,
      periodOffset,
      customStartDate,
      customEndDate
    )
  );

  const navigationOptions = $derived(
    navigationService.generateNavigationOptions(selectedPeriodType)
  );

  const trends = $derived<{ income: Trend; expenses: Trend; investments: Trend } | null>(
    dashboardData
      ? calculateTrendsUseCase.execute(dashboardData.monthlyTrend)
      : null
  );

  const metrics = $derived(dashboardData?.metrics || null);

  const categories = $derived(dashboardData?.categories || []);

  const monthlyTrendData = $derived(dashboardData?.monthlyTrend || []);

  const monthlyBarData = $derived(dashboardData?.monthlyBarData || []);

  const expenseDistribution = $derived(dashboardData?.expenseDistribution || null);

  // Memoized formatters
  const currencyFormatter = $derived(
    memoize(createCurrencyFormatter)(currentCurrency)
  );

  // Actions
  const loadDashboard = async () => {
    loading = true;
    try {
      dashboardData = await loadDashboardDataUseCase.execute(
        currentPeriod,
        currentCurrency
      );
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      dashboardData = null;
    } finally {
      loading = false;
    }
  };

  const changePeriod = async (periodType: PeriodType) => {
    if (periodType === 'custom') {
      // Will be handled by custom date picker
      return;
    }
    selectedPeriodType = periodType;
    periodOffset = 0;
    customStartDate = '';
    customEndDate = '';
    await loadDashboard();
  };

  const navigatePeriod = async (offset: number) => {
    periodOffset = offset;
    await loadDashboard();
  };

  const setCustomDateRange = async (startDate: string, endDate: string) => {
    selectedPeriodType = 'custom';
    customStartDate = startDate;
    customEndDate = endDate;
    periodOffset = 0;
    await loadDashboard();
  };

  const changeCurrency = async (currency: string) => {
    currentCurrency = currency;
    await loadDashboard();
  };

  // Formatters using functional composition
  const formatCurrency = (amount: number): string => {
    const absValue = Math.abs(amount);
    return currencyFormatter(absValue);
  };

  const formatMoneyValue = (money: any): string => {
    if (!money || typeof money.format !== 'function') return formatCurrency(0);
    return formatMoney(money, currentCurrency);
  };

  const formatTrendValue = (trend: any): string => {
    if (!trend || typeof trend.format !== 'function') return '+0.0%';
    return formatTrend(trend);
  };

  const getTrendColor = (trend: any, type: 'income' | 'expenses' | 'investments'): string => {
    if (!trend || typeof trend.getColor !== 'function') return 'var(--text-secondary)';
    return trend.getColor(type);
  };

  // Public API
  return {
    // State
    get selectedPeriodType() { return selectedPeriodType; },
    get periodOffset() { return periodOffset; },
    get customStartDate() { return customStartDate; },
    get customEndDate() { return customEndDate; },
    get loading() { return loading; },
    get currentCurrency() { return currentCurrency; },

    // Computed
    get currentPeriod() { return currentPeriod; },
    get navigationOptions() { return navigationOptions; },
    get trends() { return trends; },
    get metrics() { return metrics; },
    get categories() { return categories; },
    get monthlyTrendData() { return monthlyTrendData; },
    get monthlyBarData() { return monthlyBarData; },
    get expenseDistribution() { return expenseDistribution; },

    // Actions
    loadDashboard,
    changePeriod,
    navigatePeriod,
    setCustomDateRange,
    changeCurrency,

    // Formatters
    formatCurrency,
    formatMoneyValue,
    formatTrendValue,
    getTrendColor
  };
}

// Export type for the store
export type DashboardStore = ReturnType<typeof createDashboardStore>;