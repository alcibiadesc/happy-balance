<script lang="ts">
  import { onMount } from 'svelte';

  let { chartType = 'financial', data = null, ...props } = $props();

  let mounted = $state(false);
  let ChartComponent = $state(null);
  let container: HTMLElement;

  onMount(async () => {
    // Use intersection observer to load chart only when visible
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          // Dynamically import the chart component
          try {
            if (chartType === 'financial') {
              const module = await import('./FinancialChart.svelte');
              ChartComponent = module.default;
            } else if (chartType === 'bar') {
              const module = await import('./FinancialBarCharts.svelte');
              ChartComponent = module.default;
            }
            mounted = true;
            observer.disconnect();
          } catch (error) {
            console.warn('Failed to load chart component:', error);
          }
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  });
</script>

<div bind:this={container} class="lazy-chart-container">
  {#if mounted && ChartComponent}
    <svelte:component this={ChartComponent} {data} {...props} />
  {:else}
    <!-- Skeleton loader -->
    <div class="chart-skeleton">
      <div class="skeleton-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle"></div>
      </div>
      <div class="skeleton-chart-area">
        <div class="skeleton-bars">
          {#each Array(6) as _, i}
            <div
              class="skeleton-bar"
              style="height: {20 + Math.random() * 60}%"
            ></div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .lazy-chart-container {
    width: 100%;
    min-height: 300px;
  }

  .chart-skeleton {
    width: 100%;
    height: 300px;
    padding: 1rem;
    border-radius: 8px;
    background: var(--surface-elevated);
  }

  .skeleton-header {
    margin-bottom: 1.5rem;
  }

  .skeleton-title, .skeleton-subtitle {
    height: 12px;
    background: var(--surface-muted);
    border-radius: 4px;
    margin-bottom: 0.5rem;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-title {
    width: 40%;
    height: 16px;
  }

  .skeleton-subtitle {
    width: 60%;
  }

  .skeleton-chart-area {
    height: 200px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
  }

  .skeleton-bars {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    height: 100%;
    width: 100%;
    justify-content: space-around;
  }

  .skeleton-bar {
    width: 40px;
    background: var(--surface-muted);
    border-radius: 4px 4px 0 0;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-bar:nth-child(even) {
    animation-delay: 0.3s;
  }

  .skeleton-bar:nth-child(3n) {
    animation-delay: 0.6s;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>