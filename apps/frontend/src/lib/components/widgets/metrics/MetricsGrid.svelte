<script lang="ts">
  import { X, GripVertical, Maximize2, Minimize2 } from 'lucide-svelte';
  import MetricCard from '$lib/components/atoms/MetricCard.svelte';
  import ExpensesCard from './ExpensesCard.svelte';
  import PortfolioCard from './PortfolioCard.svelte';
  import ProfitCard from './ProfitCard.svelte';
  import { dashboardConfig, type MetricType } from '$lib/stores/dashboardConfig';
  import { getMetricIcon } from '$lib/config/dashboardSections';

  interface FilteredMetrics {
    income: number;
    expenses: number;
    investments: number;
    balance: number;
    savingsRate: number;
    portfolio?: number;
    portfolioProfit?: number;
    portfolioProfitPercentage?: number;
  }

  interface Trends {
    income: number;
    expenses: number;
    investments: number;
  }

  interface Props {
    metrics: FilteredMetrics;
    trends: Trends;
    expenseDistribution?: any;
    categoryBreakdown?: any[];
    loading?: boolean;
    labels: {
      income: string;
      expenses: string;
      investments: string;
      balance: string;
      savedPercentage: string;
      portfolio?: string;
    };
    formatCurrency: (amount: number) => string;
    formatTrend: (value: number) => string;
    getTrendColor: (value: number, type: string) => string;
  }

  const {
    metrics,
    trends,
    expenseDistribution: _expenseDistribution,
    categoryBreakdown: _categoryBreakdown = [],
    loading = false,
    labels,
    formatCurrency,
    formatTrend,
    getTrendColor,
  }: Props = $props();

  // Drag state
  let draggedId = $state<MetricType | null>(null);
  let dragOverId = $state<MetricType | null>(null);

  // Get visible and sorted metrics from config with size info
  const visibleMetrics = $derived(
    [...$dashboardConfig.metrics]
      .filter((m) => m.visible)
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ id: m.id, size: m.size || 'normal' }))
  );

  function handleDragStart(e: DragEvent, id: MetricType) {
    if (!$dashboardConfig.editMode) return;
    draggedId = id;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('metric', id);
  }

  function handleDragEnd() {
    draggedId = null;
    dragOverId = null;
  }

  function handleDragOver(e: DragEvent, id: MetricType) {
    if (!$dashboardConfig.editMode) return;
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      dragOverId = id;
    }
  }

  function handleDragLeave() {
    dragOverId = null;
  }

  function handleDrop(e: DragEvent, toId: MetricType) {
    e.preventDefault();
    const fromId = e.dataTransfer!.getData('metric') as MetricType;
    if (fromId && fromId !== toId) {
      dashboardConfig.reorderMetrics(fromId, toId);
    }
    draggedId = null;
    dragOverId = null;
  }

  function handleHide(id: MetricType) {
    dashboardConfig.hideMetric(id);
  }

  function handleToggleSize(id: MetricType) {
    dashboardConfig.toggleMetricSize(id);
  }
</script>

<section class="metrics-section">
  <div class="metrics-grid" class:edit-mode={$dashboardConfig.editMode}>
    {#each visibleMetrics as metric (metric.id)}
      <div
        class="metric-wrapper"
        class:dragging={draggedId === metric.id}
        class:drag-over={dragOverId === metric.id}
        class:edit-mode={$dashboardConfig.editMode}
        class:large={metric.size === 'large'}
        draggable={$dashboardConfig.editMode}
        ondragstart={(e) => handleDragStart(e, metric.id)}
        ondragend={handleDragEnd}
        ondragover={(e) => handleDragOver(e, metric.id)}
        ondragleave={handleDragLeave}
        ondrop={(e) => handleDrop(e, metric.id)}
        role={$dashboardConfig.editMode ? 'listitem' : undefined}
      >
        {#if $dashboardConfig.editMode}
          <div class="metric-controls">
            <button class="drag-handle" aria-label="Arrastrar">
              <GripVertical size={14} />
            </button>
            <button
              class="size-btn"
              onclick={() => handleToggleSize(metric.id)}
              aria-label={metric.size === 'large' ? 'Reducir' : 'Expandir'}
            >
              {#if metric.size === 'large'}
                <Minimize2 size={12} />
              {:else}
                <Maximize2 size={12} />
              {/if}
            </button>
            <button class="hide-btn" onclick={() => handleHide(metric.id)} aria-label="Ocultar">
              <X size={12} />
            </button>
          </div>
        {/if}

        {#if metric.id === 'income'}
          <MetricCard
            icon={getMetricIcon('income')}
            iconClass="income"
            label={labels.income}
            value={formatCurrency(metrics.income)}
            {loading}
            trend={formatTrend(trends.income)}
            trendColor={getTrendColor(trends.income, 'income')}
          />
        {:else if metric.id === 'expenses'}
          <ExpensesCard
            value={formatCurrency(metrics.expenses)}
            trend={formatTrend(trends.expenses)}
            trendColor={getTrendColor(trends.expenses, 'expenses')}
            {loading}
          />
        {:else if metric.id === 'investments'}
          <MetricCard
            icon={getMetricIcon('investments')}
            iconClass="investments"
            label={labels.investments}
            value={formatCurrency(metrics.investments)}
            {loading}
            trend={formatTrend(trends.investments)}
            trendColor={getTrendColor(trends.investments, 'investments')}
          />
        {:else if metric.id === 'balance'}
          <MetricCard
            icon={getMetricIcon('balance')}
            iconClass="balance"
            label={labels.balance}
            value={formatCurrency(metrics.balance)}
            {loading}
            subtext={labels.savedPercentage.replace('{percentage}', metrics.savingsRate.toFixed(1))}
          />
        {:else if metric.id === 'portfolio'}
          <PortfolioCard
            value={formatCurrency(metrics.portfolio ?? 0)}
            profit={metrics.portfolioProfit ?? 0}
            profitPercentage={metrics.portfolioProfitPercentage ?? 0}
            {loading}
          />
        {:else if metric.id === 'profit'}
          <ProfitCard
            value={formatCurrency(metrics.portfolioProfit ?? 0)}
            profitPercentage={metrics.portfolioProfitPercentage ?? 0}
            {loading}
          />
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .metrics-section {
    /* gap controlled by parent */
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .metrics-grid.edit-mode {
    gap: 1.25rem;
  }

  .metric-wrapper {
    position: relative;
    transition: all 0.2s ease;
    border-radius: 12px;
  }

  .metric-wrapper.edit-mode {
    border: 2px dashed transparent;
    padding: 2px;
    margin: -2px;
  }

  .metric-wrapper.edit-mode:hover {
    border-color: var(--primary);
  }

  .metric-wrapper.dragging {
    opacity: 0.4;
    transform: scale(0.98);
  }

  .metric-wrapper.drag-over {
    border-color: var(--success);
    background: var(--success-alpha, rgba(34, 197, 94, 0.08));
  }

  .metric-wrapper.large {
    grid-column: span 2;
  }

  .metric-controls {
    position: absolute;
    top: -8px;
    right: -8px;
    display: flex;
    gap: 2px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .metric-wrapper.edit-mode:hover .metric-controls {
    opacity: 1;
  }

  .drag-handle,
  .hide-btn,
  .size-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .drag-handle {
    background: var(--surface-elevated);
    color: var(--text-muted);
    cursor: grab;
  }

  .drag-handle:hover {
    background: var(--primary);
    color: white;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .size-btn {
    background: var(--surface-elevated);
    color: var(--text-muted);
  }

  .size-btn:hover {
    background: var(--primary);
    color: white;
  }

  .hide-btn {
    background: var(--surface-elevated);
    color: var(--text-muted);
  }

  .hide-btn:hover {
    background: var(--accent);
    color: white;
  }

  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .metrics-grid.edit-mode {
      gap: 1rem;
    }
  }

  @media (max-width: 480px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .metric-wrapper.large {
      grid-column: span 2;
    }

    .metric-controls {
      top: -4px;
      right: -4px;
    }

    .drag-handle,
    .hide-btn,
    .size-btn {
      width: 20px;
      height: 20px;
    }
  }

  @media (max-width: 360px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.375rem;
    }

    .metrics-grid.edit-mode {
      gap: 0.5rem;
    }

    .metric-wrapper {
      border-radius: 10px;
    }

    .metric-wrapper.large {
      grid-column: span 2;
    }

    .metric-controls {
      top: -2px;
      right: -2px;
      gap: 1px;
    }

    .drag-handle,
    .hide-btn,
    .size-btn {
      width: 18px;
      height: 18px;
      border-radius: 4px;
    }
  }
</style>
