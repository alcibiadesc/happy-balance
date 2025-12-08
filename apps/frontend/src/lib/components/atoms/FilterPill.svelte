<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    active?: boolean;
    variant?: 'default' | 'income' | 'expense' | 'uncategorized' | 'clear';
    disabled?: boolean;
    onclick: () => void;
    children: Snippet;
  }

  let {
    active = false,
    variant = 'default',
    disabled = false,
    onclick,
    children,
  }: Props = $props();
</script>

<button
  class="filter-pill {variant}"
  class:active
  class:disabled
  {disabled}
  {onclick}
  aria-pressed={active}
>
  {@render children()}
  {#if active}
    <span class="pill-indicator"></span>
  {/if}
</button>

<style>
  .filter-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: var(--surface-muted);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
  }

  .filter-pill:hover:not(:disabled) {
    background: var(--surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
  }

  .pill-indicator {
    display: none;
  }

  .filter-pill.income.active {
    background: var(--acapulco);
    color: white;
  }

  .filter-pill.expense.active {
    background: var(--froly);
    color: white;
  }

  .filter-pill.uncategorized.active {
    background: var(--gray-600);
    color: white;
  }

  .filter-pill.clear {
    background: var(--error-bg);
    color: #ef4444;
  }

  .filter-pill.clear:hover {
    background: var(--error);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.15);
  }

  .filter-pill.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .filter-pill.disabled:hover {
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    .filter-pill {
      padding: 0.375rem 0.625rem;
      font-size: 0.6875rem;
      min-height: 2rem;
      gap: 0.25rem;
    }
  }
</style>
