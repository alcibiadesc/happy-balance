<script lang="ts">
  import { dashboardConfig, type SectionType } from '$lib/stores/dashboardConfig';
  import { t } from '$lib/stores/i18n';
  import EditableSection from '$lib/components/molecules/EditableSection.svelte';

  // Section Components
  import SpendingIndicator from '$lib/components/molecules/SpendingIndicator.svelte';
  import MetricsGrid from '$lib/components/molecules/MetricsGrid.svelte';
  import CategoriesSection from '$lib/components/organisms/CategoriesSection.svelte';
  import ChartSection from '$lib/components/organisms/ChartSection.svelte';
  import FinancialBarCharts from '$lib/components/molecules/FinancialBarCharts.svelte';
  import SavingsGoalCard from '$lib/components/molecules/SavingsGoalCard.svelte';
  import TopMerchantsCard from '$lib/components/molecules/TopMerchantsCard.svelte';
  import FireIndicator from '$lib/components/molecules/FireIndicator.svelte';

  import { formatTrendValue, getTrendColor } from '$lib/utils/format';

  interface DashboardData {
    metrics: {
      income: number;
      expenses: number;
      investments: number;
      balance: number;
      spendingRate: number;
      savingsRate: number;
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

  let { data }: Props = $props();

  // Calculate cumulative investments from historical data for FIRE calculation
  const totalInvestments = $derived(
    data.monthlyTrendData.length > 0
      ? data.monthlyTrendData.reduce((sum, month) => sum + (month.investments || 0), 0)
      : data.metrics.investments * 12
  );

  // Get visible sections sorted by order
  const visibleSections = $derived(
    [...$dashboardConfig.sections]
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order)
      .map(s => s.id)
  );

  // Labels for metrics grid
  const metricsLabels = $derived({
    income: $t('dashboard.metrics.income'),
    expenses: $t('dashboard.metrics.expenses'),
    investments: $t('dashboard.metrics.investments'),
    balance: $t('dashboard.metrics.balance'),
    savedPercentage: $t('dashboard.metrics.saved_percentage', { percentage: '{percentage}' })
  });
</script>

{#each visibleSections as sectionId (sectionId)}
  <EditableSection {sectionId}>
    {#if sectionId === 'spending'}
      <SpendingIndicator
        income={data.metrics.income}
        expenses={data.metrics.expenses}
      />
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
        monthlyIncome={data.metrics.income}
        monthlyExpenses={data.metrics.expenses}
        monthlyInvestments={data.metrics.investments}
        {totalInvestments}
        loading={data.loading}
        formatCurrency={data.formatCurrency}
      />
    {/if}
  </EditableSection>
{/each}
