<script lang="ts">
  import Skeleton from '$lib/components/atoms/Skeleton.svelte';
  
  interface Props {
    height?: number;
    title?: boolean;
    subtitle?: boolean;
  }
  
  let { height = 280, title = true, subtitle = true }: Props = $props();
</script>

<div class="chart-skeleton">
  {#if title}
    <div class="skeleton-header">
      <Skeleton width="200px" height="14px" class="skeleton-title" />
      {#if subtitle}
        <Skeleton width="300px" height="13px" class="skeleton-subtitle" />
      {/if}
    </div>
  {/if}
  <div class="chart-content" style="height: {height}px; min-height: {height}px;">
    <!-- Chart area skeleton -->
    <div class="chart-area">
      <!-- Y-axis labels -->
      <div class="y-axis">
        <Skeleton width="40px" height="10px" />
        <Skeleton width="35px" height="10px" />
        <Skeleton width="40px" height="10px" />
        <Skeleton width="30px" height="10px" />
        <Skeleton width="40px" height="10px" />
      </div>
      
      <!-- Chart bars/lines area -->
      <div class="chart-main">
        <div class="chart-bars">
          <div class="bar-group">
            <Skeleton width="20px" height="80px" />
            <Skeleton width="20px" height="60px" />
            <Skeleton width="20px" height="40px" />
          </div>
          <div class="bar-group">
            <Skeleton width="20px" height="70px" />
            <Skeleton width="20px" height="55px" />
            <Skeleton width="20px" height="35px" />
          </div>
          <div class="bar-group">
            <Skeleton width="20px" height="85px" />
            <Skeleton width="20px" height="65px" />
            <Skeleton width="20px" height="45px" />
          </div>
          <div class="bar-group">
            <Skeleton width="20px" height="75px" />
            <Skeleton width="20px" height="50px" />
            <Skeleton width="20px" height="30px" />
          </div>
          <div class="bar-group">
            <Skeleton width="20px" height="90px" />
            <Skeleton width="20px" height="70px" />
            <Skeleton width="20px" height="50px" />
          </div>
          <div class="bar-group">
            <Skeleton width="20px" height="80px" />
            <Skeleton width="20px" height="60px" />
            <Skeleton width="20px" height="40px" />
          </div>
        </div>
        
        <!-- X-axis labels -->
        <div class="x-axis">
          <Skeleton width="30px" height="10px" />
          <Skeleton width="30px" height="10px" />
          <Skeleton width="30px" height="10px" />
          <Skeleton width="30px" height="10px" />
          <Skeleton width="30px" height="10px" />
          <Skeleton width="30px" height="10px" />
        </div>
      </div>
    </div>
    
    <!-- Legend -->
    <div class="chart-legend">
      <div class="legend-item">
        <Skeleton width="12px" height="12px" rounded="sm" />
        <Skeleton width="60px" height="12px" />
      </div>
      <div class="legend-item">
        <Skeleton width="12px" height="12px" rounded="sm" />
        <Skeleton width="50px" height="12px" />
      </div>
      <div class="legend-item">
        <Skeleton width="12px" height="12px" rounded="sm" />
        <Skeleton width="70px" height="12px" />
      </div>
    </div>
  </div>
</div>

<style>
  .chart-skeleton {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, transparent);
  }
  
  .skeleton-header {
    margin-bottom: 1rem;
  }
  
  .skeleton-title {
    margin-bottom: 0.25rem;
  }
  
  .skeleton-subtitle {
    margin-bottom: 1rem;
  }
  
  .chart-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .chart-area {
    display: flex;
    flex: 1;
    gap: 1rem;
  }
  
  .y-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    padding-right: 0.5rem;
  }
  
  .chart-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .chart-bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .bar-group {
    display: flex;
    gap: 2px;
    align-items: flex-end;
  }
  
  .x-axis {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    padding: 0 1rem;
  }
  
  .chart-legend {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Dark mode */
  html.dark .chart-skeleton {
    background: var(--gray-800);
  }
  
  /* Light mode */
  html:not(.dark) .chart-skeleton {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .chart-skeleton {
      padding: 1rem;
    }
    
    .chart-bars {
      gap: 0.5rem;
      padding: 0 0.5rem;
    }
    
    .x-axis {
      padding: 0 0.5rem;
    }
    
    .chart-legend {
      justify-content: center;
      gap: 0.75rem;
    }
  }
</style>