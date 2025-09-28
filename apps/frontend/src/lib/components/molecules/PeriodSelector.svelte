<script lang="ts">
  import { CalendarRange } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';

  interface Period {
    value: string;
    label: string;
    icon?: ComponentType;
  }

  interface Props {
    periods: Period[];
    selectedPeriod: string;
    loading?: boolean;
    customDateRangeLabel?: string;
    onPeriodChange: (period: string) => void;
  }

  let {
    periods,
    selectedPeriod,
    loading = false,
    customDateRangeLabel,
    onPeriodChange
  }: Props = $props();
</script>

<div class="period-selector">
  {#each periods as period}
    <button
      class="period-button"
      class:active={selectedPeriod === period.value}
      class:loading={loading && selectedPeriod === period.value}
      disabled={loading}
      onclick={() => onPeriodChange(period.value)}
    >
      {#if loading && selectedPeriod === period.value}
        <div class="button-spinner"></div>
      {:else if period.icon}
        <svelte:component this={period.icon} size={16} />
      {/if}
      <span>
        {period.value === 'custom' && customDateRangeLabel ? customDateRangeLabel : period.label}
      </span>
    </button>
  {/each}
</div>

<style>
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
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .period-button span {
    white-space: nowrap;
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

  .period-button.loading {
    pointer-events: none;
  }

  .button-spinner {
    width: 14px;
    height: 14px;
    border: 1.5px solid currentColor;
    border-top: 1.5px solid transparent;
    border-radius: 50%;
    animation: button-spin 1s linear infinite;
  }

  @keyframes button-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .period-selector {
      width: 100%;
      justify-content: center;
    }

    .period-button {
      flex: none;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
    }
  }
</style>