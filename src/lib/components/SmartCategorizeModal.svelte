<script lang="ts">
  import { X, Tag, Layers, Clock, Home } from 'lucide-svelte';
  import { apiTransactions } from '$lib/stores/api-transactions';
  import type { Transaction, Category } from '$lib/types/transaction';

  interface Props {
    show: boolean;
    transaction: Transaction | null;
    category: Category | null;
    onClose: () => void;
    onSuccess?: (result: any) => void;
  }

  let { show = false, transaction = null, category = null, onClose, onSuccess }: Props = $props();

  let applyToAll = $state(false);
  let applyToFuture = $state(true);
  let createPattern = $state(true);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Estimated matches for "apply to all"
  let estimatedMatches = $derived(() => {
    if (!transaction || !applyToAll) return 0;

    // Simple estimation based on merchant name
    const merchant = transaction.merchant.toLowerCase();
    const allTransactions = $apiTransactions;
    const matches = allTransactions.filter(t =>
      t.merchant.toLowerCase().includes(merchant) && !t.categoryId
    );
    return matches.length;
  });

  // Check if this is a mortgage payment
  let isMortgagePayment = $derived(() => {
    if (!transaction) return false;
    const merchant = transaction.merchant.toLowerCase();
    const description = (transaction.description || '').toLowerCase();

    // Common mortgage-related keywords
    const mortgageKeywords = ['mortgage', 'hipoteca', 'home loan', 'bank', 'banco',
                              'santander', 'bbva', 'caixa', 'sabadell', 'ing'];
    return mortgageKeywords.some(keyword =>
      merchant.includes(keyword) || description.includes(keyword)
    );
  });

  async function handleCategorize() {
    if (!transaction || !category) return;

    isLoading = true;
    error = null;

    try {
      const result = await apiTransactions.smartCategorize(
        transaction.id,
        category.id,
        {
          applyToAll,
          applyToFuture: applyToFuture && createPattern,
          createPattern
        }
      );

      if (result.success) {
        onSuccess?.(result);
        onClose();
      } else {
        error = result.message || 'Failed to categorize transaction';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  }

  function handleClose() {
    if (!isLoading) {
      error = null;
      applyToAll = false;
      applyToFuture = true;
      createPattern = true;
      onClose();
    }
  }
</script>

{#if show && transaction && category}
<div class="modal-overlay" onclick={handleClose}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h3>Categorize Transaction</h3>
      <button class="close-btn" onclick={handleClose} disabled={isLoading}>
        <X size={20} />
      </button>
    </div>

    <div class="modal-body">
      <div class="transaction-preview">
        <div class="preview-row">
          <span class="preview-label">Transaction:</span>
          <span class="preview-value">{transaction.merchant}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Amount:</span>
          <span class="preview-value amount-{transaction.amount > 0 ? 'income' : 'expense'}">
            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} €
          </span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Category:</span>
          <div class="category-badge" style="background-color: {category.color}20; color: {category.color}">
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </div>
        </div>
      </div>

      {#if isMortgagePayment && category.name.toLowerCase().includes('debt')}
      <div class="mortgage-hint">
        <Home size={16} />
        <span>This looks like a mortgage payment. It will be categorized under debt payments.</span>
      </div>
      {/if}

      <div class="options-section">
        <h4>How would you like to categorize?</h4>

        <label class="option-card">
          <input
            type="radio"
            name="categorize-option"
            checked={!applyToAll}
            onchange={() => applyToAll = false}
            disabled={isLoading}
          />
          <div class="option-content">
            <div class="option-header">
              <Tag size={18} />
              <span class="option-title">Just this transaction</span>
            </div>
            <p class="option-description">
              Only categorize this specific transaction
            </p>
          </div>
        </label>

        <label class="option-card">
          <input
            type="radio"
            name="categorize-option"
            checked={applyToAll}
            onchange={() => applyToAll = true}
            disabled={isLoading}
          />
          <div class="option-content">
            <div class="option-header">
              <Layers size={18} />
              <span class="option-title">All similar transactions</span>
            </div>
            <p class="option-description">
              Apply to all transactions from "{transaction.merchant}"
              {#if estimatedMatches > 0}
                <span class="match-count">({estimatedMatches} matching transaction{estimatedMatches !== 1 ? 's' : ''})</span>
              {/if}
            </p>
          </div>
        </label>

        {#if applyToAll || createPattern}
        <div class="additional-options">
          <label class="checkbox-option">
            <input
              type="checkbox"
              bind:checked={createPattern}
              disabled={isLoading}
            />
            <Clock size={16} />
            <span>Remember this pattern for future transactions</span>
          </label>

          {#if createPattern}
          <div class="future-info">
            <p>
              Future transactions from "{transaction.merchant}" will be automatically categorized as "{category.name}"
              {#if isMortgagePayment}
                <br/><small>Perfect for recurring mortgage payments!</small>
              {/if}
            </p>
          </div>
          {/if}
        </div>
        {/if}
      </div>

      {#if error}
      <div class="error-message">
        {error}
      </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" onclick={handleClose} disabled={isLoading}>
        Cancel
      </button>
      <button
        class="btn-primary"
        onclick={handleCategorize}
        disabled={isLoading}
      >
        {#if isLoading}
          Categorizing...
        {:else if applyToAll}
          Categorize All
        {:else}
          Categorize
        {/if}
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
    z-index: 70;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    background: var(--bg-primary);
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .close-btn:hover:not(:disabled) {
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .transaction-preview {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .preview-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .preview-row:last-child {
    margin-bottom: 0;
  }

  .preview-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .preview-value {
    font-weight: 500;
  }

  .amount-income {
    color: var(--success);
  }

  .amount-expense {
    color: var(--error);
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .mortgage-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--info-bg, #e3f2fd);
    color: var(--info-text, #0d47a1);
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .options-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .option-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-card:hover {
    background: var(--bg-secondary);
  }

  .option-card:has(input:checked) {
    border-color: var(--primary);
    background: var(--primary-bg, rgba(99, 102, 241, 0.05));
  }

  .option-content {
    flex: 1;
  }

  .option-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .option-title {
    font-weight: 500;
  }

  .option-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .match-count {
    color: var(--primary);
    font-weight: 500;
  }

  .additional-options {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .checkbox-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-option input {
    cursor: pointer;
  }

  .future-info {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--info-bg, #e8f5e9);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--info-text, #1b5e20);
  }

  .future-info p {
    margin: 0;
  }

  .future-info small {
    opacity: 0.8;
  }

  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--error-bg, #ffebee);
    color: var(--error-text, #c62828);
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #5b21b6);
  }

  .btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-tertiary, #e5e7eb);
  }

  .btn-primary:disabled,
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>