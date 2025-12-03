<script lang="ts">
  import { Tag, Eye, EyeOff, Trash2, Split } from 'lucide-svelte';
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
    onOpenSplitModal?: () => void;
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
    onOpenSplitModal,
    formatAmount,
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
      <div class="transaction-amount-wrapper">
        <div class="transaction-amount" class:income={transaction.amount > 0}>
          {formatAmount(transaction.amount)}
        </div>
        {#if transaction.linkedTransactionId && transaction.splitPercentage !== undefined}
          <div
            class="split-indicator"
            title={transaction.amount < 0
              ? `Gasto compartido - Pagas el ${transaction.splitPercentage}%`
              : `Reembolso vinculado - Cubre el ${transaction.splitPercentage}%`}
          >
            <Split size={12} />
            <span>{transaction.splitPercentage}%</span>
          </div>
        {:else if transaction.splitPercentage !== undefined}
          <div
            class="split-indicator split-unlinked"
            title={transaction.amount < 0
              ? `Gasto compartido - Pagas el ${transaction.splitPercentage}% (sin vincular)`
              : `Reembolso - Cubre el ${transaction.splitPercentage}% (sin vincular)`}
          >
            <Split size={12} />
            <span>{transaction.splitPercentage}%</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="category-selector">
      <button
        class="category-btn"
        class:has-category={category}
        style={category
          ? `background-color: ${category.color}20; border-color: ${category.color}; color: ${category.color}`
          : ''}
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
    {#if onOpenSplitModal}
      <button
        class="action-btn split-btn"
        class:linked={transaction.linkedTransactionId}
        title={transaction.linkedTransactionId
          ? transaction.amount < 0
            ? 'Gasto compartido vinculado'
            : 'Reembolso vinculado'
          : transaction.amount < 0
            ? 'Marcar como gasto compartido'
            : 'Vincular con gasto compartido'}
        onclick={(e) => {
          e.stopPropagation();
          onOpenSplitModal();
        }}
      >
        <Split size={14} />
      </button>
    {/if}
    <button
      class="action-btn"
      class:hidden={transaction.hidden}
      title={transaction.hidden
        ? $t('transactions.show_transaction')
        : $t('transactions.hide_transaction')}
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
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-muted);
    border: 1px solid transparent;
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    min-height: 4.5rem;
  }

  .transaction-card:hover {
    background: var(--surface-hover);
    border-color: var(--border-color);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .transaction-card.selected {
    background: var(--cornflower-alpha-10);
    border-color: var(--cornflower);
    box-shadow: 0 0 0 2px var(--cornflower-alpha-20);
  }

  .transaction-card.hidden {
    opacity: 0.5;
    background: var(--surface-muted);
  }

  .transaction-card:has(.split-indicator) {
    border-left: 3px solid var(--primary);
  }

  .transaction-details {
    flex: 1;
  }

  .transaction-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .transaction-description {
    font-weight: 500;
    color: var(--text-primary);
  }

  .transaction-observations {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-style: italic;
    margin-top: 2px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
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
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .transaction-amount-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .transaction-amount {
    font-weight: 600;
    color: var(--froly);
  }

  .transaction-amount.income {
    color: var(--acapulco);
  }

  .split-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: var(--primary-alpha-10);
    border: 1px solid var(--primary);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--primary);
    cursor: help;
    transition: all 0.2s ease;
  }

  .split-indicator:hover {
    background: var(--primary-alpha-20);
    transform: scale(1.05);
  }

  .split-indicator.split-unlinked {
    background: var(--surface-muted);
    border-color: var(--text-secondary);
    color: var(--text-secondary);
    border-style: dashed;
  }

  .split-indicator.split-unlinked:hover {
    background: var(--surface-hover);
    border-color: var(--text-primary);
    color: var(--text-primary);
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

  .split-btn.linked {
    color: var(--primary);
    background: var(--primary-alpha-10);
  }

  .split-btn:hover {
    background: var(--primary-alpha-10);
    color: var(--primary);
  }

  input[type='checkbox'] {
    margin-right: 0.5rem;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .transaction-card {
      flex-direction: column;
      align-items: stretch;
      padding: 0.875rem;
      padding-bottom: 0.625rem;
      gap: 0.375rem;
    }

    .transaction-details {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .transaction-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .transaction-main > div:first-child {
      min-width: 0;
      flex: 1;
    }

    .transaction-description {
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 0.5rem;
    }

    .transaction-observations {
      font-size: 0.75rem;
    }

    .transaction-meta {
      font-size: 0.7rem;
      flex-wrap: wrap;
    }

    .transaction-amount-wrapper {
      align-items: flex-end;
      flex-shrink: 0;
    }

    .transaction-amount {
      font-size: 1rem;
      font-weight: 600;
    }

    .category-selector {
      margin-top: 0;
    }

    .category-btn {
      font-size: 0.7rem;
      padding: 3px 8px;
    }

    /* Actions row at bottom */
    .transaction-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
      margin-top: 0.25rem;
      padding-top: 0.375rem;
      border-top: 1px solid var(--border-color);
    }

    .action-btn {
      padding: 0.375rem 0.5rem;
    }

    .action-btn :global(svg) {
      width: 14px;
      height: 14px;
    }

    .split-indicator {
      font-size: 0.65rem;
      padding: 0.1rem 0.375rem;
    }
  }

  @media (max-width: 480px) {
    .transaction-card {
      padding: 0.75rem;
      padding-bottom: 0.5rem;
    }

    .transaction-description {
      font-size: 0.85rem;
    }

    .transaction-amount {
      font-size: 0.9rem;
    }

    .transaction-meta {
      font-size: 0.65rem;
    }

    .category-btn {
      font-size: 0.65rem;
      padding: 2px 6px;
    }

    .category-icon-btn {
      font-size: 0.75rem;
    }

    .action-btn {
      padding: 0.25rem 0.375rem;
    }

    .action-btn :global(svg) {
      width: 12px;
      height: 12px;
    }
  }
</style>
