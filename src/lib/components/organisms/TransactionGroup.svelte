<script lang="ts">
  import { ChevronDown, ChevronRight } from 'lucide-svelte';
  import TransactionRow from './TransactionRow.svelte';
  import type { Transaction, Category } from '$lib/types/transaction';

  interface Props {
    date: string;
    transactions: Transaction[];
    categories: Category[];
    isExpanded: boolean;
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    editingObservationsId: string | null;
    observationsText: string;
    onToggleGroup: () => void;
    onToggleSelection: (id: string) => void;
    onCategorize: (transaction: Transaction) => void;
    onToggleHide: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    onEditObservations: (transaction: Transaction) => void;
    onUpdateObservationsText: (text: string) => void;
    onSaveObservations: () => Promise<void>;
    onCancelObservations: () => void;
    formatAmount: (amount: number) => string;
  }

  let {
    date,
    transactions,
    categories,
    isExpanded,
    isSelectionMode,
    selectedIds,
    editingObservationsId,
    observationsText,
    onToggleGroup,
    onToggleSelection,
    onCategorize,
    onToggleHide,
    onDelete,
    onEditObservations,
    onUpdateObservationsText,
    onSaveObservations,
    onCancelObservations,
    formatAmount
  }: Props = $props();

  const groupTotal = $derived(
    transactions.reduce((sum, t) => sum + t.amount, 0)
  );

  function getCategoryById(categoryId?: string): Category | undefined {
    if (!categoryId) return undefined;
    return categories.find(c => c.id === categoryId);
  }
</script>

<div class="transaction-group" class:collapsed={!isExpanded} class:expanded={isExpanded}>
  <button
    class="group-header"
    onclick={onToggleGroup}
    aria-expanded={isExpanded}
  >
    <div class="group-header-left">
      {#if !isExpanded}
        <ChevronRight size={16} class="group-chevron" />
      {:else}
        <ChevronDown size={16} class="group-chevron" />
      {/if}
      <span>{date}</span>
      {#if !isExpanded}
        <span class="group-count">({transactions.length} transacciones)</span>
      {/if}
    </div>
    <span class="group-total">
      {formatAmount(groupTotal)}
    </span>
  </button>

  {#if isExpanded}
    <div class="transactions-container">
      {#each transactions as transaction}
        {@const category = getCategoryById(transaction.categoryId)}
        <TransactionRow
          {transaction}
          {category}
          {isSelectionMode}
          isSelected={selectedIds.has(transaction.id)}
          isEditingObservations={editingObservationsId === transaction.id}
          editingObservationsText={editingObservationsId === transaction.id ? observationsText : ''}
          onToggleSelection={() => onToggleSelection(transaction.id)}
          onOpenCategoryModal={() => onCategorize(transaction)}
          onToggleHide={() => onToggleHide(transaction)}
          onDelete={() => onDelete(transaction.id)}
          onStartEditingObservations={() => onEditObservations(transaction)}
          onUpdateObservationsText={onUpdateObservationsText}
          onSaveObservations={onSaveObservations}
          onCancelEditingObservations={onCancelObservations}
          {formatAmount}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .transaction-group {
    margin-bottom: 1.75rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .transaction-group.expanded {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .transaction-group.collapsed {
    background: transparent;
    border-color: transparent;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
    border-radius: 0.875rem;
  }

  .transaction-group.collapsed .group-header {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
  }

  .transaction-group.collapsed .group-header:hover {
    background: var(--surface-hover);
    border-color: var(--border-color-hover);
    transform: translateY(-1px);
  }

  .transaction-group.expanded .group-header {
    border-bottom: 1px solid var(--border-color);
    border-radius: 0;
    margin-bottom: 0;
  }

  .transaction-group.expanded .group-header:hover {
    background: var(--surface-muted);
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
  }

  .group-chevron {
    transition: transform 0.2s;
    color: var(--text-tertiary);
    opacity: 0.7;
  }

  .group-count {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    font-weight: 400;
    opacity: 0.8;
  }

  .group-total {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 0.9375rem;
  }

  /* Container for transactions */
  .transactions-container {
    padding: 0.5rem;
  }

  /* Override transaction card styles when inside group */
  :global(.transaction-group.expanded .transaction-card) {
    background: transparent;
    border: none;
    box-shadow: none;
    margin-bottom: 0.25rem;
    padding: 0.75rem;
    position: relative;
  }

  :global(.transaction-group.expanded .transaction-card::after) {
    content: '';
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: var(--border-color);
    opacity: 0.3;
  }

  :global(.transaction-group.expanded .transaction-card:last-child::after) {
    display: none;
  }

  :global(.transaction-group.expanded .transaction-card:hover) {
    background: var(--surface-muted);
    transform: none;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .transaction-group {
      margin-bottom: 1rem;
      border-radius: 0.625rem;
    }

    .group-header {
      padding: 0.75rem 0.875rem;
      font-size: 0.75rem;
    }

    .group-total {
      font-size: 0.875rem;
    }

    .transactions-container {
      padding: 0.25rem;
    }

    :global(.transaction-group.expanded .transaction-card) {
      padding: 0.625rem 0.75rem;
    }
  }
</style>