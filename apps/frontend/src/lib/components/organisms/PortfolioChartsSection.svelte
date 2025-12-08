<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { TrendingUp, PiggyBank } from 'lucide-svelte';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { effectiveTheme } from '$lib/stores/theme';

  interface PortfolioSummary {
    netContributions: number;
    totalProfit: number;
  }

  interface TimelineEntry {
    date: string;
    contributions: number;
    withdrawals: number;
  }

  interface Props {
    portfolioSummary: PortfolioSummary | null;
    timeline: TimelineEntry[];
    investmentsCount: number;
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
  }

  const { portfolioSummary, timeline, investmentsCount, selectedPeriod, onPeriodChange }: Props =
    $props();

  let donutChartRef = $state<HTMLCanvasElement>();
  let lineChartRef = $state<HTMLCanvasElement>();
  let donutContainerRef = $state<HTMLDivElement>();
  let lineContainerRef = $state<HTMLDivElement>();
  let donutChart: Chart | null = null;
  let lineChart: Chart | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const timePeriods = [
    { label: '1M', months: 1 },
    { label: '3M', months: 3 },
    { label: '6M', months: 6 },
    { label: '1Y', months: 12 },
    { label: 'ALL', months: null },
  ];

  function getChartColors() {
    const isDark = $effectiveTheme === 'dark';
    return {
      text: isDark ? '#e5e7eb' : '#374151',
      grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      green: '#10B981',
      red: '#EF4444',
      blue: '#3B82F6',
    };
  }

  function createDonutChart() {
    if (!donutChartRef || investmentsCount === 0) return;
    const colors = getChartColors();
    const investedAmount = portfolioSummary?.netContributions || 0;
    const profitAmount = portfolioSummary?.totalProfit || 0;

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(donutChartRef, {
      type: 'doughnut',
      data: {
        labels: ['Invertido', profitAmount >= 0 ? 'Ganancia' : 'Pérdida'],
        datasets: [
          {
            data: [investedAmount, Math.abs(profitAmount)],
            backgroundColor: [colors.blue, profitAmount >= 0 ? colors.green : colors.red],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.text, padding: 16, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.raw as number, $currentCurrency)}`,
            },
          },
        },
      },
    });
  }

  function createLineChart() {
    if (!lineChartRef || timeline.length === 0) return;
    const colors = getChartColors();
    let cumulative = 0;
    const cumulativeData = timeline.map((t) => {
      cumulative += t.contributions - t.withdrawals;
      return cumulative;
    });

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(lineChartRef, {
      type: 'line',
      data: {
        labels: timeline.map((t) => t.date),
        datasets: [
          {
            label: 'Aportaciones acumuladas',
            data: cumulativeData,
            borderColor: colors.green,
            backgroundColor: colors.green + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.raw as number, $currentCurrency)}`,
            },
          },
        },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
          y: {
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              callback: (value) => formatCurrency(value as number, $currentCurrency),
            },
          },
        },
      },
    });
  }

  $effect(() => {
    if (investmentsCount > 0 && donutChartRef) createDonutChart();
  });

  $effect(() => {
    if (timeline.length > 0 && lineChartRef) createLineChart();
  });

  // Handle resize for responsive charts
  function handleResize() {
    if (donutChart) {
      donutChart.resize();
    }
    if (lineChart) {
      lineChart.resize();
    }
  }

  onMount(() => {
    // Use ResizeObserver for container size changes
    resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (donutContainerRef) resizeObserver.observe(donutContainerRef);
    if (lineContainerRef) resizeObserver.observe(lineContainerRef);

    // Also handle window resize for orientation changes
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (donutChart) donutChart.destroy();
    if (lineChart) lineChart.destroy();
    if (resizeObserver) resizeObserver.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  });
</script>

<section class="charts-section">
  <div class="chart-card">
    <h3><PiggyBank size={16} /> Distribución</h3>
    <div class="chart-container donut" bind:this={donutContainerRef}>
      <canvas bind:this={donutChartRef}></canvas>
    </div>
  </div>
  <div class="chart-card">
    <div class="chart-header">
      <h3><TrendingUp size={16} /> Evolución</h3>
      <div class="period-filters">
        {#each timePeriods as period (period.label)}
          <button
            class="period-btn"
            class:active={selectedPeriod === period.label}
            onclick={() => onPeriodChange(period.label)}
          >
            {period.label}
          </button>
        {/each}
      </div>
    </div>
    <div class="chart-container line" bind:this={lineContainerRef}>
      <canvas bind:this={lineChartRef}></canvas>
    </div>
  </div>
</section>

<style>
  .charts-section {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .chart-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
  }

  .chart-card h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0 0 1rem 0;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .period-filters {
    display: flex;
    gap: 0.25rem;
    background: var(--surface);
    border-radius: 6px;
    padding: 0.125rem;
  }

  .period-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .period-btn.active {
    background: var(--primary);
    color: white;
  }

  .chart-container {
    position: relative;
    height: 220px;
    width: 100%;
  }

  .chart-container canvas {
    max-width: 100%;
  }

  @media (max-width: 768px) {
    .charts-section {
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      padding: 0.875rem;
    }

    .chart-container {
      height: 180px;
    }
  }

  @media (max-width: 640px) {
    .chart-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .period-filters {
      width: 100%;
      justify-content: space-between;
    }

    .chart-card h3 {
      font-size: 0.8125rem;
      margin-bottom: 0.75rem;
    }
  }

  @media (max-width: 360px) {
    .charts-section {
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .chart-card {
      padding: 0.75rem;
      border-radius: 10px;
    }

    .chart-card h3 {
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .chart-container {
      height: 150px;
    }

    .chart-container.donut {
      height: 140px;
    }

    .period-btn {
      padding: 0.25rem 0.375rem;
      font-size: 0.625rem;
    }
  }
</style>
