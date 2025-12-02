<script lang="ts">
  import { TrendingUp, TrendingDown, Target, Wallet } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  type PeriodType = 'overview' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

  interface Props {
    income: number;
    expenses: number;
    investments: number;
    savingsRate: number;
    periodType?: PeriodType;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
  }

  const {
    income,
    expenses,
    investments,
    savingsRate,
    periodType = 'month',
    loading = false,
    formatCurrency,
  }: Props = $props();

  // Savings = Income - Expenses (investments are where you put savings, not expenses)
  const savings = $derived(income - expenses);
  const targetSavingsRate = 20; // 20% is a common savings target
  const progressPercentage = $derived(
    Math.max(0, Math.min((savingsRate / targetSavingsRate) * 100, 100))
  );
  const isOnTrack = $derived(savingsRate >= targetSavingsRate);

  // Calculate days based on period type
  function getPeriodDays(period: PeriodType): number {
    switch (period) {
      case 'overview':
      case 'year':
        return 365;
      case 'quarter':
        return 90;
      case 'week':
        return 7;
      case 'month':
      default:
        return 30;
    }
  }

  const dailyAverage = $derived(expenses / getPeriodDays(periodType));
</script>

<div class="savings-card" class:loading>
  <div class="card-header">
    <div class="header-icon" class:success={isOnTrack} class:warning={!isOnTrack}>
      <Target size={20} />
    </div>
    <div class="header-text">
      <h3>{$t('dashboard.savings.title') || 'Ahorro'}</h3>
      <span class="subtitle">{$t('dashboard.savings.target') || 'Meta: 20% de ingresos'}</span>
    </div>
  </div>

  <div class="savings-amount">
    <span class="amount" class:positive={savings >= 0} class:negative={savings < 0}>
      {formatCurrency(savings)}
    </span>
    <div class="rate-badge" class:success={isOnTrack} class:warning={!isOnTrack}>
      {#if isOnTrack}
        <TrendingUp size={14} />
      {:else}
        <TrendingDown size={14} />
      {/if}
      <span>{savingsRate.toFixed(1)}%</span>
    </div>
  </div>

  <div class="progress-container">
    <div class="progress-bar">
      <div
        class="progress-fill"
        class:success={isOnTrack}
        class:warning={!isOnTrack && savingsRate >= 10}
        class:danger={savingsRate < 10}
        style="width: {progressPercentage}%"
      ></div>
    </div>
    <div class="progress-labels">
      <span>0%</span>
      <span class="target-label">{targetSavingsRate}%</span>
      <span>+</span>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat">
      <Wallet size={14} />
      <span class="stat-label">{$t('dashboard.savings.daily_avg') || 'Gasto diario'}</span>
      <span class="stat-value">{formatCurrency(dailyAverage)}</span>
    </div>
  </div>
</div>

<style>
  .savings-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .savings-card.loading {
    opacity: 0.6;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--surface-muted);
    color: var(--text-muted);
  }

  .header-icon.success {
    background: var(--success-alpha, rgba(34, 197, 94, 0.1));
    color: var(--success);
  }

  .header-icon.warning {
    background: var(--warning-alpha, rgba(234, 179, 8, 0.1));
    color: var(--warning, #eab308);
  }

  .header-text h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .savings-amount {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .amount {
    font-size: 1.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .amount.positive {
    color: var(--success);
  }

  .amount.negative {
    color: var(--accent);
  }

  .rate-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .rate-badge.success {
    background: var(--success-alpha, rgba(34, 197, 94, 0.1));
    color: var(--success);
  }

  .rate-badge.warning {
    background: var(--warning-alpha, rgba(234, 179, 8, 0.1));
    color: var(--warning, #eab308);
  }

  .progress-container {
    margin-bottom: 1rem;
  }

  .progress-bar {
    height: 8px;
    background: var(--surface-muted);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .progress-fill.success {
    background: var(--success);
  }

  .progress-fill.warning {
    background: var(--warning, #eab308);
  }

  .progress-fill.danger {
    background: var(--accent);
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.25rem;
    font-size: 0.625rem;
    color: var(--text-muted);
  }

  .target-label {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .stats-row {
    display: flex;
    gap: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .stat-value {
    color: var(--text-primary);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 480px) {
    .savings-card {
      padding: 1rem;
    }

    .amount {
      font-size: 1.5rem;
    }
  }
</style>
