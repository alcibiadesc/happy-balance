<script lang="ts">
  import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-svelte';
  import TransactionRow from './TransactionRow.svelte';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';

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
    transactions
      .filter(t => !t.hidden)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const incomeTotal = $derived(
    transactions
      .filter(t => !t.hidden && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const expenseTotal = $derived(
    transactions
      .filter(t => !t.hidden && t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
</script>

<div class="transaction-group" class:collapsed={!isExpanded}>
  <button class="group-header" onclick={onToggleGroup}>
    <div class="group-info">
      <span class="group-icon">
        {#if isExpanded}
          <ChevronDown size={16} />
        {:else}
          <ChevronRight size={16} />
        {/if}
      </span>
      <span class="group-date">{date}</span>
      <span class="group-count">({transactions.length})</span>
    </div>
    <div class="group-totals">
      {#if incomeTotal > 0}
        <span class="amount income">{formatAmount(incomeTotal)}</span>
      {/if}
      {#if expenseTotal < 0}
        <span class="amount expense">{formatAmount(expenseTotal)}</span>
      {/if}
      <span class="amount total" class:positive={groupTotal > 0}>
        {formatAmount(groupTotal)}
      </span>
    </div>
  </button>

  {#if isExpanded}
    <div class="transaction-list">
      {#each transactions as transaction (transaction.id)}
        <TransactionRow
          {transaction}
          {categories}
          {isSelectionMode}
          isSelected={selectedIds.has(transaction.id)}
          isEditingObservations={editingObservationsId === transaction.id}
          {observationsText}
          onToggleSelection={() => onToggleSelection(transaction.id)}
          onCategorize={() => onCategorize(transaction)}
          onToggleHide={() => onToggleHide(transaction)}
          onDelete={() => onDelete(transaction.id)}
          onEditObservations={() => onEditObservations(transaction)}
          onUpdateObservationsText={onUpdateObservationsText}
          onSaveObservations={onSaveObservations}
          onCancelObservations={onCancelObservations}
          {formatAmount}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .transaction-group {
    margin-bottom: 2rem;
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05),
                0 1px 2px rgba(0, 0, 0, 0.03);
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
    background: rgba(229, 231, 235, 0.3);
  }

  .group-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .group-icon {
    display: flex;
    align-items: center;
    color: var(--gray-400);
  }

  .group-date {
    font-weight: 500;
    color: var(--gray-700);
    font-size: 0.875rem;
  }

  .group-count {
    color: var(--gray-500);
    font-size: 0.8125rem;
  }

  .group-totals {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .amount {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .amount.income {
    color: var(--acapulco);
  }

  .amount.expense {
    color: var(--froly);
  }

  .amount.total {
    color: var(--gray-700);
    font-weight: 600;
  }

  .amount.total.positive {
    color: var(--acapulco);
  }

  .transaction-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .transaction-group.collapsed {
    padding-bottom: 0.5rem;
  }

  .transaction-group.collapsed .group-header {
    margin-bottom: 0;
  }
</style>