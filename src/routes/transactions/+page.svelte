<script lang="ts">
  import { Plus, Search, Filter, ArrowUpDown, FileText, Calendar, DollarSign, Trash2, Edit, Check, X } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let transactions = $state([]);
  let isLoading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let selectedMonth = $state('');
  let selectedType = $state('all');
  let selectedTransactions = $state(new Set<string>());
  let isSelectionMode = $state(false);
  let sortField = $state<'date' | 'amount' | 'partner' | 'category'>('date');
  let sortDirection = $state<'asc' | 'desc'>('desc');

  // Initialize with current month
  onMount(() => {
    const now = new Date();
    selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    loadTransactions();
  });

  // Load transactions with filters
  async function loadTransactions() {
    try {
      isLoading = true;
      error = '';
      
      const params = new URLSearchParams();
      if (selectedMonth) {
        params.append('month', selectedMonth);
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        transactions = result.data;
      } else {
        error = result.error || 'Error al cargar transacciones';
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      error = 'Error de conexión';
    } finally {
      isLoading = false;
    }
  }

  // Delete transaction
  async function deleteTransaction(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadTransactions(); // Reload transactions
      } else {
        alert('Error al eliminar la transacción');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Error al eliminar la transacción');
    }
  }

  // Selection management
  function toggleSelection(transactionId: string) {
    if (selectedTransactions.has(transactionId)) {
      selectedTransactions.delete(transactionId);
    } else {
      selectedTransactions.add(transactionId);
    }
    selectedTransactions = new Set(selectedTransactions);
  }

  function toggleSelectAll() {
    if (selectedTransactions.size === filteredTransactions.length) {
      selectedTransactions.clear();
    } else {
      selectedTransactions = new Set(filteredTransactions.map(t => t.id.value || t.id));
    }
  }

  function enterSelectionMode() {
    isSelectionMode = true;
    selectedTransactions.clear();
  }

  function exitSelectionMode() {
    isSelectionMode = false;
    selectedTransactions.clear();
  }

  // Bulk actions
  async function bulkDelete() {
    if (selectedTransactions.size === 0) return;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedTransactions.size} transacciones seleccionadas?`)) {
      return;
    }

    const promises = Array.from(selectedTransactions).map(id =>
      fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    );

    try {
      await Promise.all(promises);
      await loadTransactions();
      exitSelectionMode();
    } catch (err) {
      console.error('Error deleting transactions:', err);
      alert('Error al eliminar las transacciones seleccionadas');
    }
  }

  // Sort and filter transactions
  function sortTransactions(transactionList: any[]) {
    return [...transactionList].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.bookingDate).getTime();
          bValue = new Date(b.bookingDate).getTime();
          break;
        case 'amount':
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case 'partner':
          aValue = a.partnerName.toLowerCase();
          bValue = b.partnerName.toLowerCase();
          break;
        case 'category':
          aValue = a.category?.name?.toLowerCase() || 'zzz'; // Put uncategorized at end
          bValue = b.category?.name?.toLowerCase() || 'zzz';
          break;
        default:
          aValue = new Date(a.bookingDate).getTime();
          bValue = new Date(b.bookingDate).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function handleSort(field: 'date' | 'amount' | 'partner' | 'category') {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }

  const filteredTransactions = $derived(
    sortTransactions(
      transactions.filter(transaction => {
        const matchesSearch = !searchTerm || 
          transaction.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
    )
  );

  // Calculate totals (using transactions from API which already includes month/type filters)
  const totals = $derived({
    income: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    expenses: Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
    balance: transactions.reduce((sum, t) => sum + t.amount, 0),
    count: transactions.length
  });

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Reactive filter changes
  $effect(() => {
    if (selectedMonth || selectedType) {
      loadTransactions();
    }
  });
</script>

<svelte:head>
  <title>Transacciones - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Transacciones</h1>
          <p class="text-sm text-gray-500 mt-1">
            {#if isSelectionMode && selectedTransactions.size > 0}
              {selectedTransactions.size} seleccionadas de {totals.count} transacciones
            {:else}
              {totals.count} transacciones encontradas
            {/if}
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          {#if isSelectionMode}
            <!-- Selection mode buttons -->
            <button 
              class="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onclick={bulkDelete}
              disabled={selectedTransactions.size === 0}
            >
              <Trash2 class="w-4 h-4" />
              Eliminar ({selectedTransactions.size})
            </button>
            <button 
              class="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              onclick={exitSelectionMode}
            >
              <X class="w-4 h-4" />
              Cancelar
            </button>
          {:else}
            <!-- Normal mode buttons -->
            <button 
              class="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              onclick={enterSelectionMode}
            >
              <Check class="w-4 h-4" />
              Seleccionar
            </button>
            <button 
              class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              onclick={() => goto('/transactions/new')}
            >
              <Plus class="w-4 h-4" />
              Nueva Transacción
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Month Filter -->
        <div>
          <label for="month-filter" class="block text-sm font-medium text-gray-700 mb-2">
            <Calendar class="w-4 h-4 inline mr-1" />
            Mes
          </label>
          <input
            id="month-filter"
            type="month"
            bind:value={selectedMonth}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Type Filter -->
        <div>
          <label for="type-filter" class="block text-sm font-medium text-gray-700 mb-2">
            <Filter class="w-4 h-4 inline mr-1" />
            Tipo
          </label>
          <select
            id="type-filter"
            bind:value={selectedType}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>

        <!-- Search -->
        <div class="sm:col-span-2">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            <Search class="w-4 h-4 inline mr-1" />
            Buscar
          </label>
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Buscar por concepto o descripción..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Ingresos</p>
            <p class="text-xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <ArrowUpDown class="w-5 h-5 text-green-600 transform rotate-180" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Gastos</p>
            <p class="text-xl font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
          </div>
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <ArrowUpDown class="w-5 h-5 text-red-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Balance</p>
            <p class="text-xl font-bold {totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
              {formatCurrency(totals.balance)}
            </p>
          </div>
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <DollarSign class="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Transacciones</p>
            <p class="text-xl font-bold text-gray-900">{totals.count}</p>
          </div>
          <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileText class="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {#if isLoading}
        <div class="p-8 text-center">
          <div class="inline-flex items-center gap-2 text-gray-600">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            Cargando transacciones...
          </div>
        </div>
      {:else if error}
        <div class="p-8 text-center">
          <div class="text-red-600 mb-4">{error}</div>
          <button 
            onclick={loadTransactions}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      {:else if filteredTransactions.length === 0}
        <div class="p-8 text-center">
          <FileText class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No hay transacciones</h3>
          <p class="text-gray-600 mb-4">
            {transactions.length === 0 
              ? 'Aún no tienes transacciones registradas.'
              : 'No se encontraron transacciones con los filtros seleccionados.'
            }
          </p>
          <button 
            onclick={() => goto('/transactions/new')}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Primera Transacción
          </button>
        </div>
      {:else}
        <!-- Mobile View -->
        <div class="sm:hidden">
          {#each filteredTransactions as transaction}
            <div class="p-4 border-b border-gray-200 last:border-b-0 {selectedTransactions.has(transaction.id.value || transaction.id) ? 'bg-blue-50 border-blue-200' : ''}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  {#if isSelectionMode}
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTransactions.has(transaction.id.value || transaction.id)}
                      onchange={() => toggleSelection(transaction.id.value || transaction.id)}
                    />
                  {/if}
                  <span class="text-lg">
                    {transaction.category?.icon || (transaction.amount > 0 ? '💰' : '💸')}
                  </span>
                  <div>
                    <p class="font-medium text-gray-900">{transaction.partnerName}</p>
                    <p class="text-xs text-gray-500">{formatDate(transaction.bookingDate)}</p>
                  </div>
                </div>
                <div class="text-right flex items-center gap-2">
                  <div>
                    <p class="text-lg font-semibold {transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p class="text-xs text-gray-500">{transaction.category?.name}</p>
                  </div>
                  {#if !isSelectionMode}
                    <button
                      class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onclick={() => deleteTransaction(transaction.id.value || transaction.id)}
                      title="Eliminar transacción"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  {/if}
                </div>
              </div>
              {#if transaction.description}
                <p class="text-sm text-gray-600">{transaction.description}</p>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Desktop View -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                {#if isSelectionMode}
                  <th class="py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onchange={toggleSelectAll}
                    />
                  </th>
                {/if}
                <th class="text-left py-3 px-4 font-medium text-gray-900">
                  <button
                    class="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    onclick={() => handleSort('date')}
                  >
                    Fecha
                    <ArrowUpDown class="w-4 h-4 {sortField === 'date' ? 'text-blue-600' : 'text-gray-400'}" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-900">
                  <button
                    class="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    onclick={() => handleSort('partner')}
                  >
                    Concepto
                    <ArrowUpDown class="w-4 h-4 {sortField === 'partner' ? 'text-blue-600' : 'text-gray-400'}" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-900">
                  <button
                    class="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    onclick={() => handleSort('category')}
                  >
                    Categoría
                    <ArrowUpDown class="w-4 h-4 {sortField === 'category' ? 'text-blue-600' : 'text-gray-400'}" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                <th class="text-right py-3 px-4 font-medium text-gray-900">
                  <button
                    class="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                    onclick={() => handleSort('amount')}
                  >
                    Importe
                    <ArrowUpDown class="w-4 h-4 {sortField === 'amount' ? 'text-blue-600' : 'text-gray-400'}" />
                  </button>
                </th>
                {#if !isSelectionMode}
                  <th class="text-right py-3 px-4 font-medium text-gray-900">Acciones</th>
                {/if}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each filteredTransactions as transaction}
                <tr class="hover:bg-gray-50 {selectedTransactions.has(transaction.id.value || transaction.id) ? 'bg-blue-50 border-blue-200' : ''}">
                  {#if isSelectionMode}
                    <td class="py-3 px-4">
                      <input
                        type="checkbox"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedTransactions.has(transaction.id.value || transaction.id)}
                        onchange={() => toggleSelection(transaction.id.value || transaction.id)}
                      />
                    </td>
                  {/if}
                  <td class="py-3 px-4">
                    <p class="text-sm text-gray-900">{formatDate(transaction.bookingDate)}</p>
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-medium text-gray-900">{transaction.partnerName}</p>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">{transaction.category?.icon || '📊'}</span>
                      <span class="text-sm text-gray-900">{transaction.category?.name || 'Sin categoría'}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <p class="text-sm text-gray-600 max-w-xs truncate">
                      {transaction.description || '-'}
                    </p>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <p class="text-lg font-semibold {transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                  </td>
                  {#if !isSelectionMode}
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onclick={() => deleteTransaction(transaction.id.value || transaction.id)}
                          title="Eliminar transacción"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>