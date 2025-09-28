<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { currentLanguage, t } from '$lib/stores/i18n';
  import { getChartThemeColors, updateChartTheme, updateChartDatasetColors, setupChartThemeObserver } from '$lib/utils/chartTheme';

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

  let canvasRef = $state<HTMLCanvasElement>();
  let chart: Chart | null = null;
  let cleanupThemeObserver: (() => void) | null = null;

  // Reactive data processing
  let chartData = $derived(() => {
    if (!data?.length) return {
      labels: [],
      income: [],
      essentialExpenses: [],
      discretionaryExpenses: [],
      debtPayments: [],
      investments: []
    };

    return {
      labels: data.map(d => d.month),
      income: data.map(d => Math.abs(d.income)),
      essentialExpenses: data.map(d => Math.abs(d.essentialExpenses)),
      discretionaryExpenses: data.map(d => Math.abs(d.discretionaryExpenses)),
      debtPayments: data.map(d => Math.abs(d.debtPayments)),
      investments: data.map(d => Math.abs(d.investments))
    };
  });

  // Format currency for tooltips
  function formatTooltipValue(value: number): string {
    return formatCurrency(value, $currentCurrency);
  }

  // Chart configuration
  function getChartConfig() {
    const colors = getChartThemeColors();

    return {
      type: 'bar' as const,
      data: {
        labels: chartData().labels,
        datasets: [
          {
            label: $t('dashboard.metrics.income'),
            data: chartData().income,
            backgroundColor: colors.income + '80',
            borderColor: colors.income,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: $t('dashboard.metrics.essential_expenses'),
            data: chartData().essentialExpenses,
            backgroundColor: colors.expenses + '80',
            borderColor: colors.expenses,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: $t('dashboard.metrics.discretionary_expenses'),
            data: chartData().discretionaryExpenses,
            backgroundColor: '#f59e0b80',
            borderColor: '#f59e0b',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: $t('dashboard.metrics.debt_payments'),
            data: chartData().debtPayments,
            backgroundColor: '#dc262680',
            borderColor: '#dc2626',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: $t('dashboard.metrics.investments'),
            data: chartData().investments,
            backgroundColor: colors.investments + '80',
            borderColor: colors.investments,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
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
                size: 11,
                weight: '500'
              },
              usePointStyle: true,
              pointStyle: 'rect',
              padding: 15
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
                size: 11
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
                size: 11
              },
              callback: function(value: any) {
                return formatCurrency(value, $currentCurrency);
              }
            }
          }
        },
        elements: {
          bar: {
            borderRadius: 4
          }
        }
      }
    };
  }

  function initChart() {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

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
    chart.data.datasets[1].data = newData.essentialExpenses;
    chart.data.datasets[2].data = newData.discretionaryExpenses;
    chart.data.datasets[3].data = newData.debtPayments;
    chart.data.datasets[4].data = newData.investments;

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
      updateChartDatasetColors(chart, 2, 'investments');
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
      <canvas bind:this={canvasRef}></canvas>
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

  canvas {
    max-width: 100%;
    height: auto;
  }
</style>