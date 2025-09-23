<script lang="ts">
  import { Edit2, Trash2 } from 'lucide-svelte';
  import type { Category } from '$lib/types/transaction';

  interface Props {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    formatCurrency: (amount: number) => string;
  }

  let {
    category,
    onEdit,
    onDelete,
    formatCurrency
  }: Props = $props();
</script>

<div class="category-card">
  <div
    class="category-icon"
    style="background-color: {category.color}20"
  >
    {category.icon}
  </div>

  <div class="category-info">
    <h3 class="category-name">{category.name}</h3>
    {#if category.annualBudget}
      <span class="category-budget">
        {formatCurrency(category.annualBudget)} / año
      </span>
    {:else}
      <span class="category-budget no-budget">
        Sin presupuesto
      </span>
    {/if}
  </div>

  <div class="category-actions">
    <button
      class="action-btn"
      onclick={() => onEdit(category)}
    >
      <Edit2 size={14} />
    </button>
    <button
      class="action-btn delete"
      onclick={() => onDelete(category)}
    >
      <Trash2 size={14} />
    </button>
  </div>
</div>

<style>
  /* Category Card - Exact copy from categories page */
  .category-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s ease;
  }

  .category-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .category-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .category-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .category-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .category-budget {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .category-budget.no-budget {
    opacity: 0.5;
    font-style: italic;
  }

  .category-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--surface-elevated);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  .action-btn.delete:hover {
    background: rgba(245, 121, 108, 0.1);
    color: #f5796c;
    border-color: #f5796c;
  }
</style>