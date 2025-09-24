<script lang="ts">
  import { onMount } from "svelte";
  import { CalendarRange } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";
  import { currentCurrency } from "$lib/stores/currency";

  // Components
  import SpendingIndicator from "$lib/components/molecules/SpendingIndicator.svelte";
  import FinancialBarCharts from "$lib/components/molecules/FinancialBarCharts.svelte";
  import DateRangePicker from "$lib/components/molecules/DateRangePicker.svelte";
  import DashboardHeader from "$lib/components/organisms/DashboardHeader.svelte";
  import CategoriesSection from "$lib/components/organisms/CategoriesSection.svelte";
  import ChartSection from "$lib/components/organisms/ChartSection.svelte";
  import MetricsGrid from "$lib/components/molecules/MetricsGrid.svelte";

  // Domain Store - Usar el enhanced store que detecta el último período con datos
  import { createEnhancedDashboardStore } from "$lib/modules/dashboard/presentation/stores/enhancedDashboardStore.svelte.ts";

  // Initialize store with API configuration
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3006/api";
  console.log('[Dashboard] Using API base:', API_BASE);
  const store = createEnhancedDashboardStore(API_BASE);

  // Reactive bindings
  let showDateRangePicker = $state(false);

  // Period options with i18n
  const periods = $derived([
    { value: "week", label: $t("dashboard.periods.week") },
    { value: "month", label: $t("dashboard.periods.month") },
    { value: "quarter", label: $t("dashboard.periods.quarter") },
    { value: "year", label: $t("dashboard.periods.year") },
    {
      value: "custom",
      label: $t("dashboard.periods.custom"),
      icon: CalendarRange,
    },
  ]);

  // Event handlers
  const handlePeriodChange = async (period: string) => {
    if (period === "custom") {
      showDateRangePicker = true;
    } else {
      await store.changePeriod(period as any);
    }
  };

  const handlePeriodNavigation = async (offset: number) => {
    await store.navigatePeriod(offset);
  };

  const handleCustomDateRange = async (event: CustomEvent) => {
    const { startDate, endDate } = event.detail;
    await store.setCustomDateRange(startDate, endDate);
  };

  // Helper functions
  const getCustomDateRangeLabel = (): string => {
    if (store.customStartDate && store.customEndDate) {
      const start = new Date(store.customStartDate).toLocaleDateString();
      const end = new Date(store.customEndDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return $t("dashboard.periods.custom");
  };

  const getCurrentPeriodLabel = (): string => {
    const current = store.navigationOptions.find(
      (opt) => opt.offset === store.periodOffset
    );
    return current?.fullLabel || store.navigationOptions[0]?.fullLabel || "";
  };

  // Computed values for components
  const metricsData = $derived({
    income: store.metrics?.getIncome().getValue() || 0,
    expenses: store.metrics?.getExpenses().getValue() || 0,
    investments: store.metrics?.getInvestments().getValue() || 0,
    balance: store.metrics?.getBalance().getValue() || 0,
    spendingRate: store.metrics?.getSpendingRate() || 0,
    savingsRate: store.metrics?.getSavingsRate() || 0,
  });

  const trendsData = $derived({
    income: store.trends?.income.getPercentageChange() || 0,
    expenses: store.trends?.expenses.getPercentageChange() || 0,
    investments: store.trends?.investments.getPercentageChange() || 0,
  });

  const categoriesData = $derived(
    store.categories.map(cat => ({
      name: cat.getName(),
      amount: cat.getAmount().getValue(),
      percentage: cat.getPercentage(),
      color: cat.getColor(),
      icon: cat.getIcon()
    }))
  );

  // Format functions that use the store
  const formatTrendValue = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendColor = (value: number, type: string): string => {
    if (type === "expenses") {
      return value <= 0 ? "var(--success)" : "var(--accent)";
    }
    return value >= 0 ? "var(--success)" : "var(--accent)";
  };

  // Lifecycle
  onMount(async () => {
    // Watch for currency changes
    $effect(() => {
      if ($currentCurrency !== store.currentCurrency) {
        store.changeCurrency($currentCurrency);
      }
    });

    // Initial load
    await store.loadDashboard();
  });
</script>

<svelte:head>
  <title>{$t("dashboard.title")} - Expense Tracker</title>
</svelte:head>

<main class="dashboard">
  <!-- Header with Period Filter -->
  <DashboardHeader
    title={$t("dashboard.title")}
    {periods}
    selectedPeriod={store.selectedPeriodType}
    periodOffset={store.periodOffset}
    loading={store.loading}
    customDateRangeLabel={store.customStartDate && store.customEndDate
      ? getCustomDateRangeLabel()
      : undefined}
    navigationOptions={store.navigationOptions}
    currentPeriodLabel={getCurrentPeriodLabel()}
    onPeriodChange={handlePeriodChange}
    onPeriodNavigation={handlePeriodNavigation}
  />

  <!-- Period Info Banner -->
  <div class="period-info">
    <div class="current-period">
      <span class="period-label">{getCurrentPeriodLabel()}</span>
      {#if store.comparison && store.selectedPeriodType === 'month'}
        <span class="comparison-badge">
          {store.comparison.percentageChange >= 0 ? '📈' : '📉'}
          {Math.abs(store.comparison.percentageChange).toFixed(1)}% vs mes anterior
        </span>
      {/if}
    </div>
    {#if !store.loading && store.metrics && !store.hasDataInCurrentPeriod()}
      <div class="data-status">
        <span class="no-data-badge">Sin datos en este período</span>
        {#if store.availablePeriods.length > 0}
          <span class="hint">Mostrando: {store.availablePeriods[0].label}</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Simple Spending Summary -->
  <SpendingIndicator
    income={metricsData.income}
    expenses={metricsData.expenses}
  />

  <!-- Main Metrics Grid -->
  <MetricsGrid
    metrics={metricsData}
    trends={trendsData}
    expenseDistribution={store.expenseDistribution}
    loading={store.loading}
    labels={{
      income: $t("dashboard.metrics.income"),
      expenses: $t("dashboard.metrics.expenses"),
      investments: $t("dashboard.metrics.investments"),
      balance: $t("dashboard.metrics.balance"),
      savedPercentage: $t("dashboard.metrics.saved_percentage", {
        percentage: "{percentage}"
      })
    }}
    formatCurrency={store.formatCurrency}
    formatTrend={formatTrendValue}
    {getTrendColor}
  />

  <!-- Category Breakdown -->
  <CategoriesSection
    title={$t("dashboard.categories.title")}
    categories={categoriesData}
    formatCurrency={store.formatCurrency}
  />

  <!-- Financial Line Chart -->
  <ChartSection
    title={$t("dashboard.charts.temporal_evolution")}
    subtitle={$t("dashboard.charts.temporal_evolution_subtitle")}
    data={store.monthlyTrendData}
    height={280}
    period={store.selectedPeriodType}
    loading={store.loading}
  />

  <!-- Bar Charts Section -->
  <FinancialBarCharts
    data={store.monthlyBarData}
    height={250}
    period={store.selectedPeriodType}
    loading={store.loading}
  />
</main>

<!-- Date Range Picker Modal -->
<DateRangePicker
  bind:isOpen={showDateRangePicker}
  startDate={store.customStartDate}
  endDate={store.customEndDate}
  on:apply={handleCustomDateRange}
/>

<style>
  /* Dashboard Layout */
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: var(--surface);
  }

  /* Period Info Banner */
  .period-info {
    background: linear-gradient(135deg, var(--surface-elevated) 0%, var(--surface) 100%);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin: 1rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .current-period {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .period-label {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .comparison-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 2rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .data-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .no-data-badge {
    padding: 0.375rem 0.875rem;
    background: var(--warning-bg, rgba(255, 193, 7, 0.1));
    color: var(--warning, #FFC107);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .hint {
    font-size: 0.875rem;
    color: var(--text-tertiary, var(--text-secondary));
    opacity: 0.8;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }
  }
</style>