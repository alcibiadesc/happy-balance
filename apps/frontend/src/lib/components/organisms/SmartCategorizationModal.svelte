<script lang="ts">
  import { X, Check, Calendar, Sparkles } from 'lucide-svelte';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';

  // Props
  export let isOpen = false;
  export let transaction: Transaction | null = null;
  export let selectedCategory: Category | null = null;
  export let matchingTransactions: Transaction[] = [];
  export let suggestions: Array<{
    categoryId: string;
    confidence: number;
    reason: string;
    potentialMatches: number;
  }> = [];
  export let onConfirm: (
    scope: 'single' | 'pattern' | 'all',
    applyToFuture: boolean,
    selectedTransactionIds?: string[]
  ) => void = () => {};
  export let onCancel: () => void = () => {};

  // State
  let applyToFuture = true; // Default to true for smart tagging
  let selectedTransactionIds = new Set<string>();

  $: hasMatches = matchingTransactions.length > 0;

  // Reset selected transactions when modal opens or matching transactions change
  $: if (isOpen) {
    selectedTransactionIds = new Set(matchingTransactions.map((t) => t.id));
    applyToFuture = true; // Reset to true on open
  }

  function handleConfirm() {
    const hasSelectedMatches = selectedTransactionIds.size > 0;
    if (hasSelectedMatches) {
      onConfirm('pattern', applyToFuture, Array.from(selectedTransactionIds));
    } else {
      onConfirm('single', applyToFuture);
    }
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amount));
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  function getPatternName(transaction: Transaction): string {
    return transaction.merchant || transaction.description || 'Esta transacción';
  }

  function getTotalAmount(): string {
    const selectedTransactions = matchingTransactions.filter((t) =>
      selectedTransactionIds.has(t.id)
    );
    const total = selectedTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      Math.abs(transaction?.amount || 0)
    );
    return formatAmount(total);
  }

  function toggleTransaction(transactionId: string) {
    const newSet = new Set(selectedTransactionIds);
    if (newSet.has(transactionId)) {
      newSet.delete(transactionId);
    } else {
      newSet.add(transactionId);
    }
    selectedTransactionIds = newSet;
  }

  function toggleAll() {
    if (selectedTransactionIds.size === matchingTransactions.length) {
      selectedTransactionIds = new Set();
    } else {
      selectedTransactionIds = new Set(matchingTransactions.map((t) => t.id));
    }
  }

  $: selectedCount = selectedTransactionIds.size + 1; // +1 for the current transaction
  $: totalSelectedAmount = getTotalAmount();
</script>

<div use:modalKeyboard={{ onConfirm: handleConfirm, onCancel, isOpen }}></div>

{#if isOpen && transaction && selectedCategory}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="categorization-title">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2 id="categorization-title" class="modal-title">
            <Sparkles size={18} />
            Categorización inteligente
          </h2>
          <div class="category-preview">
            <span class="merchant-name">{getPatternName(transaction)}</span>
            <div class="category-assignment">
              <span class="arrow">→</span>
              <div
                class="category-chip"
                style="background-color: {selectedCategory.color}15; border-color: {selectedCategory.color}; color: {selectedCategory.color}"
              >
                <span class="category-icon">{selectedCategory.icon}</span>
                <span class="category-name">{selectedCategory.name}</span>
              </div>
            </div>
          </div>
        </div>
        <button class="close-btn" on:click={onCancel} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>

      <div class="content-section">
        <!-- Current transaction -->
        <div class="current-transaction">
          <div class="section-label">Transacción actual</div>
          <div class="transaction-card current">
            <div class="transaction-info">
              <span class="transaction-description">{transaction.description}</span>
              <span class="transaction-meta"
                >{transaction.merchant} • {formatDate(transaction.date)}</span
              >
            </div>
            <span
              class="transaction-amount"
              class:expense={transaction.amount < 0}
              class:income={transaction.amount > 0}
            >
              {formatAmount(transaction.amount)}
            </span>
            <div class="check-badge">
              <Check size={14} />
            </div>
          </div>
        </div>

        <!-- Matching transactions -->
        {#if hasMatches}
          <div class="matches-section">
            <div class="section-header">
              <div class="section-label">
                Transacciones anteriores similares
                <span class="match-count">{matchingTransactions.length}</span>
              </div>
              <button type="button" class="toggle-all-btn" on:click={toggleAll}>
                {selectedTransactionIds.size === matchingTransactions.length
                  ? 'Deseleccionar'
                  : 'Seleccionar todas'}
              </button>
            </div>
            <div class="matches-list">
              {#each matchingTransactions as match (match.id)}
                <label
                  class="transaction-card"
                  class:selected={selectedTransactionIds.has(match.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTransactionIds.has(match.id)}
                    on:change={() => toggleTransaction(match.id)}
                  />
                  <div class="transaction-info">
                    <span class="transaction-description"
                      >{match.description || match.merchant}</span
                    >
                    <span class="transaction-meta">
                      <Calendar size={10} />
                      {formatDate(match.date)}
                      {#if match.description && match.merchant}
                        • {match.merchant}
                      {/if}
                    </span>
                  </div>
                  <span
                    class="transaction-amount"
                    class:expense={match.amount < 0}
                    class:income={match.amount > 0}
                  >
                    {formatAmount(match.amount)}
                  </span>
                </label>
              {/each}
            </div>
            {#if selectedTransactionIds.size > 0}
              <div class="selection-summary">
                <span>Total seleccionado:</span>
                <strong>{totalSelectedAmount}</strong>
              </div>
            {/if}
          </div>
        {:else}
          <div class="no-matches">
            <span class="no-matches-text">No se encontraron transacciones anteriores similares</span
            >
          </div>
        {/if}

        <!-- Future transactions option -->
        <div class="future-option">
          <label class="checkbox-option">
            <input type="checkbox" bind:checked={applyToFuture} />
            <div class="checkbox-content">
              <span class="checkbox-title">
                <Sparkles size={14} />
                Aplicar a futuras transacciones
              </span>
              <span class="checkbox-detail">
                Las transacciones similares que importes en el futuro se categorizarán
                automáticamente
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="modal-actions">
        <button class="btn-secondary" on:click={onCancel}>Cancelar</button>
        <button class="btn-primary" on:click={handleConfirm}>
          {#if selectedTransactionIds.size > 0}
            Aplicar a {selectedCount} transacciones
          {:else}
            Aplicar categoría
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 1rem;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
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
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    background: var(--surface-muted);
  }

  .header-content {
    flex: 1;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
    line-height: 1.3;
  }

  .modal-title :global(svg) {
    color: var(--primary);
  }

  .category-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .merchant-name {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .category-assignment {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arrow {
    color: var(--text-muted);
    font-size: 12px;
  }

  .category-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: 1px solid;
    border-radius: 6px;
  }

  .category-icon {
    font-size: 13px;
  }

  .category-name {
    font-size: 12px;
    font-weight: 600;
  }

  .close-btn {
    padding: 6px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .content-section {
    padding: 16px 24px 20px;
    max-height: calc(90vh - 220px);
    overflow-y: auto;
  }

  /* Current transaction */
  .current-transaction {
    margin-bottom: 16px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .match-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    background: var(--primary);
    border-radius: 9px;
    font-size: 10px;
    font-weight: 600;
    color: var(--primary-foreground);
    padding: 0 5px;
  }

  .transaction-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface-elevated);
    border: 1.5px solid var(--border-color);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .transaction-card:hover {
    border-color: var(--text-muted);
    background: var(--surface-muted);
  }

  .transaction-card.current {
    background: var(--acapulco-alpha-10);
    border-color: var(--acapulco);
    cursor: default;
  }

  .transaction-card.selected {
    background: var(--primary-alpha-10);
    border-color: var(--primary);
  }

  .transaction-card input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
    cursor: pointer;
    flex-shrink: 0;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;
  }

  .transaction-description {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .transaction-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .transaction-meta :global(svg) {
    flex-shrink: 0;
  }

  .transaction-amount {
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .transaction-amount.expense {
    color: var(--froly);
  }

  .transaction-amount.income {
    color: var(--acapulco);
  }

  .check-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: var(--acapulco);
    border-radius: 50%;
    color: white;
    flex-shrink: 0;
  }

  /* Matches section */
  .matches-section {
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .toggle-all-btn {
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    background: var(--surface-elevated);
    color: var(--primary);
    border-radius: 5px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-all-btn:hover {
    background: var(--primary-alpha-10);
    border-color: var(--primary);
  }

  .matches-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .selection-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: var(--primary-alpha-10);
    border: 1px solid var(--primary);
    border-radius: 8px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--primary);
  }

  .selection-summary strong {
    font-weight: 600;
  }

  /* No matches */
  .no-matches {
    padding: 16px;
    background: var(--surface-muted);
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    text-align: center;
    margin-bottom: 16px;
  }

  .no-matches-text {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* Future option */
  .future-option {
    padding: 14px 16px;
    background: var(--primary-alpha-10);
    border: 1.5px solid var(--primary);
    border-radius: 10px;
  }

  .checkbox-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }

  .checkbox-option input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: var(--primary);
    flex-shrink: 0;
  }

  .checkbox-content {
    flex: 1;
  }

  .checkbox-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 2px;
  }

  .checkbox-title :global(svg) {
    color: var(--primary);
  }

  .checkbox-detail {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* Actions */
  .modal-actions {
    display: flex;
    gap: 12px;
    padding: 16px 24px 20px;
    border-top: 1px solid var(--border-color);
  }

  .btn-secondary {
    flex: 1;
    padding: 11px 16px;
    border: 1.5px solid var(--border-color);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: var(--surface-muted);
    border-color: var(--text-muted);
    color: var(--text-primary);
  }

  .btn-primary {
    flex: 2;
    padding: 11px 16px;
    border: none;
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }

  .btn-primary:hover {
    background: var(--primary-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  /* Scrollbars */
  .matches-list::-webkit-scrollbar,
  .content-section::-webkit-scrollbar {
    width: 5px;
  }

  .matches-list::-webkit-scrollbar-track,
  .content-section::-webkit-scrollbar-track {
    background: transparent;
  }

  .matches-list::-webkit-scrollbar-thumb,
  .content-section::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }

  .matches-list::-webkit-scrollbar-thumb:hover,
  .content-section::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .modal-overlay {
      padding: 12px;
      align-items: flex-end;
    }

    .modal-content {
      max-width: none;
      width: 100%;
      max-height: 85vh;
      border-radius: 16px 16px 0 0;
    }

    .modal-header {
      padding: 16px 20px;
    }

    .modal-title {
      font-size: 15px;
    }

    .content-section {
      padding: 12px 20px 16px;
      max-height: calc(85vh - 200px);
    }

    .transaction-card {
      padding: 10px 12px;
    }

    .transaction-description {
      font-size: 12px;
    }

    .matches-list {
      max-height: 150px;
    }

    .modal-actions {
      padding: 16px 20px;
      flex-direction: column-reverse;
      gap: 8px;
    }

    .btn-secondary,
    .btn-primary {
      flex: none;
      width: 100%;
    }
  }
</style>
