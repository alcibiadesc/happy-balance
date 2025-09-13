<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  
  interface DataPoint {
    month: string;
    income: number;
    expenses: number;
  }
  
  interface Props {
    data: DataPoint[];
    height?: number;
  }
  
  let { data, height = 250 }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  
  function initChart() {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
    }
    
    // Create new chart
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: 'Ingresos',
            data: data.map(d => d.income),
            borderColor: '#7abaa5',
            backgroundColor: 'rgba(122, 186, 165, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#7abaa5',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'Gastos',
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
    if (chart && data) {
      chart.data.labels = data.map(d => d.month);
      chart.data.datasets[0].data = data.map(d => d.income);
      chart.data.datasets[1].data = data.map(d => d.expenses);
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
