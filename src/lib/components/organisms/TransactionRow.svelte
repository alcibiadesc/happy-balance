<script lang="ts">
  import { Tag, Eye, EyeOff, Trash2 } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import type { Transaction, Category } from '$lib/types/transaction';

  interface TransactionRowProps {
    transaction: Transaction;
    category?: Category;
    isSelectionMode: boolean;
    isSelected: boolean;
    isEditingObservations: boolean;
    editingObservationsText: string;
    onToggleSelection: () => void;
    onOpenCategoryModal: () => void;
    onStartEditingObservations: () => void;
    onSaveObservations: () => Promise<void>;
    onCancelEditingObservations: () => void;
    onUpdateObservationsText: (text: string) => void;
    onToggleHide: () => void;
    onDelete: () => void;
    formatAmount: (amount: number) => string;
  }

  let {
    transaction,
    category,
    isSelectionMode,
    isSelected,
    isEditingObservations,
    editingObservationsText = $bindable(),
    onToggleSelection,
    onOpenCategoryModal,
    onStartEditingObservations,
    onSaveObservations,
    onCancelEditingObservations,
    onUpdateObservationsText,
    onToggleHide,
    onDelete,
    formatAmount
  }: TransactionRowProps = $props();

  // Focus directive for auto-focusing input
  function focus(node: HTMLElement) {
    node.focus();
  }

  async function handleObservationsKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      await onSaveObservations();
      setTimeout(() => onCancelEditingObservations(), 50);
    } else if (e.key === 'Escape') {
      onCancelEditingObservations();
    }
  }

  async function handleObservationsBlur() {
    await onSaveObservations();
    setTimeout(() => onCancelEditingObservations(), 50);
  }
</script>

<div
  class="transaction-card"
  class:selected={isSelected}
  class:hidden={transaction.hidden}
  data-testid="transaction-item"
  data-transaction-id={transaction.id}
>
  {#if isSelectionMode}
    <input
      type="checkbox"
      checked={isSelected}
      onchange={onToggleSelection}
      onclick={(e) => e.stopPropagation()}
    />
  {/if}

  <div class="transaction-details">
    <div class="transaction-main">
      <div>
        <div class="transaction-description">{transaction.description}</div>
        {#if isEditingObservations}
          <div class="observations-editor">
            <input
              type="text"
              class="observations-input"
              value={editingObservationsText}
              placeholder={$t('transactions.observations_placeholder')}
              maxlength="500"
              oninput={(e) => onUpdateObservationsText(e.currentTarget.value)}
              onkeydown={handleObservationsKeydown}
              onblur={handleObservationsBlur}
              use:focus
            />
          </div>
        {:else}
          <div
            class="transaction-observations"
            class:empty={!transaction.observations}
            onclick={(e) => {
              e.stopPropagation();
              onStartEditingObservations();
            }}
            title={$t('transactions.observations_edit_tooltip')}
          >
            {transaction.observations || $t('transactions.observations_placeholder')}
          </div>
        {/if}
        <div class="transaction-meta">
          <span>{transaction.merchant}</span>
          <span>•</span>
          <span>{transaction.time}</span>
        </div>
      </div>
      <div class="transaction-amount" class:income={transaction.amount > 0}>
        {formatAmount(transaction.amount)}
      </div>
    </div>

    <div class="category-selector">
      <button
        class="category-btn"
        class:has-category={category}
        style={category ? `background-color: ${category.color}20; border-color: ${category.color}; color: ${category.color}` : ''}
        title={category ? `Categoría: ${category.name}` : 'Asignar categoría'}
        data-testid="transaction-category"
        onclick={(e) => {
          e.stopPropagation();
          onOpenCategoryModal();
        }}
      >
        {#if category}
          <span class="category-icon-btn">{category.icon}</span>
          <span>{category.name}</span>
        {:else}
          <Tag size={14} />
          {$t('transactions.add_category')}
        {/if}
      </button>
    </div>
  </div>

  <div class="transaction-actions">
    <button
      class="action-btn"
      class:hidden={transaction.hidden}
      title={transaction.hidden ? $t('transactions.show_transaction') : $t('transactions.hide_transaction')}
      onclick={(e) => {
        e.stopPropagation();
        onToggleHide();
      }}
    >
      {#if transaction.hidden}
        <EyeOff size={14} />
      {:else}
        <Eye size={14} />
      {/if}
    </button>
    <button
      class="action-btn delete-btn"
      title={$t('transactions.delete_transaction')}
      onclick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <Trash2 size={14} />
    </button>
  </div>
</div>

<style>
  .transaction-card {
    display: flex;
    align-items: stretch;
    gap: 0.875rem;
    padding: 0.875rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
    margin-bottom: 0.625rem;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    min-height: 4rem;
    overflow: hidden;
  }

  .transaction-card:hover {
    background: var(--surface-hover);
    border-color: var(--border-color-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px) scale(1.005);
  }

  .transaction-card.selected {
    background: var(--cornflower-alpha-10);
    border-color: var(--cornflower);
    box-shadow: 0 0 0 2px var(--cornflower-alpha-20);
  }

  .transaction-card.hidden {
    opacity: 0.6;
    background: repeating-linear-gradient(
      45deg,
      var(--surface-muted),
      var(--surface-muted) 10px,
      var(--surface-elevated) 10px,
      var(--surface-elevated) 20px
    );
  }

  .transaction-details {
    flex: 1;
    min-width: 0; /* Prevent text overflow */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .transaction-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .transaction-description {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-primary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transaction-observations {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-style: normal;
    margin-top: 0.25rem;
    cursor: pointer;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
    background: var(--surface-muted);
    display: inline-block;
  }

  .transaction-observations:hover {
    background: var(--surface-muted);
  }

  .transaction-observations.empty {
    opacity: 0.5;
  }

  .observations-editor {
    margin: 0.25rem 0;
  }

  .observations-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
    border: 1px solid var(--primary);
    border-radius: 4px;
    background: var(--surface-elevated);
    color: var(--text-primary);
    outline: none;
    transition: all 0.2s ease;
  }

  .observations-input:focus {
    box-shadow: 0 0 0 3px var(--primary-alpha-10);
  }

  .transaction-meta {
    display: flex;
    gap: var(--space-xs);
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-top: 0.25rem;
    opacity: 0.9;
  }

  .transaction-amount {
    font-weight: 700;
    font-size: 1rem;
    color: var(--froly);
    white-space: nowrap;
    flex-shrink: 0;
    text-align: right;
    min-width: fit-content;
  }

  .transaction-amount.income {
    color: var(--acapulco);
  }

  .category-selector {
    position: relative;
    margin-top: var(--space-xs);
    z-index: 1;
  }

  .category-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 4px var(--space-sm);
    border: 1px dashed var(--acapulco);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--acapulco);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-btn:hover {
    transform: scale(1.02);
    opacity: 0.9;
  }

  .category-btn:not(.has-category):hover {
    background: var(--acapulco-alpha-10);
    border-color: var(--acapulco);
  }

  .category-btn.has-category {
    border-width: 1px;
    border-style: solid;
    font-weight: 500;
  }

  .category-icon-btn {
    font-size: 0.875rem;
  }

  .transaction-actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.375rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .action-btn.hidden {
    color: var(--text-muted);
    opacity: 0.5;
  }

  .delete-btn:hover {
    background: var(--error-alpha-10);
    color: var(--error);
  }

  input[type="checkbox"] {
    margin-right: 0.5rem;
    cursor: pointer;
  }

  /* Ultra-thin mobile design */
  @media (max-width: 768px) {
    .transaction-card {
      padding: 0.75rem;
      gap: 0.625rem;
      margin-bottom: 0.5rem;
      border-radius: 0.625rem;
      min-height: unset;
      border: none;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .transaction-card:active {
      transform: scale(0.99);
      box-shadow: none;
    }

    .transaction-main {
      flex-direction: row;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .transaction-main > div:first-child {
      flex: 1;
      min-width: 0;
    }

    .transaction-description {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.125rem;
    }

    .transaction-amount {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-top: 0.125rem;
    }

    .transaction-meta {
      font-size: 0.6875rem;
      margin-top: 0.125rem;
      opacity: 0.8;
    }

    .transaction-observations {
      font-size: 0.75rem;
      margin-top: 0.125rem;
      padding: 0.125rem 0.25rem;
    }

    .category-selector {
      margin-top: 0.375rem;
    }

    .category-btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.6875rem;
      border-radius: 0.375rem;
    }

    .transaction-actions {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      gap: 0.125rem;
      opacity: 0.7;
    }

    .action-btn {
      padding: 0.25rem;
      border-radius: 0.375rem;
    }

    .action-btn svg {
      width: 12px;
      height: 12px;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      margin-right: 0.375rem;
    }
  }
</style>