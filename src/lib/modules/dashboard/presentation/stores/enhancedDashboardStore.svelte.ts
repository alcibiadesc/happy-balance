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
  let selectedPeriodType = $state<PeriodType>('month');
  let periodOffset = $state(0);
  let customStartDate = $state('');
  let customEndDate = $state('');
  let loading = $state(false);
  let dashboardData = $state<DashboardData | null>(null);
  let currentCurrency = $state('EUR');
  let availablePeriods = $state<any[]>([]);
  let comparison = $state<any>(null);
  let savingsMetrics = $state<any>(null);

  // Computed values (usando $derived rune)
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

  const monthlyTrend = $derived(dashboardData?.monthlyTrend || []);

  const monthlyBarData = $derived(dashboardData?.monthlyBarData || []);

  const expenseDistribution = $derived(dashboardData?.expenseDistribution || null);

  // Detectar el último período con datos al inicializar
  async function detectLastPeriodWithData() {
    try {
      const periods = await repository.getAvailablePeriods();
      availablePeriods = periods;

      // Siempre empezar mostrando el mes actual (offset 0)
      // La UI indicará si no hay datos
      periodOffset = 0;

      console.log('[Dashboard] Períodos disponibles:', periods.length);
      if (periods.length > 0) {
        console.log('[Dashboard] Período más reciente con datos:', periods[0].label);
      }
    } catch (error) {
      console.error('[Dashboard] Error detectando períodos:', error);
      periodOffset = 0;
    }
  }

  // Load dashboard data
  async function loadDashboardData() {
    loading = true;
    try {
      const data = await loadDashboardDataUseCase.execute(currentPeriod, currentCurrency);

      if (data) {
        dashboardData = data;
        console.log('[Dashboard] Data loaded successfully:', {
          metrics: data.metrics ? 'present' : 'missing',
          categories: data.categories?.length || 0,
          period: currentPeriod.getLabel()
        });

        // Cargar comparación si estamos en vista mensual
        if (selectedPeriodType === 'month') {
          const now = new Date();
          const targetDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth() + 1;

          // Cargar comparación y métricas de ahorro en paralelo
          const [comparisonData, savings] = await Promise.all([
            repository.getComparison(year, month),
            repository.getSavingsMetrics(year, month)
          ]);

          comparison = comparisonData;
          savingsMetrics = savings;
        }
      } else {
        console.error('[Dashboard] No data received');
        dashboardData = null;
      }
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
      dashboardData = null;
    } finally {
      loading = false;
    }
  }

  // Navigation methods
  async function changePeriod(type: PeriodType) {
    selectedPeriodType = type;
    periodOffset = 0;
    await loadDashboardData();
  }

  async function navigatePeriod(offset: number) {
    periodOffset = offset;
    await loadDashboardData();
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
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Return public API
  return {
    // State
    get selectedPeriodType() { return selectedPeriodType; },
    get periodOffset() { return periodOffset; },
    get customStartDate() { return customStartDate; },
    get customEndDate() { return customEndDate; },
    get loading() { return loading; },
    get currentCurrency() { return currentCurrency; },
    get currentPeriod() { return currentPeriod; },
    get navigationOptions() { return navigationOptions; },
    get availablePeriods() { return availablePeriods; },

    // Data
    get metrics() { return metrics; },
    get trends() { return trends; },
    get categories() { return categories; },
    get monthlyTrend() { return monthlyTrend; },
    get monthlyTrendData() { return monthlyTrend; },
    get monthlyBarData() { return monthlyBarData; },
    get expenseDistribution() { return expenseDistribution; },
    get comparison() { return comparison; },
    get savingsMetrics() { return savingsMetrics; },

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
      const targetDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);

      if (selectedPeriodType === 'month') {
        const monthName = targetDate.toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        });
        // Capitalize first letter
        return monthName.charAt(0).toUpperCase() + monthName.slice(1);
      }
      return currentPeriod.getLabel();
    },

    // Método para verificar si hay datos en el período actual
    hasDataInCurrentPeriod(): boolean {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      return availablePeriods.some(p => p.year === year && p.month === month);
    }
  };
}