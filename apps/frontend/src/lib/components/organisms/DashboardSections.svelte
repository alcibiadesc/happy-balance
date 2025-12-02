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

  // Default colors for categories without assigned colors
  const defaultColors = [
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
  ];

  // Create a map from category name to color/icon using data.categories
  const categoryColorMap = $derived(() => {
    const map = new Map<string, { color: string; icon?: string }>();
    for (const cat of data.categories || []) {
      map.set(cat.name.toLowerCase(), { color: cat.color, icon: cat.icon });
    }
    return map;
  });

  // Helper to get color for a category
  function getCategoryColor(name: string, index: number): string {
    const map = categoryColorMap();
    const found = map.get(name.toLowerCase());
    return found?.color || defaultColors[index % defaultColors.length];
  }

  function getCategoryIcon(name: string): string | undefined {
    const map = categoryColorMap();
    const found = map.get(name.toLowerCase());
    return found?.icon;
  }

  // Filter only expense categories for Top Expenses widget (exclude investments and income)
  // CategoryType values: ESSENTIAL, DISCRETIONARY, DEBT_PAYMENT, INVESTMENT, INCOME
  const expenseOnlyCategories = $derived(() => {
    const breakdown = data.categoryBreakdown;
    if (!breakdown || breakdown.length === 0) {
      // Fallback: use categories, filter out investment/income
      return (
        data.categories?.filter((c: any) => {
          const type = (c.type || '').toUpperCase();
          return type !== 'INVESTMENT' && type !== 'INCOME';
        }) ?? []
      );
    }

    // Filter expense types (ESSENTIAL, DISCRETIONARY, DEBT_PAYMENT)
    const expenseTypes = [
      'ESSENTIAL',
      'DISCRETIONARY',
      'DEBT_PAYMENT',
      'essential',
      'discretionary',
      'debt_payment',
    ];
    return breakdown
      .filter((c: any) => {
        const type = c.type || c.categoryType || '';
        return expenseTypes.includes(type);
      })
      .map((c: any, index: number) => {
        const name = c.name || c.categoryName;
        return {
          name,
          amount: c.amount,
          percentage: c.percentage,
          color: c.color || getCategoryColor(name, index),
          icon: c.icon || getCategoryIcon(name),
        };
      });
  });

  // Filter income categories for Top Income widget
  const incomeOnlyCategories = $derived(() => {
    const breakdown = data.categoryBreakdown;
    if (!breakdown || breakdown.length === 0) {
      return (
        data.categories?.filter((c: any) => {
          const type = (c.type || '').toUpperCase();
          return type === 'INCOME';
        }) ?? []
      );
    }

    return breakdown
      .filter((c: any) => {
        const type = (c.type || c.categoryType || '').toUpperCase();
        return type === 'INCOME';
      })
      .map((c: any, index: number) => {
        const name = c.name || c.categoryName;
        return {
          name,
          amount: c.amount,
          percentage: c.percentage,
          color: c.color || getCategoryColor(name, index),
          icon: c.icon || getCategoryIcon(name),
        };
      });
  });

  // Filter investment categories for Top Investments widget
  const investmentOnlyCategories = $derived(() => {
    const breakdown = data.categoryBreakdown;
    if (!breakdown || breakdown.length === 0) {
      return (
        data.categories?.filter((c: any) => {
          const type = (c.type || '').toUpperCase();
          return type === 'INVESTMENT';
        }) ?? []
      );
    }

    return breakdown
      .filter((c: any) => {
        const type = (c.type || c.categoryType || '').toUpperCase();
        return type === 'INVESTMENT';
      })
      .map((c: any, index: number) => {
        const name = c.name || c.categoryName;
        return {
          name,
          amount: c.amount,
          percentage: c.percentage,
          color: c.color || getCategoryColor(name, index),
          icon: c.icon || getCategoryIcon(name),
        };
      });
  });

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
          periodType={data.selectedPeriodType}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
        />
      {:else if sectionId === 'topMerchants'}
        <TopMerchantsCard
          categories={expenseOnlyCategories()}
          total={data.metrics.expenses}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
          variant="expenses"
        />
      {:else if sectionId === 'topIncome'}
        <TopMerchantsCard
          categories={incomeOnlyCategories()}
          total={data.metrics.income}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
          variant="income"
        />
      {:else if sectionId === 'topInvestments'}
        <TopMerchantsCard
          categories={investmentOnlyCategories()}
          total={data.metrics.investments}
          loading={data.loading}
          formatCurrency={data.formatCurrency}
          variant="investments"
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
