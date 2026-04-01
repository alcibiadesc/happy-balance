<script lang="ts">
  import { X, Search } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import type { Category } from '$lib/types/transaction';

  interface Props {
    isOpen: boolean;
    categories: Category[];
    transactionType: string;
    onSelect: (categoryId: string) => void;
    onCancel: () => void;
  }

  const { isOpen, categories, transactionType, onSelect, onCancel }: Props = $props();

  let searchTerm = $state('');

  // Type display names
  const typeDisplayNames: Record<string, string> = {
    essential: 'Gastos Esenciales',
    discretionary: 'Gastos Discrecionales',
    investment: 'Inversiones',
    debt_payment: 'Pago de Deudas',
    no_compute: 'No Computar',
    income: 'Ingresos',
  };

  function normalizeForSearch(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  const isIncomeTransaction = $derived(transactionType === 'INCOME');
  const isInvestmentTransaction = $derived(transactionType === 'INVESTMENT');

  const filteredCategories = $derived(
    categories.filter(
      (cat) =>
        searchTerm === '' || normalizeForSearch(cat.name).includes(normalizeForSearch(searchTerm))
    )
  );

  const groupedCategories = $derived.by(() => {
    if (isIncomeTransaction) {
      return {
        income: filteredCategories.filter((cat) => cat.type === 'income'),
        no_compute: filteredCategories.filter((cat) => cat.type === 'no_compute'),
      };
    }
    if (isInvestmentTransaction) {
      return {
        investment: filteredCategories.filter((cat) => cat.type === 'investment'),
        no_compute: filteredCategories.filter((cat) => cat.type === 'no_compute'),
      };
    }
    return {
      essential: filteredCategories.filter((cat) => cat.type === 'essential'),
      discretionary: filteredCategories.filter((cat) => cat.type === 'discretionary'),
      investment: filteredCategories.filter((cat) => cat.type === 'investment'),
      debt_payment: filteredCategories.filter((cat) => cat.type === 'debt_payment'),
      no_compute: filteredCategories.filter((cat) => cat.type === 'no_compute'),
    };
  });

  // Reset search when opened
  $effect(() => {
    if (isOpen) {
      searchTerm = '';
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="picker-backdrop" onclick={onCancel} role="presentation"></div>
  <div class="picker-sheet" role="dialog" aria-modal="true" aria-label={$t('tinder.pick_category')}>
    <div class="picker-header">
      <h3 class="picker-title">{$t('tinder.pick_category')}</h3>
      <button class="close-btn" onclick={onCancel} aria-label={$t('common.close')}>
        <X size={18} />
      </button>
    </div>

    <div class="picker-search">
      <Search size={16} />
      <input
        bind:value={searchTerm}
        type="text"
        placeholder={$t('common.search')}
        class="search-input"
      />
    </div>

    <div class="picker-content">
      {#each Object.entries(groupedCategories) as [type, categoryList]}
        {#if categoryList.length > 0}
          <div class="category-group">
            <h4 class="group-title">{typeDisplayNames[type] || type}</h4>
            <div class="category-grid">
              {#each categoryList as category (category.id)}
                <button
                  class="category-chip"
                  style="background-color: {category.color}15; border-color: {category.color};"
                  onclick={() => onSelect(category.id)}
                >
                  <span class="chip-icon">{category.icon}</span>
                  <span class="chip-name">{category.name}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  .picker-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    z-index: 1200;
  }

  .picker-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    background: var(--surface-elevated);
    border-radius: var(--radius-xl, 1rem) var(--radius-xl, 1rem) 0 0;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
    z-index: 1201;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg, 1rem) var(--space-xl, 1.5rem);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .picker-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm, 0.25rem);
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .picker-search {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 0.5rem);
    padding: var(--space-md, 0.75rem) var(--space-xl, 1.5rem);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: none;
    font-size: 0.875rem;
    color: var(--text-primary);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .picker-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md, 0.75rem) var(--space-xl, 1.5rem) var(--space-2xl, 2rem);
  }

  .category-group {
    margin-bottom: var(--space-lg, 1rem);
  }

  .group-title {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 var(--space-sm, 0.5rem);
  }

  .category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs, 0.25rem);
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.25rem);
    padding: 0.5rem 0.75rem;
    border: 1.5px solid;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface-elevated);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 0.8125rem;
  }

  .category-chip:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .chip-icon {
    font-size: 1rem;
  }

  .chip-name {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
  }

  /* Scrollbar */
  .picker-content::-webkit-scrollbar {
    width: 4px;
  }

  .picker-content::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 2px;
  }
</style>
