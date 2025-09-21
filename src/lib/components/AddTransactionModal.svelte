<script lang="ts">
  import { Plus, X, Calendar, DollarSign, Building, FileText } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';

  // Props
  export let isOpen = false;
  export let categories: Category[] = [];
  export let onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tags' | 'hash'>) => void = () => {};
  export let onCancel: () => void = () => {};

  // Form state
  let amount = '';
  let type: 'income' | 'expense' = 'expense';
  let merchant = '';
  let description = '';
  let date = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
  let categoryId = '';
  let isSubmitting = false;
  let errors: Record<string, string> = {};

  // Reset form when modal opens
  $: if (isOpen) {
    resetForm();
  }

  function resetForm() {
    amount = '';
    type = 'expense';
    merchant = '';
    description = '';
    date = new Date().toISOString().split('T')[0];
    categoryId = '';
    isSubmitting = false;
    errors = {};
  }

  function validateForm() {
    errors = {};

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.amount = $t('transactions.modal.validation.amount_required');
    }

    if (!merchant.trim()) {
      errors.merchant = $t('transactions.modal.validation.merchant_required');
    }

    if (!date) {
      errors.date = $t('transactions.modal.validation.date_required');
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errors.date = $t('transactions.modal.validation.future_date');
      }
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    isSubmitting = true;

    try {
      const transactionAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -Math.abs(transactionAmount) : Math.abs(transactionAmount);

      const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tags' | 'hash'> = {
        amount: finalAmount,
        date,
        time: new Date().toLocaleTimeString(),
        merchant: merchant.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        patternHash: undefined,
        hidden: false,
        notes: undefined
      };

      await onSubmit(transaction);
      closeModal();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      isSubmitting = false;
    }
  }

  function closeModal() {
    isOpen = false;
    onCancel();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function toggleType() {
    type = type === 'expense' ? 'income' : 'expense';
  }

  function navigateToCategories() {
    closeModal();
    goto('/categories');
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="dialog" tabindex="-1">
    <div class="modal-content">
      <!-- Close button -->
      <button class="close-btn" on:click={closeModal} aria-label="Close">
        <X size={20} />
      </button>

      <!-- Header -->
      <div class="modal-header">
        <h3>{$t('transactions.modal.new_transaction')}</h3>
      </div>

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="form">
        <!-- Amount and Type -->
        <div class="field-group">
          <div class="amount-container">
            <div class="amount-input">
              <span class="currency">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                bind:value={amount}
                placeholder={$t('transactions.modal.amount_placeholder')}
                class="amount-field"
                class:error={errors.amount}
                id="amount"
                autocomplete="off"
              />
            </div>
            <div class="type-toggle">
              <button
                type="button"
                class="type-btn"
                class:expense={type === 'expense'}
                class:income={type === 'income'}
                on:click={toggleType}
              >
                {type === 'expense' ? $t('transactions.modal.expense') : $t('transactions.modal.income')}
              </button>
            </div>
          </div>
          {#if errors.amount}
            <span class="error-text">{errors.amount}</span>
          {/if}
        </div>

        <!-- Merchant -->
        <div class="field-group">
          <label class="field-label" for="merchant">{$t('transactions.modal.where_label')}</label>
          <input
            type="text"
            bind:value={merchant}
            placeholder={$t('transactions.modal.merchant_placeholder')}
            class="field-input"
            class:error={errors.merchant}
            id="merchant"
            autocomplete="organization"
          />
          {#if errors.merchant}
            <span class="error-text">{errors.merchant}</span>
          {/if}
        </div>

        <!-- Description -->
        <div class="field-group">
          <label class="field-label" for="description">{$t('transactions.modal.what_for_label')}</label>
          <input
            type="text"
            bind:value={description}
            placeholder={$t('transactions.modal.description_placeholder')}
            class="field-input"
            id="description"
            maxlength="200"
          />
        </div>

        <!-- Date -->
        <div class="field-group">
          <label class="field-label" for="date">{$t('transactions.modal.when_label')}</label>
          <input
            type="date"
            bind:value={date}
            class="field-input date-input"
            class:error={errors.date}
            id="date"
          />
          {#if errors.date}
            <span class="error-text">{errors.date}</span>
          {/if}
        </div>

        <!-- Category -->
        <div class="field-group">
          <label class="field-label" for="category">{$t('transactions.category')}</label>
          {#if categories.length > 0}
            <div class="category-grid">
              {#each categories.filter(c => (type === 'income' && c.type === 'income') || (type === 'expense' && ['essential', 'discretionary', 'investment', 'debt_payment', 'no_compute'].includes(c.type))) as category}
                <button
                  type="button"
                  class="category-chip"
                  class:selected={categoryId === category.id}
                  style="--category-color: {category.color}"
                  on:click={() => categoryId = categoryId === category.id ? '' : category.id}
                >
                  <span class="category-icon">{category.icon}</span>
                  <span class="category-name">{category.name}</span>
                </button>
              {/each}
            </div>
          {:else}
            <div class="empty-categories">
              <div class="empty-categories-content">
                <span class="empty-categories-icon">🏷️</span>
                <p class="empty-categories-text">
                  No tienes categorías configuradas. Las categorías te ayudan a organizar y analizar mejor tus gastos e ingresos.
                </p>
                <button
                  type="button"
                  class="create-categories-btn"
                  on:click={navigateToCategories}
                >
                  <Plus size={16} />
                  Crear categorías
                </button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Submit buttons -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" on:click={closeModal}>
            {$t('common.cancel')}
          </button>
          <button
            type="submit"
            class="btn-primary"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <div class="spinner"></div>
              {$t('transactions.modal.saving')}
            {:else}
              {$t('transactions.modal.save_transaction')}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fade-in 0.15s ease-out;
  }

  .modal-content {
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    width: 100%;
    max-width: 380px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    animation: slide-up 0.2s ease-out;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    border-color: var(--text-secondary);
    color: var(--text-secondary);
  }

  .modal-header {
    margin-bottom: 1.5rem;
  }

  .modal-header h3 {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-input {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    background: var(--surface);
    color: var(--text-primary);
    transition: all 0.2s ease;
    outline: none;
  }

  .field-input:focus {
    border-color: var(--acapulco);
  }

  .field-input.error {
    border-color: var(--froly);
  }

  .field-input::placeholder {
    color: var(--text-muted);
  }

  .amount-container {
    display: flex;
    gap: 0.75rem;
    align-items: stretch;
  }

  .amount-input {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .currency {
    position: absolute;
    left: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
    z-index: 5;
  }

  .amount-field {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2rem;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    font-size: 1.125rem;
    font-weight: 400;
    background: var(--surface);
    color: var(--text-primary);
    transition: all 0.2s ease;
    outline: none;
  }

  .amount-field:focus {
    border-color: var(--acapulco);
  }

  .amount-field.error {
    border-color: var(--froly);
  }

  .type-toggle {
    display: flex;
  }

  .type-btn {
    padding: 0.625rem 1rem;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    min-width: 80px;
  }

  .type-btn.expense {
    border-color: var(--froly);
    color: var(--froly);
  }

  .type-btn.income {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  .date-input {
    font-family: inherit;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .category-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.625rem 0.5rem;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .category-chip:hover {
    border-color: var(--category-color);
  }

  .category-chip.selected {
    background: var(--category-color);
    border-color: var(--category-color);
    color: white;
  }

  .category-icon {
    font-size: 1.25rem;
  }

  .category-name {
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
  }

  .empty-categories {
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    text-align: center;
    background: var(--gray-50);
  }

  .empty-categories-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .empty-categories-icon {
    font-size: 2rem;
    opacity: 0.7;
  }

  .empty-categories-text {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0;
    max-width: 280px;
  }

  .create-categories-btn {
    padding: 0.625rem 1rem;
    border: 1px solid var(--acapulco);
    border-radius: var(--radius-md);
    background: var(--acapulco);
    color: white;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .create-categories-btn:hover {
    background: #6ba085;
    border-color: #6ba085;
    transform: translateY(-1px);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .btn-secondary {
    flex: 1;
    padding: 0.625rem 1rem;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .btn-secondary:hover {
    border-color: var(--text-secondary);
  }

  .btn-primary {
    flex: 2;
    padding: 0.625rem 1rem;
    border: 1px solid var(--acapulco);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--acapulco);
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary:hover:not(:disabled) {
    background: rgba(122, 186, 165, 0.05);
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .error-text {
    color: var(--froly);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .modal-content {
      margin: 0.5rem;
      padding: 1.5rem;
      max-width: none;
    }

    .category-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>