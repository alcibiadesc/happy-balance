<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';

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
    return transaction.merchant || transaction.description || $t('data.unknown_merchant');
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
        <div class="header-content">
          <h2 id="categorization-title" class="modal-title">{$t('modals.smart_categorization.title')}</h2>
          <div class="category-preview">
            <span class="merchant-name">{getPatternName(transaction)}</span>
            <div class="category-assignment">
              <span class="arrow">→</span>
              <div class="category-chip">
                <span class="category-icon">{selectedCategory.icon}</span>
                <span class="category-name">{selectedCategory.name}</span>
              </div>
            </div>
          </div>
        </div>
        <button class="close-btn" on:click={onCancel} aria-label="{$t('accessibility.close_modal')}">
          <X size={20} />
        </button>
      </div>

      <!-- Application scope options -->
      <div class="content-section">
        <div class="scope-options">
          <!-- Single transaction option -->
          <label class="scope-option" class:selected={selectedScope === 'single'}>
            <input
              type="radio"
              bind:group={selectedScope}
              value="single"
              name="scope"
            />
            <div class="option-content">
              <div class="option-info">
                <span class="option-title">{$t('modals.smart_categorization.scope_single_title')}</span>
                <span class="option-detail">{$t('modals.smart_categorization.scope_single_detail')}</span>
              </div>
              <span class="option-count">1</span>
            </div>
          </label>

          <!-- Similar transactions option -->
          {#if hasMatches}
            <label class="scope-option" class:selected={selectedScope === 'pattern'}>
              <input
                type="radio"
                bind:group={selectedScope}
                value="pattern"
                name="scope"
              />
              <div class="option-content">
                <div class="option-info">
                  <span class="option-title">{$t('modals.smart_categorization.scope_similar_title')}</span>
                  <span class="option-detail">{$t('modals.smart_categorization.scope_similar_detail')}</span>
                </div>
                <span class="option-count">{matchingTransactions.length + 1}</span>
              </div>
            </label>

            <!-- Future transactions checkbox -->
            {#if selectedScope === 'pattern'}
              <div class="future-option">
                <label class="checkbox-option">
                  <input type="checkbox" bind:checked={applyToFuture} />
                  <span class="checkbox-label">{$t('modals.smart_categorization.auto_apply_checkbox')}</span>
                </label>
              </div>
            {/if}
          {/if}
        </div>

        <!-- Preview section -->
        {#if selectedScope === 'pattern' && hasMatches && matchingTransactions.length > 0}
          <div class="preview-section">
            <div class="preview-header">
              <span class="preview-title">{$t('modals.smart_categorization.preview_title')}</span>
              <span class="preview-total">{getTotalAmount()}</span>
            </div>
            <div class="preview-list">
              {#each matchingTransactions.slice(0, 3) as match}
                <div class="preview-item">
                  <span class="preview-merchant">{match.merchant}</span>
                  <span class="preview-amount">{formatAmount(match.amount)}</span>
                </div>
              {/each}
              {#if matchingTransactions.length > 3}
                <div class="preview-more">+{matchingTransactions.length - 3} {$t('navigation.transactions').toLowerCase()} más</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Action buttons -->
      <div class="modal-actions">
        <button class="btn-secondary" on:click={onCancel}>
          {$t('common.cancel')}
        </button>
        <button class="btn-primary" on:click={handleConfirm}>
          {selectedScope === 'single' ? $t('modals.smart_categorization.apply_single') : $t('modals.smart_categorization.apply_multiple', { count: matchingTransactions.length + 1 })}
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
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    max-width: 450px;
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
    margin: 0 0 12px 0;
    line-height: 1.3;
  }

  .category-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .merchant-name {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .category-assignment {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arrow {
    color: #94a3b8;
    font-size: 12px;
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
  }

  .category-icon {
    font-size: 14px;
  }

  .category-name {
    font-size: 12px;
    font-weight: 500;
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

  .content-section {
    padding: 8px 24px 24px;
    max-height: calc(90vh - 200px);
    overflow-y: auto;
  }

  .scope-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .scope-option {
    display: block;
    cursor: pointer;
  }

  .scope-option input[type="radio"] {
    display: none;
  }

  .option-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    transition: all 0.2s ease;
  }

  .scope-option:hover .option-content {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  .scope-option.selected .option-content {
    border-color: #059669;
    background: #f0fdf4;
  }

  .option-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .option-title {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .option-detail {
    font-size: 12px;
    color: #64748b;
    line-height: 1.3;
  }

  .option-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    background: #f1f5f9;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }

  .scope-option.selected .option-count {
    background: #059669;
    color: white;
  }

  .future-option {
    margin-top: 8px;
    margin-left: 16px;
  }

  .checkbox-option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-option input[type="checkbox"] {
    margin: 2px 0 0 0;
    accent-color: #059669;
  }

  .checkbox-label {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }

  .preview-section {
    padding: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-top: 16px;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .preview-title {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }

  .preview-total {
    font-size: 12px;
    font-weight: 600;
    color: #059669;
  }

  .preview-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .preview-merchant {
    font-size: 12px;
    color: #374151;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .preview-amount {
    font-size: 12px;
    font-weight: 600;
    color: #dc2626;
  }

  .preview-more {
    padding: 8px 12px;
    text-align: center;
    font-size: 11px;
    color: #64748b;
    font-style: italic;
    background: #f1f5f9;
    border-radius: 8px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid #f1f5f9;
  }

  .btn-secondary {
    flex: 1;
    padding: 12px 16px;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #64748b;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
  }

  .btn-primary {
    flex: 2;
    padding: 12px 16px;
    border: 1.5px solid #059669;
    background: #059669;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background: #047857;
    border-color: #047857;
  }

  /* Responsive */
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

    .content-section {
      padding: 8px 20px 20px;
    }

    .modal-actions {
      padding: 20px;
      flex-direction: column;
      gap: 8px;
    }

    .btn-secondary,
    .btn-primary {
      flex: none;
    }

    .category-assignment {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .arrow {
      transform: rotate(90deg);
    }
  }

  /* Scrollbar styling */
  .content-section::-webkit-scrollbar {
    width: 6px;
  }

  .content-section::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-section::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .content-section::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>