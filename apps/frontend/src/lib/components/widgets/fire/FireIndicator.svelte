<script lang="ts">
  import { Infinity } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { widgetSettings } from '$lib/stores/widget-settings';
  import { onMount } from 'svelte';

  type PeriodType = 'overview' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

  interface Props {
    periodIncome: number;
    periodExpenses: number;
    periodInvestments: number;
    periodType?: PeriodType;
    totalInvestments?: number;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
  }

  const {
    periodIncome,
    periodExpenses,
    periodInvestments: _periodInvestments,
    periodType = 'month',
    totalInvestments = 0,
    loading = false,
    formatCurrency,
  }: Props = $props();

  // Widget ID for settings storage
  const WIDGET_ID = 'fire-indicator';

  interface FireSettings {
    withdrawalRate: number;
    targetExpenses: number | null;
  }

  // User-adjustable settings with persistence
  let withdrawalRateInput = $state('4');
  let customMonthlyExpenses = $state<number | null>(null);
  let settingsLoaded = $state(false);

  // Load from widget settings on mount
  onMount(async () => {
    const saved = await widgetSettings.get<FireSettings>(WIDGET_ID);
    if (saved) {
      if (saved.withdrawalRate) {
        withdrawalRateInput = (saved.withdrawalRate * 100).toFixed(1).replace(/\.0$/, '');
      }
      if (saved.targetExpenses !== null && saved.targetExpenses !== undefined) {
        customMonthlyExpenses = saved.targetExpenses;
      }
    }
    settingsLoaded = true;
  });

  // Save settings (debounced)
  function saveSettings() {
    const rate = parseFloat(withdrawalRateInput) / 100;
    if (!isNaN(rate) && rate > 0 && rate <= 1) {
      widgetSettings.save<FireSettings>(WIDGET_ID, {
        withdrawalRate: rate,
        targetExpenses: customMonthlyExpenses,
      });
    }
  }

  // Parse withdrawal rate from input
  const withdrawalRate = $derived(() => {
    const rate = parseFloat(withdrawalRateInput) / 100;
    return isNaN(rate) || rate <= 0 ? 0.04 : Math.min(rate, 1);
  });

  // Calculate months in period for normalization
  const monthsInPeriod = $derived(() => {
    switch (periodType) {
      case 'overview':
      case 'year':
        return 12;
      case 'quarter':
        return 3;
      case 'week':
        return 1 / 4.33;
      case 'month':
      default:
        return 1;
    }
  });

  // Normalize to monthly values
  const actualMonthlyIncome = $derived(periodIncome / monthsInPeriod());
  const actualMonthlyExpenses = $derived(periodExpenses / monthsInPeriod());

  // Initialize custom expenses
  $effect(() => {
    if (customMonthlyExpenses === null && actualMonthlyExpenses > 0) {
      customMonthlyExpenses = Math.round(actualMonthlyExpenses / 100) * 100;
    }
  });

  const targetMonthlyExpenses = $derived(customMonthlyExpenses ?? actualMonthlyExpenses);

  // Slider bounds
  const minExpenses = $derived(Math.max(500, Math.round(actualMonthlyExpenses * 0.3 / 100) * 100));
  const maxExpenses = $derived(Math.max(5000, Math.round(actualMonthlyExpenses * 2 / 100) * 100));

  // Core calculations
  const annualExpenses = $derived(targetMonthlyExpenses * 12);
  const fireMultiplier = $derived(1 / withdrawalRate());
  const fireNumber = $derived(annualExpenses * fireMultiplier);
  const fireProgress = $derived(fireNumber > 0 ? Math.min((totalInvestments / fireNumber) * 100, 100) : 0);
  const yearsOfRunway = $derived(annualExpenses > 0 ? totalInvestments / annualExpenses : 0);

  // Savings for FIRE calculation
  const monthlySavings = $derived(actualMonthlyIncome - actualMonthlyExpenses);
  const annualSavings = $derived(monthlySavings * 12);
  const expectedReturn = 0.07;

  const yearsToFire = $derived(() => {
    if (totalInvestments >= fireNumber) return 0;
    if (annualSavings <= 0 && totalInvestments <= 0) return Infinity;

    const P = totalInvestments;
    const C = annualSavings;
    const r = expectedReturn;
    const FV = fireNumber;

    if (C <= 0) {
      if (P <= 0) return Infinity;
      return Math.log(FV / P) / Math.log(1 + r);
    }

    const numerator = FV * r + C;
    const denominator = P * r + C;

    if (denominator <= 0) return Infinity;
    if (numerator <= 0) return 0;

    return Math.log(numerator / denominator) / Math.log(1 + r);
  });

  const statusLevel = $derived(() => {
    if (fireProgress >= 100) return 'achieved';
    if (fireProgress >= 50) return 'good';
    if (fireProgress >= 25) return 'progress';
    return 'starting';
  });

  function handleSliderChange() {
    saveSettings();
  }

  function handleRateInput(e: Event) {
    const input = e.target as HTMLInputElement;
    withdrawalRateInput = input.value;
    saveSettings();
  }
</script>

<div class="fire-card" class:loading>
  <!-- Header with progress ring -->
  <div class="header">
    <div class="title-section">
      <div class="icon-wrapper">
        <Infinity size={18} strokeWidth={1.5} />
      </div>
      <div class="title-text">
        <h3>{$t('dashboard.fire.title') || 'FIRE'}</h3>
        <span class="subtitle">{$t('dashboard.fire.subtitle') || 'Independencia Financiera'}</span>
      </div>
    </div>

    <div class="progress-ring" class:achieved={statusLevel() === 'achieved'} class:good={statusLevel() === 'good'}>
      <svg viewBox="0 0 36 36">
        <path
          class="ring-bg"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          class="ring-progress"
          stroke-dasharray="{fireProgress}, 100"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <text x="18" y="20.5" class="ring-text">{fireProgress.toFixed(0)}%</text>
      </svg>
    </div>
  </div>

  <!-- Main metric -->
  <div class="main-metric">
    <span class="metric-label">{$t('dashboard.fire.fire_number') || 'Objetivo'}</span>
    <span class="metric-value">{formatCurrency(fireNumber)}</span>
  </div>

  <!-- Controls -->
  <div class="controls">
    <!-- Expenses slider -->
    <div class="control-row">
      <span class="control-label">{$t('dashboard.fire.target_expenses') || 'Gastos'}</span>
      <span class="control-value">{formatCurrency(targetMonthlyExpenses)}<span class="unit">/mes</span></span>
    </div>
    <input
      type="range"
      class="slider"
      min={minExpenses}
      max={maxExpenses}
      step={100}
      bind:value={customMonthlyExpenses}
      oninput={handleSliderChange}
    />

    <!-- Withdrawal rate input -->
    <div class="control-row rate-row">
      <span class="control-label">{$t('dashboard.fire.withdrawal_rate') || 'Tasa retiro'}</span>
      <div class="rate-input-wrapper">
        <input
          type="text"
          class="rate-input"
          value={withdrawalRateInput}
          oninput={handleRateInput}
          maxlength="4"
        />
        <span class="rate-suffix">%</span>
        <span class="rate-multiplier">= {fireMultiplier.toFixed(1)}x</span>
      </div>
    </div>
  </div>

  <!-- Stats row -->
  <div class="stats">
    <div class="stat">
      <span class="stat-value">
        {#if yearsOfRunway >= 1}
          {yearsOfRunway.toFixed(1)}
        {:else}
          {(yearsOfRunway * 12).toFixed(0)}
        {/if}
      </span>
      <span class="stat-label">
        {yearsOfRunway >= 1 ? $t('dashboard.fire.years_runway') || 'años autonomía' : $t('dashboard.fire.months') || 'meses'}
      </span>
    </div>

    <div class="stat-divider"></div>

    <div class="stat">
      <span class="stat-value">
        {#if yearsToFire() === 0}
          ✓
        {:else if yearsToFire() > 99}
          99+
        {:else}
          {Math.ceil(yearsToFire())}
        {/if}
      </span>
      <span class="stat-label">{$t('dashboard.fire.years_to_fire') || 'años para FIRE'}</span>
    </div>

    <div class="stat-divider"></div>

    <div class="stat">
      <span class="stat-value">{formatCurrency(totalInvestments * withdrawalRate() / 12)}</span>
      <span class="stat-label">{$t('dashboard.fire.safe_withdrawal') || 'retiro'}/mes</span>
    </div>
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
    pointer-events: none;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .title-text h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  /* Progress ring */
  .progress-ring {
    width: 52px;
    height: 52px;
  }

  .progress-ring svg {
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: var(--surface-muted);
    stroke-width: 3;
  }

  .ring-progress {
    fill: none;
    stroke: var(--text-muted);
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.4s ease;
  }

  .progress-ring.good .ring-progress {
    stroke: var(--primary);
  }

  .progress-ring.achieved .ring-progress {
    stroke: var(--success);
  }

  .ring-text {
    fill: var(--text-primary);
    font-size: 0.5rem;
    font-weight: 600;
    text-anchor: middle;
    dominant-baseline: middle;
    transform: rotate(90deg);
    transform-origin: center;
  }

  /* Main metric */
  .main-metric {
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .metric-label {
    display: block;
    font-size: 0.6875rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
  }

  /* Controls */
  .controls {
    margin-bottom: 1.25rem;
  }

  .control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .control-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .control-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .control-value .unit {
    font-weight: 400;
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--surface-muted);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--text-primary);
    cursor: pointer;
    border: 2px solid var(--surface-elevated);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.15s ease;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--text-primary);
    cursor: pointer;
    border: 2px solid var(--surface-elevated);
  }

  /* Rate input */
  .rate-row {
    margin-bottom: 0;
  }

  .rate-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .rate-input {
    width: 40px;
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--surface-muted);
    border: 1px solid transparent;
    border-radius: 6px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.15s ease;
  }

  .rate-input:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--surface);
  }

  .rate-suffix {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .rate-multiplier {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-left: 0.5rem;
  }

  /* Stats */
  .stats {
    display: flex;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .stat {
    flex: 1;
    text-align: center;
  }

  .stat-divider {
    width: 1px;
    height: 28px;
    background: var(--border-color);
  }

  .stat-value {
    display: block;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .stat-label {
    display: block;
    font-size: 0.625rem;
    color: var(--text-muted);
    margin-top: 0.125rem;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .fire-card {
      padding: 1rem;
    }

    .metric-value {
      font-size: 1.5rem;
    }

    .progress-ring {
      width: 44px;
      height: 44px;
    }

    .stats {
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .stat-divider {
      display: none;
    }

    .stat {
      flex: 0 0 calc(50% - 0.375rem);
    }
  }
</style>
