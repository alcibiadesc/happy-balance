<script lang="ts">
  import { TrendingDown, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  
  interface Props {
    totalExpenses: number;
    essentialExpenses: number;
    discretionaryExpenses: number;
    debtPayments: number;
    trend: number;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
    formatTrend: (value: number) => string;
    getTrendColor: (value: number, type: string) => string;
  }

  let {
    totalExpenses,
    essentialExpenses,
    discretionaryExpenses,
    debtPayments,
    trend,
    loading = false,
    formatCurrency,
    formatTrend,
    getTrendColor
  }: Props = $props();
  
  let expanded = $state(false);
  
  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<article class="metric-card expenses-card">
  <div class="metric-header">
    <div class="metric-icon expenses">
      <TrendingDown size={18} strokeWidth={2} />
    </div>
    <span class="metric-label">{$t('dashboard.metrics.expenses')}</span>
    <button 
      class="expand-button" 
      onclick={toggleExpanded}
      aria-label={expanded ? "Contraer desglose" : "Ver desglose"}
    >
      {#if expanded}
        <ChevronUp size={16} />
      {:else}
        <ChevronDown size={16} />
      {/if}
    </button>
  </div>
  
  <div class="metric-body">
    <div class="metric-value">
      {#if loading}
        <div class="metric-skeleton"></div>
      {:else}
        {formatCurrency(totalExpenses)}
      {/if}
    </div>
    {#if !loading}
      <div
        class="metric-trend"
        style="color: {getTrendColor(trend, 'expenses')}"
      >
        {formatTrend(trend)}
      </div>
    {/if}
  </div>
  
  {#if expanded}
    <div class="expenses-breakdown">
      <div class="breakdown-item">
        <div class="breakdown-info">
          <span class="breakdown-label">{$t('dashboard.metrics.essential_expenses')}</span>
          <span class="breakdown-amount">{formatCurrency(essentialExpenses)}</span>
        </div>
        <div class="breakdown-percentage">
          {Math.round((essentialExpenses / totalExpenses) * 100)}%
        </div>
      </div>
      
      <div class="breakdown-item">
        <div class="breakdown-info">
          <span class="breakdown-label">{$t('dashboard.metrics.discretionary_expenses')}</span>
          <span class="breakdown-amount">{formatCurrency(discretionaryExpenses)}</span>
        </div>
        <div class="breakdown-percentage">
          {Math.round((discretionaryExpenses / totalExpenses) * 100)}%
        </div>
      </div>

      <div class="breakdown-item">
        <div class="breakdown-info">
          <span class="breakdown-label">{$t('dashboard.metrics.debt_payments')}</span>
          <span class="breakdown-amount">{formatCurrency(debtPayments)}</span>
        </div>
        <div class="breakdown-percentage">
          {Math.round((debtPayments / totalExpenses) * 100)}%
        </div>
      </div>
    </div>
  {/if}
</article>

<style>
  .expenses-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, transparent);
  }
  
  .expenses-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    position: relative;
  }
  
  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .metric-icon.expenses {
    background: rgba(245, 121, 108, 0.1);
    color: var(--accent);
  }
  
  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex: 1;
  }
  
  .expand-button {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .expand-button:hover {
    color: var(--text-primary);
    background: var(--surface-muted);
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
  
  .expenses-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .breakdown-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .breakdown-label {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .breakdown-amount {
    font-size: 0.9375rem;
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .breakdown-percentage {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    background: var(--surface-muted);
    border-radius: 12px;
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
</style>
