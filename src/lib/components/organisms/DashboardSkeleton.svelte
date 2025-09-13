<script lang="ts">
  import SkeletonSpendingIndicator from '$lib/components/molecules/SkeletonSpendingIndicator.svelte';
  import SkeletonMetricCard from '$lib/components/molecules/SkeletonMetricCard.svelte';
  import SkeletonChart from '$lib/components/molecules/SkeletonChart.svelte';
  import SkeletonCategoryCard from '$lib/components/molecules/SkeletonCategoryCard.svelte';
</script>

<div class="dashboard-skeleton">
  <!-- Spending Summary Skeleton -->
  <SkeletonSpendingIndicator />
  
  <!-- Metrics Grid Skeleton -->
  <section class="metrics-section-skeleton">
    <div class="metrics-grid-skeleton">
      <SkeletonMetricCard />
      <SkeletonMetricCard />
      <SkeletonMetricCard />
      <SkeletonMetricCard />
    </div>
  </section>
  
  <!-- Financial Evolution Chart Skeleton -->
  <SkeletonChart height={280} title={true} subtitle={true} />
  
  <!-- Bar Charts Skeleton -->
  <SkeletonChart height={250} title={true} subtitle={true} />
  
  <!-- Categories Section Skeleton -->
  <section class="categories-section-skeleton">
    <div class="section-header-skeleton">
      <div class="skeleton-title">
        <div class="skeleton-shimmer" style="width: 150px; height: 14px; border-radius: 2px;"></div>
      </div>
    </div>
    <div class="categories-grid-skeleton">
      <SkeletonCategoryCard />
      <SkeletonCategoryCard />
      <SkeletonCategoryCard />
      <SkeletonCategoryCard />
      <SkeletonCategoryCard />
      <SkeletonCategoryCard />
    </div>
  </section>
</div>

<style>
  .dashboard-skeleton {
    /* Remove padding and dimensions to match parent container */
    width: 100%;
  }
  
  .metrics-section-skeleton {
    margin-bottom: 2rem;
  }
  
  .metrics-grid-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .categories-section-skeleton {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid var(--border-color, transparent);
  }
  
  .section-header-skeleton {
    margin-bottom: 1rem;
  }
  
  .skeleton-title {
    margin-bottom: 1rem;
  }
  
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      var(--skeleton-base) 0%,
      var(--skeleton-highlight) 50%,
      var(--skeleton-base) 100%
    );
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
  }
  
  @keyframes loading {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .categories-grid-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  /* Light mode skeleton colors */
  :root {
    --skeleton-base: var(--gray-200);
    --skeleton-highlight: var(--gray-100);
  }
  
  /* Dark mode skeleton colors */
  html.dark {
    --skeleton-base: var(--gray-700);
    --skeleton-highlight: var(--gray-600);
  }
  
  /* Dark mode */
  html.dark .categories-section-skeleton {
    background: var(--gray-800);
  }
  
  /* Light mode */
  html:not(.dark) .categories-section-skeleton {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-skeleton {
      padding: 1rem;
    }
    
    .metrics-grid-skeleton {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .categories-grid-skeleton {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 480px) {
    .metrics-grid-skeleton {
      grid-template-columns: 1fr;
    }
  }
</style>