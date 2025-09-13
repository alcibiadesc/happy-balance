<script lang="ts">
  import { t } from '$lib/stores/i18n';
  
  interface Props {
    income: number;
    expenses: number;
  }
  
  let { income, expenses }: Props = $props();
  
  // Calculate spending rate (de cada 10€ cuántos gasto)
  let spendingRate = $derived(
    income > 0 ? Math.round(expenses / income * 10) : 0
  );
  
  // No status color needed - keep number in normal text color
</script>

<div class="spending-summary">
  <span class="spending-text">
    {@html $t('dashboard.spending_summary', { amount: `<strong>${spendingRate}</strong>` })}
  </span>
</div>

<style>
  .spending-summary {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
    border: 1px solid var(--border-color, transparent);
  }
  
  .spending-text {
    font-size: 1rem;
    color: var(--text-primary);
    line-height: 1.4;
  }
  
  .spending-text :global(strong) {
    font-size: 1.125rem;
    font-weight: 700;
  }
  
  /* Dark mode */
  html.dark .spending-summary {
    background: var(--gray-800);
  }
  
  /* Light mode */
  html:not(.dark) .spending-summary {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .spending-summary {
      padding: 0.875rem 1.25rem;
    }
    
    .spending-text {
      font-size: 0.9375rem;
    }
    
    .spending-text :global(strong) {
      font-size: 1.0625rem;
    }
  }
</style>
