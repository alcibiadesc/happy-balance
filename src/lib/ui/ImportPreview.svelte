<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ChevronLeft, Check, X, Eye, EyeOff, Edit3, AlertCircle, CheckCircle2, Copy, Trash2 } from 'lucide-svelte';
  import CategorySelector from './CategorySelector.svelte';
  import InlineTextEditor from './InlineTextEditor.svelte';

  export let transactions = [];
  export let summary = null;
  export let fileName = '';
  export let loading = false;

  const dispatch = createEventDispatcher();

  let selectedTransactions = new Set();
  let editingTransaction = null;
  let bulkCategoryId = '';

  // Reactive calculations
  $: selectedCount = selectedTransactions.size;
  $: selectedTransactionsArray = transactions.filter(tx => selectedTransactions.has(tx.id));
  $: selectedAmount = selectedTransactionsArray.reduce((sum, tx) => sum + (tx.selected ? tx.amount : 0), 0);
  $: newTransactionsCount = transactions.filter(tx => tx.status === 'new' && tx.selected).length;

  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // Toggle individual transaction selection
  function toggleTransaction(transaction) {
    transaction.selected = !transaction.selected;
    
    if (transaction.selected) {
      selectedTransactions.add(transaction.id);
    } else {
      selectedTransactions.delete(transaction.id);
    }
    
    selectedTransactions = selectedTransactions; // Trigger reactivity
    transactions = transactions; // Trigger reactivity
  }

  // Select/deselect all transactions
  function toggleAllTransactions() {
    const allSelected = transactions.every(tx => tx.selected || tx.status === 'error');
    
    transactions.forEach(tx => {
      if (tx.status !== 'error') {
        tx.selected = !allSelected;
        
        if (tx.selected) {
          selectedTransactions.add(tx.id);
        } else {
          selectedTransactions.delete(tx.id);
        }
      }
    });
    
    selectedTransactions = selectedTransactions;
    transactions = transactions;
  }

  // Discard transaction from import
  function discardTransaction(transaction) {
    transaction.status = 'discarded';
    transaction.selected = false;
    selectedTransactions.delete(transaction.id);
    selectedTransactions = selectedTransactions;
    transactions = transactions;
  }

  // Toggle visibility for import
  function toggleVisibility(transaction) {
    transaction.willBeHidden = !transaction.willBeHidden;
    transactions = transactions;
  }

  // Edit transaction inline
  function startEditing(transaction) {
    editingTransaction = transaction.id;
  }

  function finishEditing() {
    editingTransaction = null;
    // Mark as edited if it was modified
    const tx = transactions.find(t => t.id === editingTransaction);
    if (tx && tx.status === 'new') {
      tx.status = 'edited';
    }
    transactions = transactions;
  }

  // Bulk actions
  function discardDuplicates() {
    transactions.forEach(tx => {
      if (tx.isDuplicate) {
        tx.status = 'discarded';
        tx.selected = false;
        selectedTransactions.delete(tx.id);
      }
    });
    selectedTransactions = selectedTransactions;
    transactions = transactions;
  }

  function discardSelected() {
    selectedTransactionsArray.forEach(tx => {
      tx.status = 'discarded';
      tx.selected = false;
      selectedTransactions.delete(tx.id);
    });
    selectedTransactions = selectedTransactions;
    transactions = transactions;
  }

  function hideSelected() {
    selectedTransactionsArray.forEach(tx => {
      tx.willBeHidden = true;
    });
    transactions = transactions;
  }

  function assignCategoryToSelected() {
    if (!bulkCategoryId) return;
    
    selectedTransactionsArray.forEach(tx => {
      tx.categoryId = bulkCategoryId;
      if (tx.status === 'new') tx.status = 'edited';
    });
    
    transactions = transactions;
    bulkCategoryId = '';
  }

  // Get status badge
  function getStatusBadge(transaction) {
    switch (transaction.status) {
      case 'new': return { text: 'Nueva', class: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      case 'duplicate': return { text: 'Duplicado', class: 'bg-yellow-100 text-yellow-800', icon: Copy };
      case 'error': return { text: 'Error', class: 'bg-red-100 text-red-800', icon: AlertCircle };
      case 'edited': return { text: 'Editada', class: 'bg-blue-100 text-blue-800', icon: Edit3 };
      case 'discarded': return { text: 'Descartada', class: 'bg-gray-100 text-gray-800', icon: Trash2 };
      default: return { text: 'Nueva', class: 'bg-green-100 text-green-800', icon: CheckCircle2 };
    }
  }

  // Confirm import
  function confirmImport() {
    const selectedForImport = transactions.filter(tx => 
      tx.selected && tx.status !== 'error' && tx.status !== 'discarded'
    );
    
    dispatch('confirm', {
      transactions: selectedForImport
    });
  }

  // Cancel preview
  function cancelPreview() {
    dispatch('cancel');
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <button
        onclick={cancelPreview}
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Volver"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Previsualización de Importación</h1>
        <p class="text-gray-600">Archivo: {fileName}</p>
      </div>
    </div>
  </div>

  <!-- Summary Card -->
  {#if summary}
  <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600">{summary.totalTransactions}</div>
        <div class="text-sm text-gray-600">Total</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{summary.newTransactions}</div>
        <div class="text-sm text-gray-600">Nuevas</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-yellow-600">{summary.duplicates}</div>
        <div class="text-sm text-gray-600">Duplicados</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-red-600">{summary.errors}</div>
        <div class="text-sm text-gray-600">Errores</div>
      </div>
    </div>
    <div class="mt-4 pt-4 border-t border-orange-200 text-center">
      <div class="text-lg font-semibold text-gray-800">
        Balance total: <span class="text-orange-600">{formatCurrency(summary.totalAmount)}</span>
      </div>
      <div class="text-sm text-gray-600">
        Del {summary.dateRange.from} al {summary.dateRange.to}
      </div>
    </div>
  </div>
  {/if}

  <!-- Bulk Actions -->
  <div class="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
    <div class="flex items-center space-x-4">
      <label class="flex items-center space-x-2">
        <input 
          type="checkbox" 
          onchange={toggleAllTransactions}
          checked={transactions.every(tx => tx.selected || tx.status === 'error')}
          class="rounded border-gray-300"
        />
        <span class="text-sm font-medium">Seleccionar todo ({newTransactionsCount} para importar)</span>
      </label>
    </div>
    
    <div class="flex flex-wrap items-center gap-2">
      {#if summary?.duplicates > 0}
        <button 
          onclick={discardDuplicates}
          class="px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
        >
          Descartar Duplicados
        </button>
      {/if}
      
      {#if selectedCount > 0}
        <button 
          onclick={discardSelected}
          class="px-3 py-2 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
        >
          Descartar Seleccionadas ({selectedCount})
        </button>
        
        <button 
          onclick={hideSelected}
          class="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Ocultar Seleccionadas
        </button>

        <div class="flex items-center space-x-2">
          <CategorySelector bind:selectedCategoryId={bulkCategoryId} />
          <button 
            onclick={assignCategoryToSelected}
            disabled={!bulkCategoryId}
            class="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Asignar Categoría
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Transaction Table (using same style as main transactions) -->
  <div class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-orange-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selección</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each transactions as transaction (transaction.id)}
            {@const statusBadge = getStatusBadge(transaction)}
            <tr class="hover:bg-gray-50 {transaction.status === 'discarded' ? 'opacity-50' : ''} {transaction.willBeHidden ? 'bg-gray-25' : ''}">
              <!-- Selection checkbox -->
              <td class="px-4 py-3">
                {#if transaction.status !== 'error'}
                  <input 
                    type="checkbox" 
                    bind:checked={transaction.selected}
                    onchange={() => toggleTransaction(transaction)}
                    class="rounded border-gray-300"
                  />
                {/if}
              </td>

              <!-- Status badge -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusBadge.class}">
                  <svelte:component this={statusBadge.icon} class="w-3 h-3 mr-1" />
                  {statusBadge.text}
                </span>
                {#if transaction.willBeHidden}
                  <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                    <EyeOff class="w-3 h-3 mr-1" />
                    Oculto
                  </span>
                {/if}
              </td>

              <!-- Date -->
              <td class="px-4 py-3 text-sm text-gray-900">
                {transaction.date || 'N/A'}
              </td>

              <!-- Description -->
              <td class="px-4 py-3">
                {#if editingTransaction === transaction.id}
                  <InlineTextEditor
                    bind:value={transaction.description}
                    onFinish={finishEditing}
                    placeholder="Descripción de la transacción"
                  />
                {:else}
                  <div class="space-y-1">
                    <div class="font-medium text-gray-900">{transaction.description}</div>
                    {#if transaction.paymentReference}
                      <div class="text-xs text-gray-500">{transaction.paymentReference}</div>
                    {/if}
                    {#if transaction.error}
                      <div class="text-xs text-red-600">{transaction.error}</div>
                    {/if}
                  </div>
                {/if}
              </td>

              <!-- Category -->
              <td class="px-4 py-3">
                <CategorySelector bind:selectedCategoryId={transaction.categoryId} />
              </td>

              <!-- Amount -->
              <td class="px-4 py-3">
                <span class="font-mono text-sm font-semibold {transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                  {#if transaction.status !== 'error' && transaction.status !== 'discarded'}
                    <button
                      onclick={() => startEditing(transaction)}
                      class="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Editar"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    
                    <button
                      onclick={() => toggleVisibility(transaction)}
                      class="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                      title={transaction.willBeHidden ? "Mostrar al importar" : "Ocultar al importar"}
                    >
                      {#if transaction.willBeHidden}
                        <EyeOff class="w-4 h-4" />
                      {:else}
                        <Eye class="w-4 h-4" />
                      {/if}
                    </button>
                    
                    <button
                      onclick={() => discardTransaction(transaction)}
                      class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Descartar de la importación"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex items-center justify-between pt-6 border-t">
    <div class="text-sm text-gray-600">
      {newTransactionsCount} transacciones seleccionadas para importar
      {#if selectedAmount !== 0}
        • Balance seleccionado: <span class="font-semibold {selectedAmount > 0 ? 'text-green-600' : 'text-red-600'}">{formatCurrency(selectedAmount)}</span>
      {/if}
    </div>
    
    <div class="flex items-center space-x-3">
      <button
        onclick={cancelPreview}
        class="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Cancelar
      </button>
      
      <button
        onclick={confirmImport}
        disabled={newTransactionsCount === 0 || loading}
        class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        {#if loading}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <Check class="w-4 h-4" />
        {/if}
        <span>Confirmar Importación ({newTransactionsCount})</span>
      </button>
    </div>
  </div>
</div>

<style>
  /* Custom styling for preview mode */
  :global(.bg-gray-25) {
    background-color: rgba(249, 250, 251, 0.5);
  }
</style>