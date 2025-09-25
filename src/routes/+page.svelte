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
  import CleanPeriodNav from "$lib/components/molecules/CleanPeriodNav.svelte";

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

  const handlePeriodNavigation = async (relativeOffset: number) => {
    // relativeOffset is -1 for past, +1 for future
    await store.navigatePeriod(store.periodOffset + relativeOffset);
  };

  const handlePeriodTypeChange = async (type: string) => {
    await store.changePeriod(type as any);
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
    return store.getCurrentPeriodLabel();
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
  <!-- Simplified Header -->
  <div class="dashboard-header">
    <h1>{$t("dashboard.title")}</h1>
    <CleanPeriodNav
      currentPeriod={getCurrentPeriodLabel()}
      selectedPeriodType={store.selectedPeriodType}
      periodOffset={store.periodOffset}
      availablePeriods={store.availablePeriods}
      loading={store.loading}
      onNavigate={handlePeriodNavigation}
      onPeriodTypeChange={handlePeriodTypeChange}
    />
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

  /* Simplified Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    flex-shrink: 0;
  }


  /* Responsive */
  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }

    .dashboard-header {
      flex-direction: column;
      gap: 1.5rem;
      align-items: stretch;
    }

    .dashboard-header h1 {
      font-size: 1.25rem;
      text-align: center;
    }
  }
</style>