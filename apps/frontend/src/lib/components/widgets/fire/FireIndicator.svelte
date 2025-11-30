<script lang="ts">
  import { Infinity, Clock, Target, Percent } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface Props {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyInvestments: number;
    totalInvestments?: number;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
  }

  let {
    monthlyIncome,
    monthlyExpenses,
    monthlyInvestments,
    totalInvestments = 0,
    loading = false,
    formatCurrency,
  }: Props = $props();

  // Core calculations
  const annualExpenses = $derived(monthlyExpenses * 12);
  const monthlySavings = $derived(monthlyIncome - monthlyExpenses);
  const annualSavings = $derived(monthlySavings * 12);
  const fireNumber = $derived(annualExpenses * 25);
  const safeWithdrawal = $derived(totalInvestments * 0.04);
  const yearsOfRunway = $derived(annualExpenses > 0 ? totalInvestments / annualExpenses : 0);

  const yearsToFire = $derived(() => {
    if (annualSavings <= 0) return Infinity;
    const remaining = fireNumber - totalInvestments;
    if (remaining <= 0) return 0;
    return remaining / annualSavings;
  });

  const fireProgress = $derived(
    fireNumber > 0 ? Math.min((totalInvestments / fireNumber) * 100, 100) : 0
  );

  const savingsRate = $derived(monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0);

  const statusLevel = $derived(() => {
    if (fireProgress >= 100) return 'achieved';
    if (fireProgress >= 50) return 'good';
    if (fireProgress >= 25) return 'progress';
    return 'starting';
  });
</script>

<div class="fire-card" class:loading>
  <div class="card-header">
    <div class="header-icon">
      <Infinity size={20} strokeWidth={1.5} />
    </div>
    <div class="header-content">
      <h3>{$t('dashboard.fire.title') || 'Independencia Financiera'}</h3>
      <span class="subtitle">{$t('dashboard.fire.subtitle') || 'Regla del 4%'}</span>
    </div>
  </div>

  <div class="main-stat">
    <div class="fire-number">
      <span class="label">{$t('dashboard.fire.fire_number') || 'Objetivo'}</span>
      <span class="value">{formatCurrency(fireNumber)}</span>
    </div>
    <div class="progress-ring">
      <svg viewBox="0 0 36 36" class="circular-chart">
        <path
          class="circle-bg"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          class="circle"
          class:achieved={statusLevel() === 'achieved'}
          class:good={statusLevel() === 'good'}
          class:progress={statusLevel() === 'progress'}
          stroke-dasharray="{fireProgress}, 100"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <text x="18" y="20.35" class="percentage">{fireProgress.toFixed(0)}%</text>
      </svg>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-item">
      <Clock size={14} strokeWidth={1.5} />
      <div class="stat-content">
        <span class="stat-value">
          {#if yearsOfRunway >= 1}
            {yearsOfRunway.toFixed(1)}
          {:else}
            {(yearsOfRunway * 12).toFixed(0)}
          {/if}
        </span>
        <span class="stat-label">
          {yearsOfRunway >= 1
            ? $t('dashboard.fire.years') || 'años'
            : $t('dashboard.fire.months') || 'meses'}
        </span>
      </div>
    </div>

    <div class="stat-item">
      <Target size={14} strokeWidth={1.5} />
      <div class="stat-content">
        <span class="stat-value">
          {#if yearsToFire() === 0}
            -
          {:else if yearsToFire() > 99}
            99+
          {:else}
            {Math.ceil(yearsToFire())}
          {/if}
        </span>
        <span class="stat-label">{$t('dashboard.fire.years_to_fire') || 'años restantes'}</span>
      </div>
    </div>

    <div class="stat-item">
      <Percent size={14} strokeWidth={1.5} />
      <div class="stat-content">
        <span
          class="stat-value"
          class:positive={savingsRate >= 20}
          class:negative={savingsRate < 0}
        >
          {savingsRate.toFixed(0)}%
        </span>
        <span class="stat-label">{$t('dashboard.fire.savings_rate') || 'tasa ahorro'}</span>
      </div>
    </div>
  </div>

  <div class="card-footer">
    <span class="safe-withdrawal">
      {$t('dashboard.fire.safe_withdrawal') || 'Retiro seguro'}:
      <strong>{formatCurrency(safeWithdrawal / 12)}</strong>/mes
    </span>
  </div>
</div>

<style>
  .fire-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .fire-card.loading {
    opacity: 0.6;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--surface-muted);
    color: var(--text-secondary);
  }

  .header-content h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .main-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .fire-number .label {
    display: block;
    font-size: 0.6875rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .fire-number .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .progress-ring {
    width: 64px;
    height: 64px;
  }

  .circular-chart {
    display: block;
    max-width: 100%;
  }

  .circle-bg {
    fill: none;
    stroke: var(--surface-muted);
    stroke-width: 3;
  }

  .circle {
    fill: none;
    stroke: var(--text-muted);
    stroke-width: 3;
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dasharray 0.5s ease;
  }

  .circle.achieved {
    stroke: var(--success);
  }

  .circle.good {
    stroke: var(--primary);
  }

  .circle.progress {
    stroke: var(--text-secondary);
  }

  .percentage {
    fill: var(--text-primary);
    font-size: 0.5rem;
    font-weight: 600;
    text-anchor: middle;
    font-family: inherit;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem;
    background: var(--surface);
    border-radius: 8px;
    color: var(--text-muted);
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .stat-value {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .stat-value.positive {
    color: var(--success);
  }

  .stat-value.negative {
    color: var(--accent);
  }

  .stat-label {
    font-size: 0.625rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-footer {
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }

  .safe-withdrawal {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .safe-withdrawal strong {
    color: var(--text-primary);
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .fire-card {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .fire-number .value {
      font-size: 1.25rem;
    }

    .progress-ring {
      width: 56px;
      height: 56px;
    }
  }
</style>
