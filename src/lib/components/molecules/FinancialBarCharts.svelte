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
    investments: number;
  }
  
  interface Props {
    data: MonthlyData[];
    height?: number;
  }
  
  let { data, height = 300 }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  
  // Helper to get translations directly from language
  function getLabels(lang: string = $currentLanguage) {
    const translations = {
      en: {
        essential_expenses: 'Essential Expenses',
        discretionary_expenses: 'Discretionary Expenses',
        investments: 'Investments'
      },
      es: {
        essential_expenses: 'Gastos Esenciales',
        discretionary_expenses: 'Gastos Discrecionales',
        investments: 'Inversiones'
      }
    };
    
    return translations[lang as keyof typeof translations] || translations.en;
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
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: { size: 11 },
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-muted').trim()
          }
        },
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
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: labels.discretionary_expenses,
            data: data.map(d => d.discretionaryExpenses),
            backgroundColor: 'rgba(254, 205, 44, 0.8)',
            borderColor: '#fecd2c',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: labels.investments,
            data: data.map(d => d.investments),
            backgroundColor: colors.investments.background,
            borderColor: colors.investments.border,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
      },
      options: commonOptions
    });
  }
  
  // Update chart when data changes
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
        chart.data.datasets[2].data = data.map(d => d.investments);
        chart.update();
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
      chart.data.datasets[2].label = labels.investments;
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
  <div class="chart-wrapper" style="height: {height}px">
    <canvas bind:this={canvas}></canvas>
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
  }
  
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
  
  
  /* Responsive */
  @media (max-width: 768px) {
    .chart-card {
      padding: 1rem;
    }
  }
</style>
