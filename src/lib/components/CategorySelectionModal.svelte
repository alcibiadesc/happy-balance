<script lang="ts">
  import { X, Plus } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Transaction, Category } from '$lib/types/transaction';

  // Props
  export let isOpen = false;
  export let transaction: Transaction | null = null;
  export let categories: Category[] = [];
  export let onSelect: (categoryId: string) => void = () => {};
  export let onCancel: () => void = () => {};

  let modalElement: HTMLDivElement;

  // Prevent body scroll when modal is open
  $: if (isOpen) {
    preventBodyScroll();
  } else {
    restoreBodyScroll();
  }

  function preventBodyScroll() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    }
  }

  function restoreBodyScroll() {
    if (typeof document !== 'undefined') {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
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

  // Group categories by type
  $: isIncomeTransaction = transaction ? transaction.amount > 0 : false;
  $: groupedCategories = (() => {
    if (isIncomeTransaction) {
      return {
        income: categories.filter(cat => cat.type === 'income' || cat.type === 'INCOME'),
        no_compute: categories.filter(cat => cat.type === 'no_compute')
      };
    } else {
      return {
        essential: categories.filter(cat => cat.type === 'essential'),
        discretionary: categories.filter(cat => cat.type === 'discretionary'),
        investment: categories.filter(cat => cat.type === 'investment'),
        debt_payment: categories.filter(cat => cat.type === 'debt_payment'),
        no_compute: categories.filter(cat => cat.type === 'no_compute')
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
  >
    <div class="modal-content">
      <!-- Header with minimal design -->
      <div class="modal-header">
        <div class="header-content">
          <h2 id="category-selection-title" class="modal-title">Categorizar transacción</h2>
          <div class="transaction-preview">
            <span class="merchant">{transaction.merchant}</span>
            <span class="amount" class:income={transaction.amount > 0}>
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(Math.abs(transaction.amount))}
            </span>
          </div>
        </div>
        <button class="close-btn" on:click={closeModal} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>

      <!-- Category sections -->
      <div class="category-content">
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
                <div class="category-grid">
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
                <div class="category-grid">
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
    z-index: 100;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
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
    border-bottom: 1px solid #f1f5f9;
  }

  .header-content {
    flex: 1;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
    line-height: 1.3;
  }

  .transaction-preview {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .merchant {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .amount {
    font-size: 16px;
    font-weight: 600;
    color: #dc2626;
  }

  .amount.income {
    color: #059669;
  }

  .close-btn {
    padding: 8px;
    border: none;
    background: none;
    color: #64748b;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 16px;
  }

  .close-btn:hover {
    background: #f1f5f9;
    color: #374151;
  }

  .category-content {
    padding: 8px 24px 24px;
    max-height: calc(85vh - 140px);
    overflow-y: auto;
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
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 12px 0;
    padding-left: 2px;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .category-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 88px;
    position: relative;
  }

  .category-option:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
  }

  .category-option:active {
    transform: scale(0.98);
  }

  /* Type-specific styling */
  .essential-type {
    border-color: #fbbf24;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.03), rgba(251, 191, 36, 0.01));
  }

  .essential-type:hover {
    border-color: #f59e0b;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.15);
  }

  .discretionary-type {
    border-color: #3b82f6;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(59, 130, 246, 0.01));
  }

  .discretionary-type:hover {
    border-color: #2563eb;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  }

  .investment-type {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(16, 185, 129, 0.01));
  }

  .investment-type:hover {
    border-color: #059669;
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
  }

  .debt_payment-type {
    border-color: #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(239, 68, 68, 0.01));
  }

  .debt_payment-type:hover {
    border-color: #dc2626;
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.15);
  }

  .income-type {
    border-color: #059669;
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.03), rgba(5, 150, 105, 0.01));
  }

  .income-type:hover {
    border-color: #047857;
    box-shadow: 0 8px 25px rgba(5, 150, 105, 0.15);
  }

  .no_compute-type {
    border-color: #6b7280;
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.03), rgba(107, 114, 128, 0.01));
  }

  .no_compute-type:hover {
    border-color: #4b5563;
    box-shadow: 0 8px 25px rgba(107, 114, 128, 0.15);
  }

  .category-icon {
    font-size: 28px;
    line-height: 1;
  }

  .category-name {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    text-align: center;
    line-height: 1.3;
  }

  .empty-categories {
    padding: 2rem 1.5rem;
    text-align: center;
    background: #f8fafc;
    border-radius: 12px;
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
    color: #64748b;
    line-height: 1.5;
    margin: 0;
    max-width: 300px;
  }

  .create-categories-btn {
    padding: 12px 20px;
    border: 2px solid #059669;
    border-radius: 12px;
    background: #059669;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .create-categories-btn:hover {
    background: #047857;
    border-color: #047857;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(5, 150, 105, 0.25);
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
      padding: 20px;
    }

    .category-content {
      padding: 8px 20px 20px;
    }

    .category-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .category-option {
      padding: 12px 8px;
      min-height: 76px;
    }

    .category-icon {
      font-size: 24px;
    }

    .category-name {
      font-size: 11px;
    }
  }

  @media (max-width: 360px) {
    .modal-header {
      padding: 16px;
    }

    .category-content {
      padding: 8px 16px 16px;
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