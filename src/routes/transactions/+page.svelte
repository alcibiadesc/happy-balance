<script lang="ts">
  import { Plus, Search, Filter, ArrowUpDown, FileText, Calendar, DollarSign, Trash2, Edit, Check, X, Brain } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import CategorySelector from '$lib/ui/CategorySelector.svelte';
  import InlineTextEditor from '$lib/ui/InlineTextEditor.svelte';
  import IntelligentSuggestions from '$lib/ui/IntelligentSuggestions.svelte';
  import OmitAction from '$lib/ui/OmitAction.svelte';
  import { ConfirmationDialog } from '$lib/ui/components/molecules/ConfirmationDialog/index.js';
  import { AlertDialog } from '$lib/ui/components/molecules/AlertDialog/index.js';

  let transactions = $state([]);
  let isLoading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let selectedMonth = $state('');
  let selectedType = $state('all');
  let selectedCategoryType = $state('all');
  let selectedCategoryId = $state('all');
  let dateFilterType = $state('month'); // 'month', 'custom', 'preset'
  let customStartDate = $state('');
  let customEndDate = $state('');
  let presetPeriod = $state('');
  let showIntelligentSuggestions = $state(false);
  let selectedTransactionForSuggestions = $state(null);
  
  // Dialog states
  let showConfirmDialog = $state(false);
  let showAlertDialog = $state(false);
  let dialogConfig = $state({
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    requiresTyping: false,
    requiredText: '',
    isLoading: false
  });
  let alertConfig = $state({
    title: '',
    message: '',
    type: 'info'
  });
  let selectedTransactions = $state(new Set<string>());
  let isSelectionMode = $state(false);
  let sortField = $state<'date' | 'amount' | 'partner' | 'category'>('date');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let categories = $state([]);
  let showAdvancedFilters = $state(false);

  // Initialize with current month
  onMount(() => {
    const now = new Date();
    selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    loadTransactions();
    loadCategories();
  });

  // Load transactions with filters
  async function loadTransactions() {
    try {
      isLoading = true;
      error = '';
      
      const params = new URLSearchParams();
      
      // Handle date filtering based on selected type
      if (dateFilterType === 'month' && selectedMonth) {
        // Convert month (YYYY-MM) to start and end dates
        const [year, month] = selectedMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
        
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      } else if (dateFilterType === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', new Date(customStartDate).toISOString());
        params.append('endDate', new Date(customEndDate + 'T23:59:59').toISOString());
      } else if (dateFilterType === 'preset' && presetPeriod) {
        const { startDate, endDate } = getPresetDates(presetPeriod);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }
      
      if (selectedType !== 'all') {
        // Convert type filter to amount-based filter
        if (selectedType === 'income') {
          params.append('minAmount', '0.01');
        } else if (selectedType === 'expense') {
          params.append('maxAmount', '-0.01');
        }
      }
      
      if (selectedCategoryType !== 'all') {
        // Filter by category type
        params.append('categoryType', selectedCategoryType);
      }
      
      if (selectedCategoryId !== 'all') {
        // Filter by specific category
        params.append('categoryIds', selectedCategoryId);
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

  // Get preset date ranges
  function getPresetDates(preset: string) {
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    switch (preset) {
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek + 1); // Monday
        endDate = new Date(now);
        break;
      case 'lastWeek':
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - now.getDay());
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        startDate = lastWeekStart;
        endDate = lastWeekEnd;
        break;
      case 'last30Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        endDate = new Date(now);
        break;
      case 'thisQuarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        startDate = quarterStart;
        endDate = quarterEnd;
        break;
      case 'lastQuarter':
        const lastQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
        const lastQuarterStart = new Date(now.getFullYear(), lastQuarterMonth, 1);
        const lastQuarterEnd = new Date(now.getFullYear(), lastQuarterMonth + 3, 0);
        startDate = lastQuarterStart;
        endDate = lastQuarterEnd;
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(now);
    }
    
    return { startDate, endDate };
  }

  // Dialog helper functions
  function showConfirmationDialog(title: string, message: string, type: string, onConfirm: () => void, requiresTyping = false, requiredText = '') {
    dialogConfig = {
      title,
      message,
      type,
      onConfirm,
      requiresTyping,
      requiredText,
      isLoading: false
    };
    showConfirmDialog = true;
  }
  
  function showAlert(message: string, type = 'info', title = '') {
    alertConfig = { title, message, type };
    showAlertDialog = true;
  }
  
  function handleConfirmDialog() {
    if (dialogConfig.onConfirm) {
      dialogConfig.isLoading = true;
      dialogConfig.onConfirm();
    }
    showConfirmDialog = false;
  }
  
  function handleCancelDialog() {
    showConfirmDialog = false;
    dialogConfig = {
      title: '',
      message: '',
      type: 'info',
      onConfirm: null,
      requiresTyping: false,
      requiredText: '',
      isLoading: false
    };
  }
  
  function handleCloseAlert() {
    showAlertDialog = false;
  }

  // Delete transaction
  async function deleteTransaction(id: string) {
    showConfirmationDialog(
      'Eliminar transacción',
      '¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.',
      'danger',
      () => executeDeleteTransaction(id)
    );
  }
  
  async function executeDeleteTransaction(id: string) {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadTransactions(); // Reload transactions
      } else {
        showAlert('Error al eliminar la transacción', 'error');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      showAlert('Error al eliminar la transacción', 'error');
    }
  }

  // Load categories
  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        categories = result.data;
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  // Update transaction category
  async function updateTransactionCategory(transactionId: string, category: any) {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/category`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categoryId: category?.id.value || category?.id || null })
      });

      if (response.ok) {
        // Update the local state instead of reloading to avoid flickering
        transactions = transactions.map(t => 
          (t.id.value || t.id) === transactionId
            ? { ...t, category, categoryId: category?.id?.value || category?.id || null }
            : t
        );
        return true; // Return success indicator
      } else {
        alert('Error al actualizar la categoría');
        return false;
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Error al actualizar la categoría');
      return false;
    }
  }

  // Create new category
  async function createNewCategory(categoryData: any) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          type: categoryData.type || 'DISCRETIONARY_EXPENSE' // Use provided type or default
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadCategories(); // Reload categories
          return result.data;
        } else {
          const errorResult = await response.json();
          alert(`Error al crear la categoría: ${errorResult.error || 'Error desconocido'}`);
        }
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error de red' }));
        alert(`Error al crear la categoría: ${errorResult.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Error al crear la categoría');
    }
  }

  // Update transaction description
  async function updateTransactionDescription(transactionId: string, description: string) {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/description`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description })
      });

      if (response.ok) {
        // Update local state to avoid full reload
        transactions = transactions.map(t => 
          (t.id.value || t.id) === transactionId 
            ? { ...t, notes: description }
            : t
        );
      } else {
        alert('Error al actualizar la descripción');
      }
    } catch (err) {
      console.error('Error updating description:', err);
      alert('Error al actualizar la descripción');
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

  async function handleOmitTransaction(detail: any) {
    const { transaction, action } = detail;
    const transactionId = transaction.id.value || transaction.id;
    
    try {
      switch (action) {
        case 'single':
          // Just omit this transaction
          await omitSingleTransaction(transactionId);
          break;
          
        case 'similar_future':
          // Create rule for similar future transactions and omit current
          await createOmitRule(transaction, 'similar');
          await omitSingleTransaction(transactionId);
          break;
          
        case 'all_future':
          // Create rule for all future transactions from this partner and omit current
          await createOmitRule(transaction, 'partner');
          await omitSingleTransaction(transactionId);
          break;
      }
      
      // Log the omit action for learning
      await logUserAction(transactionId, `omit_${action}`);
      
    } catch (error) {
      console.error('Error omitting transaction:', error);
      alert('Error al omitir la transacción');
    }
  }
  
  async function omitSingleTransaction(transactionId: string) {
    // Find or create an OMIT category
    let omitCategory = categories.find(cat => cat.type === 'OMIT');
    
    if (!omitCategory) {
      // Create default OMIT category if it doesn't exist
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Omitir',
          type: 'OMIT',
          icon: 'X',
          color: '#6B7280'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          omitCategory = result.data;
          await loadCategories(); // Refresh categories
        }
      }
    }
    
    if (!omitCategory) {
      throw new Error('No se pudo crear la categoría de omisión');
    }
    
    // Apply OMIT category to transaction
    await updateTransactionCategory(transactionId, omitCategory);
  }
  
  async function createOmitRule(referenceTransaction: any, ruleType: 'similar' | 'partner') {
    try {
      const response = await fetch('/api/intelligence/omit-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ruleType,
          pattern: {
            partnerName: referenceTransaction.partnerName,
            amountRange: ruleType === 'similar' ? {
              min: referenceTransaction.amount * 0.8,
              max: referenceTransaction.amount * 1.2
            } : null
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create omit rule');
      }
    } catch (error) {
      console.error('Error creating omit rule:', error);
      throw error;
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

  // Intelligent suggestions functions
  function showSuggestionsForTransaction(transaction: any) {
    selectedTransactionForSuggestions = transaction;
    showIntelligentSuggestions = true;
  }

  function handleApplySuggestion(event: any) {
    const { suggestion, transactionId } = event.detail;
    console.log('Applying suggestion:', suggestion, 'to transaction:', transactionId);
    
    // Apply the suggested action based on type
    if (suggestion.type === 'category' && suggestion.categoryId) {
      // Apply category suggestion
      updateTransactionCategory(transactionId, { id: suggestion.categoryId });
    } else if (suggestion.type === 'bulk') {
      // Handle bulk action
      // TODO: Implement bulk category application
    }
    
    // Log the user action for learning
    logUserAction(transactionId, 'categorize', suggestion.categoryId);
    
    showIntelligentSuggestions = false;
  }

  function handleSmartAction(event: any) {
    const { action, transactionId } = event.detail;
    console.log('Executing smart action:', action, 'for transaction:', transactionId);
    
    switch (action) {
      case 'learn':
        // Create a rule based on this action
        // TODO: Implement rule creation
        break;
      case 'apply_similar':
        // Find and apply to similar transactions
        // TODO: Implement similarity search and bulk apply
        break;
      case 'suggest_only':
        // Just remember this pattern for future suggestions
        // TODO: Store pattern for future use
        break;
    }
    
    showIntelligentSuggestions = false;
  }

  async function logUserAction(transactionId: string, action: string, categoryId?: string) {
    try {
      await fetch('/api/intelligence/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId,
          action,
          categoryId
        })
      });
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }
  
  async function handleSmartCategorySelection(detail: any) {
    const { category, action, transaction } = detail;
    const transactionId = transaction.id.value || transaction.id;
    
    try {
      switch (action) {
        case 'single':
          // Apply to this transaction only
          await updateTransactionCategory(transactionId, category);
          break;
          
        case 'similar_existing':
          // Apply to all similar existing transactions
          await applyCategoryToSimilar(category, transaction, true, false);
          break;
          
        case 'similar_future':
          // Create rule for similar future transactions
          await createCategoryRule(category, transaction, 'similar');
          await updateTransactionCategory(transactionId, category);
          break;
          
        case 'all_future':
          // Create rule for all future transactions from this partner
          await createCategoryRule(category, transaction, 'partner');
          await updateTransactionCategory(transactionId, category);
          break;
      }
      
      // Log the smart action for learning
      await logUserAction(transactionId, `smart_${action}`, category.id.value || category.id);
      
    } catch (error) {
      console.error('Error applying smart category selection:', error);
      alert('Error al aplicar la categorización inteligente');
    }
  }
  
  async function applyCategoryToSimilar(category: any, referenceTransaction: any, applyToExisting: boolean, applyToFuture: boolean) {
    try {
      const response = await fetch('/api/intelligence/apply-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: category.id.value || category.id,
          referenceTransaction: {
            partnerName: referenceTransaction.partnerName,
            amount: referenceTransaction.amount
          },
          applyToExisting,
          applyToFuture
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && applyToExisting) {
          // Reload transactions to show updates
          await loadTransactions();
        }
      }
    } catch (error) {
      console.error('Error applying category to similar transactions:', error);
      throw error;
    }
  }
  
  async function createCategoryRule(category: any, referenceTransaction: any, ruleType: 'similar' | 'partner') {
    try {
      const response = await fetch('/api/intelligence/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: category.id.value || category.id,
          ruleType,
          pattern: {
            partnerName: referenceTransaction.partnerName,
            amountRange: ruleType === 'similar' ? {
              min: referenceTransaction.amount * 0.8,
              max: referenceTransaction.amount * 1.2
            } : null
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create categorization rule');
      }
    } catch (error) {
      console.error('Error creating category rule:', error);
      throw error;
    }
  }

  const filteredTransactions = $derived(
    sortTransactions(
      transactions.filter(transaction => {
        const matchesSearch = !searchTerm || 
          transaction.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
    )
  );

  // Calculate totals (excluding OMIT transactions)
  const totals = $derived.by(() => {
    const omitCategory = categories.find(c => c.name === 'Omitir');
    const includedTransactions = transactions.filter(t => 
      t.category?.name !== 'Omitir' && 
      t.category?.type !== 'OMIT' &&
      t.categoryId !== omitCategory?.id?.value &&
      t.categoryId !== omitCategory?.id
    );
    
    return {
      income: includedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      expenses: Math.abs(includedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
      balance: includedTransactions.reduce((sum, t) => sum + t.amount, 0),
      count: transactions.length, // Show all transactions count
      includedCount: includedTransactions.length // Count of included transactions
    };
  });

  function formatCurrency(amount: number) {
    const safeAmount = isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(safeAmount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Manual filter application - only reload when user changes filters that need server updates
  $effect(() => {
    if (dateFilterType || selectedType || selectedCategoryType || selectedCategoryId) {
      loadTransactions();
    }
  });
</script>

<svelte:head>
  <title>Transacciones - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen" style="background-color: var(--color-background-primary);">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10" style="border-color: var(--color-border-primary); background-color: var(--color-background-elevated);">
    <div class="container-editorial">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
        <div>
          <h1 class="text-h3" style="color: var(--color-text-primary);">Transacciones</h1>
          <p class="text-secondary mt-1">
            {#if isSelectionMode && selectedTransactions.size > 0}
              {selectedTransactions.size} seleccionadas de {totals.count} transacciones
            {:else}
              {totals.count} transacciones encontradas
            {/if}
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button 
            class="btn-primary gap-2"
            onclick={() => goto('/transactions/new')}
          >
            <Plus class="w-4 h-4" />
            Nueva Transacción
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container-editorial py-6">
    <!-- Smart Filters Section -->
    <div class="card-editorial p-6 mb-6">
      <!-- Basic Filters Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <!-- Search - Always visible for quick access -->
        <div class="lg:col-span-2">
          <label for="search" class="block text-caption mb-2">
            <Search class="w-4 h-4 inline mr-1" />
            Buscar transacciones
          </label>
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Buscar por concepto o descripción..."
            class="input-editorial"
          />
        </div>

        <!-- Quick Period Filter -->
        <div>
          <label for="quick-period" class="block text-caption mb-2">
            <Calendar class="w-4 h-4 inline mr-1" />
            Periodo rápido
          </label>
          <select
            id="quick-period"
            bind:value={dateFilterType}
            class="input-editorial"
            onchange={() => {
              if (dateFilterType === 'preset') {
                presetPeriod = 'last30Days';
              }
              loadTransactions();
            }}
          >
            <option value="month">Este mes</option>
            <option value="preset">Periodo personalizado</option>
          </select>
        </div>

        <!-- Quick Type Filter -->
        <div>
          <label for="quick-type" class="block text-caption mb-2">
            <Filter class="w-4 h-4 inline mr-1" />
            Tipo
          </label>
          <select
            id="quick-type"
            bind:value={selectedType}
            class="input-editorial"
            onchange={loadTransactions}
          >
            <option value="all">Todos</option>
            <option value="income">Solo Ingresos</option>
            <option value="expense">Solo Gastos</option>
          </select>
        </div>
      </div>

      <!-- Advanced Filters Toggle -->
      <div class="flex items-center justify-between pt-4 border-t border-warm">
        <button
          onclick={() => showAdvancedFilters = !showAdvancedFilters}
          class="btn-ghost gap-2 text-sm"
        >
          <Filter class="w-4 h-4" />
          Filtros avanzados
          <span class="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {#if showAdvancedFilters}Ocultar{:else}Mostrar{/if}
          </span>
        </button>
        
        <!-- Active Filters Indicator -->
        {#if (dateFilterType !== 'month' && dateFilterType !== '') || selectedCategoryType !== 'all' || selectedCategoryId !== 'all'}
          <div class="flex items-center gap-2">
            <span class="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              {[
                dateFilterType !== 'month' ? 'Periodo personalizado' : '',
                selectedCategoryType !== 'all' ? 'Tipo de categoría' : '',
                selectedCategoryId !== 'all' ? 'Categoría específica' : ''
              ].filter(Boolean).length} filtros activos
            </span>
            <button
              onclick={() => {
                dateFilterType = 'month';
                selectedCategoryType = 'all';
                selectedCategoryId = 'all';
                presetPeriod = '';
                customStartDate = '';
                customEndDate = '';
              }}
              class="text-xs text-tertiary hover:text-red-600 underline"
            >
              Limpiar
            </button>
          </div>
        {/if}
      </div>

      <!-- Advanced Filters Collapsible Section -->
      {#if showAdvancedFilters}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-warm mt-4">
          <!-- Month Filter (when month type is selected) -->
          {#if dateFilterType === 'month'}
          <div>
            <label for="month-filter" class="block text-caption mb-2">
              <Calendar class="w-3 h-3 inline mr-1" />
              Seleccionar mes
            </label>
            <input
              id="month-filter"
              type="month"
              bind:value={selectedMonth}
              class="input-editorial"
              onchange={loadTransactions}
            />
          </div>
          {/if}

          <!-- Preset Period Filter -->
          {#if dateFilterType === 'preset'}
          <div>
            <label for="preset-filter" class="block text-caption mb-2">
              <Calendar class="w-3 h-3 inline mr-1" />
              Periodo predefinido
            </label>
            <select
              id="preset-filter"
              bind:value={presetPeriod}
              class="input-editorial"
              onchange={loadTransactions}
            >
              <option value="">Seleccionar periodo</option>
              <option value="thisWeek">Esta semana</option>
              <option value="lastWeek">Semana pasada</option>
              <option value="last30Days">Últimos 30 días</option>
              <option value="thisQuarter">Este trimestre</option>
              <option value="lastQuarter">Trimestre pasado</option>
              <option value="thisYear">Este año</option>
              <option value="lastYear">Año pasado</option>
            </select>
          </div>
          {/if}

          <!-- Custom Date Range -->
          {#if dateFilterType === 'custom'}
          <div>
            <label for="start-date" class="block text-caption mb-2">
              <Calendar class="w-3 h-3 inline mr-1" />
              Fecha desde
            </label>
            <input
              id="start-date"
              type="date"
              bind:value={customStartDate}
              class="input-editorial"
              onchange={loadTransactions}
            />
          </div>
          <div>
            <label for="end-date" class="block text-caption mb-2">
              <Calendar class="w-3 h-3 inline mr-1" />
              Fecha hasta
            </label>
            <input
              id="end-date"
              type="date"
              bind:value={customEndDate}
              class="input-editorial"
              onchange={loadTransactions}
            />
          </div>
          {/if}

          <!-- Category Type Filter -->
          <div>
            <label for="category-type-filter" class="block text-caption mb-2">
              <Filter class="w-3 h-3 inline mr-1" />
              Tipo de categoría
            </label>
            <select
              id="category-type-filter"
              bind:value={selectedCategoryType}
              class="input-editorial"
              onchange={loadTransactions}
            >
              <option value="all">Todos los tipos</option>
              <option value="INCOME">Ingresos</option>
              <option value="ESSENTIAL_EXPENSE">Gastos Esenciales</option>
              <option value="DISCRETIONARY_EXPENSE">Gastos Discrecionales</option>
              <option value="DEBT_PAYMENT">Pagos de Deuda</option>
              <option value="SAVINGS">Ahorros</option>
              <option value="INVESTMENT">Inversiones</option>
            </select>
          </div>

          <!-- Specific Category Filter -->
          <div>
            <label for="category-filter" class="block text-caption mb-2">
              <Filter class="w-3 h-3 inline mr-1" />
              Categoría específica
            </label>
            <select
              id="category-filter"
              bind:value={selectedCategoryId}
              class="input-editorial"
              onchange={loadTransactions}
            >
              <option value="all">Todas las categorías</option>
              <option value="">❓ Sin categoría</option>
              {#each categories as category}
                <option value={category.id.value || category.id}>
                  {category.icon || '📁'} {category.name}
                </option>
              {/each}
            </select>
          </div>

          <!-- Add Custom Date Range Option in Advanced -->
          {#if dateFilterType === 'preset'}
          <div class="flex items-end">
            <button
              onclick={() => dateFilterType = 'custom'}
              class="btn-ghost gap-2 text-sm w-full"
            >
              <Calendar class="w-4 h-4" />
              Rango personalizado
            </button>
          </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="metric-card income">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-caption">Ingresos</p>
            <p class="text-h4 status-success text-mono">{formatCurrency(totals.income)}</p>
          </div>
          <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <ArrowUpDown class="w-5 h-5 status-success transform rotate-180" />
          </div>
        </div>
      </div>
      
      <div class="metric-card expense">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-caption">Gastos</p>
            <p class="text-h4 status-error text-mono">{formatCurrency(totals.expenses)}</p>
          </div>
          <div class="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <ArrowUpDown class="w-5 h-5 status-error" />
          </div>
        </div>
      </div>
      
      <div class="metric-card {totals.balance >= 0 ? 'income' : 'expense'}">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-caption">Balance</p>
            <p class="text-h4 text-mono {totals.balance >= 0 ? 'status-success' : 'status-error'}">
              {formatCurrency(totals.balance)}
            </p>
          </div>
          <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <DollarSign class="w-5 h-5 status-info" />
          </div>
        </div>
      </div>
      
      <div class="metric-card neutral">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-caption">Transacciones</p>
            <p class="text-h4 text-mono">{totals.count}</p>
          </div>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: var(--color-background-secondary);">
            <FileText class="w-5 h-5 text-tertiary" />
          </div>
        </div>
      </div>
    </div>

    <!-- Table Controls -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        {#if !isSelectionMode}
          <button 
            class="btn-ghost gap-2"
            onclick={enterSelectionMode}
          >
            <Check class="w-4 h-4" />
            Seleccionar elementos
          </button>
        {:else}
          <div class="flex items-center gap-3">
            <span class="text-body-small">
              {selectedTransactions.size} seleccionadas
            </span>
            
            <!-- Bulk Actions -->
            <div class="flex items-center gap-2">
              <button 
                class="btn-ghost gap-1 text-sm px-3 py-1 status-error hover:bg-red-50"
                onclick={bulkDelete}
                disabled={selectedTransactions.size === 0}
              >
                <Trash2 class="w-3 h-3" />
                Eliminar
              </button>
              
              <button 
                class="btn-ghost gap-1 text-sm px-3 py-1 status-warning hover:bg-orange-50"
                onclick={async () => {
                  if (selectedTransactions.size === 0) return;
                  
                  if (confirm(`¿Deseas omitir ${selectedTransactions.size} transacciones seleccionadas?`)) {
                    try {
                      for (const transactionId of selectedTransactions) {
                        await omitSingleTransaction(transactionId);
                      }
                      exitSelectionMode();
                    } catch (error) {
                      alert('Error al omitir las transacciones seleccionadas');
                    }
                  }
                }}
                disabled={selectedTransactions.size === 0}
              >
                <X class="w-3 h-3" />
                Omitir
              </button>
            </div>
            
            <button 
              class="btn-ghost gap-2 text-sm"
              onclick={exitSelectionMode}
            >
              <X class="w-4 h-4" />
              Cancelar
            </button>
          </div>
        {/if}
      </div>
      
      <!-- Table Info -->
      <div class="text-body-small text-tertiary">
        {filteredTransactions.length} de {transactions.length} transacciones
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="card-editorial overflow-hidden">
      {#if isLoading}
        <div class="p-8 text-center">
          <div class="inline-flex items-center gap-2 text-body">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            Cargando transacciones...
          </div>
        </div>
      {:else if error}
        <div class="p-8 text-center">
          <div class="status-error mb-4">{error}</div>
          <button 
            onclick={loadTransactions}
            class="btn-primary"
          >
            Reintentar
          </button>
        </div>
      {:else if filteredTransactions.length === 0}
        <div class="p-8 text-center">
          <FileText class="w-12 h-12 text-tertiary mx-auto mb-4" />
          <h3 class="text-h4 mb-2">No hay transacciones</h3>
          <p class="text-body mb-4">
            {transactions.length === 0 
              ? 'Aún no tienes transacciones registradas.'
              : 'No se encontraron transacciones con los filtros seleccionados.'
            }
          </p>
          <button 
            onclick={() => goto('/transactions/new')}
            class="btn-primary"
          >
            Crear Primera Transacción
          </button>
        </div>
      {:else}
        <!-- Mobile View -->
        <div class="sm:hidden">
          {#each filteredTransactions as transaction}
            <div class="p-4 border-b border-gray-200 last:border-b-0 {selectedTransactions.has(transaction.id.value || transaction.id) ? 'bg-blue-50 border-blue-200' : ''}">
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-shrink-0">
                    {#if isSelectionMode}
                      <input
                        type="checkbox"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedTransactions.has(transaction.id.value || transaction.id)}
                        onchange={() => toggleSelection(transaction.id.value || transaction.id)}
                      />
                    {/if}
                    <span class="text-lg flex-shrink-0">
                      {transaction.category?.icon || (transaction.amount > 0 ? '📈' : '📉')}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-primary truncate" title="{transaction.partnerName}">{transaction.partnerName}</p>
                    <p class="text-xs text-tertiary">{formatDate(transaction.bookingDate)}</p>
                    {#if transaction.category?.name}
                      <p class="text-xs text-tertiary truncate" title="{transaction.category.name}">{transaction.category.name}</p>
                    {/if}
                  </div>
                </div>
                <div class="text-right flex items-center gap-2 flex-shrink-0">
                  <div class="text-right">
                    <p class="text-lg font-semibold {transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  {#if !isSelectionMode}
                    <button
                      onclick={() => showSuggestionsForTransaction(transaction)}
                      class="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Sugerencias IA"
                    >
                      <Brain class="w-4 h-4" />
                    </button>
                    <OmitAction
                      transaction={transaction}
                      on:omit={handleOmitTransaction}
                    />
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
              {#if transaction.notes}
                <p class="text-sm text-secondary">{transaction.notes}</p>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Desktop View -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-warm border-b border-warm">
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
                <th class="text-left py-3 px-4 text-caption">
                  <button
                    class="flex items-center gap-1 hover:text-indigo-600 transition-colors focus-ring"
                    onclick={() => handleSort('date')}
                  >
                    Fecha
                    <ArrowUpDown class="w-4 h-4 {sortField === 'date' ? 'status-info' : 'text-tertiary'}" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 text-caption">
                  <button
                    class="flex items-center gap-1 hover:text-indigo-600 transition-colors focus-ring"
                    onclick={() => handleSort('partner')}
                  >
                    Concepto
                    <ArrowUpDown class="w-4 h-4 {sortField === 'partner' ? 'status-info' : 'text-tertiary'}" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 text-caption">
                  <button
                    class="flex items-center gap-1 hover:text-indigo-600 transition-colors focus-ring"
                    onclick={() => handleSort('category')}
                  >
                    Categoría
                    <ArrowUpDown class="w-4 h-4 {sortField === 'category' ? 'status-info' : 'text-tertiary'}" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 text-caption">Descripción</th>
                <th class="text-right py-3 px-4 text-caption">
                  <button
                    class="flex items-center gap-1 hover:text-indigo-600 transition-colors ml-auto focus-ring"
                    onclick={() => handleSort('amount')}
                  >
                    Importe
                    <ArrowUpDown class="w-4 h-4 {sortField === 'amount' ? 'status-info' : 'text-tertiary'}" />
                  </button>
                </th>
                {#if !isSelectionMode}
                  <th class="text-right py-3 px-4 font-medium text-primary">Acciones</th>
                {/if}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each filteredTransactions as transaction}
                <tr class="transition-colors {selectedTransactions.has(transaction.id.value || transaction.id) ? 'bg-blue-50 border-blue-200' : ''}" 
                    style="transition: background-color var(--transition-default);"
                    onmouseenter={(e) => e.target.style.backgroundColor = 'var(--color-background-secondary)'}
                    onmouseleave={(e) => e.target.style.backgroundColor = selectedTransactions.has(transaction.id.value || transaction.id) ? 'rgb(239 246 255)' : 'transparent'}>
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
                    <p class="text-sm text-primary">{formatDate(transaction.bookingDate)}</p>
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-medium text-primary">{transaction.partnerName}</p>
                  </td>
                  <td class="py-3 px-4">
                    <CategorySelector
                      currentCategory={transaction.category}
                      {categories}
                      transaction={transaction}
                      on:select={(e) => updateTransactionCategory(transaction.id.value || transaction.id, e.detail)}
                      on:smartSelect={(e) => handleSmartCategorySelection(e.detail)}
                      on:create={(e) => createNewCategory(e.detail).then(newCategory => {
                        if (newCategory) updateTransactionCategory(transaction.id.value || transaction.id, newCategory);
                      })}
                    />
                  </td>
                  <td class="py-3 px-4">
                    <InlineTextEditor
                      value={transaction.notes || ''}
                      placeholder="Agregar descripción..."
                      maxLength={200}
                      on:save={(e) => updateTransactionDescription(transaction.id.value || transaction.id, e.detail)}
                    />
                  </td>
                  <td class="py-3 px-4 text-right">
                    <p class="text-h4 font-semibold text-mono {transaction.amount > 0 ? 'status-success' : 'status-error'}">
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                  </td>
                  {#if !isSelectionMode}
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          onclick={() => showSuggestionsForTransaction(transaction)}
                          class="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Sugerencias IA"
                        >
                          <Brain class="w-4 h-4" />
                        </button>
                        <OmitAction
                          transaction={transaction}
                          on:omit={handleOmitTransaction}
                        />
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

<!-- Intelligent Suggestions Modal -->
<IntelligentSuggestions 
  transaction={selectedTransactionForSuggestions}
  isVisible={showIntelligentSuggestions}
  on:close={() => showIntelligentSuggestions = false}
  on:applySuggestion={handleApplySuggestion}
  on:smartAction={handleSmartAction}
/>

<!-- Confirmation Dialog -->
<ConfirmationDialog
  show={showConfirmDialog}
  title={dialogConfig.title}
  message={dialogConfig.message}
  type={dialogConfig.type}
  requiresTyping={dialogConfig.requiresTyping}
  requiredText={dialogConfig.requiredText}
  isLoading={dialogConfig.isLoading}
  on:confirm={handleConfirmDialog}
  on:cancel={handleCancelDialog}
/>

<!-- Alert Dialog -->
<AlertDialog
  show={showAlertDialog}
  title={alertConfig.title}
  message={alertConfig.message}
  type={alertConfig.type}
  on:close={handleCloseAlert}
/>