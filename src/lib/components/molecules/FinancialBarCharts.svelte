<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { t } from '$lib/stores/i18n';
  
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
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: $t('charts.labels.essential_expenses'),
            data: data.map(d => d.essentialExpenses),
            backgroundColor: 'rgba(245, 121, 108, 0.8)',
            borderColor: '#f5796c',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: $t('charts.labels.discretionary_expenses'),
            data: data.map(d => d.discretionaryExpenses),
            backgroundColor: 'rgba(254, 205, 44, 0.8)',
            borderColor: '#fecd2c',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: $t('charts.labels.investments'),
            data: data.map(d => d.investments),
            backgroundColor: 'rgba(2, 60, 70, 0.8)',
            borderColor: '#023c46',
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
    if (chart && data) {
      chart.data.labels = data.map(d => d.month);
      chart.data.datasets[0].data = data.map(d => d.essentialExpenses);
      chart.data.datasets[1].data = data.map(d => d.discretionaryExpenses);
      chart.data.datasets[2].data = data.map(d => d.investments);
      chart.update();
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
    if (chart) {
      // Update dataset labels
      chart.data.datasets[0].label = $t('charts.labels.essential_expenses');
      chart.data.datasets[1].label = $t('charts.labels.discretionary_expenses');
      chart.data.datasets[2].label = $t('charts.labels.investments');
      chart.update();
    }
  });
  
  // Handle dark mode changes
  function handleThemeChange() {
    if (chart) {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Update grid color
      if (chart.options.scales?.y?.grid) {
        chart.options.scales.y.grid.color = isDark 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.05)';
      }
      
      // Update text colors
      const textColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-muted').trim();
      const legendColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary').trim();
      
      if (chart.options.scales?.x?.ticks) {
        chart.options.scales.x.ticks.color = textColor;
      }
      if (chart.options.scales?.y?.ticks) {
        chart.options.scales.y.ticks.color = textColor;
      }
      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = legendColor;
      }
      
      chart.update();
    }
  }
  
  onMount(() => {
    initChart();
    
    // Listen for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  });
  
  onDestroy(() => {
    if (chart) {
      chart.destroy();
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
  
  /* Dark mode */
  html.dark .chart-card {
    background: var(--gray-800);
  }
  
  /* Light mode */
  html:not(.dark) .chart-card {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .chart-card {
      padding: 1rem;
    }
  }
</style>
