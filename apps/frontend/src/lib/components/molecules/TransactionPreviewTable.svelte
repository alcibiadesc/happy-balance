<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Badge from '../atoms/Badge.svelte';
  import type { ImportableTransaction } from '../../shared/types/transaction';

  export let transactions: ImportableTransaction[] = [];
  export let showDuplicates = true;
  export let loading = false;

  const dispatch = createEventDispatcher<{
    'toggle-selection': { id: string; selected: boolean };
    'toggle-all': { selected: boolean };
    'edit-transaction': { transaction: ImportableTransaction };
  }>();

  $: visibleTransactions = showDuplicates
    ? transactions
    : transactions.filter((t) => !t.isDuplicate);

  $: allSelected = visibleTransactions.length > 0 && visibleTransactions.every((t) => t.isSelected);
  $: someSelected = visibleTransactions.some((t) => t.isSelected);

  function handleToggleAll() {
    const newState = !allSelected;
    dispatch('toggle-all', { selected: newState });
  }

  function handleToggleTransaction(transaction: ImportableTransaction) {
    dispatch('toggle-selection', {
      id: transaction.id,
      selected: !transaction.isSelected,
    });
  }

  function formatCurrency(amount: number): string {
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));

    return isNegative ? `-${formatted}` : formatted;
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  function getAmountColorClass(amount: number): string {
    return amount >= 0 ? 'text-acapulco' : 'text-froly';
  }
</script>

<div class="bg-bridesmaid border-evening-sea overflow-hidden rounded-lg border border-opacity-10">
  {#if loading}
    <div class="p-8 text-center">
      <div
        class="border-acapulco mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
      ></div>
      <p class="text-evening-sea">Processing transactions...</p>
    </div>
  {:else if visibleTransactions.length === 0}
    <div class="text-evening-sea p-8 text-center opacity-70">
      <svg
        class="text-evening-sea mx-auto mb-4 h-12 w-12 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="font-medium">No transactions to display</p>
      <p class="mt-1 text-sm">
        {showDuplicates
          ? 'Upload a CSV file to see transactions'
          : 'No non-duplicate transactions found'}
      </p>
    </div>
  {:else}
    <!-- Table Header -->
    <div
      class="bg-evening-sea border-evening-sea border-b border-opacity-10 bg-opacity-5 px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              on:change={handleToggleAll}
              class="text-acapulco border-evening-sea focus:ring-acapulco h-4 w-4 rounded border-opacity-30 focus:ring-offset-0"
            />
            <span class="text-evening-sea text-sm font-medium">
              Select all ({visibleTransactions.length})
            </span>
          </label>
        </div>

        <div class="text-evening-sea flex items-center space-x-2 text-sm opacity-70">
          <span>{visibleTransactions.filter((t) => t.isSelected).length} selected</span>
          {#if transactions.some((t) => t.isDuplicate)}
            <span>•</span>
            <span>{transactions.filter((t) => t.isDuplicate).length} duplicates</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-evening-sea bg-opacity-5 text-left">
          <tr>
            <th
              class="text-evening-sea px-6 py-3 text-xs font-medium uppercase tracking-wider opacity-70"
              >Selection</th
            >
            <th
              class="text-evening-sea px-6 py-3 text-xs font-medium uppercase tracking-wider opacity-70"
              >Date</th
            >
            <th
              class="text-evening-sea px-6 py-3 text-xs font-medium uppercase tracking-wider opacity-70"
              >Partner</th
            >
            <th
              class="text-evening-sea px-6 py-3 text-xs font-medium uppercase tracking-wider opacity-70"
              >Description</th
            >
            <th
              class="text-evening-sea px-6 py-3 text-xs font-medium uppercase tracking-wider opacity-70"
              >Amount</th
            >
            <th
              class="text-evening-sea px-6 py-3 text-xs font-medium uppercase tracking-wider opacity-70"
              >Status</th
            >
          </tr>
        </thead>
        <tbody class="divide-evening-sea divide-y divide-opacity-10">
          {#each visibleTransactions as transaction (transaction.id)}
            <tr
              class="hover:bg-evening-sea transition-colors duration-150 hover:bg-opacity-5
                {transaction.isDuplicate ? 'bg-sunglow bg-opacity-5' : ''}
              "
            >
              <!-- Selection -->
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  checked={transaction.isSelected}
                  on:change={() => handleToggleTransaction(transaction)}
                  disabled={transaction.isDuplicate}
                  class="text-acapulco border-evening-sea focus:ring-acapulco h-4 w-4 rounded border-opacity-30 focus:ring-offset-0
                    {transaction.isDuplicate ? 'cursor-not-allowed opacity-50' : ''}
                  "
                />
              </td>

              <!-- Date -->
              <td class="text-evening-sea whitespace-nowrap px-6 py-4 text-sm">
                {formatDate(transaction.bookingDate)}
              </td>

              <!-- Partner -->
              <td class="text-evening-sea px-6 py-4 text-sm">
                <div class="max-w-40 truncate font-medium" title={transaction.partnerName}>
                  {transaction.partnerName || 'N/A'}
                </div>
                {#if transaction.partnerIban}
                  <div class="text-evening-sea max-w-40 truncate text-xs opacity-60">
                    {transaction.partnerIban}
                  </div>
                {/if}
              </td>

              <!-- Description -->
              <td class="text-evening-sea max-w-60 px-6 py-4 text-sm">
                <div class="truncate" title={transaction.paymentReference}>
                  {transaction.paymentReference || transaction.type || 'N/A'}
                </div>
                {#if transaction.type && transaction.paymentReference}
                  <div class="text-evening-sea truncate text-xs opacity-60">
                    {transaction.type}
                  </div>
                {/if}
              </td>

              <!-- Amount -->
              <td
                class="whitespace-nowrap px-6 py-4 text-sm font-medium {getAmountColorClass(
                  transaction.amountEur
                )}"
              >
                {formatCurrency(transaction.amountEur)}
                {#if transaction.originalCurrency && transaction.originalCurrency !== 'EUR'}
                  <div class="text-evening-sea text-xs opacity-60">
                    {formatCurrency(transaction.originalAmount || 0)}
                    {transaction.originalCurrency}
                  </div>
                {/if}
              </td>

              <!-- Status -->
              <td class="whitespace-nowrap px-6 py-4">
                {#if transaction.isDuplicate}
                  <Badge variant="warning" size="sm">Duplicate</Badge>
                  {#if transaction.duplicateReason}
                    <div
                      class="text-evening-sea mt-1 max-w-32 text-xs opacity-60"
                      title={transaction.duplicateReason}
                    >
                      {transaction.duplicateReason}
                    </div>
                  {/if}
                {:else if transaction.isSelected}
                  <Badge variant="success" size="sm">Ready</Badge>
                {:else}
                  <Badge variant="default" size="sm">Skipped</Badge>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
