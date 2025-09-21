<script lang="ts">
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';

  interface DataPoint {
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }

  interface Props {
    data: DataPoint[];
    height?: number;
    period?: string;
    loading?: boolean;
  }

  let { data = [], height = 280, period = 'month', loading = false }: Props = $props();

  // Calculate max values for scaling
  let maxValue = $derived(() => {
    if (!data?.length) return 100;
    return Math.max(
      ...data.flatMap(d => [Math.abs(d.income), Math.abs(d.expenses), Math.abs(d.balance)])
    );
  });

  // Format values for display
  function formatValue(value: number): string {
    return formatCurrency(Math.abs(value), $currentCurrency);
  }

  // Calculate percentage for bar height
  function getPercentage(value: number): number {
    if (maxValue() === 0) return 0;
    return (Math.abs(value) / maxValue()) * 100;
  }
</script>

<div class="financial-chart" style="height: {height}px;">
  {#if loading}
    <div class="chart-loading">
      <div class="loading-spinner"></div>
      <span>Loading chart data...</span>
    </div>
  {:else if !data?.length}
    <div class="chart-empty">
      <span>No data available</span>
    </div>
  {:else}
    <div class="chart-container">
      <!-- Chart legend -->
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-color income"></div>
          <span>Income</span>
        </div>
        <div class="legend-item">
          <div class="legend-color expenses"></div>
          <span>Expenses</span>
        </div>
        <div class="legend-item">
          <div class="legend-color balance"></div>
          <span>Balance</span>
        </div>
      </div>

      <!-- Chart bars -->
      <div class="chart-bars">
        {#each data as point}
          <div class="bar-group">
            <div class="bars">
              <div
                class="bar income"
                style="height: {getPercentage(point.income)}%"
                title="Income: {formatValue(point.income)}"
              ></div>
              <div
                class="bar expenses"
                style="height: {getPercentage(point.expenses)}%"
                title="Expenses: {formatValue(point.expenses)}"
              ></div>
              <div
                class="bar balance"
                style="height: {getPercentage(point.balance)}%"
                title="Balance: {formatValue(point.balance)}"
              ></div>
            </div>
            <div class="bar-label">{point.month}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .financial-chart {
    width: 100%;
    background: var(--surface);
    border-radius: 8px;
    padding: 1rem;
    position: relative;
  }

  .chart-loading,
  .chart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    gap: 0.5rem;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .chart-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .chart-legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .legend-color.income {
    background: var(--success);
  }

  .legend-color.expenses {
    background: var(--accent);
  }

  .legend-color.balance {
    background: var(--primary);
  }

  .chart-bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    padding: 1rem 0;
    overflow-x: auto;
  }

  .bar-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
    flex: 1;
  }

  .bars {
    display: flex;
    gap: 4px;
    align-items: flex-end;
    height: 200px;
    margin-bottom: 0.5rem;
  }

  .bar {
    width: 12px;
    min-height: 4px;
    border-radius: 2px 2px 0 0;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .bar:hover {
    opacity: 0.8;
    transform: scaleY(1.05);
  }

  .bar.income {
    background: var(--success);
  }

  .bar.expenses {
    background: var(--accent);
  }

  .bar.balance {
    background: var(--primary);
  }

  .bar-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    max-width: 60px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .chart-bars {
      gap: 0.5rem;
    }

    .bar-group {
      min-width: 40px;
    }

    .bars {
      height: 150px;
    }

    .bar {
      width: 8px;
    }
  }
</style>