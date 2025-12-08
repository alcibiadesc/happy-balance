<script lang="ts">
  import { onMount } from 'svelte';
  import { Pencil, Check } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { currentCurrency } from '$lib/stores/currency';
  import { dashboardConfig } from '$lib/stores/dashboardConfig';

  // Layout Components
  import PageContainer from '$lib/components/atoms/PageContainer.svelte';
  import PageHeader from '$lib/components/molecules/PageHeader.svelte';

  // Components
  import CleanPeriodNav from '$lib/components/molecules/CleanPeriodNav.svelte';
  import DateRangePicker from '$lib/components/molecules/DateRangePicker.svelte';
  import HiddenItemsBar from '$lib/components/molecules/HiddenItemsBar.svelte';
  import DashboardSections from '$lib/components/organisms/DashboardSections.svelte';

  // Domain Store
  import { createEnhancedDashboardStore } from '$lib/modules/dashboard/presentation/stores/enhancedDashboardStore.svelte.ts';
  import { getApiUrl } from '$lib/utils/api-url';
  import { investmentsApi } from '$lib/modules/investments/infrastructure/api/investmentsApi';
  import type { PortfolioSummary } from '$lib/modules/investments/domain/entities/Investment';

  // Initialize store
  const store = createEnhancedDashboardStore(getApiUrl());

  // State
  let showDateRangePicker = $state(false);
  let portfolioSummary = $state<PortfolioSummary | null>(null);

  // Computed data for sections
  const dashboardData = $derived({
    metrics: {
      income: store.metrics?.getIncome().getValue() || 0,
      expenses: store.metrics?.getExpenses().getValue() || 0,
      investments: store.metrics?.getInvestments().getValue() || 0,
      balance: store.metrics?.getBalance().getValue() || 0,
      spendingRate: store.metrics?.getSpendingRate() || 0,
      savingsRate: store.metrics?.getSavingsRate() || 0,
      portfolio: portfolioSummary?.totalValue ?? 0,
      portfolioProfit: portfolioSummary?.totalProfit ?? 0,
      portfolioProfitPercentage: portfolioSummary?.profitPercentage ?? 0,
    },
    trends: {
      income: store.trends?.income.getPercentageChange() || 0,
      expenses: store.trends?.expenses.getPercentageChange() || 0,
      investments: store.trends?.investments.getPercentageChange() || 0,
    },
    categories: store.categories.map((cat) => ({
      name: cat.getName(),
      amount: cat.getAmount().getValue(),
      percentage: cat.getPercentage(),
      color: cat.getColor(),
      icon: cat.getIcon(),
      monthlyBudget: cat.getMonthlyBudget(),
      budgetUsage: cat.getBudgetUsage(),
    })),
    categoryBreakdown: store.categoryBreakdown,
    expenseDistribution: store.expenseDistribution,
    monthlyTrendData: store.monthlyTrendData,
    monthlyBarData: store.monthlyBarData,
    selectedPeriodType: store.selectedPeriodType,
    loading: store.loading,
    formatCurrency: store.formatCurrency,
  });

  // Event handlers
  async function handlePeriodNavigation(relativeOffset: number) {
    await store.navigatePeriod(store.periodOffset + relativeOffset);
  }

  async function handlePeriodTypeChange(type: string) {
    await store.changePeriod(type as any);
  }

  async function handleCustomDateRange(event: CustomEvent) {
    const { startDate, endDate } = event.detail;
    await store.setCustomDateRange(startDate, endDate);
  }

  // Load portfolio data
  async function loadPortfolio() {
    try {
      portfolioSummary = await investmentsApi.getPortfolioSummary();
    } catch (_error) {
      console.error('Failed to load portfolio summary:', _error);
    }
  }

  // Lifecycle
  onMount(async () => {
    $effect(() => {
      if ($currentCurrency !== store.currentCurrency) {
        store.changeCurrency($currentCurrency);
      }
    });

    await Promise.all([store.loadDashboard(), loadPortfolio()]);
  });
</script>

<svelte:head>
  <title>{$t('dashboard.title')} - Expense Tracker</title>
</svelte:head>

<PageContainer>
  <main class="dashboard" class:edit-mode={$dashboardConfig.editMode}>
    <PageHeader title={$t('dashboard.title')}>
      <CleanPeriodNav
        currentPeriod={store.getCurrentPeriodLabel()}
        selectedPeriodType={store.selectedPeriodType}
        periodOffset={store.periodOffset}
        availablePeriods={store.availablePeriods}
        loading={store.loading}
        onNavigate={handlePeriodNavigation}
        onPeriodTypeChange={handlePeriodTypeChange}
      />
      <button
        class="edit-btn"
        class:active={$dashboardConfig.editMode}
        onclick={() => dashboardConfig.toggleEditMode()}
        aria-label={$dashboardConfig.editMode ? $t('common.done') : $t('common.edit')}
      >
        {#if $dashboardConfig.editMode}
          <Check size={18} />
        {:else}
          <Pencil size={16} />
        {/if}
      </button>
    </PageHeader>

    {#if $dashboardConfig.editMode}
      <div class="edit-hint">
        {$t('dashboard.config.edit_hint')}
      </div>
    {/if}

    <DashboardSections data={dashboardData} />
  </main>
</PageContainer>

<!-- Floating UI -->
<HiddenItemsBar />

<DateRangePicker
  bind:isOpen={showDateRangePicker}
  startDate={store.customStartDate}
  endDate={store.customEndDate}
  on:apply={handleCustomDateRange}
/>

<style>
  .dashboard {
    transition: padding-bottom 0.2s ease;
  }

  .dashboard.edit-mode {
    padding-bottom: 5rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .edit-btn:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  .edit-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .edit-hint {
    text-align: center;
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    background: var(--primary-alpha, rgba(99, 102, 241, 0.08));
    border: 1px dashed var(--primary);
    border-radius: 8px;
    font-size: 0.8125rem;
    color: var(--primary);
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }

    .dashboard.edit-mode {
      padding-bottom: 6rem;
    }

    .dashboard-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .dashboard-header h1 {
      font-size: 1.25rem;
      text-align: center;
    }

    .header-actions {
      justify-content: center;
    }

    .edit-hint {
      font-size: 0.75rem;
      padding: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .dashboard {
      padding: 0.75rem;
    }

    .dashboard-header h1 {
      font-size: 1.125rem;
    }

    .edit-hint {
      font-size: 0.6875rem;
      padding: 0.375rem;
      margin-bottom: 1rem;
    }
  }

  @media (max-width: 360px) {
    .dashboard {
      padding: 0.5rem;
    }

    .dashboard-header h1 {
      font-size: 1rem;
    }

    .header-actions {
      gap: 0.25rem;
    }

    .edit-btn {
      width: 32px;
      height: 32px;
    }

    .edit-btn :global(svg) {
      width: 14px;
      height: 14px;
    }

    .edit-hint {
      font-size: 0.625rem;
      padding: 0.25rem;
      margin-bottom: 0.75rem;
      border-radius: 6px;
    }
  }
</style>
