<script lang="ts">
  import { X, Plus, Search } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Transaction, Category } from '$lib/types/transaction';

  // Props
  export let isOpen = false;
  export let transaction: Transaction | null = null;
  export let categories: Category[] = [];
  export let onSelect: (categoryId: string | null) => void = () => {};
  export let onCancel: () => void = () => {};

  let modalElement: HTMLDivElement;
  let searchTerm = '';
  let searchInput: HTMLInputElement;

  // Prevent body scroll when modal is open
  $: if (isOpen) {
    preventBodyScroll();
    // Focus search input when modal opens
    setTimeout(() => {
      searchInput?.focus();
    }, 100);
  } else {
    restoreBodyScroll();
    // Reset search when modal closes
    searchTerm = '';
  }

  function preventBodyScroll() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  function restoreBodyScroll() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === modalElement) {
      closeModal();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function closeModal() {
    isOpen = false;
    onCancel();
  }

  function selectCategory(categoryId: string) {
    onSelect(categoryId);
    closeModal();
  }

  function uncategorizeTransaction() {
    console.log('🔄 Uncategorize button clicked');
    onSelect(null); // Pass null instead of empty string
    closeModal();
  }

  // Group categories by type and filter by search term
  $: isIncomeTransaction = transaction ? transaction.amount > 0 : false;
  $: filteredCategories = categories.filter(cat =>
    searchTerm === '' ||
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  $: groupedCategories = (() => {
    if (isIncomeTransaction) {
      return {
        income: filteredCategories.filter(cat => cat.type === 'income' || cat.type === 'INCOME'),
        no_compute: filteredCategories.filter(cat => cat.type === 'no_compute')
      };
    } else {
      return {
        essential: filteredCategories.filter(cat => cat.type === 'essential'),
        discretionary: filteredCategories.filter(cat => cat.type === 'discretionary'),
        investment: filteredCategories.filter(cat => cat.type === 'investment'),
        debt_payment: filteredCategories.filter(cat => cat.type === 'debt_payment'),
        no_compute: filteredCategories.filter(cat => cat.type === 'no_compute')
      };
    }
  })();

  // Type display names
  const typeDisplayNames = {
    essential: 'Gastos Esenciales',
    discretionary: 'Gastos Discrecionales',
    investment: 'Inversiones',
    debt_payment: 'Pago de Deudas',
    no_compute: 'No Computar',
    income: 'Ingresos'
  };

  function navigateToCategories() {
    closeModal();
    goto('/categories');
  }

  onDestroy(() => {
    restoreBodyScroll();
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && transaction}
  <div
    class="modal-overlay"
    bind:this={modalElement}
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="category-selection-title"
    data-testid="category-modal"
  >
    <div class="modal-content">
      <!-- Header with modern design -->
      <div class="modal-header">
        <div class="header-content">
          <div class="title-section">
            <h2 id="category-selection-title" class="modal-title">Categorizar</h2>
            <p class="modal-subtitle">Selecciona una categoría para organizar esta transacción</p>
          </div>
          <div class="transaction-preview">
            <div class="transaction-info">
              <div class="merchant-name">{transaction.merchant}</div>
              <div class="transaction-details">
                <span class="amount" class:income={transaction.amount > 0}>
                  {new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(Math.abs(transaction.amount))}
                </span>
                <span class="separator">•</span>
                <span class="date">{transaction.time}</span>
              </div>
            </div>
          </div>
        </div>
        <button class="close-btn" on:click={closeModal} aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>

      <!-- Search section -->
      <div class="search-section">
        <div class="search-input-container">
          <input
            bind:this={searchInput}
            bind:value={searchTerm}
            type="text"
            placeholder="🔍 Buscar categorías..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Category sections -->
      <div class="category-content">
        <!-- Uncategorize option - only show if transaction already has a category -->
        {#if transaction?.categoryId}
          <div class="uncategorize-section">
            <button
              class="uncategorize-btn"
              on:click={uncategorizeTransaction}
              data-testid="uncategorize-btn"
            >
              <span class="uncategorize-icon">❌</span>
              <span class="uncategorize-text">Quitar categoría</span>
            </button>
          </div>
        {/if}

        {#if categories.length === 0}
          <div class="empty-categories">
            <div class="empty-categories-content">
              <span class="empty-categories-icon">🏷️</span>
              <p class="empty-categories-text">
                No tienes categorías configuradas. Las categorías te ayudan a organizar y analizar mejor tus gastos e ingresos.
              </p>
              <button
                class="create-categories-btn"
                on:click={navigateToCategories}
              >
                <Plus size={16} />
                Crear categorías
              </button>
            </div>
          </div>
        {:else if isIncomeTransaction}
          {#each Object.entries(groupedCategories) as [type, categoryList]}
            {#if categoryList.length > 0}
              <div class="category-group">
                <h3 class="group-title">{typeDisplayNames[type]}</h3>
                <div class="category-list">
                  {#each categoryList as category}
                    <button
                      class="category-option {type}-type"
                      on:click={() => selectCategory(category.id)}
                    >
                      <span class="category-icon">{category.icon}</span>
                      <span class="category-name">{category.name}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        {:else}
          {#each Object.entries(groupedCategories) as [type, categoryList]}
            {#if categoryList.length > 0}
              <div class="category-group">
                <h3 class="group-title">{typeDisplayNames[type]}</h3>
                <div class="category-list">
                  {#each categoryList as category}
                    <button
                      class="category-option {type}-type"
                      on:click={() => selectCategory(category.id)}
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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    max-width: 500px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes modalSlideIn {
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
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-content {
    flex: 1;
  }

  .title-section {
    margin-bottom: 12px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
    line-height: 1.3;
  }

  .modal-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    font-weight: 400;
    line-height: 1.4;
  }

  .transaction-preview {
    background: var(--surface-muted);
    border-radius: var(--radius-md);
    padding: 12px 14px;
  }

  .transaction-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .merchant-name {
    font-size: 15px;
    color: var(--text-primary);
    font-weight: 600;
    line-height: 1.3;
  }

  .transaction-details {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .amount {
    font-weight: 700;
    color: var(--accent);
    font-size: 14px;
  }

  .amount.income {
    color: var(--success);
  }

  .separator {
    color: var(--gray-300);
    font-weight: 400;
  }

  .date {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .close-btn {
    padding: 8px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: var(--transition-theme);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 16px;
  }

  .close-btn:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .search-section {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .search-input-container {
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 14px;
    color: var(--text-primary);
    background: var(--surface-elevated);
    transition: var(--transition-theme);
    outline: none;
  }

  .search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .category-content {
    padding: 8px 24px 32px;
    max-height: calc(85vh - 140px);
    overflow-y: auto;
  }

  .uncategorize-section {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .uncategorize-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 16px;
    border: 2px dashed var(--accent);
    border-radius: var(--radius-lg);
    background: var(--accent-light);
    color: var(--accent);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition-theme);
    text-align: left;
  }

  .uncategorize-btn:hover {
    background: var(--accent-light);
    border-color: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 121, 108, 0.15);
  }

  .uncategorize-btn:active {
    transform: scale(0.98);
  }

  .uncategorize-icon {
    font-size: 18px;
    line-height: 1;
  }

  .uncategorize-text {
    font-size: 14px;
    font-weight: 600;
  }

  .category-group {
    margin-bottom: 24px;
  }

  .category-group:last-child {
    margin-bottom: 0;
  }

  .group-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 12px 0;
    padding-left: 2px;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .category-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    cursor: pointer;
    transition: var(--transition-theme);
    position: relative;
    text-align: left;
    width: 100%;
  }

  .category-option:hover {
    transform: translateY(-1px);
    border-color: var(--border-color-hover);
  }

  .category-option:active {
    transform: scale(0.98);
  }

  /* Type-specific background colors using app's palette */
  .essential-type {
    background: var(--warning-light);
    border-color: var(--warning);
  }

  .essential-type:hover {
    background: var(--warning-light);
    border-color: var(--warning-hover);
    box-shadow: 0 8px 25px rgba(254, 205, 44, 0.15);
  }

  .discretionary-type {
    background: var(--accent-light);
    border-color: var(--accent);
  }

  .discretionary-type:hover {
    background: var(--accent-light);
    border-color: var(--accent-hover);
    box-shadow: 0 8px 25px rgba(245, 121, 108, 0.15);
  }

  .investment-type {
    background: var(--success-light);
    border-color: var(--success);
  }

  .investment-type:hover {
    background: var(--success-light);
    border-color: var(--success-hover);
    box-shadow: 0 8px 25px rgba(122, 186, 165, 0.15);
  }

  .debt_payment-type {
    background: var(--accent-light);
    border-color: var(--accent);
  }

  .debt_payment-type:hover {
    background: var(--accent-light);
    border-color: var(--accent-hover);
    box-shadow: 0 8px 25px rgba(245, 121, 108, 0.15);
  }

  .income-type {
    background: var(--success-light);
    border-color: var(--success);
  }

  .income-type:hover {
    background: var(--success-light);
    border-color: var(--success-hover);
    box-shadow: 0 8px 25px rgba(122, 186, 165, 0.15);
  }

  .no_compute-type {
    background: var(--surface-muted);
    border-color: var(--gray-300);
  }

  .no_compute-type:hover {
    background: var(--surface-muted);
    border-color: var(--gray-400);
    box-shadow: 0 8px 25px rgba(120, 113, 108, 0.08);
  }


  .category-icon {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
  }

  .category-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.3;
    flex: 1;
  }

  .empty-categories {
    padding: 2rem 1.5rem;
    text-align: center;
    background: var(--surface-muted);
    border-radius: var(--radius-lg);
    margin: 0 8px;
  }

  .empty-categories-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .empty-categories-icon {
    font-size: 2.5rem;
    opacity: 0.7;
  }

  .empty-categories-text {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
    max-width: 300px;
  }

  .create-categories-btn {
    padding: 12px 20px;
    border: 2px solid var(--success);
    border-radius: var(--radius-lg);
    background: var(--success);
    color: var(--surface-elevated);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition-theme);
    outline: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .create-categories-btn:hover {
    background: var(--success-hover);
    border-color: var(--success-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(122, 186, 165, 0.25);
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .modal-overlay {
      padding: 16px;
    }

    .modal-content {
      max-width: none;
      width: 100%;
    }

    .modal-header {
      padding: 24px 20px 16px;
    }

    .category-content {
      padding: 16px 20px 24px;
    }

    .search-section {
      padding: 16px 20px;
    }

    .search-input {
      padding: 12px 16px;
      font-size: 14px;
    }

    .category-option {
      padding: 14px 14px;
      gap: 14px;
    }

    .category-icon {
      font-size: 20px;
    }

    .category-name {
      font-size: 14px;
    }

    .group-title {
      padding: 14px 16px 10px;
      font-size: 12px;
    }
  }

  @media (max-width: 360px) {
    .modal-header {
      padding: 16px;
    }

    .category-content {
      padding: 12px 16px 20px;
    }

    .search-section {
      padding: 16px 16px 16px;
    }

    .search-input {
      padding: 12px 12px 12px 40px;
      font-size: 14px;
    }

    .uncategorize-btn {
      padding: 16px 18px;
      gap: 12px;
    }
  }

  /* Scrollbar styling */
  .category-content::-webkit-scrollbar {
    width: 6px;
  }

  .category-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .category-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .category-content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>