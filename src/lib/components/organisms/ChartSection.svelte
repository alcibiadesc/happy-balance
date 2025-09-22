<script lang="ts">
  import FinancialChart from '../molecules/FinancialChart.svelte';

  interface Props {
    title: string;
    subtitle?: string;
    data: any[];
    height?: number;
    period: string;
    loading?: boolean;
  }

  let {
    title,
    subtitle,
    data,
    height = 280,
    period,
    loading = false
  }: Props = $props();
</script>

<section class="chart-section">
  <h2 class="section-title">{title}</h2>
  {#if subtitle}
    <p class="chart-subtitle">{subtitle}</p>
  {/if}
  <div class="chart-wrapper">
    <FinancialChart
      {data}
      {height}
      {period}
      {loading}
    />
  </div>
</section>

<style>
  .chart-section {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, transparent);
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chart-wrapper {
    margin-top: 1rem;
  }

  .chart-subtitle {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0.25rem 0 1rem 0;
    line-height: 1.4;
  }
</style>