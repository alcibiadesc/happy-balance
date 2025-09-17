<script lang="ts">
  import { Check, X, Zap, Target, Users, Plus, InfoIcon } from 'lucide-svelte';
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
  $: primarySuggestion = suggestions[0];

  function handleConfirm() {
    onConfirm(selectedScope, applyToFuture);
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  }

  function formatPattern(transaction: Transaction): string {
    // Extract key pattern elements for display
    const merchantName = transaction.merchant || '';
    const description = transaction.description || '';

    // Return the most recognizable part
    if (merchantName.length > description.length) {
      return merchantName;
    }
    return description || merchantName;
  }
</script>

{#if isOpen && transaction && selectedCategory}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="smart-categorization-title">
    <div class="modal-content smart-categorization-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-section">
          <Zap size={20} class="text-blue-500" />
          <h2 id="smart-categorization-title" class="modal-title">
            Categorización Inteligente
          </h2>
        </div>
        <button
          class="modal-close-btn"
          onclick={onCancel}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Transaction Context -->
      <div class="transaction-context">
        <div class="context-header">
          <h3>Transacción seleccionada</h3>
        </div>
        <div class="context-details">
          <div class="transaction-info">
            <span class="merchant-name">{transaction.merchant}</span>
            <span class="amount">{formatAmount(transaction.amount)}</span>
          </div>
          {#if transaction.description}
            <div class="description">{transaction.description}</div>
          {/if}
        </div>
      </div>

      <!-- Category Selection -->
      <div class="category-selection">
        <div class="selected-category">
          <span class="category-icon">{selectedCategory.icon}</span>
          <span class="category-name">{selectedCategory.name}</span>
          <span class="category-type-badge category-type-{selectedCategory.type}">
            {selectedCategory.type}
          </span>
        </div>
      </div>

      <!-- Smart Suggestions -->
      {#if primarySuggestion && primarySuggestion.potentialMatches > 0}
        <div class="smart-suggestion">
          <div class="suggestion-header">
            <InfoIcon size={16} class="text-blue-500" />
            <span>Patrón detectado</span>
          </div>
          <div class="suggestion-content">
            <p class="suggestion-text">
              Encontramos <strong>{primarySuggestion.potentialMatches}</strong>
              transacciones similares que podrían beneficiarse de esta categoría.
            </p>
            <p class="suggestion-reason">
              {primarySuggestion.reason}
            </p>
          </div>
        </div>
      {/if}

      <!-- Scope Selection -->
      <div class="scope-selection">
        <h3 class="scope-title">Aplicar categoría a:</h3>

        <div class="scope-options">
          <!-- Single Transaction -->
          <label class="scope-option" class:selected={selectedScope === 'single'}>
            <input
              type="radio"
              bind:group={selectedScope}
              value="single"
              name="categorization-scope"
            />
            <div class="scope-option-content">
              <div class="scope-option-header">
                <Target size={16} />
                <span class="scope-option-title">Solo esta transacción</span>
              </div>
              <p class="scope-option-description">
                Categorizar únicamente la transacción seleccionada
              </p>
              <div class="scope-stats">
                <span class="stat">1 transacción</span>
              </div>
            </div>
          </label>

          <!-- Pattern Matching -->
          {#if hasMatches}
            <label class="scope-option" class:selected={selectedScope === 'pattern'}>
              <input
                type="radio"
                bind:group={selectedScope}
                value="pattern"
                name="categorization-scope"
              />
              <div class="scope-option-content">
                <div class="scope-option-header">
                  <Users size={16} />
                  <span class="scope-option-title">Transacciones similares</span>
                </div>
                <p class="scope-option-description">
                  Categorizar todas las transacciones que coincidan con:
                  <strong>"{formatPattern(transaction)}"</strong>
                </p>
                <div class="scope-stats">
                  <span class="stat">{matchingTransactions.length + 1} transacciones</span>
                  <span class="stat-detail">
                    {formatAmount(matchingTransactions.reduce((sum, t) => sum + Math.abs(t.amount), Math.abs(transaction.amount)))} total
                  </span>
                </div>
              </div>
            </label>

            <!-- Future Transactions Option -->
            {#if selectedScope === 'pattern'}
              <div class="future-option">
                <label class="checkbox-option">
                  <input type="checkbox" bind:checked={applyToFuture} />
                  <div class="checkbox-content">
                    <div class="checkbox-header">
                      <Plus size={14} />
                      <span>Aplicar a futuras transacciones</span>
                    </div>
                    <p class="checkbox-description">
                      Crear una regla para categorizar automáticamente futuras transacciones similares
                    </p>
                  </div>
                </label>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Matching Transactions Preview -->
      {#if selectedScope === 'pattern' && hasMatches}
        <div class="matching-preview">
          <h4 class="preview-title">
            Transacciones que se categorizarán ({matchingTransactions.length})
          </h4>
          <div class="preview-list">
            {#each matchingTransactions.slice(0, 3) as match}
              <div class="preview-transaction">
                <span class="preview-merchant">{match.merchant}</span>
                <span class="preview-amount">{formatAmount(match.amount)}</span>
                <span class="preview-date">{new Date(match.date).toLocaleDateString('es-ES')}</span>
              </div>
            {/each}
            {#if matchingTransactions.length > 3}
              <div class="preview-more">
                +{matchingTransactions.length - 3} más...
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="modal-actions">
        <button
          class="btn-secondary"
          onclick={onCancel}
        >
          Cancelar
        </button>
        <button
          class="btn-primary"
          onclick={handleConfirm}
        >
          <Check size={16} />
          {selectedScope === 'single' ? 'Categorizar' : `Categorizar ${selectedScope === 'pattern' ? matchingTransactions.length + 1 : 'todas'}`}
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
    z-index: 1000;
    padding: 1rem;
  }

  .smart-categorization-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .modal-title-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .modal-close-btn {
    padding: 0.5rem;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .modal-close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .transaction-context {
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #f3f4f6;
  }

  .context-header h3 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .transaction-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .merchant-name {
    font-weight: 500;
    color: #111827;
  }

  .amount {
    font-weight: 600;
    color: #059669;
  }

  .description {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .category-selection {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .selected-category {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
  }

  .category-icon {
    font-size: 1.25rem;
  }

  .category-name {
    font-weight: 500;
    color: #111827;
    flex: 1;
  }

  .category-type-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .category-type-income { background: #dcfce7; color: #166534; }
  .category-type-essential { background: #fef3c7; color: #92400e; }
  .category-type-discretionary { background: #fce7f3; color: #be185d; }
  .category-type-investment { background: #e0e7ff; color: #3730a3; }

  .smart-suggestion {
    padding: 1rem 1.5rem;
    background: #eff6ff;
    border-bottom: 1px solid #f3f4f6;
  }

  .suggestion-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #1d4ed8;
    margin-bottom: 0.5rem;
  }

  .suggestion-text {
    margin: 0 0 0.25rem 0;
    color: #374151;
  }

  .suggestion-reason {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .scope-selection {
    padding: 1.5rem;
  }

  .scope-title {
    font-size: 1rem;
    font-weight: 500;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .scope-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .scope-option {
    display: block;
    cursor: pointer;
  }

  .scope-option input[type="radio"] {
    display: none;
  }

  .scope-option-content {
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .scope-option:hover .scope-option-content {
    border-color: #d1d5db;
  }

  .scope-option.selected .scope-option-content {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  .scope-option-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .scope-option-title {
    font-weight: 500;
    color: #111827;
  }

  .scope-option-description {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .scope-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .stat {
    font-weight: 500;
    color: #059669;
  }

  .stat-detail {
    color: #6b7280;
  }

  .future-option {
    margin-left: 2rem;
    margin-top: 0.5rem;
  }

  .checkbox-option {
    display: block;
    cursor: pointer;
  }

  .checkbox-option input[type="checkbox"] {
    margin-right: 0.5rem;
  }

  .checkbox-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .checkbox-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #111827;
  }

  .checkbox-description {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    margin-left: 1.5rem;
  }

  .matching-preview {
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-top: 1px solid #f3f4f6;
  }

  .preview-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin: 0 0 0.75rem 0;
  }

  .preview-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-transaction {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: white;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .preview-merchant {
    font-weight: 500;
    color: #111827;
    truncate: true;
  }

  .preview-amount {
    font-weight: 500;
    color: #059669;
  }

  .preview-date {
    color: #6b7280;
  }

  .preview-more {
    padding: 0.5rem 0.75rem;
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1.5rem;
    border-top: 1px solid #f3f4f6;
  }

  .btn-secondary {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  @media (max-width: 640px) {
    .smart-categorization-modal {
      margin: 0.5rem;
      max-width: none;
    }

    .modal-header {
      padding: 1rem;
    }

    .scope-selection {
      padding: 1rem;
    }

    .modal-actions {
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-secondary,
    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
</style>