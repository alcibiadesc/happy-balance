<script lang="ts">
  import { Plus, X, Calendar, DollarSign, Building, FileText } from 'lucide-svelte';
  import type { Transaction, Category } from '$lib/types/transaction';

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
      errors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!merchant.trim()) {
      errors.merchant = 'Merchant is required';
    }

    if (!date) {
      errors.date = 'Date is required';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errors.date = 'Date cannot be in the future';
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
        currency: 'EUR',
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
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="dialog">
    <div class="modal-content">
      <!-- Close button -->
      <button class="close-btn" on:click={closeModal} aria-label="Close">
        <X size={20} />
      </button>

      <!-- Header -->
      <div class="modal-header">
        <h3>New Transaction</h3>
        <p>Add a transaction to your records</p>
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
                placeholder="0.00"
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
                {type === 'expense' ? 'Expense' : 'Income'}
              </button>
            </div>
          </div>
          {#if errors.amount}
            <span class="error-text">{errors.amount}</span>
          {/if}
        </div>

        <!-- Merchant -->
        <div class="field-group">
          <label class="field-label" for="merchant">Where?</label>
          <input
            type="text"
            bind:value={merchant}
            placeholder="e.g., Amazon, Starbucks, Salary..."
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
          <label class="field-label" for="description">What for?</label>
          <input
            type="text"
            bind:value={description}
            placeholder="Optional description..."
            class="field-input"
            id="description"
            maxlength="200"
          />
        </div>

        <!-- Date -->
        <div class="field-group">
          <label class="field-label" for="date">When?</label>
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
        {#if categories.length > 0}
          <div class="field-group">
            <label class="field-label" for="category">Category</label>
            <div class="category-grid">
              {#each categories.filter(c => (type === 'income' && c.type === 'income') || (type === 'expense' && ['essential', 'discretionary'].includes(c.type))) as category}
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
          </div>
        {/if}

        <!-- Submit buttons -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" on:click={closeModal}>
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <div class="spinner"></div>
              Saving...
            {:else}
              Save Transaction
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
    z-index: 50;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fade-in 0.2s ease-out;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 420px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.05);
  }

  .modal-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .modal-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .modal-header p {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  .field-input {
    padding: 0.75rem 1rem;
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--surface);
    color: var(--text-primary);
    transition: all 0.2s ease;
    outline: none;
  }

  .field-input:focus {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  .field-input.error {
    border-color: var(--froly);
    box-shadow: 0 0 0 3px rgba(245, 121, 108, 0.1);
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
    z-index: 1;
  }

  .amount-field {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2rem;
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    background: var(--surface);
    color: var(--text-primary);
    transition: all 0.2s ease;
    outline: none;
  }

  .amount-field:focus {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  .amount-field.error {
    border-color: var(--froly);
    box-shadow: 0 0 0 3px rgba(245, 121, 108, 0.1);
  }

  .type-toggle {
    display: flex;
  }

  .type-btn {
    padding: 0.75rem 1.5rem;
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    min-width: 80px;
  }

  .type-btn.expense {
    background: rgba(245, 121, 108, 0.1);
    border-color: rgba(245, 121, 108, 0.3);
    color: var(--froly);
  }

  .type-btn.income {
    background: rgba(122, 186, 165, 0.1);
    border-color: rgba(122, 186, 165, 0.3);
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
    padding: 0.75rem 0.5rem;
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .category-chip:hover {
    border-color: var(--category-color);
    transform: translateY(-1px);
  }

  .category-chip.selected {
    background: var(--category-color);
    border-color: var(--category-color);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .category-icon {
    font-size: 1.25rem;
  }

  .category-name {
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .btn-secondary {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.15);
  }

  .btn-primary {
    flex: 2;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: var(--acapulco);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary:hover:not(:disabled) {
    background: #6ca085;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
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
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
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