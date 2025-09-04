<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    LinearScale,
    CategoryScale,
    TimeScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    type ChartConfiguration
  } from 'chart.js';
  import 'chartjs-adapter-date-fns';

  interface Props {
    data: Array<{
      date: string;
      income: number;
      expenses: number;
      balance: number;
    }>;
    height?: number;
    class?: string;
  }

  let { data, height = 300, class: className }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  // Register Chart.js components
  Chart.register(
    LinearScale,
    CategoryScale,
    TimeScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
  );

  onMount(() => {
    createChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  function createChart() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prepare data for Chart.js
    const chartData = {
      labels: data.map(item => new Date(item.date)),
      datasets: [
        {
          label: 'Ingresos',
          data: data.map(item => item.income),
          borderColor: '#10B981', // green-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Gastos',
          data: data.map(item => Math.abs(item.expenses)),
          borderColor: '#EF4444', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#EF4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Balance Neto',
          data: data.map(item => item.balance),
          borderColor: '#6366F1', // indigo-500
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6366F1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#F9FAFB',
            bodyColor: '#F9FAFB',
            borderColor: '#374151',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const label = context.dataset.label || '';
                return `${label}: ${new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'dd/MM'
              }
            },
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              callback: function(value) {
                return new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  notation: 'compact'
                }).format(Number(value));
              }
            }
          }
        }
      }
    };

    chart = new Chart(ctx, config);
  }

  // Reactive update when data changes
  $effect(() => {
    if (chart && data) {
      const labels = data.map(item => new Date(item.date));
      const incomeData = data.map(item => item.income);
      const expenseData = data.map(item => Math.abs(item.expenses));
      const balanceData = data.map(item => item.balance);

      chart.data.labels = labels;
      chart.data.datasets[0].data = incomeData;
      chart.data.datasets[1].data = expenseData;
      chart.data.datasets[2].data = balanceData;
      
      chart.update('none'); // Update without animation for better performance
    }
  });
</script>

<div class="w-full {className}" style="height: {height}px;">
  <canvas bind:this={canvas} class="w-full h-full"></canvas>
</div>