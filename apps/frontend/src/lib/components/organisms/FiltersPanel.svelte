<script lang="ts">
  import { TrendingUp, TrendingDown, X, Tag } from 'lucide-svelte';
  import type { Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';
  import FilterPill from '../atoms/FilterPill.svelte';
  import ActiveFilterTags from '../molecules/ActiveFilterTags.svelte';
  import CategoryDropdown from '../molecules/CategoryDropdown.svelte';

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

  let showCategoryDropdown = $state(false);
  let showPrimaryTypeDropdown = $state(false);

  const primaryTypeNames: Record<string, string> = {
    income: '💰 Ingresos',
    essential: '🏠 Esenciales',
    discretionary: '🎉 Discrecionales',
    investment: '📈 Inversiones',
    debt_payment: '💳 Pago Deudas',
    no_compute: '🚫 No Computar',
  };

  const categoryItems = $derived(
    categories.map((c) => ({ id: c.id, label: c.name, icon: c.icon }))
  );

  const primaryTypeItems = $derived(
    Object.entries(primaryTypeNames).map(([id, label]) => ({ id, label }))
  );

  const hasActiveFilters = $derived(
    transactionTypeFilter !== 'all' ||
      selectedCategories.length > 0 ||
      selectedPrimaryTypes.length > 0 ||
      showUncategorized
  );

  const transactionType = $derived(
    transactionTypeFilter === 'income'
      ? 'income'
      : transactionTypeFilter === 'expenses'
        ? 'expenses'
        : null
  );
</script>

{#if visible}
  <div class="filters-bento" class:visible>
    <div class="filter-grid">
      <!-- Quick Type Filters -->
      <div class="bento-item quick-filters">
        <FilterPill
          variant="income"
          active={transactionTypeFilter === 'income'}
          onclick={() =>
            onTransactionTypeFilter(transactionTypeFilter === 'income' ? 'all' : 'income')}
        >
          <TrendingUp size={12} />
          <span>Ingresos</span>
        </FilterPill>

        <FilterPill
          variant="expense"
          active={transactionTypeFilter === 'expenses'}
          onclick={() =>
            onTransactionTypeFilter(transactionTypeFilter === 'expenses' ? 'all' : 'expenses')}
        >
          <TrendingDown size={12} />
          <span>Gastos</span>
        </FilterPill>

        <FilterPill
          variant="uncategorized"
          active={showUncategorized}
          onclick={onToggleShowUncategorized}
        >
          <Tag size={12} style="opacity: 0.5" />
          <span>{$t('transactions.period.uncategorized')}</span>
        </FilterPill>
      </div>

      <!-- Category Selector -->
      <div class="bento-item">
        <CategoryDropdown
          label="Categorías"
          items={categoryItems}
          selectedIds={selectedCategories}
          open={showCategoryDropdown}
          onToggle={() => (showCategoryDropdown = !showCategoryDropdown)}
          onSelectItem={onToggleCategory}
        />
      </div>

      <!-- Primary Type Selector -->
      <div class="bento-item">
        <CategoryDropdown
          label="Tipos de categoría"
          items={primaryTypeItems}
          selectedIds={selectedPrimaryTypes}
          open={showPrimaryTypeDropdown}
          onToggle={() => (showPrimaryTypeDropdown = !showPrimaryTypeDropdown)}
          onSelectItem={onTogglePrimaryType}
        />
      </div>

      <!-- Clear Button -->
      {#if hasActiveFilters}
        <div class="bento-item clear-section">
          <FilterPill variant="clear" onclick={onClearFilters}>
            <X size={12} />
            <span>Limpiar</span>
          </FilterPill>
        </div>
      {/if}
    </div>

    <!-- Active Tags -->
    <ActiveFilterTags
      {transactionType}
      {showUncategorized}
      {selectedCategories}
      {selectedPrimaryTypes}
      {categories}
      {primaryTypeNames}
      onRemoveTransactionType={() => onTransactionTypeFilter('all')}
      onRemoveUncategorized={onToggleShowUncategorized}
      onRemoveCategory={onToggleCategory}
      onRemovePrimaryType={onTogglePrimaryType}
    />
  </div>
{/if}

<style>
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

  .quick-filters {
    display: flex;
    gap: 0.25rem;
  }

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

  @media (max-width: 768px) {
    .filters-bento {
      padding: 1rem;
    }

    .filter-grid {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }

    .bento-item {
      width: 100%;
    }

    .quick-filters {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .filter-grid {
      grid-template-columns: 1fr;
    }

    .quick-filters {
      flex-direction: column;
    }
  }

  @media (max-width: 360px) {
    .filters-bento {
      padding: 0.5rem;
      margin: 0.5rem auto 1rem auto;
      border-radius: 0.75rem;
    }

    .bento-item {
      padding: 0.25rem;
      border-radius: 0.5rem;
    }

    .quick-filters {
      gap: 0.25rem;
    }
  }
</style>
