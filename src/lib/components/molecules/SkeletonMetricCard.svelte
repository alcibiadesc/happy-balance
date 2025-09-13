<script lang="ts">
  import Skeleton from '$lib/components/atoms/Skeleton.svelte';
</script>

<article class="metric-card-skeleton">
  <div class="skeleton-header">
    <Skeleton width="36px" height="36px" rounded="md" />
    <Skeleton width="95px" height="14px" />
  </div>
  <div class="skeleton-body">
    <Skeleton width="140px" height="24px" />
    <Skeleton width="55px" height="14px" />
  </div>
</article>

<style>
  .metric-card-skeleton {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid var(--border-color, transparent);
    min-height: 124px; /* Match real metric card height */
  }
  
  .skeleton-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .skeleton-body {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  
  /* Dark mode */
  html.dark .metric-card-skeleton {
    background: var(--gray-800);
  }
  
  /* Light mode */
  html:not(.dark) .metric-card-skeleton {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
</style>