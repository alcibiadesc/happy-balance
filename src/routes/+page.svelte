<script lang="ts">
  import { onMount } from 'svelte';
  import { Calendar, TrendingUp, TrendingDown, Wallet, PiggyBank, CalendarRange } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { apiTransactions, apiCategories, apiTransactionStats } from '$lib/stores/api-transactions';
  import SpendingIndicator from '$lib/components/molecules/SpendingIndicator.svelte';
  import ExpensesCard from '$lib/components/molecules/ExpensesCard.svelte';
  import FinancialChart from '$lib/components/molecules/FinancialChart.svelte';
  import FinancialBarCharts from '$lib/components/molecules/FinancialBarCharts.svelte';
  import DateRangePicker from '$lib/components/molecules/DateRangePicker.svelte';

  // API Configuration
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
  
  // Period options - using i18n
  let periods = $derived([
    { value: 'week', label: $t('dashboard.periods.week') },
    { value: 'month', label: $t('dashboard.periods.month') },
    { value: 'quarter', label: $t('dashboard.periods.quarter') },
    { value: 'year', label: $t('dashboard.periods.year') },
    { value: 'custom', label: $t('dashboard.periods.custom'), icon: CalendarRange }
  ]);

  let selectedPeriod = $state('month');
  let periodOffset = $state(0);
  let customStartDate = $state('');
  let customEndDate = $state('');
  let showDateRangePicker = $state(false);
  let loading = $state(false);
  let dashboardData = $state<any>(null);
  let realData = $state({
    monthlyTrend: [] as any[],
    monthlyBarData: [] as any[],
    categories: [] as any[]
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
        savingsRate: 0
      };
    }

    console.log('Processing filteredMetrics with dashboardData.summary:', dashboardData.summary);

    const income = Math.abs(dashboardData.summary.totalIncome?._amount || 0);
    const expenses = Math.abs(dashboardData.summary.totalExpenses?._amount || 0) + Math.abs(dashboardData.summary.totalDebtPayments?._amount || 0);
    const investments = Math.abs(dashboardData.summary.totalInvestments?._amount || 0);
    const balance = dashboardData.summary.balance?._amount || 0;
    const spendingRate = dashboardData.spendingRate || 0;
    const savingsRate = spendingRate ? (100 - spendingRate) : 0;

    console.log('Calculated metrics:', { income, expenses, investments, balance, spendingRate, savingsRate });

    return {
      income,
      expenses,
      investments,
      balance,
      spendingRate,
      savingsRate
    };
  });

  // Calculate trends from historical data
  let trends = $derived(realData.monthlyTrend.length >= 2 ? {
    income: calculateTrendPercentage(realData.monthlyTrend, 'income'),
    expenses: calculateTrendPercentage(realData.monthlyTrend, 'expenses'),
    investments: calculateTrendPercentage(realData.monthlyTrend, 'balance')
  } : {
    income: 0,
    expenses: 0,
    investments: 0
  });
  
  // Load data based on period from API
  async function loadData(period: string, offset: number = 0, startDate?: string, endDate?: string) {
    loading = true;
    try {
      let url = `${API_BASE}/metrics/dashboard?currency=${$currentCurrency}`;

      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else if (period !== 'custom') {
        url += `&period=${period}&periodOffset=${offset}`;
      }

      console.log('Fetching dashboard data from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        console.log('Dashboard API response:', result);
        if (result.success && result.data) {
          dashboardData = result.data;
          console.log('Dashboard data set:', dashboardData);

          // Transform trends data for charts

          if (result.data.monthlyTrend && result.data.monthlyTrend.length > 0) {
            // Use the monthlyTrend data from the new unified API
            realData.monthlyTrend = result.data.monthlyTrend.map((trend: any) => ({
              month: trend.month,
              income: trend.income || 0,
              expenses: trend.expenses || 0,
              balance: trend.balance || 0
            }));

            // Use monthlyBarData directly from API if available, otherwise calculate
            if (result.data.monthlyBarData && result.data.monthlyBarData.length > 0) {
              realData.monthlyBarData = result.data.monthlyBarData;
            } else {
              // Fallback: calculate from expense distribution ratios
              const essentialRatio = result.data.expenseDistribution?.essentialPercentage
                ? result.data.expenseDistribution.essentialPercentage / 100
                : 0.5;
              const discretionaryRatio = result.data.expenseDistribution?.discretionaryPercentage
                ? result.data.expenseDistribution.discretionaryPercentage / 100
                : 0.33;
              const debtPaymentRatio = result.data.expenseDistribution?.debtPaymentPercentage
                ? result.data.expenseDistribution.debtPaymentPercentage / 100
                : 0.17;

              realData.monthlyBarData = result.data.monthlyTrend.map((trend: any) => ({
                month: trend.month,
                income: trend.income || 0,
                essentialExpenses: (trend.expenses || 0) * essentialRatio,
                discretionaryExpenses: (trend.expenses || 0) * discretionaryRatio,
                debtPayments: 0,
                investments: 0
              }));
            }
            console.log('Charts data - monthlyTrend:', realData.monthlyTrend);
            console.log('Charts data - monthlyBarData:', realData.monthlyBarData);

          } else {
            // Use summary data as fallback
            const currentPeriodLabel = result.data.summary?.period?.label || 'Current';
            realData.monthlyTrend = [{
              month: currentPeriodLabel,
              income: result.data.summary?.totalIncome?._amount || 0,
              expenses: result.data.summary?.totalExpenses?._amount || 0,
              balance: result.data.summary?.balance?._amount || 0
            }];

            const essentialRatio = result.data.expenseDistribution?.essentialPercentage
              ? result.data.expenseDistribution.essentialPercentage / 100
              : 0.5;
            const discretionaryRatio = result.data.expenseDistribution?.discretionaryPercentage
              ? result.data.expenseDistribution.discretionaryPercentage / 100
              : 0.33;
            const debtPaymentRatio = result.data.expenseDistribution?.debtPaymentPercentage
              ? result.data.expenseDistribution.debtPaymentPercentage / 100
              : 0.17;

            realData.monthlyBarData = [{
              month: currentPeriodLabel,
              income: result.data.summary?.totalIncome?._amount || 0,
              essentialExpenses: (result.data.summary?.totalExpenses?._amount || 0) * essentialRatio,
              discretionaryExpenses: (result.data.summary?.totalExpenses?._amount || 0) * discretionaryRatio,
              debtPayments: result.data.summary?.totalDebtPayments?._amount || 0,
              investments: result.data.summary?.totalInvestments?._amount || 0
            }];
          }

          // Transform category breakdown for the categories section
          if (result.data.categoryBreakdown && result.data.categoryBreakdown.length > 0) {
            const totalExpenses = result.data.summary?.totalExpenses?._amount || 1;
            realData.categories = result.data.categoryBreakdown.map((cat: any) => ({
              name: cat.categoryName || cat.category || 'Unknown',
              amount: cat.amount?._amount || 0,
              percentage: cat.percentage || ((cat.amount?._amount || 0) / totalExpenses * 100).toFixed(1)
            }));
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
      console.error('Error loading dashboard data:', error);
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
    if (period === 'custom') {
      showDateRangePicker = true;
    } else {
      selectedPeriod = period;
      periodOffset = 0;
      customStartDate = '';
      customEndDate = '';
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
    selectedPeriod = 'custom';
    loading = true;
    try {
      await loadData('custom', 0, startDate, endDate);
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
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
  
  function getTrendColor(value: number, type: string): string {
    if (type === 'expenses') {
      // For expenses, negative is good
      return value <= 0 ? 'var(--success)' : 'var(--accent)';
    }
    // For income and investments, positive is good
    return value >= 0 ? 'var(--success)' : 'var(--accent)';
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
    return $t('dashboard.periods.custom');
  }

  // Generate navigation options based on selected period
  function getPeriodNavigationOptions() {
    const now = new Date();
    const options = [];

    switch (selectedPeriod) {
      case 'week':
        // Generate last 12 weeks
        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          options.push({
            offset: i,
            label: i === 0 ? 'Esta semana' : `S${i + 1}`,
            fullLabel: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
          });
        }
        break;

      case 'month':
        // Generate last 12 months
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

          options.push({
            offset: i,
            label: i === 0 ? 'Este mes' : monthName,
            fullLabel: monthName
          });
        }
        break;

      case 'quarter':
        // Generate last 8 quarters
        for (let i = 0; i < 8; i++) {
          const quarterDate = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
          const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
          const year = quarterDate.getFullYear();

          options.push({
            offset: i,
            label: i === 0 ? 'Este trimestre' : `Q${quarter} ${year}`,
            fullLabel: `Q${quarter} ${year}`
          });
        }
        break;

      case 'year':
        // Generate last 5 years
        for (let i = 0; i < 5; i++) {
          const year = now.getFullYear() - i;

          options.push({
            offset: i,
            label: i === 0 ? 'Este año' : year.toString(),
            fullLabel: year.toString()
          });
        }
        break;
    }

    return options;
  }

  // Get current period label
  function getCurrentPeriodLabel() {
    const options = getPeriodNavigationOptions();
    const current = options.find(opt => opt.offset === periodOffset);
    return current?.fullLabel || options[0]?.fullLabel || '';
  }
</script>

<svelte:head>
  <title>{$t('dashboard.title')} - Expense Tracker</title>
</svelte:head>

<main class="dashboard">
  <!-- Header with Period Filter -->
  <header class="dashboard-header">
    <div class="header-top">
      <h1 class="dashboard-title">{$t('dashboard.title')}</h1>
      
      <!-- Period Selector -->
      <div class="period-selector">
        {#each periods as period}
          <button
            class="period-button"
            class:active={selectedPeriod === period.value}
            class:loading={loading && selectedPeriod === period.value}
            disabled={loading}
            onclick={() => handlePeriodChange(period.value)}
          >
            {#if loading && selectedPeriod === period.value}
              <div class="button-spinner"></div>
            {:else if period.icon}
              <svelte:component this={period.icon} size={16} />
            {/if}
            <span>
              {period.value === 'custom' && customStartDate && customEndDate ? getCustomDateRangeLabel() : period.label}
            </span>
          </button>
        {/each}
      </div>

      <!-- Period Navigation -->
      {#if selectedPeriod !== 'custom'}
        <div class="period-navigation">
          <div class="period-selector-dropdown">
            <select
              bind:value={periodOffset}
              onchange={() => handlePeriodNavigation(periodOffset)}
              disabled={loading}
              class="period-select"
            >
              {#each getPeriodNavigationOptions() as option}
                <option value={option.offset}>{option.label}</option>
              {/each}
            </select>
          </div>

          <div class="period-nav-buttons">
            <button
              class="nav-button"
              onclick={() => handlePeriodNavigation(periodOffset + 1)}
              disabled={loading}
              title="Período anterior"
            >
              ←
            </button>
            <span class="current-period-label">{getCurrentPeriodLabel()}</span>
            <button
              class="nav-button"
              onclick={() => handlePeriodNavigation(Math.max(0, periodOffset - 1))}
              disabled={loading || periodOffset === 0}
              title="Período siguiente"
            >
              →
            </button>
          </div>
        </div>
      {/if}
    </div>
  </header>
  
    <!-- Simple Spending Summary -->
    <SpendingIndicator
      income={filteredMetrics().income}
      expenses={filteredMetrics().expenses}
    />
    
    <!-- Main Metrics Grid -->
    <section class="metrics-section">
      <div class="metrics-grid">
        <!-- Income Card -->
        <article class="metric-card">
          <div class="metric-header">
            <div class="metric-icon income">
              <TrendingUp size={18} strokeWidth={2} />
            </div>
            <span class="metric-label">{$t('dashboard.metrics.income')}</span>
          </div>
          <div class="metric-body">
            <div class="metric-value">
              {#if loading}
                <div class="metric-skeleton"></div>
              {:else}
                {formatCurrencyAmount(filteredMetrics().income)}
              {/if}
            </div>
            {#if !loading}
              <div
                class="metric-trend"
                style="color: {getTrendColor(trends.income, 'income')}"
              >
                {formatTrend(trends.income)}
              </div>
            {/if}
          </div>
        </article>
        
        <!-- Expenses Card with Breakdown -->
        <ExpensesCard
          totalExpenses={filteredMetrics().expenses}
          essentialExpenses={Math.abs(dashboardData?.expenseDistribution?.essential?._amount || filteredMetrics().expenses * 0.5)}
          discretionaryExpenses={Math.abs(dashboardData?.expenseDistribution?.discretionary?._amount || filteredMetrics().expenses * 0.33)}
          debtPayments={Math.abs(dashboardData?.expenseDistribution?.debtPayments?._amount || filteredMetrics().expenses * 0.17)}
          trend={trends.expenses}
          {loading}
          formatCurrency={formatCurrencyAmount}
          {formatTrend}
          {getTrendColor}
        />
        
        <!-- Investments Card -->
        <article class="metric-card">
          <div class="metric-header">
            <div class="metric-icon investments">
              <PiggyBank size={18} strokeWidth={2} />
            </div>
            <span class="metric-label">{$t('dashboard.metrics.investments')}</span>
          </div>
          <div class="metric-body">
            <div class="metric-value">
              {#if loading}
                <div class="metric-skeleton"></div>
              {:else}
                {formatCurrencyAmount(filteredMetrics().investments)}
              {/if}
            </div>
            {#if !loading}
              <div
                class="metric-trend"
                style="color: {getTrendColor(trends.investments, 'investments')}"
              >
                {formatTrend(trends.investments)}
              </div>
            {/if}
          </div>
        </article>
        
        <!-- Balance Card -->
        <article class="metric-card">
          <div class="metric-header">
            <div class="metric-icon balance">
              <Wallet size={18} strokeWidth={2} />
            </div>
            <span class="metric-label">{$t('dashboard.metrics.balance')}</span>
          </div>
          <div class="metric-body">
            <div class="metric-value">
              {#if loading}
                <div class="metric-skeleton"></div>
              {:else}
                {formatCurrencyAmount(filteredMetrics().balance)}
              {/if}
            </div>
            {#if !loading}
              <div class="metric-subtext">
                {@html $t('dashboard.metrics.saved_percentage', { percentage: filteredMetrics().savingsRate.toFixed(1) })}
              </div>
            {/if}
          </div>
        </article>
      </div>
    </section>

    <!-- Category Breakdown - FIRST -->
    <section class="categories-section">
      <h2 class="section-title">{$t('dashboard.categories.title')}</h2>
      <div class="categories-grid">
        {#each realData.categories as category}
          <div class="category-card">
            <div class="category-header">
              <div class="category-info">
                <span class="category-icon" style="background-color: {category.color}20; color: {category.color}">
                  {category.icon || '📊'}
                </span>
                <span class="category-name">{category.name}</span>
              </div>
              <span class="category-amount">{formatCurrencyAmount(category.amount)}</span>
            </div>
            <div class="category-bar">
              <div
                class="category-progress"
                style="width: {category.percentage}%; background-color: {category.color}"
              ></div>
            </div>
            <span class="category-percentage">{category.percentage}%</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Financial Line Chart - SECOND -->
    <section class="chart-section">
      <h2 class="section-title">{$t('dashboard.charts.temporal_evolution')}</h2>
      <p class="chart-subtitle">{$t('dashboard.charts.temporal_evolution_subtitle')}</p>
      <div class="chart-wrapper">
        <FinancialChart
          data={realData.monthlyTrend}
          height={280}
          period={selectedPeriod}
          loading={loading}
        />
      </div>
    </section>

    <!-- Bar Charts Section - THIRD (with grouped bars, not stacked) -->
    <FinancialBarCharts
      data={realData.monthlyBarData}
      height={250}
      period={selectedPeriod}
      loading={loading}
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
  
  /* Header */
  .dashboard-header {
    margin-bottom: 2rem;
  }
  
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .dashboard-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.025em;
  }
  
  /* Period Selector */
  .period-selector {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: var(--surface-elevated);
    border-radius: 10px;
  }
  
  .period-button {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .period-button span {
    white-space: nowrap;
  }
  
  .period-button:hover:not(.active):not(:disabled) {
    background: var(--surface-muted);
  }
  
  .period-button.active {
    background: var(--primary);
    color: white !important;
  }
  
  .period-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .period-button.loading {
    pointer-events: none;
  }

  .button-spinner {
    width: 14px;
    height: 14px;
    border: 1.5px solid currentColor;
    border-top: 1.5px solid transparent;
    border-radius: 50%;
    animation: button-spin 1s linear infinite;
  }

  @keyframes button-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Period Navigation */
  .period-navigation {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--surface-muted);
    border-radius: 8px;
    border: 1px solid var(--border-color, transparent);
  }

  .period-selector-dropdown {
    flex: 1;
    max-width: 200px;
  }

  .period-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .period-select:hover:not(:disabled) {
    border-color: var(--primary);
  }

  .period-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .period-nav-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-button {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .nav-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .current-period-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    min-width: 120px;
    text-align: center;
  }

  /* Metrics Section */
  .metrics-section {
    margin-bottom: 2rem;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  /* Metric Card */
  .metric-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, transparent);
  }
  
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .metric-icon.income {
    background: rgba(122, 186, 165, 0.1);
    color: var(--success);
  }
  
  .metric-icon.investments {
    background: rgba(2, 60, 70, 0.1);
    color: var(--primary);
  }
  
  
  .metric-icon.balance {
    background: rgba(254, 205, 44, 0.1);
    color: var(--warning);
  }
  
  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .metric-body {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  
  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.025em;
  }
  
  .metric-trend {
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .metric-subtext {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .metric-skeleton {
    width: 80%;
    height: 1.5rem;
    background: linear-gradient(90deg, var(--surface-muted) 25%, var(--surface-elevated) 50%, var(--surface-muted) 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeleton-loading 1.5s infinite;
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Chart Section */
  .chart-section {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, transparent);
  }
  
  .chart-wrapper {
    margin-top: 1rem;
  }
  
  .chart-subtitle {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0.25rem 0 1rem 0;
    line-height: 1.4;
  }
  
  /* Categories Section */
  .categories-section {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, transparent);
  }
  
  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .category-card {
    background: var(--surface);
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid var(--border-color, transparent);
    transition: all 0.2s ease;
  }
  
  .category-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-icon {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .category-name {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
  }
  
  .category-amount {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .category-bar {
    height: 4px;
    background: var(--surface-muted);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .category-progress {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    transition: width 0.6s ease;
  }
  
  .category-percentage {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  
  
  /* Responsive */
  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }
    
    .header-top {
      flex-direction: column;
      align-items: stretch;
    }
    
    .dashboard-title {
      font-size: 1.5rem;
    }
    
    .period-selector {
      width: 100%;
      justify-content: center;
    }
    
    .period-button {
      flex: none;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
    }

    .period-navigation {
      flex-direction: column;
      gap: 0.75rem;
    }

    .period-selector-dropdown {
      max-width: none;
      width: 100%;
    }

    .current-period-label {
      min-width: auto;
      font-size: 0.8125rem;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .categories-grid {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 480px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }
    
    .metric-value {
      font-size: 1.25rem;
    }
  }
</style>
