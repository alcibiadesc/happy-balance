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

<div class="transaction-group" class:collapsed={!isExpanded}>
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
  {/if}
</div>

<style>
  .transaction-group {
    margin-bottom: 1.5rem;
    background: transparent;
    border-radius: 0.875rem;
    padding: 0;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.875rem;
    margin-bottom: 0.625rem;
    border-radius: 0.625rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
  }

  .group-header:hover {
    background: var(--surface-hover);
    border-color: var(--border-color-hover);
    transform: translateY(-1px);
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
  }

  .group-chevron {
    transition: transform 0.2s;
    color: var(--text-secondary);
  }

  .group-count {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    font-weight: 400;
    opacity: 0.9;
  }

  .transaction-group.collapsed .group-header {
    margin-bottom: 0;
  }

  .group-total {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 0.9375rem;
  }
</style>