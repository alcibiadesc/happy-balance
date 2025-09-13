<script lang="ts">
  import Skeleton from '$lib/components/atoms/Skeleton.svelte';
</script>

<div class="spending-summary-skeleton">
  <Skeleton width="320px" height="22px" class="spending-text-skeleton" />
</div>

<style>
  .spending-summary-skeleton {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
    border: 1px solid var(--border-color, transparent);
    display: flex;
    justify-content: center;
  }
  
  .spending-text-skeleton {
    max-width: 100%;
  }
  
  /* Dark mode */
  html.dark .spending-summary-skeleton {
    background: var(--gray-800);
  }
  
  /* Light mode */
  html:not(.dark) .spending-summary-skeleton {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .spending-summary-skeleton {
      padding: 0.875rem 1.25rem;
    }
    
    .spending-text-skeleton {
      width: 280px !important;
    }
  }
</style>