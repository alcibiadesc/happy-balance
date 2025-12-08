<script lang="ts">
  import { X, Plus } from 'lucide-svelte';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';
  import { formatCurrency } from '$lib/stores/currency';

  interface Props {
    isOpen: boolean;
    transaction: Transaction | null;
    categories: Category[];
    onSelect: (categoryId: string | null) => void;
    onCancel: () => void;
  }

  let {
    isOpen = false,
    transaction = null,
    categories = [],
    onSelect = () => {},
    onCancel = () => {},
  }: Props = $props();

  let searchTerm = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);

  // Type display names
  const typeDisplayNames: Record<string, string> = {
    essential: 'Gastos Esenciales',
    discretionary: 'Gastos Discrecionales',
    investment: 'Inversiones',
    debt_payment: 'Pago de Deudas',
    no_compute: 'No Computar',
    income: 'Ingresos',
  };

  // Derived values
  const isIncomeTransaction = $derived(transaction ? transaction.amount > 0 : false);

  const filteredCategories = $derived(
    categories.filter(
      (cat) =>
        searchTerm === '' || normalizeForSearch(cat.name).includes(normalizeForSearch(searchTerm))
    )
  );

  const groupedCategories = $derived.by(() => {
    if (isIncomeTransaction) {
      return {
        income: filteredCategories.filter((cat) => cat.type === 'income' || cat.type === 'INCOME'),
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

  // Effects
  $effect(() => {
    if (isOpen) {
      preventBodyScroll();
      setTimeout(() => searchInput?.focus(), 100);
    } else {
      restoreBodyScroll();
      searchTerm = '';
    }
  });

  // Helper functions
  function preventBodyScroll() {
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }

  function restoreBodyScroll() {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }

  function normalizeForSearch(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  onDestroy(() => restoreBodyScroll());
</script>

<div use:modalKeyboard={{ onCancel, isOpen }}></div>

{#if isOpen && transaction}
  <div
    class="modal-overlay"
    onclick={(e) => e.target === e.currentTarget && onCancel()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="title-section">
            <h2 class="modal-title">Categorizar</h2>
            <p class="modal-subtitle">Selecciona una categoría para organizar esta transacción</p>
          </div>
          <div class="transaction-preview">
            <div class="merchant-name">{transaction.merchant}</div>
            <div class="transaction-details">
              <span class="amount" class:income={transaction.amount > 0}>
                {formatCurrency(transaction.amount)}
              </span>
              <span class="separator">•</span>
              <span class="date">{transaction.time}</span>
            </div>
          </div>
        </div>
        <button class="close-btn" onclick={onCancel}><X size={18} /></button>
      </div>

      <!-- Search -->
      <div class="search-section">
        <input
          bind:this={searchInput}
          bind:value={searchTerm}
          type="text"
          placeholder="🔍 Buscar categorías..."
          class="search-input"
        />
      </div>

      <!-- Categories -->
      <div class="category-content">
        {#if transaction.categoryId}
          <div class="uncategorize-section">
            <button class="uncategorize-btn" onclick={() => onSelect(null)}>
              <span>❌</span>
              <span>Quitar categoría</span>
            </button>
          </div>
        {/if}

        {#if categories.length === 0}
          <div class="empty-categories">
            <span class="empty-icon">🏷️</span>
            <p>No tienes categorías configuradas.</p>
            <button
              class="create-btn"
              onclick={() => {
                onCancel();
                goto('/categories');
              }}
            >
              <Plus size={16} /> Crear categorías
            </button>
          </div>
        {:else}
          {#each Object.entries(groupedCategories) as [type, categoryList]}
            {#if categoryList.length > 0}
              <div class="category-group">
                <h3 class="group-title">{typeDisplayNames[type]}</h3>
                <div class="category-list">
                  {#each categoryList as category (category.id)}
                    <button
                      class="category-option {type}-type"
                      style="background-color: {category.color}20; border-color: {category.color};"
                      onclick={() => onSelect(category.id)}
                    >
                      <span class="category-icon">{category.icon}</span>
                      <span class="category-name">{category.name}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 1rem;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 1rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .header-content {
    flex: 1;
  }

  .title-section {
    margin-bottom: 0.75rem;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .modal-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .transaction-preview {
    background: var(--surface-muted);
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .merchant-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .transaction-details {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .amount {
    font-weight: 700;
    color: var(--froly);
  }

  .amount.income {
    color: var(--acapulco);
  }

  .separator {
    color: var(--text-muted);
  }

  .date {
    color: var(--text-secondary);
  }

  .close-btn {
    padding: 0.5rem;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s;
    margin-left: 1rem;
  }

  .close-btn:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .search-section {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-primary);
    background: var(--surface-elevated);
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary);
  }

  .category-content {
    padding: 0.5rem 1.5rem 1.5rem;
    flex: 1;
    overflow-y: auto;
  }

  .uncategorize-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .uncategorize-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem;
    border: 2px dashed var(--froly);
    border-radius: 0.75rem;
    background: rgba(245, 121, 108, 0.1);
    color: var(--froly);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .uncategorize-btn:hover {
    transform: translateY(-1px);
  }

  .category-group {
    margin-bottom: 1.5rem;
  }

  .group-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 0.75rem;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .category-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1.5px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface-elevated);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .category-option:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  .category-icon {
    font-size: 1.25rem;
  }

  .category-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    flex: 1;
  }

  .empty-categories {
    padding: 2rem;
    text-align: center;
    background: var(--surface-muted);
    border-radius: 0.75rem;
  }

  .empty-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  .empty-categories p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }

  .create-btn {
    padding: 0.75rem 1.25rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .create-btn:hover {
    opacity: 0.9;
  }

  /* Type-specific colors */
  .essential-type {
    background: rgba(254, 205, 44, 0.1);
    border-color: #fecd2c;
  }
  .discretionary-type {
    background: rgba(245, 121, 108, 0.1);
    border-color: #f5796c;
  }
  .investment-type,
  .income-type {
    background: rgba(122, 186, 165, 0.1);
    border-color: #7abaa5;
  }
  .debt_payment-type {
    background: rgba(245, 121, 108, 0.1);
    border-color: #f5796c;
  }
  .no_compute-type {
    background: var(--surface-muted);
    border-color: var(--border-color);
  }

  @media (max-width: 480px) {
    .modal-header {
      padding: 1rem;
    }
    .search-section {
      padding: 0.75rem 1rem;
    }
    .category-content {
      padding: 0.5rem 1rem 1rem;
    }
    .modal-title {
      font-size: 1rem;
    }
  }

  @media (max-width: 360px) {
    .modal-overlay {
      padding: 0.5rem;
    }
    .modal-content {
      max-height: 90vh;
    }
  }

  .category-content::-webkit-scrollbar {
    width: 6px;
  }
  .category-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
</style>
