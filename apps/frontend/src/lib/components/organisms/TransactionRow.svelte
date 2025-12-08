<script lang="ts">
  import { Eye, EyeOff, Trash2, Split } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import type { Transaction, Category } from '$lib/types/transaction';
  import AmountDisplay from '../atoms/AmountDisplay.svelte';
  import SplitIndicator from '../atoms/SplitIndicator.svelte';
  import CategoryButton from '../atoms/CategoryButton.svelte';

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
  }: TransactionRowProps = $props();

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

  const hasSplit = $derived(transaction.splitPercentage !== undefined);
  const isLinked = $derived(!!transaction.linkedTransactionId);
  const isExpense = $derived(transaction.amount < 0);
</script>

<div
  class="transaction-card"
  class:selected={isSelected}
  class:hidden={transaction.hidden}
  class:has-split={hasSplit}
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
      <div class="transaction-content">
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
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
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
        <AmountDisplay amount={transaction.amount} showSign={false} />
        {#if hasSplit && transaction.splitPercentage !== undefined}
          <SplitIndicator percentage={transaction.splitPercentage} {isLinked} {isExpense} />
        {/if}
      </div>
    </div>

    <div class="category-selector">
      <CategoryButton
        {category}
        onclick={(e) => {
          e.stopPropagation();
          onOpenCategoryModal();
        }}
      />
    </div>
  </div>

  <div class="transaction-actions">
    {#if onOpenSplitModal}
      <button
        class="action-btn split-btn"
        class:linked={isLinked}
        title={isLinked
          ? isExpense
            ? 'Gasto compartido vinculado'
            : 'Reembolso vinculado'
          : isExpense
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

  .transaction-card.has-split {
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

  .transaction-content {
    min-width: 0;
    flex: 1;
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
    gap: 0.25rem;
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

  .category-selector {
    position: relative;
    margin-top: 0.25rem;
    z-index: 1;
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

    .transaction-content {
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

    .category-selector {
      margin-top: 0;
    }

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
  }

  @media (max-width: 480px) {
    .transaction-card {
      padding: 0.75rem;
      padding-bottom: 0.5rem;
    }

    .transaction-description {
      font-size: 0.85rem;
    }

    .transaction-meta {
      font-size: 0.65rem;
    }

    .action-btn {
      padding: 0.25rem 0.375rem;
    }

    .action-btn :global(svg) {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 360px) {
    .transaction-card {
      padding: 0.625rem;
      padding-bottom: 0.375rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .transaction-description {
      font-size: 0.8rem;
      max-width: 140px;
    }

    .transaction-meta {
      font-size: 0.6rem;
      gap: 0.25rem;
    }

    .transaction-meta span:nth-child(2) {
      display: none;
    }

    .transaction-actions {
      gap: 0.125rem;
    }

    .action-btn {
      padding: 0.25rem;
    }
  }
</style>
