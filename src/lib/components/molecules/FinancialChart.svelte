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
  }
  
  let { data, height = 250 }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  
  // Helper to get translations directly from language
  function getLabels(lang: string = $currentLanguage) {
    const translations = {
      en: {
        income: 'Income',
        expenses: 'Expenses',
        balance: 'Balance'
      },
      es: {
        income: 'Ingresos',
        expenses: 'Gastos',
        balance: 'Balance'
      }
    };
    
    return translations[lang as keyof typeof translations] || translations.en;
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
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: {
                size: 11
              },
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
  
  // Update chart when data changes
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

<div class="chart-container" style="height: {height}px">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
  }
  
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
</style>
