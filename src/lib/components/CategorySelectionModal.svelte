<script lang="ts">
  import { X } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
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

  // Filter categories based on transaction amount
  $: isIncomeTransaction = transaction ? transaction.amount > 0 : false;
  $: filteredCategories = categories.filter(category => {
    if (isIncomeTransaction) {
      return category.type === 'income';
    } else {
      return ['essential', 'discretionary', 'investment', 'debt_payment'].includes(category.type);
    }
  });

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
      <!-- Header -->
      <div class="modal-header">
        <h2 id="category-selection-title" class="modal-title">
          Seleccionar categoría
        </h2>
        <button class="close-btn" on:click={closeModal} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      <!-- Transaction info -->
      <div class="transaction-info">
        <div class="transaction-details">
          <div class="transaction-merchant">{transaction.merchant}</div>
          <div class="transaction-description">{transaction.description}</div>
          <div class="transaction-amount" class:income={transaction.amount > 0}>
            {new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR'
            }).format(Math.abs(transaction.amount))}
          </div>
        </div>
      </div>

      <!-- Category selection -->
      <div class="category-section">
        <div class="section-header">
          <h3 class="section-title">
            {isIncomeTransaction ? 'Categorías de Ingresos' : 'Categorías de Gastos'}
          </h3>
        </div>

        <div class="category-grid">
          {#each filteredCategories as category}
            <button
              class="category-option"
              class:income-cat={category.type === 'income'}
              class:expense-cat={category.type !== 'income'}
              on:click={() => selectCategory(category.id)}
              title={category.name}
            >
              <span class="category-emoji">{category.icon}</span>
              <span class="category-name">{category.name}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button class="btn-cancel" on:click={closeModal}>
          Cancelar
        </button>
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    animation: modalSlideIn 0.2s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--gray-200);
  }

  .modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    padding: 0.5rem;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--gray-100);
    color: var(--text-secondary);
  }

  .transaction-info {
    padding: 1.5rem;
    border-bottom: 1px solid var(--gray-100);
    background: var(--gray-50);
  }

  .transaction-details {
    text-align: center;
  }

  .transaction-merchant {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .transaction-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  .transaction-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--froly);
  }

  .transaction-amount.income {
    color: var(--acapulco);
  }

  .category-section {
    padding: 1.5rem;
  }

  .section-header {
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .category-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0.75rem;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    background: var(--surface);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 80px;
  }

  .category-option:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .category-option:active {
    transform: scale(0.98);
  }

  .category-option.income-cat {
    background: linear-gradient(135deg, rgba(122, 186, 165, 0.08), rgba(122, 186, 165, 0.03));
    border-color: rgba(122, 186, 165, 0.3);
  }

  .category-option.income-cat:hover {
    background: linear-gradient(135deg, rgba(122, 186, 165, 0.15), rgba(122, 186, 165, 0.08));
    border-color: var(--acapulco);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.2);
  }

  .category-option.expense-cat {
    background: linear-gradient(135deg, rgba(245, 121, 108, 0.08), rgba(245, 121, 108, 0.03));
    border-color: rgba(245, 121, 108, 0.3);
  }

  .category-option.expense-cat:hover {
    background: linear-gradient(135deg, rgba(245, 121, 108, 0.15), rgba(245, 121, 108, 0.08));
    border-color: var(--froly);
    box-shadow: 0 4px 12px rgba(245, 121, 108, 0.2);
  }

  .category-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }

  .category-name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .modal-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--gray-100);
    display: flex;
    justify-content: center;
  }

  .btn-cancel {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-cancel:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .modal-overlay {
      padding: 0.5rem;
    }

    .modal-content {
      max-width: none;
      width: 100%;
    }

    .category-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .category-option {
      padding: 0.75rem 0.5rem;
      min-height: 70px;
    }

    .category-emoji {
      font-size: 1.25rem;
    }

    .category-name {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 360px) {
    .transaction-info {
      padding: 1rem;
    }

    .category-section {
      padding: 1rem;
    }

    .modal-actions {
      padding: 1rem;
    }
  }
</style>