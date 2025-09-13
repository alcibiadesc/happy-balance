<script lang="ts">
  import { onMount } from 'svelte';
  import { Calendar, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { transactions, categories, transactionStats } from '$lib/stores/transactions';
  import SpendingIndicator from '$lib/components/molecules/SpendingIndicator.svelte';
  import ExpensesCard from '$lib/components/molecules/ExpensesCard.svelte';
  import FinancialChart from '$lib/components/molecules/FinancialChart.svelte';
  import FinancialBarCharts from '$lib/components/molecules/FinancialBarCharts.svelte';
  
  // Period options - using i18n
  let periods = $derived([
    { value: 'week', label: $t('dashboard.periods.week') },
    { value: 'month', label: $t('dashboard.periods.month') },
    { value: 'quarter', label: $t('dashboard.periods.quarter') },
    { value: 'year', label: $t('dashboard.periods.year') }
  ]);
  
  let selectedPeriod = $state('month');
  let loading = $state(false);
  let realData = $state({
    monthlyTrend: [] as any[],
    monthlyBarData: [] as any[],
    categories: [] as any[]
  });
  
  // Get current stats from store
  let currentStats = $derived($transactionStats);
  
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
  
  // Load data based on period
  function loadData(period: string) {
      // Update data based on period (this would come from API)
      if (period === 'year') {
        data = {
          ...data,
          income: 36000,
          expenses: 21600,
          essentialExpenses: 14400,
          discretionaryExpenses: 7200,
          investments: 6000,
          balance: 8400,
          previousIncome: 34000,
          previousExpenses: 20400,
          previousInvestments: 4800,
          monthlyTrend: [
            { month: '2023', income: 34000, expenses: 20400, balance: 13600 },
            { month: '2024', income: 36000, expenses: 21600, balance: 14400 }
          ],
          monthlyBarData: [
            { month: '2023', income: 34000, essentialExpenses: 13600, discretionaryExpenses: 6800, investments: 4800 },
            { month: '2024', income: 36000, essentialExpenses: 14400, discretionaryExpenses: 7200, investments: 6000 }
          ]
        };
      } else if (period === 'quarter') {
        data = {
          ...data,
          income: 9000,
          expenses: 5400,
          essentialExpenses: 3600,
          discretionaryExpenses: 1800,
          investments: 1500,
          balance: 2100,
          previousIncome: 8400,
          previousExpenses: 4950,
          previousInvestments: 1200,
          monthlyTrend: [
            { month: 'Abr', income: 3100, expenses: 1900, balance: 1200 },
            { month: 'May', income: 2950, expenses: 1700, balance: 1250 },
            { month: 'Jun', income: 3000, expenses: 1800, balance: 1200 }
          ],
          monthlyBarData: [
            { month: 'Abr', income: 3100, essentialExpenses: 1270, discretionaryExpenses: 630, investments: 480 },
            { month: 'May', income: 2950, essentialExpenses: 1140, discretionaryExpenses: 560, investments: 460 },
            { month: 'Jun', income: 3000, essentialExpenses: 1200, discretionaryExpenses: 600, investments: 500 }
          ]
        };
      } else if (period === 'week') {
        data = {
          ...data,
          income: 750,
          expenses: 450,
          essentialExpenses: 300,
          discretionaryExpenses: 150,
          investments: 125,
          balance: 175,
          previousIncome: 700,
          previousExpenses: 412,
          previousInvestments: 100,
          categories: data.categories.map(c => ({ ...c, amount: Math.round(c.amount / 4) })),
          monthlyTrend: [
            { month: 'Lun', income: 150, expenses: 90, balance: 60 },
            { month: 'Mar', income: 150, expenses: 97, balance: 53 },
            { month: 'Mié', income: 150, expenses: 87, balance: 63 },
            { month: 'Jue', income: 150, expenses: 93, balance: 57 },
            { month: 'Vie', income: 150, expenses: 83, balance: 67 }
          ],
          monthlyBarData: [
            { month: 'Lun', income: 150, essentialExpenses: 60, discretionaryExpenses: 30, investments: 25 },
            { month: 'Mar', income: 150, essentialExpenses: 65, discretionaryExpenses: 32, investments: 25 },
            { month: 'Mié', income: 150, essentialExpenses: 58, discretionaryExpenses: 29, investments: 25 },
            { month: 'Jue', income: 150, essentialExpenses: 62, discretionaryExpenses: 31, investments: 25 },
            { month: 'Vie', income: 150, essentialExpenses: 55, discretionaryExpenses: 28, investments: 25 }
          ]
        };
      } else {
        // Default month data
        data = {
          ...data,
          income: 3000,
          expenses: 1800,
          essentialExpenses: 1200,
          discretionaryExpenses: 600,
          investments: 500,
          balance: 700,
          previousIncome: 2800,
          previousExpenses: 1650,
          previousInvestments: 400,
          monthlyTrend: [
            { month: 'Ene', income: 2800, expenses: 1600, balance: 1200 },
            { month: 'Feb', income: 2900, expenses: 1750, balance: 1150 },
            { month: 'Mar', income: 3000, expenses: 1650, balance: 1350 },
            { month: 'Abr', income: 3100, expenses: 1900, balance: 1200 },
            { month: 'May', income: 2950, expenses: 1700, balance: 1250 },
            { month: 'Jun', income: 3000, expenses: 1800, balance: 1200 }
          ],
          monthlyBarData: [
            { month: 'Ene', income: 2800, essentialExpenses: 1070, discretionaryExpenses: 530, investments: 400 },
            { month: 'Feb', income: 2900, essentialExpenses: 1170, discretionaryExpenses: 580, investments: 420 },
            { month: 'Mar', income: 3000, essentialExpenses: 1100, discretionaryExpenses: 550, investments: 450 },
            { month: 'Abr', income: 3100, essentialExpenses: 1270, discretionaryExpenses: 630, investments: 480 },
            { month: 'May', income: 2950, essentialExpenses: 1140, discretionaryExpenses: 560, investments: 460 },
            { month: 'Jun', income: 3000, essentialExpenses: 1200, discretionaryExpenses: 600, investments: 500 }
          ]
        };
      }
  }
  
  // Generate period-based data from transactions
  function generatePeriodData(allTransactions: any[], period: string) {
    // For now, return mock data - this will be enhanced with real transaction processing
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
        { month: 'Ene', income: 2800, essentialExpenses: 1070, discretionaryExpenses: 530, investments: 400 },
        { month: 'Feb', income: 2900, essentialExpenses: 1170, discretionaryExpenses: 580, investments: 420 },
        { month: 'Mar', income: 3000, essentialExpenses: 1100, discretionaryExpenses: 550, investments: 450 },
        { month: 'Abr', income: 3100, essentialExpenses: 1270, discretionaryExpenses: 630, investments: 480 },
        { month: 'May', income: 2950, essentialExpenses: 1140, discretionaryExpenses: 560, investments: 460 },
        { month: 'Jun', income: 3000, essentialExpenses: 1200, discretionaryExpenses: 600, investments: 500 }
      ],
      categories: [
        { name: $t('dashboard.categories.food'), amount: 450, percentage: 25 },
        { name: $t('dashboard.categories.transport'), amount: 280, percentage: 15.5 },
        { name: $t('dashboard.categories.utilities'), amount: 350, percentage: 19.4 },
        { name: $t('dashboard.categories.shopping'), amount: 320, percentage: 17.8 },
        { name: $t('dashboard.categories.entertainment'), amount: 200, percentage: 11.1 },
        { name: $t('dashboard.categories.health'), amount: 200, percentage: 11.1 }
      ]
    };
  }
  
  function handlePeriodChange(period: string) {
    selectedPeriod = period;
    loadData(period);
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
  
  onMount(() => {
    loadData(selectedPeriod);
  });
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
            {period.label}
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
            <div class="metric-value">{formatCurrencyAmount(currentStats.income)}</div>
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
          totalExpenses={currentStats.expenses}
          essentialExpenses={currentStats.expenses * 0.67}
          discretionaryExpenses={currentStats.expenses * 0.33}
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
            <div class="metric-value">{formatCurrencyAmount(500)}</div>
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
            <div class="metric-value">{formatCurrencyAmount(currentStats.balance)}</div>
            <div class="metric-subtext">
              {@html $t('dashboard.metrics.saved_percentage', { percentage: savingsRate.toFixed(1) })}
            </div>
          </div>
        </article>
      </div>
    </section>
    
    <!-- Financial Line Chart - FIRST -->
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
    
    <!-- Bar Charts Section - SECOND (with grouped bars, not stacked) -->
    <FinancialBarCharts 
      data={realData.monthlyBarData} 
      height={250}
    />
    
    <!-- Category Breakdown -->
    <section class="categories-section">
      <h2 class="section-title">{$t('dashboard.categories.title')}</h2>
      <div class="categories-grid">
        {#each realData.categories as category}
          <div class="category-card">
            <div class="category-header">
              <span class="category-name">{category.name}</span>
              <span class="category-amount">{formatCurrencyAmount(category.amount)}</span>
            </div>
            <div class="category-bar">
              <div 
                class="category-progress" 
                style="width: {category.percentage}%"
              ></div>
            </div>
            <span class="category-percentage">{category.percentage}%</span>
          </div>
        {/each}
      </div>
    </section>
</main>

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
      justify-content: space-between;
    }
    
    .period-button {
      flex: 1;
      padding: 0.5rem 0.5rem;
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
