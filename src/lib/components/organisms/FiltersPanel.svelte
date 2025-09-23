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
          class="filter-pill expense"
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
              class="category-chip-mini"
              class:selected={selectedCategories.includes(category.id)}
              onclick={() => onToggleCategory(category.id)}
            >
              <span class="chip-emoji">{category.icon}</span>
              <span class="chip-name">{category.name}</span>
              {#if selectedCategories.includes(category.id)}
                <div class="chip-check">
                  <Check size={10} />
                </div>
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
    background: white;
    border: none;
    padding: 1.5rem;
    margin: 1rem auto 2rem auto;
    max-width: 1200px;
    opacity: 0;
    transform: translateY(-8px);
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    position: relative;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .filters-bento:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.05),
                0 4px 6px rgba(0, 0, 0, 0.03);
  }

  @keyframes slideDown {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    align-items: center;
  }

  @media (min-width: 768px) {
    .filter-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
  }

  .bento-item {
    background: rgba(249, 250, 251, 0.5);
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 0.625rem;
    padding: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bento-item:hover {
    background: rgba(249, 250, 251, 0.8);
    border-color: rgba(209, 213, 219, 0.5);
    transform: translateY(-2px);
  }

  .quick-filters {
    display: flex;
    gap: var(--space-xs);
  }

  .filter-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: #FFF7ED;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
  }

  .filter-pill:hover:not(.disabled) {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: #475569;
  }

  .filter-pill.active {
    color: white;
  }

  .filter-pill.income.active {
    background: var(--acapulco);
  }

  .filter-pill.expense.active {
    background: var(--froly);
  }

  .filter-pill.uncategorized.active {
    background: var(--gray-600);
  }

  .filter-pill.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-50);
    color: var(--text-muted);
  }

  .filter-pill.disabled:hover {
    background: var(--gray-50);
    transform: none;
    box-shadow: none;
    color: var(--text-muted);
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
    grid-template-columns: 1fr;
    gap: 1px;
    padding: var(--space-xs);
  }

  .category-chip-mini {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    font-size: 0.8125rem;
    color: var(--text-primary);
    text-align: left;
  }

  .category-chip-mini:hover {
    background: var(--gray-50);
  }

  .category-chip-mini.selected {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .chip-emoji {
    font-size: 0.875rem;
    width: 16px;
    text-align: center;
  }

  .chip-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chip-check {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--acapulco);
  }

</style>