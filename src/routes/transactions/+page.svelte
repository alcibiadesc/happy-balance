<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
  import SmartCategorizationModal from '$lib/components/SmartCategorizationModal.svelte';
  import {
    ChevronDown, Search, Filter, Download, Plus, Calendar,
    TrendingUp, TrendingDown, Check, X, Eye, EyeOff, Trash2,
    Tag, MoreVertical, ChevronLeft, ChevronRight, Layers,
    CalendarDays, CalendarRange
  } from 'lucide-svelte';
  import {
    apiTransactions,
    apiCategories,
    apiSelectedTransactions,
    apiTransactionStats
  } from '$lib/stores/api-transactions';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';
  import { exportTransactionsToCSV, downloadCSV, generateFilename } from '$lib/utils/csv-export';
  
  // State
  let searchQuery = $state('');
  let showFilters = $state(false);
  let selectedPeriod = $state(new Date().toISOString().slice(0, 7)); // Current month by default
  let selectedCategories = $state<string[]>([]);
  let transactionTypeFilter = $state<'all' | 'income' | 'expenses'>('all');
  let showCategoryFilterDropdown = $state(false);
  let isSelectionMode = $state(false);
  let showCategoryModal = $state(false);
  let editingTransaction = $state<Transaction | null>(null);
  let showAddModal = $state(false);
  let showCategoryDropdown = $state<string | null>(null); // Transaction ID showing category dropdown
  let showAllTransactions = $state(
    typeof window !== 'undefined'
      ? localStorage.getItem('showAllTransactions') === 'true' || localStorage.getItem('showAllTransactions') === null
      : true
  ); // Toggle for showing all transactions

  // Save preference to localStorage when it changes
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showAllTransactions', showAllTransactions.toString());
    }
  });
  let dateRangeMode = $state<'month' | 'custom'>('month');
  let customStartDate = $state('');
  let customEndDate = $state('');
  let showDatePicker = $state(false);

  // Smart categorization modal state
  let showSmartCategorization = $state(false);
  let smartCategorizationTransaction = $state<Transaction | null>(null);
  let smartCategorizationCategory = $state<Category | null>(null);
  let smartMatchingTransactions = $state<Transaction[]>([]);
  let smartSuggestions = $state<Array<{
    categoryId: string;
    confidence: number;
    reason: string;
    potentialMatches: number;
  }>>([]);


  // Click outside handler
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close category filter dropdown
    if (showCategoryFilterDropdown && !target.closest('.category-selector')) {
      showCategoryFilterDropdown = false;
    }

    // Close category dropdown for transactions
    if (showCategoryDropdown && !target.closest('.category-selector')) {
      showCategoryDropdown = null;
    }

    // Close date picker
    if (showDatePicker && !target.closest('.date-selector-section')) {
      showDatePicker = false;
    }
  }

  // Modal states
  let showDeleteSelectedModal = $state(false);
  let showDeleteSingleModal = $state(false);
  let transactionToDelete = $state<string | null>(null);
  
  // Period navigation
  function previousPeriod() {
    if (!selectedPeriod) {
      selectedPeriod = new Date().toISOString().slice(0, 7);
      return;
    }
    const [year, month] = selectedPeriod.split('-');
    const date = new Date(Number(year), Number(month) - 2);
    selectedPeriod = date.toISOString().slice(0, 7);
  }

  function nextPeriod() {
    if (!selectedPeriod) {
      selectedPeriod = new Date().toISOString().slice(0, 7);
      return;
    }
    const [year, month] = selectedPeriod.split('-');
    const date = new Date(Number(year), Number(month));
    selectedPeriod = date.toISOString().slice(0, 7);
  }

  function showAllPeriods() {
    selectedPeriod = '';
  }
  
  // State for showing/hiding hidden transactions
  let showHiddenTransactions = $state(false);

  // Computed
  let filteredTransactions = $derived(() => {
    let filtered = $apiTransactions;

    // Period filter
    if (!showAllTransactions) {
      if (dateRangeMode === 'month' && selectedPeriod) {
        filtered = filtered.filter(t =>
          t.date.startsWith(selectedPeriod)
        );
      } else if (dateRangeMode === 'custom' && customStartDate && customEndDate) {
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date);
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
    }

    // Apply filters: categories take precedence over transaction type
    if (selectedCategories.length > 0) {
      // If specific categories are selected, only filter by categories
      filtered = filtered.filter(t =>
        t.categoryId && selectedCategories.includes(t.categoryId)
      );
    } else {
      // If no categories selected, apply transaction type filter
      if (transactionTypeFilter === 'income') {
        filtered = filtered.filter(t => t.amount > 0);
      } else if (transactionTypeFilter === 'expenses') {
        filtered = filtered.filter(t => t.amount < 0);
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.merchant.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    // Hide hidden transactions unless explicitly showing them
    if (!showHiddenTransactions) {
      filtered = filtered.filter(t => !t.hidden);
    }

    return filtered;
  });
  
  function clearAllFilters() {
    selectedCategories = [];
    transactionTypeFilter = 'all';
  }

  let groupedTransactions = $derived(() => {
    const filtered = filteredTransactions();

    const groups = new Map<string, Transaction[]>();

    filtered.forEach(transaction => {
      const date = transaction.date;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(transaction);
    });

    const result = Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
      }));

    return result;
  });
  
  let periodStats = $derived(() => {
    const filtered = filteredTransactions();
    // Exclude hidden transactions from statistics
    const visibleTransactions = filtered.filter(t => !t.hidden);

    const income = visibleTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseTransactions = visibleTransactions.filter(t => t.amount < 0);
    const totalExpenses = expenseTransactions
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Separate essential and discretionary expenses
    const essentialExpenses = expenseTransactions
      .filter(t => {
        const category = getCategoryById(t.categoryId);
        return category?.type === 'essential';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const discretionaryExpenses = expenseTransactions
      .filter(t => {
        const category = getCategoryById(t.categoryId);
        return category?.type === 'discretionary';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const uncategorizedExpenses = expenseTransactions
      .filter(t => !t.categoryId)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income: isNaN(income) ? 0 : income,
      expenses: isNaN(totalExpenses) ? 0 : totalExpenses,
      essentialExpenses: isNaN(essentialExpenses) ? 0 : essentialExpenses,
      discretionaryExpenses: isNaN(discretionaryExpenses) ? 0 : discretionaryExpenses,
      uncategorizedExpenses: isNaN(uncategorizedExpenses) ? 0 : uncategorizedExpenses,
      balance: isNaN(income - totalExpenses) ? 0 : income - totalExpenses
    };
  });
  
  // Actions
  function toggleSelection(id: string) {
    apiSelectedTransactions.update(s => {
      const newSet = new Set(s);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }
  
  function selectAll() {
    const allIds = filteredTransactions().map(t => t.id);
    apiSelectedTransactions.set(new Set(allIds));
  }
  
  function clearSelection() {
    apiSelectedTransactions.set(new Set());
    isSelectionMode = false;
  }
  
  async function deleteSelected() {
    showDeleteSelectedModal = true;
  }

  async function confirmDeleteSelected() {
    const ids = Array.from($apiSelectedTransactions);
    for (const id of ids) {
      await apiTransactions.delete(id);
    }
    clearSelection();
  }
  
  async function hideSelected() {
    const ids = Array.from($apiSelectedTransactions);
    await apiTransactions.bulkUpdate(ids, { hidden: true });
    clearSelection();
  }

  async function toggleHideTransaction(transaction: Transaction) {
    const newHiddenState = !transaction.hidden;

    try {
      // Optimistic update happens immediately in the store
      await apiTransactions.update(transaction.id, { hidden: newHiddenState });
    } catch (error) {
      console.error('Failed to toggle transaction visibility:', error);
      // The store will handle rollback on error
    }
  }

  async function deleteTransaction(id: string) {
    transactionToDelete = id;
    showDeleteSingleModal = true;
  }

  async function confirmDeleteSingle() {
    if (!transactionToDelete) return;
    await apiTransactions.delete(transactionToDelete);
    transactionToDelete = null;
  }

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tags' | 'hash'>) {
    try {
      await apiTransactions.add(transaction);
      showAddModal = false;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      // Could show error toast here
    }
  }
  
  async function categorizeTransaction(transaction: Transaction, categoryId: string, applyToAll = false) {
    try {
      const selectedCategory = getCategoryById(categoryId);

      // Fix: Update transaction amount based on category type
      let updates: Partial<Transaction> = { categoryId };

      // If changing from expense to income or vice versa
      if (selectedCategory) {
        if (selectedCategory.type === 'income' && transaction.amount < 0) {
          // Converting expense to income
          updates.amount = Math.abs(transaction.amount);
        } else if ((selectedCategory.type === 'essential' || selectedCategory.type === 'discretionary' || selectedCategory.type === 'investment') && transaction.amount > 0) {
          // Converting income to expense
          updates.amount = -Math.abs(transaction.amount);
        }
      }

      if (applyToAll) {
        await apiTransactions.applyCategoryToPattern(transaction, categoryId);
      } else {
        await apiTransactions.update(transaction.id, updates);
      }

      // Reload transactions to ensure UI is in sync
      await apiTransactions.load();
    } catch (error) {
      console.error('❌ Failed to categorize transaction:', error);
    }
  }

  async function initSmartCategorization(transaction: Transaction, categoryId: string) {
    try {
      const selectedCategory = getCategoryById(categoryId);
      if (!selectedCategory) return;

      // Set up the modal state
      smartCategorizationTransaction = transaction;
      smartCategorizationCategory = selectedCategory;

      // Find potential matching transactions
      smartMatchingTransactions = await findMatchingTransactions(transaction);

      // Generate smart suggestions
      smartSuggestions = generateSmartSuggestions(transaction, smartMatchingTransactions);

      // Show the modal
      showSmartCategorization = true;
      showCategoryDropdown = null; // Close category dropdown

    } catch (error) {
      console.error('❌ Failed to initialize smart categorization:', error);
      // Fall back to simple categorization
      await categorizeTransaction(transaction, categoryId);
    }
  }

  async function findMatchingTransactions(sourceTransaction: Transaction): Promise<Transaction[]> {
    const allTransactions = $apiTransactions || [];
    const matchingTransactions: Transaction[] = [];

    // Extract patterns from merchant name and description
    const merchantPattern = normalizeText(sourceTransaction.merchant);
    const descriptionPattern = normalizeText(sourceTransaction.description || '');

    for (const transaction of allTransactions) {
      if (transaction.id === sourceTransaction.id) continue;

      const merchantMatch = normalizeText(transaction.merchant);
      const descriptionMatch = normalizeText(transaction.description || '');

      // Check for matches
      if (merchantPattern && merchantMatch.includes(merchantPattern)) {
        matchingTransactions.push(transaction);
      } else if (descriptionPattern && descriptionMatch.includes(descriptionPattern)) {
        matchingTransactions.push(transaction);
      } else if (merchantPattern && descriptionMatch.includes(merchantPattern)) {
        matchingTransactions.push(transaction);
      }
    }

    return matchingTransactions;
  }

  function generateSmartSuggestions(transaction: Transaction, matchingTransactions: Transaction[]) {
    if (matchingTransactions.length === 0) return [];

    // Calculate the primary pattern
    const merchantPattern = normalizeText(transaction.merchant);
    const reason = `Transacciones similares con "${merchantPattern || transaction.merchant}"`;

    return [{
      categoryId: smartCategorizationCategory?.id || '',
      confidence: Math.min(0.8 + (matchingTransactions.length * 0.1), 1.0),
      reason,
      potentialMatches: matchingTransactions.length
    }];
  }

  function normalizeText(text: string): string {
    return text?.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || '';
  }

  async function handleSmartCategorization(scope: 'single' | 'pattern' | 'all', applyToFuture: boolean) {
    if (!smartCategorizationTransaction || !smartCategorizationCategory) return;

    try {
      const transaction = smartCategorizationTransaction;
      const categoryId = smartCategorizationCategory.id;

      if (scope === 'single') {
        await categorizeTransaction(transaction, categoryId, false);
      } else {
        // Apply to pattern matches
        await categorizeTransaction(transaction, categoryId, true);

        // Apply to all matching transactions
        for (const matchingTransaction of smartMatchingTransactions) {
          await categorizeTransaction(matchingTransaction, categoryId, false);
        }
      }

      if (applyToFuture && scope === 'pattern') {
        // TODO: Create categorization rule for future transactions
        console.log('Creating rule for future transactions with pattern:', transaction.merchant);
      }

      // Close modal and reset state
      showSmartCategorization = false;
      smartCategorizationTransaction = null;
      smartCategorizationCategory = null;
      smartMatchingTransactions = [];
      smartSuggestions = [];

    } catch (error) {
      console.error('❌ Failed to apply smart categorization:', error);
    }
  }

  function handleSmartCategorizationCancel() {
    showSmartCategorization = false;
    smartCategorizationTransaction = null;
    smartCategorizationCategory = null;
    smartMatchingTransactions = [];
    smartSuggestions = [];
  }


  function formatAmount(amount: number): string {
    if (isNaN(amount)) return '€0.00';
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return $t('transactions.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return $t('transactions.yesterday');
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
  
  function getCategoryById(id?: string): Category | undefined {
    if (!id) return undefined;
    return $apiCategories.find(c => c.id === id);
  }

  function downloadTransactionsCSV() {
    // Determine the date range based on current filters
    let dateRange: { start: string; end: string } | undefined;

    if (!showAllTransactions) {
      if (dateRangeMode === 'month' && selectedPeriod) {
        const [year, month] = selectedPeriod.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
        dateRange = { start: startDate, end: endDate };
      } else if (dateRangeMode === 'custom' && customStartDate && customEndDate) {
        dateRange = { start: customStartDate, end: customEndDate };
      }
    }

    // Get the filtered transactions (applies current filters)
    const transactionsToExport = filteredTransactions();

    // Generate CSV content
    const csvContent = exportTransactionsToCSV(transactionsToExport, $apiCategories, {
      includeHidden: showHiddenTransactions,
      dateRange
    });

    // Generate filename
    const filename = generateFilename(dateRange);

    // Download the file
    downloadCSV(csvContent, filename);
  }

  onMount(async () => {
    // Only try to load data on the client side
    if (browser) {
      try {
        await apiTransactions.load();
      } catch (error) {
        console.warn('Failed to load transactions on mount:', error);
        // Continue without failing the page
      }
    }
    if (browser) {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="transactions-page">
  <!-- Header -->
  <header class="transactions-header">
    <div class="header-content">
      <!-- Stats -->
      <div class="period-stats">
        <!-- Main Balance -->
        <div class="balance-display">
          <div class="balance-label">{$t('transactions.period.balance')}</div>
          <div class="balance-value" class:positive={periodStats().balance >= 0} class:negative={periodStats().balance < 0}>
            {formatAmount(periodStats().balance)}
          </div>
        </div>

        <!-- Income & Expenses Overview -->
        <div class="stats-overview">
          <div class="stat-row">
            <span class="stat-label">{$t('transactions.period.income')}</span>
            <span class="stat-value income">{formatAmount(periodStats().income)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">{$t('transactions.period.total_expenses')}</span>
            <span class="stat-value expense">{formatAmount(periodStats().expenses)}</span>
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="expense-breakdown">
          <div class="breakdown-header">
            <span class="breakdown-title">{$t('transactions.period.expense_distribution')}</span>
          </div>

          <div class="breakdown-content">
            <div class="breakdown-row">
              <div class="breakdown-item">
                <div class="breakdown-dot essential"></div>
                <span class="breakdown-label">{$t('transactions.period.essential')}</span>
              </div>
              <span class="breakdown-value">{formatAmount(periodStats().essentialExpenses)}</span>
            </div>

            <div class="breakdown-row">
              <div class="breakdown-item">
                <div class="breakdown-dot discretionary"></div>
                <span class="breakdown-label">{$t('transactions.period.discretionary')}</span>
              </div>
              <span class="breakdown-value">{formatAmount(periodStats().discretionaryExpenses)}</span>
            </div>

            {#if periodStats().uncategorizedExpenses > 0}
            <div class="breakdown-row uncategorized">
              <div class="breakdown-item">
                <div class="breakdown-dot uncategorized"></div>
                <span class="breakdown-label">{$t('transactions.period.uncategorized')}</span>
              </div>
              <span class="breakdown-value">{formatAmount(periodStats().uncategorizedExpenses)}</span>
            </div>
            {/if}
          </div>

          <!-- Visual bar -->
          <div class="visual-bar">
            <div
              class="bar-segment essential"
              style="width: {periodStats().expenses > 0 ? (periodStats().essentialExpenses / periodStats().expenses * 100) : 0}%"
            ></div>
            <div
              class="bar-segment discretionary"
              style="width: {periodStats().expenses > 0 ? (periodStats().discretionaryExpenses / periodStats().expenses * 100) : 0}%"
            ></div>
            <div
              class="bar-segment uncategorized"
              style="width: {periodStats().expenses > 0 ? (periodStats().uncategorizedExpenses / periodStats().expenses * 100) : 0}%"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </header>
  
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-content">
      <!-- Date selector section -->
      <div class="date-selector-section" class:show-all={showAllTransactions}>
        <!-- All transactions toggle - always first -->
        <button
          class="all-toggle-btn"
          class:active={showAllTransactions}
          onclick={() => showAllTransactions = !showAllTransactions}
          title={showAllTransactions ? 'Mostrar período seleccionado' : 'Mostrar todas las transacciones'}
          aria-label={showAllTransactions ? 'Mostrar período' : 'Mostrar todas'}
        >
          <Layers size={14} />
        </button>

        <!-- Date controls - always shown but disabled when showing all transactions -->
        {#if dateRangeMode === 'month'}
          <button
            class="date-nav-btn"
            class:disabled={showAllTransactions}
            onclick={showAllTransactions ? null : previousPeriod}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            class="date-display"
            class:disabled={showAllTransactions}
            onclick={showAllTransactions ? null : () => showDatePicker = !showDatePicker}
          >
            <CalendarDays size={14} />
            <span>{showAllTransactions ? '----' : (selectedPeriod ? new Date(selectedPeriod + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Seleccionar mes')}</span>
            <ChevronDown size={14} />
          </button>
          <button
            class="date-nav-btn"
            class:disabled={showAllTransactions}
            onclick={showAllTransactions ? null : nextPeriod}
          >
            <ChevronRight size={14} />
          </button>
        {:else}
          <div class="custom-date-range" class:disabled={showAllTransactions}>
            <input
              type="date"
              class="date-input"
              bind:value={customStartDate}
              placeholder="Desde"
              disabled={showAllTransactions}
            />
            <span class="date-separator">-</span>
            <input
              type="date"
              class="date-input"
              bind:value={customEndDate}
              placeholder="Hasta"
              disabled={showAllTransactions}
            />
          </div>
        {/if}

        <button
          class="date-mode-btn"
          class:disabled={showAllTransactions}
          onclick={showAllTransactions ? null : () => dateRangeMode = dateRangeMode === 'month' ? 'custom' : 'month'}
          title={showAllTransactions ? 'Deshabilitado al mostrar todas las transacciones' : (dateRangeMode === 'month' ? 'Cambiar a rango personalizado' : 'Cambiar a selección de mes')}
        >
          <CalendarRange size={14} />
        </button>

        <!-- Hidden transactions toggle - always last -->
        <button
          class="hidden-toggle-btn"
          class:active={showHiddenTransactions}
          onclick={() => showHiddenTransactions = !showHiddenTransactions}
          title={showHiddenTransactions ? 'Ocultar gastos excluidos' : 'Mostrar gastos excluidos'}
        >
          {#if showHiddenTransactions}
            <EyeOff size={14} />
          {:else}
            <Eye size={14} />
          {/if}
        </button>
      </div>

      <!-- Search bar -->
      <div class="search-bar" class:searching={searchQuery.length > 0}>
        <Search size={14} class="search-icon" />
        <input
          type="text"
          placeholder={$t('transactions.search_placeholder')}
          bind:value={searchQuery}
        />
        {#if searchQuery.length > 0}
          <button
            class="clear-search"
            onclick={() => searchQuery = ''}
            aria-label="Limpiar búsqueda"
          >
            <X size={12} />
          </button>
        {/if}
      </div>

      <!-- Action buttons -->
      <div class="toolbar-actions">
        {#if isSelectionMode}
          <button class="toolbar-btn" onclick={selectAll}>
            {$t('transactions.select_all')}
          </button>
          <button class="toolbar-btn danger" onclick={deleteSelected}>
            <Trash2 size={14} />
          </button>
          <button class="toolbar-btn" onclick={hideSelected}>
            <EyeOff size={14} />
          </button>
          <button class="toolbar-btn" onclick={clearSelection}>
            {$t('transactions.cancel')}
          </button>
        {:else}
          <button
            class="toolbar-btn"
            class:pulse={isSelectionMode === false && filteredTransactions().length > 10}
            onclick={() => isSelectionMode = true}
            aria-label="Seleccionar transacciones"
          >
            {$t('transactions.select')}
          </button>
          <button
            class="toolbar-btn"
            class:active={showFilters}
            class:has-filters={selectedCategories.length > 0 || transactionTypeFilter !== 'all'}
            onclick={() => showFilters = !showFilters}
            aria-label="Mostrar filtros"
          >
            <Filter size={14} />
            {#if selectedCategories.length > 0 || transactionTypeFilter !== 'all'}
              <span class="filter-badge"></span>
            {/if}
          </button>
          <button
            class="toolbar-btn"
            onclick={downloadTransactionsCSV}
            aria-label="Exportar transacciones"
          >
            <Download size={14} />
          </button>
        {/if}
      </div>
    </div>

    {#if showDatePicker && dateRangeMode === 'month' && !showAllTransactions}
      <div class="month-picker-dropdown">
        <div class="month-picker-header">
          <button class="year-nav-btn" onclick={() => {
            const [year] = selectedPeriod.split('-');
            selectedPeriod = `${parseInt(year) - 1}-${selectedPeriod.split('-')[1]}`;
          }}>
            <ChevronLeft size={14} />
          </button>
          <span class="year-label">{selectedPeriod.split('-')[0]}</span>
          <button class="year-nav-btn" onclick={() => {
            const [year] = selectedPeriod.split('-');
            selectedPeriod = `${parseInt(year) + 1}-${selectedPeriod.split('-')[1]}`;
          }}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div class="month-grid">
          {#each ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as month}
            {@const monthDate = `${selectedPeriod.split('-')[0]}-${month}`}
            <button
              class="month-option"
              class:selected={selectedPeriod === monthDate}
              onclick={() => {
                selectedPeriod = monthDate;
                showDatePicker = false;
              }}
            >
              {new Date(`${monthDate}-01`).toLocaleDateString('es-ES', { month: 'short' })}
            </button>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if showFilters}
      <div class="filters-bento" class:visible={showFilters}>
        <!-- Filter Grid - Bento Box Layout -->
        <div class="filter-grid">
          <!-- Quick Type Filters -->
          <div class="bento-item quick-filters">
            <button
              class="filter-pill income"
              class:active={transactionTypeFilter === 'income' && selectedCategories.length === 0}
              class:disabled={selectedCategories.length > 0}
              onclick={() => {
                if (selectedCategories.length === 0) {
                  transactionTypeFilter = transactionTypeFilter === 'income' ? 'all' : 'income'
                }
              }}
              aria-pressed={transactionTypeFilter === 'income'}
            >
              <TrendingUp size={12} class="pill-icon" />
              <span>Ingresos</span>
              {#if transactionTypeFilter === 'income' && selectedCategories.length === 0}
                <span class="pill-indicator"></span>
              {/if}
            </button>

            <button
              class="filter-pill expense"
              class:active={transactionTypeFilter === 'expenses' && selectedCategories.length === 0}
              class:disabled={selectedCategories.length > 0}
              onclick={() => {
                if (selectedCategories.length === 0) {
                  transactionTypeFilter = transactionTypeFilter === 'expenses' ? 'all' : 'expenses'
                }
              }}
              aria-pressed={transactionTypeFilter === 'expenses'}
            >
              <TrendingDown size={12} class="pill-icon" />
              <span>Gastos</span>
              {#if transactionTypeFilter === 'expenses' && selectedCategories.length === 0}
                <span class="pill-indicator"></span>
              {/if}
            </button>
          </div>

          <!-- Category Selector -->
          <div class="bento-item category-selector">
            <button
              class="category-pill"
              class:active={selectedCategories.length > 0}
              class:open={showCategoryFilterDropdown}
              onclick={(e) => {
                e.stopPropagation();
                showCategoryFilterDropdown = !showCategoryFilterDropdown;
              }}
            >
              <Tag size={12} />
              <span>
                {selectedCategories.length > 0
                  ? `${selectedCategories.length} categorías`
                  : 'Categorías'}
              </span>
              <ChevronDown size={12} class="chevron {showCategoryFilterDropdown ? 'rotated' : ''}" />
            </button>

            {#if showCategoryFilterDropdown}
              <div class="category-dropdown-mini">
                <div class="category-grid-compact">
                  {#each $apiCategories as category}
                    <button
                      class="category-chip-mini"
                      class:selected={selectedCategories.includes(category.id)}
                      onclick={() => {
                        if (selectedCategories.includes(category.id)) {
                          selectedCategories = selectedCategories.filter(c => c !== category.id);
                        } else {
                          selectedCategories = [...selectedCategories, category.id];
                        }
                      }}
                    >
                      <span class="chip-emoji">{category.icon}</span>
                      <span class="chip-name">{category.name}</span>
                      {#if selectedCategories.includes(category.id)}
                        <div class="chip-check">
                          <Check size={8} />
                        </div>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Clear Button (when filters active) -->
          {#if transactionTypeFilter !== 'all' || selectedCategories.length > 0}
            <div class="bento-item clear-section">
              <button class="clear-pill" onclick={clearAllFilters}>
                <X size={12} />
                <span>Limpiar</span>
              </button>
            </div>
          {/if}
        </div>

        <!-- Active Tags (minimal display) -->
        {#if transactionTypeFilter !== 'all' || selectedCategories.length > 0}
          <div class="active-tags-mini">
            {#if transactionTypeFilter === 'income'}
              <button
                class="tag-mini income-tag"
                onclick={() => transactionTypeFilter = 'all'}
                aria-label="Eliminar filtro de ingresos"
              >
                <TrendingUp size={10} />
                <span>Ingresos</span>
                <X size={10} class="tag-close" />
              </button>
            {/if}

            {#if transactionTypeFilter === 'expenses'}
              <button
                class="tag-mini expense-tag"
                onclick={() => transactionTypeFilter = 'all'}
                aria-label="Eliminar filtro de gastos"
              >
                <TrendingDown size={10} />
                <span>Gastos</span>
                <X size={10} class="tag-close" />
              </button>
            {/if}

            {#each selectedCategories as categoryId}
              {@const category = $apiCategories.find(c => c.id === categoryId)}
              {#if category}
                <button
                  class="tag-mini category-tag"
                  style="--category-color: {category.color}"
                  onclick={() => {
                    selectedCategories = selectedCategories.filter(c => c !== categoryId);
                  }}
                  aria-label="Eliminar categoría {category.name}"
                >
                  <span class="tag-emoji">{category.icon}</span>
                  <span>{category.name}</span>
                  <X size={10} class="tag-close" />
                </button>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Transaction List -->
  <main class="transactions-list">
    {#each groupedTransactions() as group}
      <div class="transaction-group">
        <h3 class="group-header">
          <span>{formatDate(group.date)}</span>
          <span class="group-total">
            {formatAmount(group.items.reduce((sum, t) => sum + t.amount, 0))}
          </span>
        </h3>

        {#each group.items as transaction}
          {@const category = getCategoryById(transaction.categoryId)}
          <div
            class="transaction-card"
            class:selected={$apiSelectedTransactions.has(transaction.id)}
            class:hidden={transaction.hidden}
            class:has-dropdown-open={showCategoryDropdown === transaction.id}
          >
            {#if isSelectionMode}
              <input 
                type="checkbox"
                checked={$apiSelectedTransactions.has(transaction.id)}
                onchange={() => toggleSelection(transaction.id)}
              />
            {/if}

            <div class="transaction-details">
              <div class="transaction-main">
                <div>
                  <div class="transaction-description">{transaction.description}</div>
                  <div class="transaction-meta">
                    <span>{transaction.merchant}</span>
                    <span>•</span>
                    <span>{transaction.time}</span>
                  </div>
                </div>
                <div class="transaction-amount" class:income={transaction.amount > 0}>
                  {formatAmount(transaction.amount)}
                </div>
              </div>
              
              <div class="category-selector">
                <button
                  class="category-btn"
                  class:has-category={category}
                  title={category ? `Categoría: ${category.name}` : 'Asignar categoría'}
                  onclick={(e) => {
                    e.stopPropagation();
                    showCategoryDropdown = showCategoryDropdown === transaction.id ? null : transaction.id;
                  }}
                >
                  {#if category}
                    <span class="category-icon-btn">{category.icon}</span>
                    <span>{category.name}</span>
                  {:else}
                    <Tag size={14} />
                    {$t('transactions.add_category')}
                  {/if}
                </button>

                {#if showCategoryDropdown === transaction.id}
                  {@const isIncomeTransaction = transaction.amount > 0}
                  {@const incomeCategories = $apiCategories.filter(c => c.type === 'income')}
                  {@const expenseCategories = $apiCategories.filter(c => c.type === 'essential' || c.type === 'discretionary' || c.type === 'investment')}
                  <div class="category-dropdown-compact">
                    {#if isIncomeTransaction && incomeCategories.length > 0}
                      <div class="category-section">
                        <div class="category-section-label">Categorías de Ingresos</div>
                        <div class="category-grid">
                          {#each incomeCategories as cat}
                            <button
                              class="category-grid-item income-cat"
                              onclick={(e) => {
                                e.stopPropagation();
                                initSmartCategorization(transaction, cat.id);
                              }}
                              title="{cat.name}"
                            >
                              <span class="category-emoji">{cat.icon}</span>
                            </button>
                          {/each}
                        </div>
                      </div>
                    {/if}

                    {#if !isIncomeTransaction && expenseCategories.length > 0}
                      <div class="category-section">
                        <div class="category-section-label">Categorías de Gastos</div>
                        <div class="category-grid">
                          {#each expenseCategories as cat}
                            <button
                              class="category-grid-item expense-cat"
                              onclick={(e) => {
                                e.stopPropagation();
                                initSmartCategorization(transaction, cat.id);
                              }}
                              title="{cat.name}"
                            >
                              <span class="category-emoji">{cat.icon}</span>
                            </button>
                          {/each}
                        </div>
                      </div>
                    {/if}

                    <button
                      class="category-close-btn"
                      onclick={(e) => {
                        e.stopPropagation();
                        showCategoryDropdown = null;
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="transaction-actions">
              <button
                class="action-btn"
                class:hidden={transaction.hidden}
                title={transaction.hidden ? $t('transactions.show_transaction') : $t('transactions.hide_transaction')}
                onclick={() => toggleHideTransaction(transaction)}
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
                onclick={() => deleteTransaction(transaction.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </main>
  
  <!-- FAB -->
  <button class="fab" onclick={() => showAddModal = true}>
    <Plus size={16} />
  </button>
</div>

<!-- Smart Categorization Modal -->
<SmartCategorizationModal
  isOpen={showSmartCategorization}
  transaction={smartCategorizationTransaction}
  selectedCategory={smartCategorizationCategory}
  matchingTransactions={smartMatchingTransactions}
  suggestions={smartSuggestions}
  onConfirm={handleSmartCategorization}
  onCancel={handleSmartCategorizationCancel}
/>


<!-- Delete Selected Modal -->
<ConfirmModal
  bind:isOpen={showDeleteSelectedModal}
  title={$t('transactions.delete_selected_title')}
  message={$t('transactions.delete_selected_message', { count: $apiSelectedTransactions.size })}
  confirmText={$t('transactions.delete_all')}
  cancelText={$t('common.cancel')}
  type="danger"
  onConfirm={confirmDeleteSelected}
  onCancel={() => {}}
/>

<!-- Delete Single Transaction Modal -->
<ConfirmModal
  bind:isOpen={showDeleteSingleModal}
  title={$t('transactions.delete_single_title')}
  message={$t('transactions.delete_single_message')}
  confirmText={$t('common.delete')}
  cancelText={$t('common.cancel')}
  type="danger"
  onConfirm={confirmDeleteSingle}
  onCancel={() => transactionToDelete = null}
/>

<!-- Add Transaction Modal -->
<AddTransactionModal
  bind:isOpen={showAddModal}
  categories={$apiCategories}
  onSubmit={addTransaction}
  onCancel={() => showAddModal = false}
/>

<style>
  .transactions-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%);
  }
  
  .transactions-header {
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--gray-200);
    padding: var(--space-2xl) var(--space-lg);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* Date selector styles */
  .date-selector-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05),
                0 1px 2px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
  }

  .date-selector-section:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                0 2px 4px rgba(0, 0, 0, 0.03);
  }

  /* When showing all transactions, integrate the hidden button better */
  .date-selector-section.show-all {
    gap: 0.25rem;
  }

  .date-selector-section.show-all .all-toggle-btn {
    margin-right: 0;
  }

  .date-selector-section.show-all .hidden-toggle-btn {
    margin-left: 0.25rem;
  }

  .date-nav-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    border: none;
    background: #FFF7ED;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .date-nav-btn:hover {
    background: #FFF3E0;
    transform: scale(1.08);
  }

  .date-nav-btn:active {
    transform: scale(0.98);
  }

  .date-nav-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8f9fa;
    color: #9ca3af;
  }

  .date-nav-btn.disabled:hover {
    background: #f8f9fa;
    transform: none;
    color: #9ca3af;
  }

  .date-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1.25rem;
    height: 2.5rem;
    background: #FFF7ED;
    border: none;
    border-radius: 0.625rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
  }

  .date-display:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
  }

  .date-display.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8f9fa;
    color: #9ca3af;
  }

  .date-display.disabled:hover {
    background: #f8f9fa;
    transform: none;
    color: #9ca3af;
  }

  .custom-date-range {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .date-input {
    height: 1.75rem;
    padding: 0 var(--space-xs);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 0.8125rem;
    color: var(--text-primary);
    outline: none;
    transition: all 0.15s ease;
  }

  .date-input:focus {
    border-color: var(--acapulco);
  }

  .date-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8f9fa;
    color: #9ca3af;
  }

  .custom-date-range.disabled {
    opacity: 0.4;
  }

  .custom-date-range.disabled .date-separator {
    color: #9ca3af;
  }

  .date-separator {
    color: var(--text-muted);
    font-size: 0.8125rem;
  }

  .date-mode-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    border: none;
    background: #FFF7ED;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-left: 0.5rem;
  }

  .date-mode-btn:hover {
    background: #FFF3E0;
    transform: scale(1.08);
    color: var(--acapulco);
  }

  .date-mode-btn:active {
    transform: scale(0.98);
  }

  .date-mode-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8f9fa;
    color: #9ca3af;
  }

  .date-mode-btn.disabled:hover {
    background: #f8f9fa;
    transform: none;
    color: #9ca3af;
  }

  .all-toggle-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    border: none;
    background: #FFF7ED;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .all-toggle-btn:hover {
    background: #FFF3E0;
    transform: scale(1.08);
  }

  .all-toggle-btn:active {
    transform: scale(0.98);
  }

  .all-toggle-btn.active {
    background: var(--acapulco);
    color: white;
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.25);
  }

  .hidden-toggle-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    border: none;
    background: #FFF7ED;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .hidden-toggle-btn:hover {
    background: #FFF3E0;
    transform: scale(1.08);
  }

  .hidden-toggle-btn:active {
    transform: scale(0.98);
  }

  .hidden-toggle-btn.active {
    background: #94a3b8;
    color: white;
    box-shadow: 0 2px 8px rgba(148, 163, 184, 0.25);
  }

  /* Month picker dropdown */
  .month-picker-dropdown {
    position: absolute;
    top: calc(100% + var(--space-xs));
    left: var(--space-lg);
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 25;
    min-width: 240px;
  }

  .month-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--gray-200);
  }

  .year-nav-btn {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--radius-xs);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .year-nav-btn:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .year-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
  }

  .month-option {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .month-option:hover {
    background: var(--gray-50);
    color: var(--text-primary);
  }

  .month-option.selected {
    background: var(--acapulco);
    color: white;
    font-weight: 500;
  }
  
  .period-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    max-width: 320px;
    margin: 0 auto;
  }

  /* Balance Display - Featured */
  .balance-display {
    text-align: center;
  }

  .balance-label {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: var(--space-xs);
    font-weight: 300;
  }

  .balance-value {
    font-size: 2.25rem;
    font-weight: 300;
    letter-spacing: -0.025em;
    color: var(--text-primary);
  }

  .balance-value.positive {
    color: var(--acapulco);
  }

  .balance-value.negative {
    color: var(--froly);
  }

  /* Stats Overview - Clean rows */
  .stats-overview {
    border-top: 1px solid var(--gray-200);
    border-bottom: 1px solid var(--gray-200);
    padding: var(--space-lg) 0;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm) 0;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .stat-value.income {
    color: var(--acapulco);
  }

  .stat-value.expense {
    color: var(--text-primary);
  }

  /* Expense Breakdown - Minimal */
  .expense-breakdown {
    padding-top: var(--space-md);
  }

  .breakdown-header {
    margin-bottom: var(--space-md);
  }

  .breakdown-title {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .breakdown-content {
    margin-bottom: var(--space-lg);
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) 0;
  }

  .breakdown-row.uncategorized {
    opacity: 0.7;
    font-size: 0.8125rem;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .breakdown-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .breakdown-dot.essential {
    background: var(--froly);
  }

  .breakdown-dot.discretionary {
    background: var(--acapulco);
  }

  .breakdown-dot.uncategorized {
    background: var(--text-muted);
  }

  .breakdown-label {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  .breakdown-value {
    font-size: 0.8125rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  /* Visual Bar - Subtle */
  .visual-bar {
    display: flex;
    height: 2px;
    border-radius: 1px;
    background: var(--gray-200);
    overflow: hidden;
  }

  .bar-segment {
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bar-segment.essential {
    background: var(--froly);
  }

  .bar-segment.discretionary {
    background: var(--acapulco);
  }

  .bar-segment.uncategorized {
    background: var(--text-muted);
  }
  
  .toolbar {
    background: transparent;
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 1rem 0;
  }

  .toolbar-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
  }

  @media (min-width: 1024px) {
    .toolbar-content {
      grid-template-columns: minmax(240px, auto) 1fr minmax(200px, auto);
      gap: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .toolbar {
      padding: 0.75rem 0;
    }

    .toolbar-content {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 0 1rem;
    }

    .date-selector-section,
    .toolbar-actions {
      width: 100%;
      justify-content: space-between;
    }

    .search-bar {
      width: 100%;
      order: -1;
    }
  }

  @media (max-width: 640px) {
    .toolbar {
      padding: 0.75rem 0;
    }

    .toolbar-content {
      padding: 0 1rem;
    }

    .date-selector-section {
      padding: 0.375rem;
      gap: 0.375rem;
    }

    .date-selector-section.show-all {
      gap: 0.25rem;
    }

    .toolbar-actions {
      padding: 0.375rem;
      gap: 0.375rem;
    }

    .filter-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .filters-bento {
      padding: 1rem;
      margin: 0.5rem 1rem;
      border-radius: 0.75rem;
    }

    .bento-item {
      padding: 0.5rem;
    }

    .all-toggle-btn,
    .hidden-toggle-btn,
    .date-nav-btn,
    .date-mode-btn {
      width: 2.25rem;
      height: 2.25rem;
    }

    .date-display {
      font-size: 0.8125rem;
      padding: 0 1rem;
      height: 2.25rem;
    }

    .toolbar-btn {
      padding: 0 1rem;
      height: 2.25rem;
      font-size: 0.8125rem;
    }

    .search-bar {
      height: 2.75rem;
      padding: 0.5rem 0.875rem;
    }

    .filter-pill,
    .category-pill,
    .clear-pill {
      min-height: 2.25rem;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
    }

    .transactions-header {
      padding: var(--space-xl) var(--space-md);
    }

    .header-content {
      padding: 0;
    }

    .period-stats {
      gap: var(--space-lg);
      max-width: 100%;
    }

    .balance-display {
      padding-bottom: var(--space-md);
    }

    .stats-overview {
      padding: var(--space-md) 0;
    }

    .expense-breakdown {
      padding-top: var(--space-sm);
    }

    .transactions-list {
      padding: 0 1rem 2rem 1rem;
    }

    .transaction-group {
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .transaction-card {
      padding: 0.875rem;
      min-height: 4rem;
    }

    .fab {
      width: 3.5rem;
      height: 3.5rem;
      bottom: 1rem;
      right: 1rem;
    }
  }

  @media (min-width: 768px) {
    .toolbar-content {
      flex-wrap: nowrap;
    }
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    height: 3rem;
    background: white;
    border: none;
    border-radius: 0.75rem;
    flex: 1;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05),
                0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .search-bar:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .search-bar:focus-within {
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1),
                0 4px 6px rgba(0, 0, 0, 0.05);
    transform: scale(1.01);
  }

  .search-bar input {
    font-size: 0.875rem;
  }

  .search-bar.searching {
    background: var(--surface);
  }

  .search-icon {
    transition: color 0.15s ease;
    color: var(--text-muted);
  }

  .search-bar:focus-within .search-icon {
    color: var(--acapulco);
  }

  .search-bar input {
    border: none;
    background: none;
    outline: none;
    flex: 1;
    font-size: 0.8125rem;
    color: var(--text-primary);
  }

  .search-bar input::placeholder {
    color: var(--text-muted);
    transition: opacity 0.2s ease;
  }

  .search-bar:focus-within input::placeholder {
    opacity: 0.4;
  }

  .clear-search {
    position: absolute;
    right: var(--space-xs);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: none;
    background: var(--gray-200);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    animation: fadeIn 0.15s ease forwards;
    transition: all 0.15s ease;
  }

  .clear-search:hover {
    background: var(--gray-300);
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }

  .toolbar-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    background: white;
    padding: 0.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05),
                0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .toolbar-actions:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .toolbar-btn {
    height: 2.5rem;
    padding: 0 1.25rem;
    border: none;
    border-radius: 0.625rem;
    background: #FFF7ED;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
  }

  .toolbar-btn:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
  }

  .toolbar-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .toolbar-btn.active {
    background: var(--acapulco);
    color: white;
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.25);
  }

  .toolbar-btn.has-filters {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .filter-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--acapulco);
  }

  .toolbar-btn.danger:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
    color: rgb(239, 68, 68);
    transform: translateY(-1px) scale(1.02);
  }
  
  /* Bento Box Filters */
  .filters-bento {
    background: white;
    border: none;
    padding: 1.5rem;
    margin: 1rem auto 2rem auto;
    max-width: 1200px;
    opacity: 0;
    transform: translateY(-8px);
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    position: relative;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .filters-bento:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.05),
                0 4px 6px rgba(0, 0, 0, 0.03);
  }

  @keyframes slideDown {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Bento Grid Layout */
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    align-items: center;
  }

  @media (min-width: 768px) {
    .filter-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
  }

  .bento-item {
    background: rgba(249, 250, 251, 0.5);
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 0.625rem;
    padding: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bento-item:hover {
    background: rgba(249, 250, 251, 0.8);
    border-color: rgba(209, 213, 219, 0.5);
    transform: translateY(-2px);
  }

  /* Quick Filters Pills */
  .quick-filters {
    display: flex;
    gap: var(--space-xs);
  }

  .filter-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: #FFF7ED;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
  }

  .filter-pill:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: #475569;
  }

  .filter-pill:active {
    background: var(--gray-100);
  }

  .pill-indicator {
    display: none;
  }

  .filter-pill.income.active {
    background: var(--acapulco);
    color: white;
  }

  .filter-pill.expense.active {
    background: var(--froly);
    color: white;
  }

  .filter-pill.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-50);
    border-color: var(--gray-100);
    color: var(--text-muted);
  }

  .filter-pill.disabled:hover {
    background: var(--gray-50);
    border-color: var(--gray-100);
    color: var(--text-muted);
  }

  /* Category Selector */
  .category-selector {
    position: relative;
    z-index: 30;
  }

  .category-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: #FFF7ED;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    justify-content: space-between;
    min-width: 180px;
    position: relative;
  }

  .category-pill:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: #475569;
  }

  .category-pill.active {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.15);
  }

  .chevron {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0.5;
  }

  .chevron.rotated {
    transform: rotate(180deg);
    opacity: 0.8;
  }

  /* Compact Category Dropdown */
  .category-dropdown-mini {
    position: absolute;
    top: calc(100% + var(--space-xs));
    left: 0;
    right: 0;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 35;
    max-height: 200px;
    overflow-y: auto;
    min-width: 240px;
  }

  .category-grid-compact {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    padding: var(--space-xs);
  }

  .category-chip-mini {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    font-size: 0.8125rem;
  }

  .category-chip-mini:hover {
    background: var(--gray-50);
  }

  .category-chip-mini.selected {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .chip-emoji {
    font-size: 0.875rem;
    width: 16px;
    text-align: center;
  }

  .chip-name {
    flex: 1;
    text-align: left;
    font-weight: 500;
  }

  .chip-check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--acapulco);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    margin-left: auto;
  }

  /* Clear Button */
  .clear-section {
    opacity: 0;
    animation: slideInFade 0.25s ease forwards;
  }

  @keyframes slideInFade {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .clear-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: #FEE2E2;
    color: #EF4444;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .clear-pill:hover {
    background: #FCA5A5;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.15);
  }

  /* Active Tags */
  .active-tags-mini {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(249, 250, 251, 0.5);
    border-radius: 0.75rem;
    border: 1px dashed rgba(209, 213, 219, 0.5);
    position: relative;
    min-height: 3rem;
    align-items: center;
  }

  .active-tags-mini:empty {
    display: none;
  }

  .tag-mini {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    min-height: 2rem;
    border: none;
    border-radius: 1rem;
    background: #FFF7ED;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .tag-mini:hover {
    background: #FFF3E0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .tag-emoji {
    font-size: 0.75rem;
  }

  .tag-close {
    margin-left: 0.25rem;
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .tag-mini:hover .tag-close {
    opacity: 0.7;
  }

  .tag-mini.income-tag {
    background: #E6F7F2;
    color: #10B981;
  }

  .tag-mini.expense-tag {
    background: #FEE2E2;
    color: #EF4444;
  }

  .tag-mini.category-tag {
    background: #FFF7ED;
    color: #64748b;
  }

  /* Responsive Bento Grid */
  @media (max-width: 768px) {
    .filters-bento {
      padding: var(--space-md);
    }

    .filter-grid {
      grid-template-columns: 1fr;
      gap: var(--space-xs);
    }

    .bento-item {
      width: 100%;
    }

    .quick-filters {
      justify-content: center;
    }

    .filter-pill {
      flex: 1;
      justify-content: center;
    }

    .category-dropdown-mini {
      min-width: auto;
      left: 0;
      right: 0;
    }
  }

  @media (max-width: 480px) {
    .filter-grid {
      grid-template-columns: 1fr;
    }

    .quick-filters {
      flex-direction: column;
    }

    .filter-pill {
      justify-content: center;
      min-height: 32px;
    }

    .category-pill {
      min-width: auto;
      justify-content: center;
    }

    .category-dropdown-mini {
      max-height: 150px;
    }

    .active-tags-mini {
      justify-content: center;
    }
  }

  /* Ultra-compact for very small screens */
  @media (max-width: 360px) {
    .filters-bento {
      padding: var(--space-sm);
    }

    .bento-item {
      padding: var(--space-xs);
    }

    .filter-pill,
    .category-pill,
    .clear-pill {
      padding: var(--space-xs);
      font-size: 0.75rem;
    }

    .tag-mini {
      font-size: 0.625rem;
      padding: 1px var(--space-xs);
    }

    .category-dropdown-compact {
      min-width: 200px;
      max-width: 240px;
      left: auto;
      right: 0;
    }

    .category-grid-item {
      width: 32px;
      height: 32px;
    }
  }
  
  .transactions-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem 1.5rem;
  }
  
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
    padding: 0 0 1rem 0;
    border-bottom: 2px solid rgba(229, 231, 235, 0.5);
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .group-header span:first-child {
    color: var(--text-primary);
  }
  
  .transaction-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(249, 250, 251, 0.5);
    border: 1px solid transparent;
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    min-height: 4.5rem;
    z-index: 1;
  }

  .transaction-card:hover {
    background: white;
    border-color: rgba(122, 186, 165, 0.2);
    transform: translateX(4px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
                0 2px 4px rgba(0, 0, 0, 0.03);
    z-index: 2;
  }

  /* Keep elevated z-index when dropdown is open */
  .transaction-card.has-dropdown-open {
    z-index: 40;
  }

  .transaction-card:last-child {
    margin-bottom: 0;
  }
  
  .transaction-card.selected {
    background: rgba(122, 186, 165, 0.1);
    border-color: var(--acapulco);
  }

  .transaction-card.hidden {
    position: relative;
    opacity: 0.6;
    background: repeating-linear-gradient(
      45deg,
      var(--surface-elevated),
      var(--surface-elevated) 10px,
      var(--gray-50) 10px,
      var(--gray-50) 20px
    );
  }

  .transaction-card.hidden::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-lg);
    pointer-events: none;
  }

  .transaction-card.hidden:hover {
    transform: none;
    border-color: var(--gray-300);
    opacity: 0.7;
  }

  .transaction-card.hidden .transaction-description,
  .transaction-card.hidden .transaction-amount,
  .transaction-card.hidden .transaction-meta {
    color: var(--text-muted);
  }
  .transaction-details {
    flex: 1;
  }
  
  .transaction-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .transaction-description {
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .transaction-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 2px;
  }
  
  .transaction-amount {
    font-weight: 600;
    color: var(--froly);
  }
  
  .transaction-amount.income {
    color: var(--acapulco);
  }
  
  .category-selector {
    position: relative;
    margin-top: var(--space-xs);
    z-index: 30;
  }
  
  .category-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 4px var(--space-sm);
    border: 1px dashed var(--acapulco);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--acapulco);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-btn.has-category {
    border: 1px solid var(--gray-200);
    color: var(--text-primary);
    background: var(--surface);
  }

  .category-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  .category-btn.has-category:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  .category-icon-btn {
    font-size: 0.875rem;
  }

  .category-dropdown-compact {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 35;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.05);
    padding: var(--space-lg);
    min-width: 300px;
    max-width: 360px;
    animation: dropdownOpen 0.2s ease-out;
  }

  @keyframes dropdownOpen {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .category-section {
    margin-bottom: var(--space-lg);
  }

  .category-section:last-of-type {
    margin-bottom: var(--space-md);
  }

  .category-section-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: var(--space-sm);
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid var(--gray-100);
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
  }

  .category-grid-item {
    aspect-ratio: 1;
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-md);
    background: var(--surface);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .category-grid-item:hover {
    transform: translateY(-2px) scale(1.08);
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .category-grid-item.income-cat {
    background: linear-gradient(135deg, rgba(122, 186, 165, 0.08), rgba(122, 186, 165, 0.03));
    border-color: rgba(122, 186, 165, 0.4);
  }

  .category-grid-item.income-cat:hover {
    background: linear-gradient(135deg, rgba(122, 186, 165, 0.2), rgba(122, 186, 165, 0.1));
    border-color: var(--acapulco);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }

  .category-grid-item.expense-cat {
    background: linear-gradient(135deg, rgba(245, 121, 108, 0.08), rgba(245, 121, 108, 0.03));
    border-color: rgba(245, 121, 108, 0.4);
  }

  .category-grid-item.expense-cat:hover {
    background: linear-gradient(135deg, rgba(245, 121, 108, 0.2), rgba(245, 121, 108, 0.1));
    border-color: var(--froly);
    box-shadow: 0 4px 12px rgba(245, 121, 108, 0.3);
  }

  .category-grid-item:active {
    transform: scale(0.95);
  }

  .category-emoji {
    font-size: 1.25rem;
    line-height: 1;
    filter: saturate(1.1);
  }

  .category-close-btn {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    margin-top: var(--space-xs);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .category-close-btn:hover {
    background: var(--gray-200);
    color: var(--text-secondary);
  }
  
  .transaction-actions {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .action-btn {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0;
  }

  .transaction-card:hover .action-btn {
    opacity: 1;
  }

  .action-btn:hover {
    background: var(--surface);
    color: var(--text);
  }

  .action-btn.hidden {
    opacity: 0.5;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }


  
  .fab {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 60;
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    background: var(--acapulco);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3),
                0 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 300;
  }

  .fab:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px rgba(122, 186, 165, 0.4),
                0 3px 8px rgba(0, 0, 0, 0.1);
  }

  .fab:active {
    transform: translateY(-1px) scale(1.02);
  }
</style>
