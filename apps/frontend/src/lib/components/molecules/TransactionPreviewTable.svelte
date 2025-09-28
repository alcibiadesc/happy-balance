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
    : transactions.filter(t => !t.isDuplicate);
  
  $: allSelected = visibleTransactions.length > 0 && visibleTransactions.every(t => t.isSelected);
  $: someSelected = visibleTransactions.some(t => t.isSelected);

  function handleToggleAll() {
    const newState = !allSelected;
    dispatch('toggle-all', { selected: newState });
  }

  function handleToggleTransaction(transaction: ImportableTransaction) {
    dispatch('toggle-selection', { 
      id: transaction.id, 
      selected: !transaction.isSelected 
    });
  }

  function formatCurrency(amount: number): string {
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
    
    return isNegative ? `-${formatted}` : formatted;
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  function getAmountColorClass(amount: number): string {
    return amount >= 0 ? 'text-acapulco' : 'text-froly';
  }
</script>

<div class="bg-bridesmaid rounded-lg border border-evening-sea border-opacity-10 overflow-hidden">
  {#if loading}
    <div class="p-8 text-center">
      <div class="animate-spin w-8 h-8 border-4 border-acapulco border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-evening-sea">Processing transactions...</p>
    </div>
  {:else if visibleTransactions.length === 0}
    <div class="p-8 text-center text-evening-sea opacity-70">
      <svg class="w-12 h-12 mx-auto mb-4 text-evening-sea opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="font-medium">No transactions to display</p>
      <p class="text-sm mt-1">
        {showDuplicates ? 'Upload a CSV file to see transactions' : 'No non-duplicate transactions found'}
      </p>
    </div>
  {:else}
    <!-- Table Header -->
    <div class="bg-evening-sea bg-opacity-5 px-6 py-4 border-b border-evening-sea border-opacity-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              on:change={handleToggleAll}
              class="w-4 h-4 text-acapulco border-evening-sea border-opacity-30 rounded focus:ring-acapulco focus:ring-offset-0"
            />
            <span class="text-sm font-medium text-evening-sea">
              Select all ({visibleTransactions.length})
            </span>
          </label>
        </div>
        
        <div class="flex items-center space-x-2 text-sm text-evening-sea opacity-70">
          <span>{visibleTransactions.filter(t => t.isSelected).length} selected</span>
          {#if transactions.some(t => t.isDuplicate)}
            <span>•</span>
            <span>{transactions.filter(t => t.isDuplicate).length} duplicates</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-evening-sea bg-opacity-5 text-left">
          <tr>
            <th class="px-6 py-3 text-xs font-medium text-evening-sea opacity-70 uppercase tracking-wider">Selection</th>
            <th class="px-6 py-3 text-xs font-medium text-evening-sea opacity-70 uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-xs font-medium text-evening-sea opacity-70 uppercase tracking-wider">Partner</th>
            <th class="px-6 py-3 text-xs font-medium text-evening-sea opacity-70 uppercase tracking-wider">Description</th>
            <th class="px-6 py-3 text-xs font-medium text-evening-sea opacity-70 uppercase tracking-wider">Amount</th>
            <th class="px-6 py-3 text-xs font-medium text-evening-sea opacity-70 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-evening-sea divide-opacity-10">
          {#each visibleTransactions as transaction (transaction.id)}
            <tr 
              class="hover:bg-evening-sea hover:bg-opacity-5 transition-colors duration-150
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
                  class="w-4 h-4 text-acapulco border-evening-sea border-opacity-30 rounded focus:ring-acapulco focus:ring-offset-0 
                    {transaction.isDuplicate ? 'opacity-50 cursor-not-allowed' : ''}
                  "
                />
              </td>

              <!-- Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-evening-sea">
                {formatDate(transaction.bookingDate)}
              </td>

              <!-- Partner -->
              <td class="px-6 py-4 text-sm text-evening-sea">
                <div class="font-medium truncate max-w-40" title={transaction.partnerName}>
                  {transaction.partnerName || 'N/A'}
                </div>
                {#if transaction.partnerIban}
                  <div class="text-xs text-evening-sea opacity-60 truncate max-w-40">
                    {transaction.partnerIban}
                  </div>
                {/if}
              </td>

              <!-- Description -->
              <td class="px-6 py-4 text-sm text-evening-sea max-w-60">
                <div class="truncate" title={transaction.paymentReference}>
                  {transaction.paymentReference || transaction.type || 'N/A'}
                </div>
                {#if transaction.type && transaction.paymentReference}
                  <div class="text-xs text-evening-sea opacity-60 truncate">
                    {transaction.type}
                  </div>
                {/if}
              </td>

              <!-- Amount -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {getAmountColorClass(transaction.amountEur)}">
                {formatCurrency(transaction.amountEur)}
                {#if transaction.originalCurrency && transaction.originalCurrency !== 'EUR'}
                  <div class="text-xs text-evening-sea opacity-60">
                    {formatCurrency(transaction.originalAmount || 0)} {transaction.originalCurrency}
                  </div>
                {/if}
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                {#if transaction.isDuplicate}
                  <Badge variant="warning" size="sm">
                    Duplicate
                  </Badge>
                  {#if transaction.duplicateReason}
                    <div class="text-xs text-evening-sea opacity-60 mt-1 max-w-32" title={transaction.duplicateReason}>
                      {transaction.duplicateReason}
                    </div>
                  {/if}
                {:else if transaction.isSelected}
                  <Badge variant="success" size="sm">
                    Ready
                  </Badge>
                {:else}
                  <Badge variant="default" size="sm">
                    Skipped
                  </Badge>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
