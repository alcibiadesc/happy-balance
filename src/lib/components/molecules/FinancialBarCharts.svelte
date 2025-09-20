<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { currentLanguage, t } from '$lib/stores/i18n';
  import { getChartThemeColors, updateChartTheme, updateChartDatasetColors, setupChartThemeObserver } from '$lib/utils/chartTheme';
  
  interface MonthlyData {
    month: string;
    income: number;
    essentialExpenses: number;
    discretionaryExpenses: number;
    debtPayments: number;
    investments: number;
  }
  
  interface Props {
    data: MonthlyData[];
    height?: number;
    period?: string;
    loading?: boolean;
  }

  let { data, height = 300, period = 'month', loading = false }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  
  // Helper to get translations directly from language
  function getLabels(lang: string = $currentLanguage) {
    const translations = {
      en: {
        essential_expenses: 'Essential Expenses',
        discretionary_expenses: 'Discretionary Expenses',
        debt_payments: 'Debt Payments',
        investments: 'Investments'
      },
      es: {
        essential_expenses: 'Gastos Esenciales',
        discretionary_expenses: 'Gastos Discrecionales',
        debt_payments: 'Pago de Deudas',
        investments: 'Inversiones'
      }
    };
    
    return translations[lang as keyof typeof translations] || translations.en;
  }
  

  function getBarConfig(period: string) {
    const baseBarConfig = {
      borderRadius: 4,
      borderSkipped: false,
      borderWidth: 1,
    };

    // Adjust bar spacing and size based on period
    switch (period) {
      case 'week':
        return {
          ...baseBarConfig,
          barThickness: 20,
          maxBarThickness: 25,
        };
      case 'month':
        return {
          ...baseBarConfig,
          barThickness: 18,
          maxBarThickness: 22,
        };
      case 'quarter':
        return {
          ...baseBarConfig,
          barThickness: 25,
          maxBarThickness: 30,
        };
      case 'year':
        return {
          ...baseBarConfig,
          barThickness: 30,
          maxBarThickness: 35,
        };
      default:
        return baseBarConfig;
    }
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

    switch (period) {
      case 'week':
        return {
          ...baseConfig,
          ticks: {
            ...baseConfig.ticks,
            maxTicksLimit: 7,
            callback: function(value: any) {
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
      case 'year':
        return {
          ...baseConfig,
          ticks: {
            ...baseConfig.ticks,
            maxTicksLimit: 4
          }
        };
      default:
        return baseConfig;
    }
  }

  function initChart() {
    if (!canvas) return;

    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          align: 'end' as const,
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
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
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
          border: { display: false },
          ticks: {
            font: { size: 11 },
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-muted').trim(),
            callback: function(value: any) {
              return formatCurrency(value, $currentCurrency);
            }
          }
        }
      }
    };
    
    // Single Chart: Expense Breakdown + Investments (Grouped bars - not stacked)
    const labels = getLabels($currentLanguage);
    const colors = getChartThemeColors();
    const barConfig = getBarConfig(period);

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: labels.essential_expenses,
            data: data.map(d => d.essentialExpenses),
            backgroundColor: 'rgba(245, 121, 108, 0.8)',
            borderColor: '#f5796c',
            ...barConfig,
          },
          {
            label: labels.discretionary_expenses,
            data: data.map(d => d.discretionaryExpenses),
            backgroundColor: 'rgba(254, 205, 44, 0.8)',
            borderColor: '#fecd2c',
            ...barConfig,
          },
          {
            label: labels.debt_payments,
            data: data.map(d => d.debtPayments),
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: '#a855f7',
            ...barConfig,
          },
          {
            label: labels.investments,
            data: data.map(d => d.investments),
            backgroundColor: colors.investments.background,
            borderColor: colors.investments.border,
            ...barConfig,
          }
        ]
      },
      options: commonOptions
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
        chart.data.datasets[0].data = data.map(d => d.essentialExpenses);
        chart.data.datasets[1].data = data.map(d => d.discretionaryExpenses);
        chart.data.datasets[2].data = data.map(d => d.debtPayments);
        chart.data.datasets[3].data = data.map(d => d.investments);

        // Update configurations based on period
        const barConfig = getBarConfig(period);
        chart.data.datasets.forEach(dataset => {
          Object.assign(dataset, barConfig);
        });
        chart.options.scales.x = getXAxisConfig(period);
        chart.update('none');
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
      chart.data.datasets[0].label = labels.essential_expenses;
      chart.data.datasets[1].label = labels.discretionary_expenses;
      chart.data.datasets[2].label = labels.debt_payments;
      chart.data.datasets[3].label = labels.investments;
      chart.update();
    }
  });
  
  
  let cleanupThemeObserver: (() => void) | null = null;
  
  onMount(() => {
    initChart();
    
    // Setup theme change observer
    cleanupThemeObserver = setupChartThemeObserver(chart, () => {
      updateChartDatasetColors(chart, 2, 'investments');
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

<div class="chart-card">
  <h3 class="chart-title">{$t('dashboard.charts.detailed_breakdown')}</h3>
  <p class="chart-subtitle">{$t('dashboard.charts.detailed_breakdown_subtitle')}</p>
  <div class="chart-wrapper" style="height: {height}px" class:loading>
    {#if loading}
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <span class="loading-text">Updating chart...</span>
      </div>
    {/if}
    <canvas bind:this={canvas} class:chart-loading={loading}></canvas>
  </div>
</div>

<style>
  .chart-card {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid var(--border-color, transparent);
    margin-bottom: 2rem;
  }
  
  .chart-title {
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
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
  }

  .chart-wrapper.loading canvas {
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

  /* Responsive */
  @media (max-width: 768px) {
    .chart-card {
      padding: 1rem;
    }
  }
</style>
