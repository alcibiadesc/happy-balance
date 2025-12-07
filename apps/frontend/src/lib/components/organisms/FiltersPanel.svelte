<script lang="ts">
  import { TrendingUp, TrendingDown, Check, X, Tag, ChevronDown } from 'lucide-svelte';
  import type { Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';

  interface Props {
    visible: boolean;
    transactionTypeFilter: 'all' | 'income' | 'expenses' | 'uncategorized';
    selectedCategories: string[];
    selectedPrimaryTypes: string[];
    showUncategorized: boolean;
    categories: Category[];
    onTransactionTypeFilter: (type: 'all' | 'income' | 'expenses' | 'uncategorized') => void;
    onToggleCategory: (categoryId: string) => void;
    onTogglePrimaryType: (primaryType: string) => void;
    onToggleShowUncategorized: () => void;
    onClearFilters: () => void;
  }

  const {
    visible,
    transactionTypeFilter,
    selectedCategories,
    selectedPrimaryTypes,
    showUncategorized,
    categories,
    onTransactionTypeFilter,
    onToggleCategory,
    onTogglePrimaryType,
    onToggleShowUncategorized,
    onClearFilters,
  }: Props = $props();

  let showCategoryFilterDropdown = $state(false);
  let showPrimaryTypeDropdown = $state(false);

  const primaryTypeNames = {
    income: '💰 Ingresos',
    essential: '🏠 Esenciales',
    discretionary: '🎉 Discrecionales',
    investment: '📈 Inversiones',
    debt_payment: '💳 Pago Deudas',
    no_compute: '🚫 No Computar',
  };
</script>

{#if visible}
  <div class="filters-bento" class:visible>
    <!-- Filter Grid - Bento Box Layout -->
    <div class="filter-grid">
      <!-- Quick Type Filters -->
      <div class="bento-item quick-filters">
        <button
          class="filter-pill income"
          class:active={transactionTypeFilter === 'income'}
          onclick={() => {
            onTransactionTypeFilter(transactionTypeFilter === 'income' ? 'all' : 'income');
          }}
          aria-pressed={transactionTypeFilter === 'income'}
        >
          <TrendingUp size={12} class="pill-icon" />
          <span>Ingresos</span>
          {#if transactionTypeFilter === 'income'}
            <span class="pill-indicator"></span>
          {/if}
        </button>

        <button
          class="filter-pill expense"
          class:active={transactionTypeFilter === 'expenses'}
          onclick={() => {
            onTransactionTypeFilter(transactionTypeFilter === 'expenses' ? 'all' : 'expenses');
          }}
          aria-pressed={transactionTypeFilter === 'expenses'}
        >
          <TrendingDown size={12} class="pill-icon" />
          <span>Gastos</span>
          {#if transactionTypeFilter === 'expenses'}
            <span class="pill-indicator"></span>
          {/if}
        </button>

        <button
          class="filter-pill uncategorized"
          class:active={showUncategorized}
          onclick={onToggleShowUncategorized}
          aria-pressed={showUncategorized}
        >
          <Tag size={12} class="pill-icon" style="opacity: 0.5" />
          <span>{$t('transactions.period.uncategorized')}</span>
          {#if showUncategorized}
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
              {#each categories as category (category.id)}
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

      <!-- Primary Type Selector -->
      <div class="bento-item category-selector">
        <button
          class="category-pill"
          class:active={selectedPrimaryTypes.length > 0}
          class:open={showPrimaryTypeDropdown}
          onclick={(e) => {
            e.stopPropagation();
            showPrimaryTypeDropdown = !showPrimaryTypeDropdown;
          }}
        >
          <Tag size={12} />
          <span>
            {selectedPrimaryTypes.length > 0
              ? `${selectedPrimaryTypes.length} tipos`
              : 'Tipos de categoría'}
          </span>
          <ChevronDown size={12} class="chevron {showPrimaryTypeDropdown ? 'rotated' : ''}" />
        </button>

        {#if showPrimaryTypeDropdown}
          <div class="category-dropdown-mini">
            <div class="category-grid-compact">
              {#each Object.entries(primaryTypeNames) as [type, name] (type)}
                <button
                  class="category-chip-mini"
                  class:selected={selectedPrimaryTypes.includes(type)}
                  onclick={() => onTogglePrimaryType(type)}
                >
                  <span class="chip-name">{name}</span>
                  {#if selectedPrimaryTypes.includes(type)}
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
      {#if transactionTypeFilter !== 'all' || selectedCategories.length > 0 || selectedPrimaryTypes.length > 0 || showUncategorized}
        <div class="bento-item clear-section">
          <button class="clear-pill" onclick={onClearFilters}>
            <X size={12} />
            <span>Limpiar</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Active Tags (minimal display) -->
    {#if transactionTypeFilter !== 'all' || selectedCategories.length > 0 || selectedPrimaryTypes.length > 0 || showUncategorized}
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

        {#if showUncategorized}
          <button
            class="tag-mini uncategorized-tag"
            onclick={onToggleShowUncategorized}
            aria-label={$t('accessibility.remove_filter')}
          >
            <Tag size={10} style="opacity: 0.5" />
            <span>{$t('transactions.period.uncategorized')}</span>
            <X size={10} class="tag-close" />
          </button>
        {/if}

        {#each selectedPrimaryTypes as primaryType (primaryType)}
          <button
            class="tag-mini primary-type-tag"
            onclick={() => onTogglePrimaryType(primaryType)}
            aria-label="Remove primary type filter"
          >
            <span>{primaryTypeNames[primaryType]}</span>
            <X size={10} class="tag-close" />
          </button>
        {/each}

        {#each selectedCategories as categoryId (categoryId)}
          {@const category = categories.find((c) => c.id === categoryId)}
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
    background: var(--surface-elevated);
    border: none;
    padding: 1.5rem;
    margin: 1rem auto 2rem auto;
    max-width: 1200px;
    opacity: 0;
    transform: translateY(-8px);
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    position: relative;
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
  }

  .filters-bento:hover {
    box-shadow: var(--shadow-lg);
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
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.625rem;
    padding: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bento-item:hover {
    background: var(--surface-hover);
    border-color: var(--border-color-hover);
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
    background: var(--surface-muted);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
  }

  .filter-pill:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
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
    background: var(--surface-muted);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    justify-content: space-between;
    min-width: 180px;
    position: relative;
  }

  .category-pill:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
  }

  .category-pill.active {
    background: var(--acapulco-alpha-10);
    color: var(--acapulco);
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.15);
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
    background: var(--acapulco-alpha-10);
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
    background: var(--error-bg);
    color: #ef4444;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .clear-pill:hover {
    background: var(--error);
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
    background: var(--surface-muted);
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
    background: var(--surface-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .tag-mini:hover {
    background: var(--surface-hover);
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
    background: var(--success-light);
    color: #10b981;
  }

  .tag-mini.expense-tag {
    background: var(--error-bg);
    color: #ef4444;
  }

  .tag-mini.uncategorized-tag {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .tag-mini.category-tag {
    background: var(--surface-muted);
    color: var(--text-secondary);
  }

  .tag-mini.primary-type-tag {
    background: var(--primary-light);
    color: var(--primary);
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
      margin: 0.5rem auto 1rem auto;
      border-radius: 0.75rem;
    }

    .bento-item {
      padding: var(--space-xs);
      border-radius: 0.5rem;
    }

    .quick-filters {
      gap: 0.25rem;
    }

    .filter-pill,
    .category-pill,
    .clear-pill {
      padding: 0.375rem 0.625rem;
      font-size: 0.6875rem;
      min-height: 2rem;
      gap: 0.25rem;
    }

    .filter-pill :global(svg),
    .category-pill :global(svg),
    .clear-pill :global(svg) {
      width: 10px;
      height: 10px;
    }

    .tag-mini {
      font-size: 0.625rem;
      padding: 0.25rem 0.5rem;
      min-height: 1.5rem;
    }

    .active-tags-mini {
      padding: 0.5rem;
      margin-top: 0.75rem;
      min-height: 2rem;
      gap: 0.375rem;
    }

    .category-dropdown-mini {
      min-width: 180px;
      max-width: calc(100vw - 2rem);
      max-height: 120px;
    }

    .category-chip-mini {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .chip-emoji {
      font-size: 0.75rem;
    }
  }
</style>
