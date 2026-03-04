import { Period, type PeriodType } from '../../domain/value-objects/Period';
import { ModernApiDashboardRepository } from '../../infrastructure/adapters/ModernApiDashboardRepository';
import { LoadDashboardDataUseCase } from '../../application/use-cases/LoadDashboardDataUseCase';
import { CalculateTrendsUseCase } from '../../application/use-cases/CalculateTrendsUseCase';
import { PeriodNavigationService } from '../../application/services/PeriodNavigationService';
import type { DashboardData } from '../../domain/repositories/DashboardRepository';
import type { Trend } from '../../domain/entities/Trend';

/**
 * Enhanced Dashboard Store con auto-detección del último período con datos
 */
export function createEnhancedDashboardStore(apiBase: string) {
  // Infrastructure
  const repository = new ModernApiDashboardRepository(apiBase);

  // Use cases
  const loadDashboardDataUseCase = new LoadDashboardDataUseCase(repository);
  const calculateTrendsUseCase = new CalculateTrendsUseCase();
  const navigationService = new PeriodNavigationService();

  // State (usando $state rune de Svelte 5)
  let selectedPeriodType = $state<PeriodType>('overview'); // Default to overview (last 12 months)
  let periodOffset = $state(0);
  let customStartDate = $state('');
  let customEndDate = $state('');
  let loading = $state(false);
  let dashboardData = $state<DashboardData | null>(null);
  let currentCurrency = $state('EUR');
  let availablePeriods = $state<any[]>([]);
  let comparison = $state<any>(null);
  let savingsMetrics = $state<any>(null);
  let categoryBreakdown = $state<any[]>([]);

  // Computed values (usando $derived rune)
  const currentPeriod = $derived(
    Period.create(selectedPeriodType, periodOffset, customStartDate, customEndDate)
  );

  const navigationOptions = $derived(
    navigationService.generateNavigationOptions(selectedPeriodType)
  );

  const trends = $derived<{ income: Trend; expenses: Trend; investments: Trend } | null>(
    dashboardData ? calculateTrendsUseCase.execute(dashboardData.monthlyTrend) : null
  );

  const metrics = $derived(dashboardData?.metrics || null);

  const categories = $derived(dashboardData?.categories || []);

  const monthlyTrend = $derived(dashboardData?.monthlyTrend || []);

  const monthlyBarData = $derived(dashboardData?.monthlyBarData || []);

  const expenseDistribution = $derived(dashboardData?.expenseDistribution || null);

  // Detectar el último período con datos al inicializar
  async function detectLastPeriodWithData() {
    try {
      const periods = await repository.getAvailablePeriods();
      availablePeriods = periods;

      // Start at current month
      periodOffset = 0;
    } catch (error) {
      console.error('[Dashboard] Error loading periods:', error);
      availablePeriods = [];
      periodOffset = 0;
    }
  }

  // Load dashboard data
  async function loadDashboardData() {
    loading = true;
    try {
      const data = await loadDashboardDataUseCase.execute(currentPeriod, currentCurrency);

      if (data) {
        categoryBreakdown = data.categoryBreakdown || [];

        // ALWAYS load last 12 months for charts
        let historicalData: any[] = [];

        if (selectedPeriodType === 'overview') {
          historicalData = await repository.getHistory(12);
        } else if (selectedPeriodType === 'month') {
          const now = new Date();
          const targetDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth() + 1;

          // Load comparison, savings metrics and 12-month history in parallel
          const [comparisonData, savings, history] = await Promise.all([
            repository.getComparison(year, month),
            repository.getSavingsMetrics(year, month),
            repository.getHistory(12), // Last 12 months
          ]);

          comparison = comparisonData;
          savingsMetrics = savings;
          historicalData = history;
        } else {
          // For any other period type (quarter, year, custom), ALWAYS show last 12 months
          historicalData = await repository.getHistory(12);
        }

        // Build chart data from historical data, falling back to API trend data
        let chartTrend = data.monthlyTrend || [];
        let chartBar = data.monthlyBarData || [];

        if (Array.isArray(historicalData) && historicalData.length > 0) {
          chartTrend = historicalData.map((item: any) => {
            // Backend returns data in item.summary
            const summary = item.summary || item;
            const monthLabel = item.monthName || item.label || item.month || 'Unknown';

            return {
              month: monthLabel,
              income: summary.income || 0,
              expenses: summary.expenses || 0,
              balance: summary.balance || (summary.income || 0) - (summary.expenses || 0),
              investments: summary.investments || 0,
            };
          });

          chartBar = historicalData.map((item: any) => {
            const summary = item.summary || item;
            const monthLabel = item.monthName || item.label || item.month || 'Unknown';

            return {
              month: monthLabel,
              income: summary.income || 0,
              expenses: summary.expenses || 0,
              investments: summary.investments || 0,
            };
          });
        }

        // Reassign entire object to guarantee Svelte 5 reactivity
        dashboardData = {
          ...data,
          monthlyTrend: chartTrend,
          monthlyBarData: chartBar,
        };
      } else {
        dashboardData = null;
      }
    } catch (_error) {
      dashboardData = null;
    } finally {
      loading = false;
    }
  }

  // Navigation methods
  async function changePeriod(type: PeriodType) {
    // Validate period type
    if (['overview', 'month', 'quarter', 'year', 'week'].includes(type)) {
      selectedPeriodType = type;
      periodOffset = 0;
      await loadDashboardData();
    }
  }

  async function navigatePeriod(newOffset: number) {
    // Overview cannot navigate (always shows last 12 months)
    if (selectedPeriodType === 'overview') {
      return;
    }

    // Clamp offset to valid range
    // 0 = current period
    // -1 = one period back
    // etc.

    const maxFuture = 0; // Can't go beyond current period
    const maxPast =
      selectedPeriodType === 'month'
        ? -24 // 2 years back
        : selectedPeriodType === 'quarter'
          ? -8 // 2 years back (8 quarters)
          : selectedPeriodType === 'year'
            ? -5 // 5 years back
            : selectedPeriodType === 'week'
              ? -52
              : -24; // 1 year back

    // Apply limits
    newOffset = Math.min(maxFuture, Math.max(maxPast, newOffset));

    // Only update if changed
    if (newOffset !== periodOffset) {
      periodOffset = newOffset;
      await loadDashboardData();
    }
  }

  function resetToToday() {
    periodOffset = 0;
    customStartDate = '';
    customEndDate = '';
    loadDashboardData();
  }

  function setCustomDateRange(startDate: string, endDate: string) {
    selectedPeriodType = 'custom';
    customStartDate = startDate;
    customEndDate = endDate;
    periodOffset = 0;
    loadDashboardData();
  }

  // Load available periods first, then load dashboard data
  async function initialize() {
    await detectLastPeriodWithData();
    await loadDashboardData();
  }

  // Start initialization
  initialize();

  // Currency change handler
  async function changeCurrency(currency: string) {
    currentCurrency = currency;
    await loadDashboardData();
  }

  // Format currency helper
  function formatCurrency(amount: number): string {
    const currency = currentCurrency || 'EUR';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Return public API
  return {
    // State
    get selectedPeriodType() {
      return selectedPeriodType;
    },
    get periodOffset() {
      return periodOffset;
    },
    get customStartDate() {
      return customStartDate;
    },
    get customEndDate() {
      return customEndDate;
    },
    get loading() {
      return loading;
    },
    get currentCurrency() {
      return currentCurrency;
    },
    get currentPeriod() {
      return currentPeriod;
    },
    get navigationOptions() {
      return navigationOptions;
    },
    get availablePeriods() {
      return availablePeriods;
    },

    // Data
    get metrics() {
      return metrics;
    },
    get trends() {
      return trends;
    },
    get categories() {
      return categories;
    },
    get monthlyTrend() {
      return monthlyTrend;
    },
    get monthlyTrendData() {
      return monthlyTrend;
    },
    get monthlyBarData() {
      return monthlyBarData;
    },
    get expenseDistribution() {
      return expenseDistribution;
    },
    get comparison() {
      return comparison;
    },
    get savingsMetrics() {
      return savingsMetrics;
    },
    get categoryBreakdown() {
      // Convert Category objects to plain objects if needed
      return categoryBreakdown.map((cat: any) => {
        if (typeof cat.toJSON === 'function') {
          return cat.toJSON();
        }
        return cat;
      });
    },

    // Methods
    changePeriod,
    navigatePeriod,
    changeCurrency,
    resetToToday,
    setCustomDateRange,
    loadDashboard: loadDashboardData,
    formatCurrency,

    // Método para obtener el label del período actual
    getCurrentPeriodLabel(): string {
      const now = new Date();

      switch (selectedPeriodType) {
        case 'overview': {
          return 'Últimos 12 meses';
        }

        case 'month': {
          const targetDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
          const monthName = targetDate.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric',
          });
          // Capitalize first letter
          return monthName.charAt(0).toUpperCase() + monthName.slice(1);
        }

        case 'quarter': {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const targetQuarter = currentQuarter + periodOffset;
          const targetYear = now.getFullYear() + Math.floor(targetQuarter / 4);
          const normalizedQuarter = ((targetQuarter % 4) + 4) % 4;

          if (periodOffset === 0) {
            return 'Este trimestre';
          }
          return `Q${normalizedQuarter + 1} ${targetYear}`;
        }

        case 'year': {
          const targetYear = now.getFullYear() + periodOffset;
          if (periodOffset === 0) {
            return 'Este año';
          }
          return targetYear.toString();
        }

        default:
          return currentPeriod.getLabel();
      }
    },

    // Check if we can navigate forward
    canNavigateForward(): boolean {
      if (selectedPeriodType === 'overview') return false;
      return periodOffset < 0;
    },

    // Check if we can navigate backward
    canNavigateBackward(): boolean {
      if (selectedPeriodType === 'overview') return false;

      // Different limits based on period type
      const limits: Record<PeriodType, number> = {
        overview: 0, // No navigation for overview
        month: -24, // 2 years back
        quarter: -8, // 2 years back (8 quarters)
        year: -5, // 5 years back
        week: -52, // 1 year back
        custom: 0,
      };
      return periodOffset > (limits[selectedPeriodType] || -24);
    },

    // Método para verificar si hay datos en el período actual
    hasDataInCurrentPeriod(): boolean {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      return availablePeriods.some((p) => p.year === year && p.month === month);
    },
  };
}
