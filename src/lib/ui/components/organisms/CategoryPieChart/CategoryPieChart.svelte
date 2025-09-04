<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    type ChartConfiguration
  } from 'chart.js';

  interface Props {
    data: Array<{
      categoryName: string;
      categoryType: string;
      amount: number;
      color?: string;
    }>;
    height?: number;
    class?: string;
  }

  let { data, height = 300, class: className }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  // Register Chart.js components
  Chart.register(ArcElement, Title, Tooltip, Legend);

  // Color palette for categories
  const colors = [
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#EAB308', // yellow-500
    '#22C55E', // green-500
    '#06B6D4', // cyan-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#6366F1', // indigo-500
    '#84CC16'  // lime-500
  ];

  onMount(() => {
    createChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  function createChart() {
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sort data by amount (highest first) and take top categories
    const sortedData = [...data]
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 12); // Show top 12 categories

    if (!sortedData.length) return;

    const chartData = {
      labels: sortedData.map(item => item.categoryName),
      datasets: [{
        data: sortedData.map(item => item.amount),
        backgroundColor: sortedData.map((item, index) => 
          item.color || colors[index % colors.length]
        ),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff'
      }]
    };

    const total = sortedData.reduce((sum, item) => sum + item.amount, 0);

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, index) => {
                    const value = data.datasets[0].data[index] as number;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[index],
                      strokeStyle: '#ffffff',
                      lineWidth: 2,
                      pointStyle: 'circle',
                      index: index
                    };
                  });
                }
                return [];
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
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value)} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000
        },
        interaction: {
          intersect: false
        }
      }
    };

    chart = new Chart(ctx, config);
  }

  // Reactive update when data changes
  $effect(() => {
    if (chart && data) {
      const sortedData = [...data]
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 12);

      if (sortedData.length > 0) {
        const labels = sortedData.map(item => item.categoryName);
        const amounts = sortedData.map(item => item.amount);
        const backgroundColors = sortedData.map((item, index) => 
          item.color || colors[index % colors.length]
        );

        chart.data.labels = labels;
        chart.data.datasets[0].data = amounts;
        chart.data.datasets[0].backgroundColor = backgroundColors;
        
        chart.update('none');
      }
    }
  });
</script>

<div class="w-full {className}" style="height: {height}px;">
  {#if data.length > 0}
    <canvas bind:this={canvas} class="w-full h-full"></canvas>
  {:else}
    <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div class="text-center">
        <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
          </svg>
        </div>
        <p class="text-sm text-gray-600">No hay datos de categorías disponibles</p>
      </div>
    </div>
  {/if}
</div>