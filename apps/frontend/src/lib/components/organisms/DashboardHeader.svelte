<script lang="ts">
  import PeriodSelector from '$lib/components/molecules/PeriodSelector.svelte';
  import PeriodNavigation from '$lib/components/molecules/PeriodNavigation.svelte';
  import type { ComponentType } from 'svelte';

  interface Period {
    value: string;
    label: string;
    icon?: ComponentType;
  }

  interface NavigationOption {
    offset: number;
    label: string;
    fullLabel: string;
  }

  interface Props {
    title: string;
    periods: Period[];
    selectedPeriod: string;
    periodOffset: number;
    loading?: boolean;
    customDateRangeLabel?: string;
    navigationOptions: NavigationOption[];
    currentPeriodLabel: string;
    onPeriodChange: (period: string) => void;
    onPeriodNavigation: (offset: number) => void;
  }

  let {
    title,
    periods,
    selectedPeriod,
    periodOffset,
    loading = false,
    customDateRangeLabel,
    navigationOptions,
    currentPeriodLabel,
    onPeriodChange,
    onPeriodNavigation
  }: Props = $props();
</script>

<header class="dashboard-header">
  <div class="header-top">
    <h1 class="dashboard-title">{title}</h1>

    <PeriodSelector
      {periods}
      {selectedPeriod}
      {loading}
      {customDateRangeLabel}
      {onPeriodChange}
    />

    <PeriodNavigation
      {selectedPeriod}
      {periodOffset}
      {loading}
      {navigationOptions}
      {currentPeriodLabel}
      {onPeriodNavigation}
    />
  </div>
</header>

<style>
  .dashboard-header {
    margin-bottom: 2rem;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .dashboard-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.025em;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-top {
      flex-direction: column;
      align-items: stretch;
    }

    .dashboard-title {
      font-size: 1.5rem;
    }
  }
</style>