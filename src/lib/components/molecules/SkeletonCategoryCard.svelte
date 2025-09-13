<script lang="ts">
  import Skeleton from '$lib/components/atoms/Skeleton.svelte';
</script>

<div class="category-card-skeleton">
  <div class="skeleton-header">
    <Skeleton width="80px" height="14px" />
    <Skeleton width="60px" height="14px" />
  </div>
  <div class="skeleton-bar">
    <Skeleton width="100%" height="4px" rounded="sm" />
  </div>
  <Skeleton width="35px" height="12px" />
</div>

<style>
  .category-card-skeleton {
    background: var(--surface);
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid var(--border-color, transparent);
  }
  
  .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .skeleton-bar {
    margin-bottom: 0.5rem;
  }
  
  /* Dark mode */
  html.dark .category-card-skeleton {
    background: var(--gray-900);
    border-color: rgba(254, 247, 238, 0.06);
  }
  
  /* Light mode */
  html:not(.dark) .category-card-skeleton {
    background: var(--gray-50);
    border-color: rgba(2, 60, 70, 0.06);
  }
</style>