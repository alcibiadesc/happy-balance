<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { currentLanguage } from '$lib/stores/i18n';
  import { getChartThemeColors, updateChartTheme, updateChartDatasetColors, setupChartThemeObserver } from '$lib/utils/chartTheme';

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

  let canvasRef = $state<HTMLCanvasElement>();
  let chart: Chart | null = null;
  let cleanupThemeObserver: (() => void) | null = null;

  // Reactive data processing
  let chartData = $derived(() => {
    if (!data?.length) return { labels: [], income: [], expenses: [], balance: [] };

    return {
      labels: data.map(d => d.month),
      income: data.map(d => Math.abs(d.income)),
      expenses: data.map(d => Math.abs(d.expenses)),
      balance: data.map(d => d.balance)
    };
  });

  // Format currency for tooltips
  function formatTooltipValue(value: number): string {
    return formatCurrency(value, $currentCurrency);
  }

  // Get month labels based on period
  function getTimeUnit() {
    switch (period) {
      case 'week': return 'week';
      case 'quarter': return 'quarter';
      case 'year': return 'year';
      default: return 'month';
    }
  }

  // Chart configuration
  function getChartConfig() {
    const colors = getChartThemeColors();
    const timeUnit = getTimeUnit();

    return {
      type: 'line' as const,
      data: {
        labels: chartData().labels,
        datasets: [
          {
            label: 'Income',
            data: chartData().income,
            borderColor: colors.income,
            backgroundColor: colors.income + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: colors.income,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Expenses',
            data: chartData().expenses,
            borderColor: colors.expenses,
            backgroundColor: colors.expenses + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: colors.expenses,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Balance',
            data: chartData().balance,
            borderColor: colors.balance,
            backgroundColor: colors.balance + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: colors.balance,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index' as const
        },
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: colors.text,
              font: {
                size: 13,
                weight: '500'
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#f9fafb',
            bodyColor: '#f9fafb',
            borderColor: colors.grid,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const value = formatTooltipValue(context.parsed.y);
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.text,
              font: {
                size: 12
              },
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.text,
              font: {
                size: 12
              },
              callback: function(value: any) {
                return formatCurrency(value, $currentCurrency);
              }
            }
          }
        },
        elements: {
          point: {
            hoverBorderWidth: 3
          }
        }
      }
    };
  }

  function initChart() {
    if (!canvasRef) {
      return;
    }

    const ctx = canvasRef.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear any existing chart before creating new one
    if (chart) {
      chart.destroy();
      chart = null;
    }

    const config = getChartConfig();
    chart = new Chart(ctx, config);
  }

  function updateChart() {
    if (!chart) return;

    const newData = chartData();
    chart.data.labels = newData.labels;
    chart.data.datasets[0].data = newData.income;
    chart.data.datasets[1].data = newData.expenses;
    chart.data.datasets[2].data = newData.balance;

    chart.update('none');
  }

  // Watch for data changes
  $effect(() => {
    // Reference data to make effect reactive to data changes
    if (chart) {
      updateChart();
    }
  });

  // Watch for currency changes to update tooltips
  $effect(() => {
    if (chart && $currentCurrency) {
      chart.options.scales!.y!.ticks!.callback = function(value: any) {
        return formatCurrency(value, $currentCurrency);
      };
      chart.update('none');
    }
  });

  // Watch for loading state and reinitialize chart when needed
  $effect(() => {
    if (!loading && canvasRef) {
      // Always try to initialize/reinitialize when loading completes
      setTimeout(() => {
        initChart();
      }, 100);
    }
  });

  onMount(() => {
    if (!loading) {
      initChart();
    }

    // Setup theme observer
    cleanupThemeObserver = setupChartThemeObserver(chart, () => {
      updateChartDatasetColors(chart, 0, 'income');
      updateChartDatasetColors(chart, 1, 'expenses');
      updateChartDatasetColors(chart, 2, 'balance');
    });
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
    if (cleanupThemeObserver) {
      cleanupThemeObserver();
    }
  });
</script>

<div class="financial-chart" style="height: {height}px;">
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
    <canvas bind:this={canvasRef}></canvas>
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

  canvas {
    max-width: 100%;
    height: auto;
  }
</style>