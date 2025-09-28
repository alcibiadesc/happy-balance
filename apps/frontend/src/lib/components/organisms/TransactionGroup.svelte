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
    margin-bottom: 2rem;
    background: var(--surface-elevated);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    margin: -0.5rem -0.5rem 1rem -0.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    width: calc(100% + 1rem);
  }

  .group-header:hover {
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
    color: var(--text-secondary);
  }

  .group-count {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .transaction-group.collapsed {
    padding-bottom: 0.5rem;
  }

  .transaction-group.collapsed .group-header {
    margin-bottom: 0;
  }

  .group-total {
    font-weight: 600;
    color: var(--text-primary);
  }
</style>