<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Transaction } from '$lib/types/transaction';

  // Props
  export let isOpen = false;
  export let transaction: Transaction | null = null;
  export let matchingTransactions: Transaction[] = [];
  export let onConfirm: (tag: string, scope: 'single' | 'pattern') => void = () => {};
  export let onCancel: () => void = () => {};

  // State
  let newTag = '';
  let selectedScope: 'single' | 'pattern' = 'single';

  $: hasMatches = matchingTransactions.length > 0;

  function handleConfirm() {
    if (newTag.trim()) {
      onConfirm(newTag.trim(), selectedScope);
      newTag = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleConfirm();
    }
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  }

  function getPatternName(transaction: Transaction): string {
    return transaction.merchant || transaction.description || 'Esta transacción';
  }

  function getTotalAmount(): string {
    const total = matchingTransactions.reduce((sum, t) => sum + Math.abs(t.amount), Math.abs(transaction?.amount || 0));
    return formatAmount(total);
  }
</script>

{#if isOpen && transaction}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tag-title">
    <div class="modal-content">
      <!-- Header minimalista -->
      <div class="modal-header">
        <h2 id="tag-title" class="modal-title">Añadir etiqueta</h2>
        <button class="close-btn" onclick={onCancel} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      <!-- Información de la transacción -->
      <div class="transaction-info">
        <div class="transaction-summary">
          <span class="merchant">{getPatternName(transaction)}</span>
          <span class="amount">{formatAmount(transaction.amount)}</span>
        </div>
        {#if transaction.tags && transaction.tags.length > 0}
          <div class="existing-tags">
            <span class="tags-label">Etiquetas:</span>
            {#each transaction.tags as tag}
              <span class="tag-chip">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Input para nueva etiqueta -->
      <div class="tag-input-section">
        <input
          type="text"
          bind:value={newTag}
          onkeydown={handleKeydown}
          placeholder="Nueva etiqueta..."
          class="tag-input"
          autocomplete="off"
        />
      </div>

      <!-- Opciones de aplicación -->
      <div class="scope-options">
        <!-- Opción: Solo esta transacción -->
        <label class="scope-option" class:selected={selectedScope === 'single'}>
          <input
            type="radio"
            bind:group={selectedScope}
            value="single"
            name="tag-scope"
          />
          <div class="scope-content">
            <span class="scope-title">Solo esta transacción</span>
            <span class="scope-detail">1 transacción</span>
          </div>
        </label>

        <!-- Opción: Transacciones similares -->
        {#if hasMatches}
          <label class="scope-option" class:selected={selectedScope === 'pattern'}>
            <input
              type="radio"
              bind:group={selectedScope}
              value="pattern"
              name="tag-scope"
            />
            <div class="scope-content">
              <span class="scope-title">Todas las similares</span>
              <span class="scope-detail">
                {matchingTransactions.length + 1} transacciones • {getTotalAmount()}
              </span>
            </div>
          </label>
        {/if}
      </div>

      <!-- Preview compacto -->
      {#if selectedScope === 'pattern' && hasMatches && matchingTransactions.length > 0}
        <div class="preview-section">
          <div class="preview-summary">
            Se añadirá a {matchingTransactions.length} transacciones más:
          </div>
          <div class="preview-items">
            {#each matchingTransactions.slice(0, 2) as match}
              <div class="preview-item">
                <span class="preview-merchant">{match.merchant}</span>
                <span class="preview-amount">{formatAmount(match.amount)}</span>
              </div>
            {/each}
            {#if matchingTransactions.length > 2}
              <div class="preview-more">+{matchingTransactions.length - 2} más...</div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Botones de acción -->
      <div class="modal-actions">
        <button class="btn-cancel" onclick={onCancel}>
          Cancelar
        </button>
        <button
          class="btn-confirm"
          onclick={handleConfirm}
          disabled={!newTag.trim()}
        >
          {selectedScope === 'single' ? 'Añadir' : `Añadir a ${matchingTransactions.length + 1}`}
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
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 75;
    padding: 1rem;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    max-width: 350px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }


  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 0.5rem;
  }

  .modal-title {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    padding: 0.25rem;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background: var(--surface-muted);
  }

  .transaction-info {
    padding: 0.5rem 1rem;
  }

  .transaction-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .merchant {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .amount {
    font-weight: 500;
    color: var(--acapulco);
    font-size: 0.875rem;
  }

  .existing-tags {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .tags-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-right: 0.25rem;
  }

  .tag-chip {
    padding: 0.125rem 0.375rem;
    background: var(--acapulco-light);
    color: var(--acapulco);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .tag-input-section {
    padding: 0 1rem;
  }

  .tag-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--text-primary);
    background: var(--surface);
    transition: border-color 0.2s;
  }

  .tag-input:focus {
    outline: none;
    border-color: var(--acapulco);
  }

  .scope-options {
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scope-option {
    display: block;
    cursor: pointer;
  }

  .scope-option input[type="radio"] {
    display: none;
  }

  .scope-content {
    padding: 0.75rem;
    border: 1px solid var(--gray-200);
    border-radius: 6px;
    transition: all 0.2s;
    position: relative;
  }

  .scope-option:hover .scope-content {
    border-color: var(--gray-300);
  }

  .scope-option.selected .scope-content {
    border-color: var(--acapulco);
    background: var(--acapulco-light);
  }

  .scope-option.selected .scope-content::before {
    content: '';
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 6px;
    height: 6px;
    background: var(--acapulco);
    border-radius: 50%;
  }

  .scope-title {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
    margin: 0 0 0.25rem 0;
  }

  .scope-detail {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .preview-section {
    padding: 0.5rem 1rem;
    background: var(--surface-muted);
    margin: 0 1rem;
    border-radius: 6px;
  }

  .preview-summary {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .preview-items {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .preview-merchant {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .preview-amount {
    color: var(--acapulco);
    font-weight: 500;
  }

  .preview-more {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    margin-top: 0.25rem;
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    padding: 1rem;
  }

  .btn-cancel {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    border-color: var(--gray-300);
    background: var(--surface-muted);
  }

  .btn-confirm {
    padding: 0.375rem 0.75rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-confirm:hover:not(:disabled) {
    background: var(--acapulco-dark);
  }

  .btn-confirm:disabled {
    background: var(--gray-300);
    color: var(--text-muted);
    cursor: not-allowed;
  }

</style>