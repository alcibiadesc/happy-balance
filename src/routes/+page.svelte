<script lang="ts">
  import { onMount } from "svelte";
  import {
    Calendar,
    TrendingUp,
    TrendingDown,
    Wallet,
    PiggyBank,
    CalendarRange,
  } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";
  import { currentCurrency, formatCurrency } from "$lib/stores/currency";
  import {
    apiTransactions,
    apiCategories,
    apiTransactionStats,
  } from "$lib/stores/api-transactions";
  import SpendingIndicator from "$lib/components/molecules/SpendingIndicator.svelte";
  import FinancialBarCharts from "$lib/components/molecules/FinancialBarCharts.svelte";
  import DateRangePicker from "$lib/components/molecules/DateRangePicker.svelte";
  import DashboardHeader from "$lib/components/organisms/DashboardHeader.svelte";
  import CategoriesSection from "$lib/components/organisms/CategoriesSection.svelte";
  import ChartSection from "$lib/components/organisms/ChartSection.svelte";
  import MetricsGrid from "$lib/components/molecules/MetricsGrid.svelte";

  // API Configuration
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3004/api";

  // Period options - using i18n
  let periods = $derived([
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

  let selectedPeriod = $state("month");
  let periodOffset = $state(0);
  let customStartDate = $state("");
  let customEndDate = $state("");
  let showDateRangePicker = $state(false);
  let loading = $state(false);
  let dashboardData = $state<any>(null);
  let realData = $state({
    monthlyTrend: [] as any[],
    monthlyBarData: [] as any[],
    categories: [] as any[],
  });

  // Calculate filtered metrics from dashboard data
  let filteredMetrics = $derived(() => {
    if (!dashboardData?.summary) {
      return {
        income: 0,
        expenses: 0,
        investments: 0,
        balance: 0,
        spendingRate: 0,
        savingsRate: 0,
      };
    }

    const income = dashboardData.summary.totalIncome?._amount || 0;
    const expenses =
      (dashboardData.summary.totalExpenses?._amount || 0) +
      (dashboardData.summary.totalDebtPayments?._amount || 0);
    const investments = dashboardData.summary.totalInvestments?._amount || 0;
    const balance = dashboardData.summary.balance?._amount || 0;
    const spendingRate = dashboardData.spendingRate || 0;
    const savingsRate = spendingRate ? 100 - spendingRate : 0;

    return {
      income,
      expenses,
      investments,
      balance,
      spendingRate,
      savingsRate,
    };
  });

  // Calculate trends from historical data
  let trends = $derived(
    realData.monthlyTrend.length >= 2
      ? {
          income: calculateTrendPercentage(realData.monthlyTrend, "income"),
          expenses: calculateTrendPercentage(realData.monthlyTrend, "expenses"),
          investments: calculateTrendPercentage(
            realData.monthlyTrend,
            "balance",
          ),
        }
      : {
          income: 0,
          expenses: 0,
          investments: 0,
        },
  );

  // Load data based on period from API
  async function loadData(
    period: string,
    offset: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    loading = true;
    try {
      let url = `${API_BASE}/metrics/dashboard?currency=${$currentCurrency}`;

      if (period === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else if (period !== "custom") {
        url += `&period=${period}&periodOffset=${offset}`;
      }

      console.log("Fetching dashboard data from:", url);
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        console.log("Dashboard API response:", result);
        if (result.success && result.data) {
          dashboardData = result.data;
          console.log("Dashboard data set:", dashboardData);

          // Transform trends data for charts

          if (result.data.monthlyTrend && result.data.monthlyTrend.length > 0) {
            // Use the monthlyTrend data from the new unified API
            realData.monthlyTrend = result.data.monthlyTrend.map(
              (trend: any) => ({
                month: trend.month,
                income: trend.income || 0,
                expenses: trend.expenses || 0,
                balance: trend.balance || 0,
              }),
            );

            // Use monthlyBarData directly from API if available, otherwise calculate
            if (
              result.data.monthlyBarData &&
              result.data.monthlyBarData.length > 0
            ) {
              realData.monthlyBarData = result.data.monthlyBarData;
            } else {
              // Fallback: calculate from expense distribution ratios
              const essentialRatio = result.data.expenseDistribution
                ?.essentialPercentage
                ? result.data.expenseDistribution.essentialPercentage / 100
                : 0.5;
              const discretionaryRatio = result.data.expenseDistribution
                ?.discretionaryPercentage
                ? result.data.expenseDistribution.discretionaryPercentage / 100
                : 0.33;
              const debtPaymentRatio = result.data.expenseDistribution
                ?.debtPaymentPercentage
                ? result.data.expenseDistribution.debtPaymentPercentage / 100
                : 0.17;

              realData.monthlyBarData = result.data.monthlyTrend.map(
                (trend: any) => ({
                  month: trend.month,
                  income: trend.income || 0,
                  essentialExpenses: (trend.expenses || 0) * essentialRatio,
                  discretionaryExpenses:
                    (trend.expenses || 0) * discretionaryRatio,
                  debtPayments: 0,
                  investments: 0,
                }),
              );
            }
            console.log("Charts data - monthlyTrend:", realData.monthlyTrend);
            console.log(
              "Charts data - monthlyBarData:",
              realData.monthlyBarData,
            );
          } else {
            // Use summary data as fallback
            const currentPeriodLabel =
              result.data.summary?.period?.label || "Current";
            realData.monthlyTrend = [
              {
                month: currentPeriodLabel,
                income: result.data.summary?.totalIncome?._amount || 0,
                expenses: result.data.summary?.totalExpenses?._amount || 0,
                balance: result.data.summary?.balance?._amount || 0,
              },
            ];

            const essentialRatio = result.data.expenseDistribution
              ?.essentialPercentage
              ? result.data.expenseDistribution.essentialPercentage / 100
              : 0.5;
            const discretionaryRatio = result.data.expenseDistribution
              ?.discretionaryPercentage
              ? result.data.expenseDistribution.discretionaryPercentage / 100
              : 0.33;
            const debtPaymentRatio = result.data.expenseDistribution
              ?.debtPaymentPercentage
              ? result.data.expenseDistribution.debtPaymentPercentage / 100
              : 0.17;

            realData.monthlyBarData = [
              {
                month: currentPeriodLabel,
                income: result.data.summary?.totalIncome?._amount || 0,
                essentialExpenses:
                  (result.data.summary?.totalExpenses?._amount || 0) *
                  essentialRatio,
                discretionaryExpenses:
                  (result.data.summary?.totalExpenses?._amount || 0) *
                  discretionaryRatio,
                debtPayments:
                  result.data.summary?.totalDebtPayments?._amount || 0,
                investments:
                  result.data.summary?.totalInvestments?._amount || 0,
              },
            ];
          }

          // Transform category breakdown for the categories section
          if (
            result.data.categoryBreakdown &&
            result.data.categoryBreakdown.length > 0
          ) {
            const totalExpenses =
              result.data.summary?.totalExpenses?._amount || 1;
            realData.categories = result.data.categoryBreakdown.map(
              (cat: any) => ({
                name: cat.categoryName || cat.category || "Unknown",
                amount: cat.amount?._amount || 0,
                percentage:
                  cat.percentage ||
                  (((cat.amount?._amount || 0) / totalExpenses) * 100).toFixed(
                    1,
                  ),
              }),
            );
          } else {
            // No categories from DB - use empty array
            realData.categories = [];
          }
        }
      } else {
        // Clear data if API fails
        clearData();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Clear data on error
      clearData();
    } finally {
      loading = false;
    }
  }

  // Clear all data
  function clearData() {
    realData.monthlyTrend = [];
    realData.monthlyBarData = [];
    realData.categories = [];
  }

  async function handlePeriodChange(period: string) {
    if (period === "custom") {
      showDateRangePicker = true;
    } else {
      selectedPeriod = period;
      periodOffset = 0;
      customStartDate = "";
      customEndDate = "";
      loading = true;
      try {
        await loadData(period, 0);
      } finally {
        loading = false;
      }
    }
  }

  async function handlePeriodNavigation(offset: number) {
    periodOffset = offset;
    loading = true;
    try {
      await loadData(selectedPeriod, offset);
    } finally {
      loading = false;
    }
  }

  async function handleCustomDateRange(event: CustomEvent) {
    const { startDate, endDate } = event.detail;
    customStartDate = startDate;
    customEndDate = endDate;
    selectedPeriod = "custom";
    loading = true;
    try {
      await loadData("custom", 0, startDate, endDate);
    } finally {
      loading = false;
    }
  }

  // Calculate trend percentage between latest and previous period
  function calculateTrendPercentage(data: any[], field: string): number {
    if (data.length < 2) return 0;

    const current = data[data.length - 1][field] || 0;
    const previous = data[data.length - 2][field] || 0;

    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Use the global currency formatter
  function formatCurrencyAmount(amount: number): string {
    return formatCurrency(amount, $currentCurrency);
  }

  function formatTrend(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  }

  function getTrendColor(value: number, type: string): string {
    if (type === "expenses") {
      // For expenses, negative is good
      return value <= 0 ? "var(--success)" : "var(--accent)";
    }
    // For income and investments, positive is good
    return value >= 0 ? "var(--success)" : "var(--accent)";
  }

  onMount(async () => {
    // Load dashboard data with selected filters
    await loadData(selectedPeriod, periodOffset);
  });

  // Format custom date range for display
  function getCustomDateRangeLabel(): string {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString();
      const end = new Date(customEndDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return $t("dashboard.periods.custom");
  }

  // Generate navigation options based on selected period
  function getPeriodNavigationOptions() {
    const now = new Date();
    const options = [];

    switch (selectedPeriod) {
      case "week":
        // Generate last 12 weeks
        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() - i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          options.push({
            offset: i,
            label: i === 0 ? "Esta semana" : `S${i + 1}`,
            fullLabel: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
          });
        }
        break;

      case "month":
        // Generate last 12 months
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = monthDate.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          });

          options.push({
            offset: i,
            label: i === 0 ? "Este mes" : monthName,
            fullLabel: monthName,
          });
        }
        break;

      case "quarter":
        // Generate last 8 quarters
        for (let i = 0; i < 8; i++) {
          const quarterDate = new Date(
            now.getFullYear(),
            now.getMonth() - i * 3,
            1,
          );
          const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
          const year = quarterDate.getFullYear();

          options.push({
            offset: i,
            label: i === 0 ? "Este trimestre" : `Q${quarter} ${year}`,
            fullLabel: `Q${quarter} ${year}`,
          });
        }
        break;

      case "year":
        // Generate last 5 years
        for (let i = 0; i < 5; i++) {
          const year = now.getFullYear() - i;

          options.push({
            offset: i,
            label: i === 0 ? "Este año" : year.toString(),
            fullLabel: year.toString(),
          });
        }
        break;
    }

    return options;
  }

  // Get current period label
  function getCurrentPeriodLabel() {
    const options = getPeriodNavigationOptions();
    const current = options.find((opt) => opt.offset === periodOffset);
    return current?.fullLabel || options[0]?.fullLabel || "";
  }
</script>

<svelte:head>
  <title>{$t("dashboard.title")} - Expense Tracker</title>
</svelte:head>

<main class="dashboard">
  <!-- Header with Period Filter -->
  <DashboardHeader
    title={$t("dashboard.title")}
    {periods}
    {selectedPeriod}
    {periodOffset}
    {loading}
    customDateRangeLabel={customStartDate && customEndDate
      ? getCustomDateRangeLabel()
      : undefined}
    navigationOptions={getPeriodNavigationOptions()}
    currentPeriodLabel={getCurrentPeriodLabel()}
    onPeriodChange={handlePeriodChange}
    onPeriodNavigation={handlePeriodNavigation}
  />

  <!-- Simple Spending Summary -->
  <SpendingIndicator
    income={filteredMetrics().income}
    expenses={filteredMetrics().expenses}
  />

  <!-- Main Metrics Grid -->
  <MetricsGrid
    metrics={filteredMetrics()}
    {trends}
    expenseDistribution={dashboardData?.expenseDistribution}
    {loading}
    labels={{
      income: $t("dashboard.metrics.income"),
      expenses: $t("dashboard.metrics.expenses"),
      investments: $t("dashboard.metrics.investments"),
      balance: $t("dashboard.metrics.balance"),
      savedPercentage: $t("dashboard.metrics.saved_percentage", { percentage: "{percentage}" })
    }}
    formatCurrency={formatCurrencyAmount}
    {formatTrend}
    {getTrendColor}
  />

  <!-- Category Breakdown - FIRST -->
  <CategoriesSection
    title={$t("dashboard.categories.title")}
    categories={realData.categories}
    formatCurrency={formatCurrencyAmount}
  />

  <!-- Financial Line Chart - SECOND -->
  <ChartSection
    title={$t("dashboard.charts.temporal_evolution")}
    subtitle={$t("dashboard.charts.temporal_evolution_subtitle")}
    data={realData.monthlyTrend}
    height={280}
    period={selectedPeriod}
    {loading}
  />

  <!-- Bar Charts Section - THIRD (with grouped bars, not stacked) -->
  <FinancialBarCharts
    data={realData.monthlyBarData}
    height={250}
    period={selectedPeriod}
    {loading}
  />
</main>

<!-- Date Range Picker Modal -->
<DateRangePicker
  bind:isOpen={showDateRangePicker}
  startDate={customStartDate}
  endDate={customEndDate}
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


  /* Responsive */
  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }
  }
</style>
