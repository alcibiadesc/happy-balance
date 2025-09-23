<script lang="ts">
  import { TrendingUp, TrendingDown, Check, X, Tag } from 'lucide-svelte';
  import type { Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';

  interface Props {
    visible: boolean;
    transactionTypeFilter: 'all' | 'income' | 'expenses' | 'uncategorized';
    selectedCategories: string[];
    categories: Category[];
    onTransactionTypeFilter: (type: 'all' | 'income' | 'expenses' | 'uncategorized') => void;
    onToggleCategory: (categoryId: string) => void;
    onClearFilters: () => void;
  }

  let {
    visible,
    transactionTypeFilter,
    selectedCategories,
    categories,
    onTransactionTypeFilter,
    onToggleCategory,
    onClearFilters
  }: Props = $props();

  const getCategoryColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      income: 'var(--acapulco)',
      essential: 'var(--froly)',
      discretionary: 'var(--cornflower)',
      investment: 'var(--salmon)'
    };
    return colorMap[type] || 'var(--gray-400)';
  };
</script>

{#if visible}
  <div class="filters-bento" class:visible>
    <div class="filter-grid">
      <div class="bento-item quick-filters">
        <button
          class="filter-pill income"
          class:active={transactionTypeFilter === 'income' && selectedCategories.length === 0}
          class:disabled={selectedCategories.length > 0}
          onclick={() => {
            if (selectedCategories.length === 0) {
              onTransactionTypeFilter(transactionTypeFilter === 'income' ? 'all' : 'income');
            }
          }}
        >
          <TrendingUp size={14} />
          <span>{$t('transactions.income')}</span>
          {#if transactionTypeFilter === 'income' && selectedCategories.length === 0}
            <Check size={12} />
          {/if}
        </button>

        <button
          class="filter-pill expenses"
          class:active={transactionTypeFilter === 'expenses' && selectedCategories.length === 0}
          class:disabled={selectedCategories.length > 0}
          onclick={() => {
            if (selectedCategories.length === 0) {
              onTransactionTypeFilter(transactionTypeFilter === 'expenses' ? 'all' : 'expenses');
            }
          }}
        >
          <TrendingDown size={14} />
          <span>{$t('transactions.expenses')}</span>
          {#if transactionTypeFilter === 'expenses' && selectedCategories.length === 0}
            <Check size={12} />
          {/if}
        </button>

        <button
          class="filter-pill uncategorized"
          class:active={transactionTypeFilter === 'uncategorized' && selectedCategories.length === 0}
          class:disabled={selectedCategories.length > 0}
          onclick={() => {
            if (selectedCategories.length === 0) {
              onTransactionTypeFilter(transactionTypeFilter === 'uncategorized' ? 'all' : 'uncategorized');
            }
          }}
        >
          <Tag size={14} />
          <span>{$t('transactions.uncategorized')}</span>
          {#if transactionTypeFilter === 'uncategorized' && selectedCategories.length === 0}
            <Check size={12} />
          {/if}
        </button>
      </div>

      <div class="bento-item category-filters">
        <div class="bento-header">
          <h3>{$t('transactions.categories')}</h3>
          {#if selectedCategories.length > 0}
            <button class="clear-btn" onclick={onClearFilters}>
              <X size={14} />
              <span>{$t('transactions.clear')}</span>
            </button>
          {/if}
        </div>

        <div class="category-grid-compact">
          {#each categories as category}
            <button
              class="category-chip"
              class:active={selectedCategories.includes(category.id)}
              style="--category-color: {getCategoryColor(category.type)}"
              onclick={() => onToggleCategory(category.id)}
            >
              <span class="category-name">{category.name}</span>
              {#if selectedCategories.includes(category.id)}
                <Check size={12} />
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .filters-bento {
    padding: 1rem;
    background: var(--surface);
    border-radius: 0.75rem;
    margin: 1rem 0;
    opacity: 0;
    animation: slideDown 0.3s ease forwards;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .filter-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .bento-item {
    padding: 1rem;
    background: white;
    border-radius: 0.625rem;
    border: 1px solid var(--gray-100);
  }

  .quick-filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: 2rem;
    font-size: 0.8125rem;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-pill:hover:not(.disabled) {
    background: var(--gray-50);
  }

  .filter-pill.active {
    color: white;
    border-color: transparent;
  }

  .filter-pill.income.active {
    background: var(--acapulco);
  }

  .filter-pill.expenses.active {
    background: var(--froly);
  }

  .filter-pill.uncategorized.active {
    background: var(--gray-500);
  }

  .filter-pill.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .bento-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .bento-header h3 {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--gray-700);
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clear-btn:hover {
    background: var(--gray-50);
  }

  .category-grid-compact {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .category-chip {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: 0.5rem;
    font-size: 0.75rem;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .category-chip:hover {
    background: var(--gray-50);
  }

  .category-chip.active {
    background: var(--category-color);
    color: white;
    border-color: var(--category-color);
  }

  .category-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  @media (max-width: 768px) {
    .category-grid-compact {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
  }
</style>