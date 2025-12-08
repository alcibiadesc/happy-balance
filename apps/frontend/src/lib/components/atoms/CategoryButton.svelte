<script lang="ts">
  import { Tag } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import type { Category } from '$lib/types/transaction';

  interface Props {
    category?: Category | null;
    onclick: (e: MouseEvent) => void;
  }

  let { category = null, onclick }: Props = $props();
</script>

<button
  class="category-btn"
  class:has-category={category}
  style={category
    ? `background-color: ${category.color}20; border-color: ${category.color}; color: ${category.color}`
    : ''}
  title={category ? `Categoría: ${category.name}` : 'Asignar categoría'}
  data-testid="transaction-category"
  {onclick}
>
  {#if category}
    <span class="category-icon">{category.icon}</span>
    <span>{category.name}</span>
  {:else}
    <Tag size={14} />
    {$t('transactions.add_category')}
  {/if}
</button>

<style>
  .category-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 4px 0.5rem;
    border: 1px dashed var(--acapulco);
    border-radius: 0.5rem;
    background: transparent;
    color: var(--acapulco);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-btn:hover {
    transform: scale(1.02);
    opacity: 0.9;
  }

  .category-btn:not(.has-category):hover {
    background: var(--acapulco-alpha-10);
    border-color: var(--acapulco);
  }

  .category-btn.has-category {
    border-width: 1px;
    border-style: solid;
    font-weight: 500;
  }

  .category-icon {
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .category-btn {
      font-size: 0.7rem;
      padding: 3px 8px;
    }
  }

  @media (max-width: 480px) {
    .category-btn {
      font-size: 0.65rem;
      padding: 2px 6px;
    }

    .category-icon {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 360px) {
    .category-btn {
      font-size: 0.6rem;
      padding: 2px 4px;
      gap: 0.25rem;
    }

    .category-icon {
      font-size: 0.7rem;
    }
  }
</style>
