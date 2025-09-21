<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { currentLanguage, t } from '$lib/stores/i18n';
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

  let { data, height = 250, period = 'month', loading = false }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  
  // Helper to get translations using i18n
  function getLabels() {
    return {
      income: $t('dashboard.metrics.income'),
      expenses: $t('dashboard.metrics.expenses'),
      balance: $t('dashboard.metrics.balance')
    };
  }

  
  function getXAxisConfig(period: string) {
    const baseConfig = {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        font: { size: 11 },
        color: getComputedStyle(document.documentElement)
          .getPropertyValue('--text-muted').trim()
      }
    };

    // Adjust x-axis based on period for better readability
    switch (period) {
      case 'week':
        return {
          ...baseConfig,
          ticks: {
            ...baseConfig.ticks,
            maxTicksLimit: 7,
            callback: function(value: any, index: any) {
              const label = this.getLabelForValue(value);
              return label.length > 8 ? label.substring(0, 8) + '...' : label;
            }
          }
        };
      case 'month':
        return {
          ...baseConfig,
          ticks: {
            ...baseConfig.ticks,
            maxTicksLimit: 6
          }
        };
      case 'quarter':
        return {
          ...baseConfig,
          ticks: {
            ...baseConfig.ticks,
            maxTicksLimit: 4
          }
        };
      case 'year':
        return {
          ...baseConfig,
          ticks: {
            ...baseConfig.ticks,
            maxTicksLimit: 6
          }
        };
      default:
        return baseConfig;
    }
  }

  function initChart() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
    }

    // Create new chart
    const labels = getLabels($currentLanguage);
    const colors = getChartThemeColors();
    
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: labels.income,
            data: data.map(d => d.income),
            borderColor: colors.income.border,
            backgroundColor: colors.income.background,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: colors.income.point,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: labels.expenses,
            data: data.map(d => d.expenses),
            borderColor: '#f5796c',
            backgroundColor: 'rgba(245, 121, 108, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f5796c',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: labels.balance,
            data: data.map(d => d.balance),
            borderColor: '#fecd2c',
            backgroundColor: 'rgba(254, 205, 44, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fecd2c',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12,
                family: 'system-ui',
                weight: '500'
              },
              color: getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim()
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += formatCurrency(context.parsed.y, $currentCurrency);
                return label;
              }
            }
          }
        },
        scales: {
          x: getXAxisConfig(period),
          y: {
            grid: {
              display: true,
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            border: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              },
              color: getComputedStyle(document.documentElement)
                .getPropertyValue('--text-muted').trim(),
              callback: function(value: any) {
                return formatCurrency(value, $currentCurrency);
              }
            }
          }
        }
      }
    });
  }
  
  // Update chart when data or period changes
  $effect(() => {
    if (data && data.length > 0) {
      if (!chart && canvas) {
        // Initialize chart if not exists
        initChart();
      } else if (chart) {
        // Update existing chart
        chart.data.labels = data.map(d => d.month);
        chart.data.datasets[0].data = data.map(d => d.income);
        chart.data.datasets[1].data = data.map(d => d.expenses);
        chart.data.datasets[2].data = data.map(d => d.balance);

        // Update x-axis configuration based on period
        chart.options.scales.x = getXAxisConfig(period);
        chart.update('none'); // No animation for smoother transitions
      }
    }
  });
  
  // Update chart when currency changes
  $effect(() => {
    if (chart && $currentCurrency) {
      // Force chart update to refresh tooltips and axis labels
      chart.update();
    }
  });
  
  // Update chart when language changes
  $effect(() => {
    if (chart && $currentLanguage) {
      // Update dataset labels
      const labels = getLabels($currentLanguage);
      chart.data.datasets[0].label = labels.income;
      chart.data.datasets[1].label = labels.expenses;
      chart.data.datasets[2].label = labels.balance;
      chart.update();
    }
  });
  
  
  let cleanupThemeObserver: (() => void) | null = null;
  
  onMount(() => {
    initChart();
    
    // Setup theme change observer
    cleanupThemeObserver = setupChartThemeObserver(chart, () => {
      updateChartDatasetColors(chart, 0, 'income');
    });
  });
  
  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
    if (cleanupThemeObserver) {
      cleanupThemeObserver();
    }
  });
</script>

<div class="chart-container" style="height: {height}px" class:loading>
  {#if loading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">Updating chart...</span>
    </div>
  {/if}
  <canvas bind:this={canvas} class:chart-loading={loading}></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
  }

  .chart-container.loading canvas {
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(2px);
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 0.5rem;
  }

  .loading-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  canvas {
    width: 100% !important;
    height: 100% !important;
    transition: opacity 0.3s ease;
  }

  .chart-loading {
    opacity: 0.6;
  }
</style>
