<script lang="ts">
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { t } from '$lib/stores/i18n';

  interface DataPoint {
    month: string;
    income: number;
    essentialExpenses: number;
    discretionaryExpenses: number;
    debtPayments: number;
    investments: number;
  }

  interface Props {
    data: DataPoint[];
    height?: number;
    period?: string;
    loading?: boolean;
  }

  let { data = [], height = 250, period = 'month', loading = false }: Props = $props();

  // Calculate max values for scaling
  let maxValue = $derived(() => {
    if (!data?.length) return 100;
    return Math.max(
      ...data.flatMap(d => [
        Math.abs(d.income),
        Math.abs(d.essentialExpenses),
        Math.abs(d.discretionaryExpenses),
        Math.abs(d.debtPayments),
        Math.abs(d.investments)
      ])
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

<section class="financial-bar-charts">
  <h2 class="section-title">{$t('dashboard.charts.expense_distribution')}</h2>
  <p class="chart-subtitle">{$t('dashboard.charts.expense_distribution_subtitle')}</p>

  <div class="chart-wrapper" style="height: {height}px;">
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
            <span>{$t('dashboard.metrics.income')}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color essential"></div>
            <span>{$t('dashboard.metrics.essential_expenses')}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color discretionary"></div>
            <span>{$t('dashboard.metrics.discretionary_expenses')}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color debt"></div>
            <span>{$t('dashboard.metrics.debt_payments')}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color investments"></div>
            <span>{$t('dashboard.metrics.investments')}</span>
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
                  class="bar essential"
                  style="height: {getPercentage(point.essentialExpenses)}%"
                  title="Essential: {formatValue(point.essentialExpenses)}"
                ></div>
                <div
                  class="bar discretionary"
                  style="height: {getPercentage(point.discretionaryExpenses)}%"
                  title="Discretionary: {formatValue(point.discretionaryExpenses)}"
                ></div>
                <div
                  class="bar debt"
                  style="height: {getPercentage(point.debtPayments)}%"
                  title="Debt: {formatValue(point.debtPayments)}"
                ></div>
                <div
                  class="bar investments"
                  style="height: {getPercentage(point.investments)}%"
                  title="Investments: {formatValue(point.investments)}"
                ></div>
              </div>
              <div class="bar-label">{point.month}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .financial-bar-charts {
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
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chart-subtitle {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: 0 0 1rem 0;
    line-height: 1.4;
  }

  .chart-wrapper {
    width: 100%;
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
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .legend-color {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .legend-color.income {
    background: var(--success);
  }

  .legend-color.essential {
    background: var(--accent);
  }

  .legend-color.discretionary {
    background: var(--warning);
  }

  .legend-color.debt {
    background: var(--error);
  }

  .legend-color.investments {
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
    min-width: 80px;
    flex: 1;
  }

  .bars {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 180px;
    margin-bottom: 0.5rem;
  }

  .bar {
    width: 10px;
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

  .bar.essential {
    background: var(--accent);
  }

  .bar.discretionary {
    background: var(--warning);
  }

  .bar.debt {
    background: var(--error);
  }

  .bar.investments {
    background: var(--primary);
  }

  .bar-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .financial-bar-charts {
      padding: 1rem;
    }

    .chart-legend {
      gap: 0.5rem;
    }

    .legend-item {
      font-size: 0.7rem;
    }

    .chart-bars {
      gap: 0.5rem;
    }

    .bar-group {
      min-width: 60px;
    }

    .bars {
      height: 140px;
      gap: 1px;
    }

    .bar {
      width: 8px;
    }
  }
</style>