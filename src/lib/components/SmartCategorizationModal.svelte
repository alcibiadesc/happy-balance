<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Transaction, Category } from '$lib/types/transaction';

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
  export let onConfirm: (scope: 'single' | 'pattern' | 'all', applyToFuture: boolean) => void = () => {};
  export let onCancel: () => void = () => {};

  // State
  let selectedScope: 'single' | 'pattern' | 'all' = 'single';
  let applyToFuture = false;

  $: hasMatches = matchingTransactions.length > 0;

  function handleConfirm() {
    onConfirm(selectedScope, applyToFuture);
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

{#if isOpen && transaction && selectedCategory}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="categorization-title">
    <div class="modal-content">
      <!-- Header minimalista -->
      <div class="modal-header">
        <h2 id="categorization-title" class="modal-title">Aplicar categoría</h2>
        <button class="close-btn" onclick={onCancel} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      <!-- Información condensada -->
      <div class="category-info">
        <div class="transaction-pattern">
          <span class="pattern-text">{getPatternName(transaction)}</span>
          <span class="arrow">→</span>
          <div class="category-chip">
            <span class="category-emoji">{selectedCategory.icon}</span>
            <span class="category-label">{selectedCategory.name}</span>
          </div>
        </div>
      </div>

      <!-- Opciones de aplicación -->
      <div class="scope-options">
        <!-- Opción: Solo esta transacción -->
        <label class="scope-option" class:selected={selectedScope === 'single'}>
          <input
            type="radio"
            bind:group={selectedScope}
            value="single"
            name="scope"
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
              name="scope"
            />
            <div class="scope-content">
              <span class="scope-title">Todas las similares</span>
              <span class="scope-detail">
                {matchingTransactions.length + 1} transacciones • {getTotalAmount()}
              </span>
            </div>
          </label>

          <!-- Opción para futuras transacciones -->
          {#if selectedScope === 'pattern'}
            <div class="future-option">
              <label class="future-checkbox">
                <input type="checkbox" bind:checked={applyToFuture} />
                <span>Aplicar también a futuras transacciones</span>
              </label>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Preview compacto de transacciones -->
      {#if selectedScope === 'pattern' && hasMatches && matchingTransactions.length > 0}
        <div class="preview-section">
          <div class="preview-summary">
            Se aplicará a {matchingTransactions.length} transacciones más:
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
        <button class="btn-confirm" onclick={handleConfirm}>
          {selectedScope === 'single' ? 'Aplicar' : `Aplicar a ${matchingTransactions.length + 1}`}
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
    padding: var(--space-md);
  }

  .modal-content {
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    max-width: 350px;
    width: 100%;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    border-bottom: 1px solid var(--gray-100);
  }

  .modal-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    padding: var(--space-xs);
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--gray-100);
    color: var(--text-secondary);
  }

  .category-info {
    padding: var(--space-md);
    border-bottom: 1px solid var(--gray-100);
  }

  .transaction-pattern {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .pattern-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arrow {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 4px var(--space-xs);
    background: rgba(122, 186, 165, 0.1);
    border: 1px solid rgba(122, 186, 165, 0.2);
    border-radius: var(--radius-sm);
  }

  .category-emoji {
    font-size: 0.875rem;
  }

  .category-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--acapulco);
  }

  .scope-options {
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .scope-option {
    display: block;
    cursor: pointer;
  }

  .scope-option input[type="radio"] {
    display: none;
  }

  .scope-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  .scope-option:hover .scope-content {
    border-color: var(--gray-300);
    background: var(--gray-50);
  }

  .scope-option.selected .scope-content {
    border-color: var(--acapulco);
    background: rgba(122, 186, 165, 0.05);
  }

  .scope-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .scope-detail {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .future-option {
    margin-top: var(--space-xs);
    margin-left: var(--space-sm);
  }

  .future-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.75rem;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .future-checkbox input[type="checkbox"] {
    margin: 0;
  }

  .preview-section {
    padding: var(--space-md);
    background: var(--surface-muted);
    border-top: 1px solid var(--gray-100);
  }

  .preview-summary {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
  }

  .preview-items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px var(--space-xs);
    background: var(--surface-elevated);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
  }

  .preview-merchant {
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 150px;
  }

  .preview-amount {
    color: var(--acapulco);
    font-weight: 500;
  }

  .preview-more {
    padding: 2px var(--space-xs);
    text-align: center;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .modal-actions {
    display: flex;
    gap: var(--space-xs);
    padding: var(--space-md);
    border-top: 1px solid var(--gray-100);
  }

  .btn-cancel {
    flex: 1;
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface-elevated);
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

  .btn-confirm {
    flex: 2;
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--acapulco);
    background: var(--acapulco);
    color: var(--surface-elevated);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-confirm:hover {
    background: var(--success-hover);
    border-color: var(--success-hover);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .modal-content {
      max-width: none;
      margin: var(--space-sm);
    }

    .transaction-pattern {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-xs);
    }

    .arrow {
      transform: rotate(90deg);
    }

    .pattern-text {
      max-width: none;
    }
  }
</style>