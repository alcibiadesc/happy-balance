<script lang="ts">
  import { dashboardConfig } from '$lib/stores/dashboardConfig';
  import { t } from '$lib/stores/i18n';
  import EditableSection from '$lib/components/molecules/EditableSection.svelte';

  // Widget Components - imported from centralized widgets folder
  import {
    SpendingIndicator,
    MetricsGrid,
    CategoriesSection,
    ChartSection,
    FinancialBarCharts,
    SavingsGoalCard,
    TopMerchantsCard,
    FireIndicator,
  } from '$lib/components/widgets';

  import { formatTrendValue, getTrendColor } from '$lib/utils/format';

  interface DashboardData {
    metrics: {
      income: number;
      expenses: number;
      investments: number;
      balance: number;
      spendingRate: number;
      savingsRate: number;
      portfolio?: number;
      portfolioProfit?: number;
      portfolioProfitPercentage?: number;
    };
    trends: {
      income: number;
      expenses: number;
      investments: number;
    };
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
      color: string;
      icon?: string;
      monthlyBudget?: number;
      budgetUsage?: number;
    }>;
    categoryBreakdown: any[];
    expenseDistribution: any;
    monthlyTrendData: any[];
    monthlyBarData: any[];
    selectedPeriodType: string;
    loading: boolean;
    formatCurrency: (amount: number) => string;
  }

  interface Props {
    data: DashboardData;
  }

  const { data }: Props = $props();

  // Use actual portfolio value for FIRE calculation
  const totalInvestments = $derived(data.metrics.portfolio ?? 0);

  // Get visible sections sorted by order
  const visibleSections = $derived(
    [...$dashboardConfig.sections]
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id)
  );

  // Labels for metrics grid
  const metricsLabels = $derived({
    income: $t('dashboard.metrics.income'),
    expenses: $t('dashboard.metrics.expenses'),
    investments: $t('dashboard.metrics.investments'),
    balance: $t('dashboard.metrics.balance'),
    savedPercentage: $t('dashboard.metrics.saved_percentage', { percentage: '{percentage}' }),
  });
</script>

<div class="dashboard-sections">
  {#each visibleSections as sectionId (sectionId)}
    <EditableSection {sectionId}>
      {#if sectionId === 'spending'}
        <SpendingIndicator income={data.metrics.income} expenses={data.metrics.expenses} />
      {:else if sectionId === 'metrics'}
        <MetricsGrid
          metrics={data.metrics}
          trends={data.trends}
          expenseDistribution={data.expenseDistribution}
          categoryBreakdown={data.categoryBreakdown}
          loading={data.loading}
          labels={metricsLabels}
          formatCurrency={data.formatCurrency}
          formatTrend={formatTrendValue}
          {getTrendColor}
        />
      {:else if sectionId === 'categories'}
        <CategoriesSection
          title={$t('dashboard.categories.title')}
          categories={data.categories}
          categoryBreakdown={data.categoryBreakdown}
          expenseDistribution={data.expenseDistribution}
          totalExpenses={data.metrics.expenses}
          totalIncome={data.metrics.income}
          totalInvestments={data.metrics.investments}
          formatCurrency={data.formatCurrency}
        />
      {:else if sectionId === 'lineChart'}
        <ChartSection
          title={$t('dashboard.charts.temporal_evolution')}
          subtitle={$t('dashboard.charts.temporal_evolution_subtitle')}
          data={data.monthlyTrendData}
          height={280}
          period={data.selectedPeriodType}
          loading={data.loading}
        />
      {:else if sectionId === 'barChart'}
        <FinancialBarCharts
          data={data.monthlyBarData}
          height={250}
          period={data.selectedPeriodType}
          loading={data.loading}
        />
      {:else if sectionId === 'savingsGoal'}
        <SavingsGoalCard
          income={data.metrics.income}
          expenses={data.metrics.expenses}
          investments={data.metrics.investments}
          savingsRate={data.metrics.savingsRate}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
        />
      {:else if sectionId === 'topMerchants'}
        <TopMerchantsCard
          categories={data.categories}
          totalExpenses={data.metrics.expenses}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
        />
      {:else if sectionId === 'fireIndicator'}
        <FireIndicator
          periodIncome={data.metrics.income}
          periodExpenses={data.metrics.expenses}
          periodInvestments={data.metrics.investments}
          periodType={data.selectedPeriodType}
          {totalInvestments}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
        />
      {/if}
    </EditableSection>
  {/each}
</div>

<style>
  .dashboard-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>
