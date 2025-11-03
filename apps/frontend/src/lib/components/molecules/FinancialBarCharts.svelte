<script lang="ts">
  import { LayerCake, Svg, Html } from 'layercake';
  import { scaleBand, scaleLinear } from 'd3-scale';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { currentLanguage, t } from '$lib/stores/i18n';
  import GroupedColumn from './chart-layers/GroupedColumn.svelte';
  import AxisX from './chart-layers/AxisX.svelte';
  import AxisY from './chart-layers/AxisY.svelte';

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

  // Process data for Layer Cake
  let chartData = $derived(
    data.map((d) => ({
      month: d.month,
      income: Math.abs(d.income),
      essentialExpenses: Math.abs(d.essentialExpenses),
      discretionaryExpenses: Math.abs(d.discretionaryExpenses),
      debtPayments: Math.abs(d.debtPayments),
      investments: Math.abs(d.investments)
    }))
  );

  // Group keys for the bars
  const groupKeys = ['income', 'essentialExpenses', 'discretionaryExpenses', 'debtPayments', 'investments'];

  // Colors for each group
  const colors = {
    income: '#7aba9e',
    essentialExpenses: '#ef4444',
    discretionaryExpenses: '#f59e0b',
    debtPayments: '#dc2626',
    investments: '#023c46'
  };

  // Legend items
  let legendItems = $derived([
    { key: 'income', label: $t('dashboard.metrics.income'), color: colors.income },
    { key: 'essentialExpenses', label: $t('dashboard.metrics.essential_expenses'), color: colors.essentialExpenses },
    { key: 'discretionaryExpenses', label: $t('dashboard.metrics.discretionary_expenses'), color: colors.discretionaryExpenses },
    { key: 'debtPayments', label: $t('dashboard.metrics.debt_payments'), color: colors.debtPayments },
    { key: 'investments', label: $t('dashboard.metrics.investments'), color: colors.investments }
  ]);

  // Tooltip state
  let hoveredData = $state<any>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
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
        <span>No data available for the selected period</span>
      </div>
    {:else}
      <!-- Legend -->
      <div class="legend">
        {#each legendItems as item}
          <div class="legend-item">
            <div class="legend-color" style="background: {item.color};"></div>
            <span>{item.label}</span>
          </div>
        {/each}
      </div>

      <!-- Chart -->
      <LayerCake
        padding={{ top: 10, right: 15, bottom: 40, left: 70 }}
        x="month"
        y={groupKeys}
        yDomain={[0, null]}
        xScale={scaleBand().paddingInner(0.2)}
        yScale={scaleLinear()}
        data={chartData}
      >
        <Svg>
          <AxisX gridlines={false} />
          <AxisY
            gridlines={true}
            formatTick={(d) => formatCurrency(d, $currentCurrency)}
          />
          <GroupedColumn {groupKeys} {colors} />
        </Svg>
      </LayerCake>
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

  .legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 11px;
    font-weight: 500;
    color: #000000;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  canvas {
    max-width: 100%;
    height: auto;
  }
</style>
