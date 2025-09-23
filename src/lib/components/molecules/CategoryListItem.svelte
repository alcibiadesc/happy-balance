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

<div class="category-item">
  <div class="item-left">
    <div
      class="category-icon"
      style="background-color: {category.color}20"
    >
      {category.icon}
    </div>

    <div class="category-info">
      <span class="category-name">{category.name}</span>
    </div>
  </div>

  <div class="item-right">
    {#if category.annualBudget}
      <span class="category-budget">
        {formatCurrency(category.annualBudget)} / año
      </span>
    {:else}
      <span class="category-budget no-budget">
        Sin presupuesto
      </span>
    {/if}

    <div class="category-actions">
      <button
        class="action-btn"
        onclick={() => onEdit(category)}
        title="Editar"
      >
        <Edit2 size={14} />
      </button>
      <button
        class="action-btn delete"
        onclick={() => onDelete(category)}
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
</div>

<style>
  /* Category List Item */
  .category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .category-item:last-child {
    border-bottom: none;
  }

  .category-item:hover {
    background: rgba(0, 0, 0, 0.01);
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .category-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .category-info {
    display: flex;
    align-items: center;
  }

  .category-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .category-budget {
    font-size: 0.8125rem;
    color: var(--text-muted);
    min-width: 120px;
    text-align: right;
  }

  .category-budget.no-budget {
    opacity: 0.5;
    font-style: italic;
  }

  .category-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .category-item:hover .category-actions {
    opacity: 1;
  }

  .action-btn {
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
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
  }

  .action-btn.delete:hover {
    background: rgba(245, 121, 108, 0.1);
    color: #f5796c;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .category-actions {
      opacity: 1;
    }

    .category-budget {
      min-width: auto;
    }
  }
</style>