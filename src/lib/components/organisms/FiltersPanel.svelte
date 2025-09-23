<script lang="ts">
  import { TrendingUp, TrendingDown, Check, X, Tag, ChevronDown } from 'lucide-svelte';
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

  let showCategoryFilterDropdown = $state(false);
</script>

{#if visible}
  <div class="filters-bento" class:visible>
    <!-- Filter Grid - Bento Box Layout -->
    <div class="filter-grid">
      <!-- Quick Type Filters -->
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
          aria-pressed={transactionTypeFilter === 'income'}
        >
          <TrendingUp size={12} class="pill-icon" />
          <span>Ingresos</span>
          {#if transactionTypeFilter === 'income' && selectedCategories.length === 0}
            <span class="pill-indicator"></span>
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
          aria-pressed={transactionTypeFilter === 'expenses'}
        >
          <TrendingDown size={12} class="pill-icon" />
          <span>Gastos</span>
          {#if transactionTypeFilter === 'expenses' && selectedCategories.length === 0}
            <span class="pill-indicator"></span>
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
          aria-pressed={transactionTypeFilter === 'uncategorized'}
        >
          <Tag size={12} class="pill-icon" style="opacity: 0.5" />
          <span>{$t('transactions.period.uncategorized')}</span>
          {#if transactionTypeFilter === 'uncategorized' && selectedCategories.length === 0}
            <span class="pill-indicator"></span>
          {/if}
        </button>
      </div>

      <!-- Category Selector -->
      <div class="bento-item category-selector">
        <button
          class="category-pill"
          class:active={selectedCategories.length > 0}
          class:open={showCategoryFilterDropdown}
          onclick={(e) => {
            e.stopPropagation();
            showCategoryFilterDropdown = !showCategoryFilterDropdown;
          }}
        >
          <Tag size={12} />
          <span>
            {selectedCategories.length > 0
              ? `${selectedCategories.length} categorías`
              : 'Categorías'}
          </span>
          <ChevronDown size={12} class="chevron {showCategoryFilterDropdown ? 'rotated' : ''}" />
        </button>

        {#if showCategoryFilterDropdown}
          <div class="category-dropdown-mini">
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
                      <Check size={8} />
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Clear Button (when filters active) -->
      {#if transactionTypeFilter !== 'all' || selectedCategories.length > 0}
        <div class="bento-item clear-section">
          <button class="clear-pill" onclick={onClearFilters}>
            <X size={12} />
            <span>Limpiar</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Active Tags (minimal display) -->
    {#if transactionTypeFilter !== 'all' || selectedCategories.length > 0}
      <div class="active-tags-mini">
        {#if transactionTypeFilter === 'income'}
          <button
            class="tag-mini income-tag"
            onclick={() => onTransactionTypeFilter('all')}
            aria-label={$t('accessibility.remove_income_filter')}
          >
            <TrendingUp size={10} />
            <span>Ingresos</span>
            <X size={10} class="tag-close" />
          </button>
        {/if}

        {#if transactionTypeFilter === 'expenses'}
          <button
            class="tag-mini expense-tag"
            onclick={() => onTransactionTypeFilter('all')}
            aria-label={$t('accessibility.remove_expense_filter')}
          >
            <TrendingDown size={10} />
            <span>Gastos</span>
            <X size={10} class="tag-close" />
          </button>
        {/if}

        {#if transactionTypeFilter === 'uncategorized'}
          <button
            class="tag-mini uncategorized-tag"
            onclick={() => onTransactionTypeFilter('all')}
            aria-label={$t('accessibility.remove_filter')}
          >
            <Tag size={10} style="opacity: 0.5" />
            <span>{$t('transactions.period.uncategorized')}</span>
            <X size={10} class="tag-close" />
          </button>
        {/if}

        {#each selectedCategories as categoryId}
          {@const category = categories.find(c => c.id === categoryId)}
          {#if category}
            <button
              class="tag-mini category-tag"
              style="--category-color: {category.color}"
              onclick={() => onToggleCategory(categoryId)}
              aria-label={$t('common.delete')}
            >
              <span class="tag-emoji">{category.icon}</span>
              <span>{category.name}</span>
              <X size={10} class="tag-close" />
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Bento Box Filters */
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

  /* Bento Grid Layout */
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

  /* Quick Filters Pills */
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

  .filter-pill:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: #475569;
  }

  .filter-pill:active {
    background: var(--gray-100);
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

  .filter-pill.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-50);
    border-color: var(--gray-100);
    color: var(--text-muted);
  }

  .filter-pill.disabled:hover {
    background: var(--gray-50);
    border-color: var(--gray-100);
    color: var(--text-muted);
    transform: none;
    box-shadow: none;
  }

  /* Category Selector */
  .category-selector {
    position: relative;
    z-index: 30;
  }

  .category-pill {
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
    justify-content: space-between;
    min-width: 180px;
    position: relative;
  }

  .category-pill:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: #475569;
  }

  .category-pill.active {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.15);
  }

  .chevron {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0.5;
  }

  .chevron.rotated {
    transform: rotate(180deg);
    opacity: 0.8;
  }

  /* Compact Category Dropdown */
  .category-dropdown-mini {
    position: absolute;
    top: calc(100% + var(--space-xs));
    left: 0;
    right: 0;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 35;
    max-height: 200px;
    overflow-y: auto;
    min-width: 240px;
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
    text-align: left;
    font-weight: 500;
  }

  .chip-check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--acapulco);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    margin-left: auto;
  }

  /* Clear Button */
  .clear-section {
    opacity: 0;
    animation: slideInFade 0.25s ease forwards;
  }

  @keyframes slideInFade {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .clear-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: #FEE2E2;
    color: #EF4444;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .clear-pill:hover {
    background: #FCA5A5;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.15);
  }

  /* Active Tags */
  .active-tags-mini {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(249, 250, 251, 0.5);
    border-radius: 0.75rem;
    border: 1px dashed rgba(209, 213, 219, 0.5);
    position: relative;
    min-height: 3rem;
    align-items: center;
  }

  .active-tags-mini:empty {
    display: none;
  }

  .tag-mini {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    min-height: 2rem;
    border: none;
    border-radius: 1rem;
    background: #FFF7ED;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .tag-mini:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .tag-emoji {
    font-size: 0.75rem;
  }

  .tag-close {
    margin-left: 0.25rem;
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .tag-mini:hover .tag-close {
    opacity: 0.7;
  }

  .tag-mini.income-tag {
    background: #E6F7F2;
    color: #10B981;
  }

  .tag-mini.expense-tag {
    background: #FEE2E2;
    color: #EF4444;
  }

  .tag-mini.uncategorized-tag {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .tag-mini.category-tag {
    background: #FFF7ED;
    color: #64748b;
  }

  /* Responsive Bento Grid */
  @media (max-width: 768px) {
    .filters-bento {
      padding: var(--space-md);
    }

    .filter-grid {
      grid-template-columns: 1fr;
      gap: var(--space-xs);
    }

    .bento-item {
      width: 100%;
    }

    .quick-filters {
      justify-content: center;
    }

    .filter-pill {
      flex: 1;
      justify-content: center;
    }

    .category-dropdown-mini {
      min-width: auto;
      left: 0;
      right: 0;
    }
  }

  @media (max-width: 480px) {
    .filter-grid {
      grid-template-columns: 1fr;
    }

    .quick-filters {
      flex-direction: column;
    }

    .filter-pill {
      justify-content: center;
      min-height: 32px;
    }

    .category-pill {
      min-width: auto;
      justify-content: center;
    }

    .category-dropdown-mini {
      max-height: 150px;
    }

    .active-tags-mini {
      justify-content: center;
    }
  }

  /* Ultra-compact for very small screens */
  @media (max-width: 360px) {
    .filters-bento {
      padding: var(--space-sm);
    }

    .bento-item {
      padding: var(--space-xs);
    }

    .filter-pill,
    .category-pill,
    .clear-pill {
      padding: var(--space-xs);
      font-size: 0.75rem;
    }

    .tag-mini {
      font-size: 0.625rem;
      padding: 1px var(--space-xs);
    }

    .category-dropdown-compact {
      min-width: 200px;
      max-width: 240px;
      left: auto;
      right: 0;
    }

    .category-grid-item {
      width: 32px;
      height: 32px;
    }
  }
</style>