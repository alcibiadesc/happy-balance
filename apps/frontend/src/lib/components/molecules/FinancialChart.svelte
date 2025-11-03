<script lang="ts">
  import { LayerCake, Svg, Html } from 'layercake';
  import { scaleLinear, scalePoint } from 'd3-scale';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import Line from './chart-layers/Line.svelte';
  import Area from './chart-layers/Area.svelte';
  import AxisX from './chart-layers/AxisX.svelte';
  import AxisY from './chart-layers/AxisY.svelte';

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

  // Process data for Layer Cake
  let chartData = $derived(
    data.map((d) => ({
      month: d.month,
      income: Math.abs(d.income),
      expenses: Math.abs(d.expenses),
      balance: d.balance
    }))
  );

  // Tooltip state
  let hoveredData = $state<DataPoint | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  function handleMouseMove(event: MouseEvent, d: DataPoint) {
    hoveredData = d;
    tooltipX = event.offsetX;
    tooltipY = event.offsetY;
  }

  function handleMouseLeave() {
    hoveredData = null;
  }
</script>

<div class="financial-chart" style="height: {height}px;">
  {#if loading}
    <div class="chart-loading">
      <div class="loading-spinner"></div>
      <span>Cargando datos...</span>
    </div>
  {:else if !data?.length}
    <div class="chart-empty">
      <span>No hay datos disponibles para el período seleccionado</span>
    </div>
  {:else}
    <div class="chart-container">
      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #10b981;"></div>
          <span>Ingresos</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #ef4444;"></div>
          <span>Gastos</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #3b82f6;"></div>
          <span>Balance</span>
        </div>
      </div>

      <!-- Chart -->
      <LayerCake
        padding={{ top: 10, right: 15, bottom: 35, left: 60 }}
        x="month"
        y={['income', 'expenses', 'balance']}
        yDomain={[0, null]}
        xScale={scalePoint()}
        yScale={scaleLinear()}
        data={chartData}
      >
        <Svg>
          <!-- Areas with gradient -->
          <Area
            y="income"
            fill="#10b981"
            opacity={0.1}
          />
          <Area
            y="expenses"
            fill="#ef4444"
            opacity={0.1}
          />
          <Area
            y="balance"
            fill="#3b82f6"
            opacity={0.1}
          />

          <!-- Lines -->
          <Line
            y="income"
            stroke="#10b981"
            strokeWidth={3}
          />
          <Line
            y="expenses"
            stroke="#ef4444"
            strokeWidth={3}
          />
          <Line
            y="balance"
            stroke="#3b82f6"
            strokeWidth={3}
          />

          <!-- Axes -->
          <AxisX gridlines={false} />
          <AxisY
            gridlines={true}
            formatTick={(d) => formatCurrency(d, $currentCurrency)}
          />
        </Svg>

        <Html>
          <!-- Tooltip -->
          {#if hoveredData}
            <div
              class="chart-tooltip"
              style="left: {tooltipX + 15}px; top: {tooltipY - 28}px;"
            >
              <div style="font-weight: 600; margin-bottom: 8px;">{hoveredData.month}</div>
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; margin-right: 8px;"></span>
                <span style="flex: 1;">Ingresos:</span>
                <span style="font-weight: 600; margin-left: 12px;">{formatCurrency(hoveredData.income, $currentCurrency)}</span>
              </div>
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; margin-right: 8px;"></span>
                <span style="flex: 1;">Gastos:</span>
                <span style="font-weight: 600; margin-left: 12px;">{formatCurrency(hoveredData.expenses, $currentCurrency)}</span>
              </div>
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span>
                <span style="flex: 1;">Balance:</span>
                <span style="font-weight: 600; margin-left: 12px;">{formatCurrency(hoveredData.balance, $currentCurrency)}</span>
              </div>
            </div>
          {/if}
        </Html>
      </LayerCake>
    </div>
  {/if}
</div>

<style>
  .financial-chart {
    width: 100%;
    position: relative;
    background: var(--surface);
    border-radius: 8px;
    padding: 1rem;
  }

  .chart-container {
    width: 100%;
    height: 100%;
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
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 13px;
    font-weight: 500;
    color: #000000;
  }

  .legend-color {
    width: 20px;
    height: 3px;
    border-radius: 2px;
  }

  :global(.chart-tooltip) {
    position: absolute;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    pointer-events: none;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    z-index: 100;
  }
</style>
