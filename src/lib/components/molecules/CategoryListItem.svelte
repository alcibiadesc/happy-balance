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
    <span class="category-name">{category.name}</span>
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

<style>
  .category-card {
    display: flex;
    align-items: center;
    gap: var(--space-md, 1rem);
    padding: var(--space-md, 1rem);
    background: var(--surface);
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: var(--radius-md, 0.75rem);
    transition: all 0.2s ease;
  }

  .category-card:hover {
    border-color: var(--gray-300, #d1d5db);
    transform: translateX(2px);
  }

  .category-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md, 0.75rem);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .category-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 0.25rem);
  }

  .category-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
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
    gap: var(--space-xs, 0.5rem);
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: var(--radius-sm, 0.5rem);
    background: var(--surface);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--gray-50, #f9fafb);
    color: var(--text-primary);
    border-color: var(--gray-300, #d1d5db);
  }

  .action-btn.delete:hover {
    background: rgba(245, 121, 108, 0.1);
    color: #f5796c;
    border-color: #f5796c;
  }

  @media (max-width: 640px) {
    .category-card {
      padding: var(--space-sm, 0.75rem);
      gap: var(--space-sm, 0.75rem);
    }

    .category-icon {
      width: 2rem;
      height: 2rem;
      font-size: 1rem;
    }
  }
</style>