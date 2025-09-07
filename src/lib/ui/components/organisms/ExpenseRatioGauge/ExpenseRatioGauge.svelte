<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    ArcElement,
    Title,
    Tooltip,
    type ChartConfiguration
  } from 'chart.js';

  interface Props {
    ratio: number; // Value between 0 and 1
    height?: number;
    class?: string;
  }

  let { ratio, height = 200, class: className }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  // Register Chart.js components
  Chart.register(ArcElement, Title, Tooltip);

  onMount(() => {
    createChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  function getColor(ratio: number) {
    if (ratio <= 0.6) return '#22C55E'; // green-500 - Good
    if (ratio <= 0.8) return '#F59E0B'; // amber-500 - Warning
    return '#EF4444'; // red-500 - Danger
  }

  function getStatus(ratio: number) {
    if (ratio <= 0.6) return { text: 'Excelente', color: 'text-green-600' };
    if (ratio <= 0.8) return { text: 'Moderado', color: 'text-amber-600' };
    return { text: 'Alto', color: 'text-red-600' };
  }

  function createChart() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure ratio is within bounds with NaN protection
    const inputRatio = Number(ratio) || 0;
    const safeRatioValue = isFinite(inputRatio) ? Math.max(0, Math.min(1, inputRatio)) : 0;
    const percentage = safeRatioValue * 100;

    const chartData = {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: [
          getColor(safeRatioValue),
          'rgba(229, 231, 235, 0.3)' // gray-200 with opacity
        ],
        borderWidth: 0,
        cutout: '75%',
        rotation: -90, // Start from top
        circumference: 180 // Half circle
      }]
    };

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        animation: {
          animateRotate: true,
          duration: 1500
        }
      }
    };

    chart = new Chart(ctx, config);
  }

  // Reactive update when ratio changes
  $effect(() => {
    if (chart) {
      const inputRatio = Number(ratio) || 0;
      const safeRatioValue = isFinite(inputRatio) ? Math.max(0, Math.min(1, inputRatio)) : 0;
      const percentage = safeRatioValue * 100;
      
      chart.data.datasets[0].data = [percentage, 100 - percentage];
      chart.data.datasets[0].backgroundColor = [
        getColor(safeRatioValue),
        'rgba(229, 231, 235, 0.3)'
      ];
      
      chart.update('active');
    }
  });

  // Computed values with comprehensive NaN protection
  let safeRatio = $derived.by(() => {
    const inputRatio = Number(ratio) || 0;
    return isFinite(inputRatio) ? Math.max(0, Math.min(1, inputRatio)) : 0;
  });
  
  let spentPer10 = $derived.by(() => {
    const spent = safeRatio * 10;
    return isFinite(spent) ? spent.toFixed(1) : '0.0';
  });
  
  let percentageText = $derived.by(() => {
    const percentage = safeRatio * 100;
    return isFinite(percentage) ? percentage.toFixed(1) : '0.0';
  });
  
  let status = $derived(getStatus(safeRatio));
</script>

<div class="w-full {className} flex flex-col items-center" style="height: {height}px;">
  <!-- Chart Container -->
  <div class="relative flex-1 w-full" style="height: {height * 0.7}px;">
    <canvas bind:this={canvas} class="w-full h-full"></canvas>
    
    <!-- Center Text -->
    <div class="absolute inset-0 flex flex-col items-center justify-end pb-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 font-mono">
          €{spentPer10}
        </div>
        <div class="text-xs text-gray-500 uppercase tracking-wide">
          de cada €10
        </div>
      </div>
    </div>
  </div>

  <!-- Status and Details -->
  <div class="mt-2 text-center">
    <div class="flex items-center justify-center gap-2 mb-1">
      <div class="w-3 h-3 rounded-full" style="background-color: {getColor(safeRatio)}"></div>
      <span class="text-sm font-medium {status.color}">{status.text}</span>
    </div>
    <p class="text-xs text-gray-600">
      Ratio de gastos: {percentageText}%
    </p>
  </div>
  
  <!-- Scale indicators -->
  <div class="flex justify-between w-full max-w-48 mt-2 text-xs text-gray-400">
    <span>€0</span>
    <span>€5</span>
    <span>€10</span>
  </div>
</div>