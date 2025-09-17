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
  
  // Get current stats from store
  let currentStats = $derived($apiTransactionStats);
  
  // Calculate trends (simplified for now - can be enhanced later)
  let trends = $derived({
    income: 7.1, // Mock data - will be calculated from historical data
    expenses: 9.1,
    investments: 25.0
  });
  
  // Calculate savings rate
  let savingsRate = $derived(
    currentStats.income > 0 ? ((currentStats.balance) / currentStats.income * 100) : 0
  );
  
  // Load data based on period from API
  async function loadData(period: string, startDate?: string, endDate?: string) {
    loading = true;
    try {
      let url = `${API_BASE}/transactions/dashboard?currency=${$currentCurrency}`;

      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else if (period !== 'custom') {
        url += `&period=${period}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          dashboardData = result.data;

          // Transform trends data for charts

          if (result.data.trends && result.data.trends.length > 0) {
            // Filter out empty trends (all zeros)
            const nonEmptyTrends = result.data.trends.filter((trend: any) =>
              (trend.income?._amount || 0) > 0 ||
              (trend.expenses?._amount || 0) > 0 ||
              (trend.investments?._amount || 0) > 0
            );

            // If we have non-empty trends, use them
            if (nonEmptyTrends.length > 0) {
              realData.monthlyTrend = nonEmptyTrends.map((trend: any) => ({
                month: trend.period,
                income: trend.income?._amount || 0,
                expenses: Math.abs(trend.expenses?._amount || 0),
                balance: trend.balance?._amount || 0
              }));
            } else {
              // If all trends are empty, use summary data as a single point
              const currentPeriodLabel = result.data.summary?.period?.label || 'Current';
              realData.monthlyTrend = [{
                month: currentPeriodLabel,
                income: result.data.summary?.totalIncome?._amount || 0,
                expenses: Math.abs(result.data.summary?.totalExpenses?._amount || 0),
                balance: result.data.summary?.balance?._amount || 0
              }];
            }


            // For bar data
            const essentialRatio = result.data.expenseDistribution?.essentialPercentage
              ? result.data.expenseDistribution.essentialPercentage / 100
              : 0.5;
            const discretionaryRatio = result.data.expenseDistribution?.discretionaryPercentage
              ? result.data.expenseDistribution.discretionaryPercentage / 100
              : 0.33;
            const debtPaymentRatio = result.data.expenseDistribution?.debtPaymentPercentage
              ? result.data.expenseDistribution.debtPaymentPercentage / 100
              : 0.17;

            // Use the same approach for bar data
            if (nonEmptyTrends && nonEmptyTrends.length > 0) {
              realData.monthlyBarData = nonEmptyTrends.map((trend: any) => ({
                month: trend.period,
                income: trend.income?._amount || 0,
                essentialExpenses: Math.abs(trend.expenses?._amount || 0) * essentialRatio,
                discretionaryExpenses: Math.abs(trend.expenses?._amount || 0) * discretionaryRatio,
                debtPayments: Math.abs(trend.debtPayments?._amount || 0),
                investments: Math.abs(trend.investments?._amount || 0)
              }));
            } else {
              // Use summary data
              const currentPeriodLabel = result.data.summary?.period?.label || 'Current';
              realData.monthlyBarData = [{
                month: currentPeriodLabel,
                income: result.data.summary?.totalIncome?._amount || 0,
                essentialExpenses: Math.abs(result.data.summary?.totalExpenses?._amount || 0) * essentialRatio,
                discretionaryExpenses: Math.abs(result.data.summary?.totalExpenses?._amount || 0) * discretionaryRatio,
                debtPayments: Math.abs(result.data.summary?.totalDebtPayments?._amount || 0),
                investments: Math.abs(result.data.summary?.totalInvestments?._amount || 0)
              }];
            }

          } else {
            // Use summary data as fallback
            const currentPeriodLabel = result.data.summary?.period?.label || 'Current';
            realData.monthlyTrend = [{
              month: currentPeriodLabel,
              income: result.data.summary?.totalIncome?._amount || 0,
              expenses: Math.abs(result.data.summary?.totalExpenses?._amount || 0),
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
              essentialExpenses: Math.abs(result.data.summary?.totalExpenses?._amount || 0) * essentialRatio,
              discretionaryExpenses: Math.abs(result.data.summary?.totalExpenses?._amount || 0) * discretionaryRatio,
              debtPayments: Math.abs(result.data.summary?.totalDebtPayments?._amount || 0),
              investments: Math.abs(result.data.summary?.totalInvestments?._amount || 0)
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
            // Use mock categories if none from DB
            realData.categories = generatePeriodData([], period).categories;
          }
        }
      } else {
        // Fallback to mock data if API fails
        generateMockData(period);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data
      generateMockData(period);
    } finally {
      loading = false;
    }
  }

  // Generate mock data as fallback
  function generateMockData(period: string) {
    const mockData = generatePeriodData([], period);
    realData.monthlyTrend = mockData.monthlyTrend;
    realData.monthlyBarData = mockData.monthlyBarData;
    realData.categories = mockData.categories;
  }
  
  // Generate period-based data from transactions
  function generatePeriodData(allTransactions: any[], period: string) {
    // Calculate category breakdown from actual categories and transactions
    const categoryBreakdown = calculateCategoryBreakdown();

    return {
      monthlyTrend: [
        { month: 'Ene', income: 2800, expenses: 1600, balance: 1200 },
        { month: 'Feb', income: 2900, expenses: 1750, balance: 1150 },
        { month: 'Mar', income: 3000, expenses: 1650, balance: 1350 },
        { month: 'Abr', income: 3100, expenses: 1900, balance: 1200 },
        { month: 'May', income: 2950, expenses: 1700, balance: 1250 },
        { month: 'Jun', income: 3000, expenses: 1800, balance: 1200 }
      ],
      monthlyBarData: [
        { month: 'Ene', income: 2800, essentialExpenses: 1070, discretionaryExpenses: 530, debtPayments: 200, investments: 400 },
        { month: 'Feb', income: 2900, essentialExpenses: 1170, discretionaryExpenses: 580, debtPayments: 220, investments: 420 },
        { month: 'Mar', income: 3000, essentialExpenses: 1100, discretionaryExpenses: 550, debtPayments: 250, investments: 450 },
        { month: 'Abr', income: 3100, essentialExpenses: 1270, discretionaryExpenses: 630, debtPayments: 180, investments: 480 },
        { month: 'May', income: 2950, essentialExpenses: 1140, discretionaryExpenses: 560, debtPayments: 210, investments: 460 },
        { month: 'Jun', income: 3000, essentialExpenses: 1200, discretionaryExpenses: 600, debtPayments: 200, investments: 500 }
      ],
      categories: categoryBreakdown
    };
  }

  // Calculate category breakdown from actual data
  function calculateCategoryBreakdown() {
    const transactions = $apiTransactions;
    const categories = $apiCategories;

    // Group transactions by category
    const categoryTotals = new Map();
    let totalAmount = 0;

    // Initialize all categories with 0
    categories.forEach(cat => {
      categoryTotals.set(cat.id, {
        name: cat.name,
        icon: cat.icon,
        amount: 0,
        type: cat.type,
        color: cat.color
      });
    });

    // Calculate totals per category
    transactions.forEach(transaction => {
      if (transaction.categoryId && categoryTotals.has(transaction.categoryId)) {
        const amount = Math.abs(transaction.amount);
        categoryTotals.get(transaction.categoryId).amount += amount;
        totalAmount += amount;
      }
    });

    // Convert to array and calculate percentages
    const categoryBreakdown = Array.from(categoryTotals.values())
      .filter(cat => cat.amount > 0) // Only show categories with transactions
      .map(cat => ({
        name: cat.name,
        icon: cat.icon,
        amount: cat.amount,
        percentage: totalAmount > 0 ? (cat.amount / totalAmount * 100).toFixed(1) : 0,
        type: cat.type,
        color: cat.color
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    // If no categories with data, return default categories
    if (categoryBreakdown.length === 0) {
      return categories.slice(0, 6).map(cat => ({
        name: cat.name,
        icon: cat.icon,
        amount: Math.random() * 500 + 100, // Mock amount
        percentage: 16.67,
        type: cat.type,
        color: cat.color
      }));
    }

    return categoryBreakdown;
  }
  
  async function handlePeriodChange(period: string) {
    if (period === 'custom') {
      showDateRangePicker = true;
    } else {
      selectedPeriod = period;
      customStartDate = '';
      customEndDate = '';
      await loadData(period);
    }
  }

  async function handleCustomDateRange(event: CustomEvent) {
    const { startDate, endDate } = event.detail;
    customStartDate = startDate;
    customEndDate = endDate;
    selectedPeriod = 'custom';
    await loadData('custom', startDate, endDate);
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
    // Load transactions and categories from API
    await apiTransactions.load();
    await apiCategories.load();
    await loadData(selectedPeriod);
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
            onclick={() => handlePeriodChange(period.value)}
          >
            {#if period.icon}
              <svelte:component this={period.icon} size={16} />
            {/if}
            <span>
              {period.value === 'custom' && customStartDate && customEndDate ? getCustomDateRangeLabel() : period.label}
            </span>
          </button>
        {/each}
      </div>
    </div>
  </header>
  
    <!-- Simple Spending Summary -->
    <SpendingIndicator 
      income={currentStats.income} 
      expenses={currentStats.expenses} 
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
            <div class="metric-value">{formatCurrencyAmount(Math.abs(dashboardData?.summary?.totalIncome?._amount || currentStats.income))}</div>
            <div 
              class="metric-trend"
              style="color: {getTrendColor(trends.income, 'income')}"
            >
              {formatTrend(trends.income)}
            </div>
          </div>
        </article>
        
        <!-- Expenses Card with Breakdown -->
        <ExpensesCard
          totalExpenses={Math.abs(
            (dashboardData?.summary?.totalExpenses?._amount || 0) +
            (dashboardData?.summary?.totalDebtPayments?._amount || 0) ||
            currentStats.expenses
          )}
          essentialExpenses={Math.abs(dashboardData?.expenseDistribution?.essential?._amount || currentStats.expenses * 0.5)}
          discretionaryExpenses={Math.abs(dashboardData?.expenseDistribution?.discretionary?._amount || currentStats.expenses * 0.33)}
          debtPayments={Math.abs(dashboardData?.expenseDistribution?.debtPayments?._amount || currentStats.expenses * 0.17)}
          trend={trends.expenses}
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
            <div class="metric-value">{formatCurrencyAmount(Math.abs(dashboardData?.summary?.totalInvestments?._amount || currentStats.investments || 0))}</div>
            <div 
              class="metric-trend"
              style="color: {getTrendColor(trends.investments, 'investments')}"
            >
              {formatTrend(trends.investments)}
            </div>
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
            <div class="metric-value">{formatCurrencyAmount(dashboardData?.summary?.balance?._amount || currentStats.balance)}</div>
            <div class="metric-subtext">
              {@html $t('dashboard.metrics.saved_percentage', { percentage: (dashboardData?.spendingRate ? (100 - dashboardData.spendingRate).toFixed(1) : savingsRate.toFixed(1)) })}
            </div>
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
        />
      </div>
    </section>

    <!-- Bar Charts Section - THIRD (with grouped bars, not stacked) -->
    <FinancialBarCharts
      data={realData.monthlyBarData}
      height={250}
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
