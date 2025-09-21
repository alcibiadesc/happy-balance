<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
  import SmartCategorizationModal from '$lib/components/SmartCategorizationModal.svelte';
  import CategorySelectionModal from '$lib/components/CategorySelectionModal.svelte';
  import VirtualTransactionList from '$lib/components/VirtualTransactionList.svelte';
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
  import { paginatedTransactions, type PaginatedQuery } from '$lib/stores/paginated-transactions';
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
  let categoryModalTransaction = $state<Transaction | null>(null);
  let editingTransaction = $state<Transaction | null>(null);
  let showAddModal = $state(false);
  let showCategoryDropdown = $state<string | null>(null);
  let showAllTransactions = $state(
    typeof window !== 'undefined'
      ? localStorage.getItem('showAllTransactions') === 'true' || localStorage.getItem('showAllTransactions') === null
      : true
  );

  // Save preferences to localStorage when they change
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showAllTransactions', showAllTransactions.toString());
    }
  });

  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showHiddenTransactions', showHiddenTransactions.toString());
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

  // State for showing/hiding hidden transactions - default to true on first visit
  let showHiddenTransactions = $state(
    typeof window !== 'undefined'
      ? localStorage.getItem('showHiddenTransactions') === 'false' ? false : true
      : true
  );

  // Modal states
  let showDeleteSelectedModal = $state(false);
  let showDeleteSingleModal = $state(false);
  let transactionToDelete = $state<string | null>(null);

  // Selected transactions for the virtual list
  let virtualSelectedTransactions = $state<Set<string>>(new Set());

  // Build query for virtual list
  let virtualListQuery = $derived(() => {
    const query: Partial<PaginatedQuery> = {
      includeHidden: true, // Always load all, filter in frontend
      limit: 50,
    };

    // Search query
    if (searchQuery.trim()) {
      query.searchTerm = searchQuery.trim();
    }

    // Date filters
    if (!showAllTransactions) {
      if (dateRangeMode === 'month' && selectedPeriod) {
        query.startDate = selectedPeriod + '-01';
        const endDate = new Date(selectedPeriod + '-01');
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
        query.endDate = endDate.toISOString().slice(0, 10);
      } else if (dateRangeMode === 'custom' && customStartDate && customEndDate) {
        query.startDate = customStartDate;
        query.endDate = customEndDate;
      }
    }

    // Category filter
    if (selectedCategories.length > 0) {
      // For now, we'll use the first selected category
      // TODO: Enhance backend to support multiple categories
      query.categoryId = selectedCategories[0];
    }

    // Transaction type filter
    if (transactionTypeFilter === 'income') {
      query.type = 'INCOME';
    } else if (transactionTypeFilter === 'expenses') {
      query.type = 'EXPENSE';
    }

    return query;
  });

  // Period navigation
  function previousPeriod() {
    if (!selectedPeriod) {
      selectedPeriod = new Date().toISOString().slice(0, 7);
      return;
    }
    const date = new Date(selectedPeriod + '-01');
    date.setMonth(date.getMonth() - 1);
    selectedPeriod = date.toISOString().slice(0, 7);
  }

  function nextPeriod() {
    if (!selectedPeriod) {
      selectedPeriod = new Date().toISOString().slice(0, 7);
      return;
    }
    const date = new Date(selectedPeriod + '-01');
    date.setMonth(date.getMonth() + 1);
    selectedPeriod = date.toISOString().slice(0, 7);
  }

  function showAllPeriods() {
    selectedPeriod = '';
  }

  // Virtual list event handlers
  function handleTransactionSelect(transaction: Transaction) {
    if (virtualSelectedTransactions.has(transaction.id)) {
      virtualSelectedTransactions.delete(transaction.id);
    } else {
      virtualSelectedTransactions.add(transaction.id);
    }
    // Trigger reactivity
    virtualSelectedTransactions = new Set(virtualSelectedTransactions);
  }

  function handleTransactionEdit(transaction: Transaction) {
    editingTransaction = transaction;
    showAddModal = true;
  }

  function handleTransactionDelete(transactionId: string) {
    transactionToDelete = transactionId;
    showDeleteSingleModal = true;
  }

  async function handleTransactionToggleHidden(transaction: Transaction) {
    try {
      await paginatedTransactions.updateTransaction(transaction.id, {
        hidden: !transaction.hidden
      });
    } catch (error) {
      console.error('Failed to toggle hidden state:', error);
    }
  }

  function handleCategoryAssign(transaction: Transaction) {
    categoryModalTransaction = transaction;
    showCategoryModal = true;
  }

  // Delete confirmation handlers
  async function confirmDeleteSingle() {
    if (!transactionToDelete) return;

    try {
      await paginatedTransactions.deleteTransaction(transactionToDelete);
      showDeleteSingleModal = false;
      transactionToDelete = null;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  }

  async function confirmDeleteSelected() {
    try {
      const selectedIds = Array.from(virtualSelectedTransactions);
      for (const id of selectedIds) {
        await paginatedTransactions.deleteTransaction(id);
      }
      virtualSelectedTransactions.clear();
      virtualSelectedTransactions = new Set();
      showDeleteSelectedModal = false;
      isSelectionMode = false;
    } catch (error) {
      console.error('Failed to delete selected transactions:', error);
    }
  }

  // Category assignment handler
  async function handleCategoryAssignment(categoryId: string | null) {
    if (!categoryModalTransaction) return;

    try {
      await paginatedTransactions.updateTransaction(categoryModalTransaction.id, {
        categoryId: categoryId
      });
      showCategoryModal = false;
      categoryModalTransaction = null;
    } catch (error) {
      console.error('Failed to assign category:', error);
    }
  }

  // Toggle selection mode
  function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    if (!isSelectionMode) {
      virtualSelectedTransactions.clear();
      virtualSelectedTransactions = new Set();
    }
  }

  // Initialize categories
  onMount(async () => {
    if (browser) {
      await apiCategories.load();
    }
  });

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

  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<svelte:head>
  <title>{$t('nav.transactions')} (Optimized) - Happy Balance</title>
</svelte:head>

<div class="page-container">
  <!-- Header with controls -->
  <div class="page-header">
    <div class="header-main">
      <h1>{$t('nav.transactions')} (Optimized)</h1>

      <div class="header-actions">
        <!-- Search -->
        <div class="search-container">
          <Search class="search-icon" size={16} />
          <input
            type="text"
            placeholder={$t('transactions.searchPlaceholder')}
            bind:value={searchQuery}
            class="search-input"
          />
        </div>

        <!-- Filters toggle -->
        <button
          class="icon-btn"
          class:active={showFilters}
          onclick={() => showFilters = !showFilters}
        >
          <Filter size={18} />
        </button>

        <!-- Selection mode toggle -->
        <button
          class="icon-btn"
          class:active={isSelectionMode}
          onclick={toggleSelectionMode}
        >
          <Check size={18} />
        </button>

        <!-- Add transaction -->
        <button
          class="primary-btn"
          onclick={() => { editingTransaction = null; showAddModal = true; }}
        >
          <Plus size={18} />
          {$t('transactions.add')}
        </button>
      </div>
    </div>

    <!-- Filters panel -->
    {#if showFilters}
      <div class="filters-panel">
        <!-- Date range controls -->
        <div class="filter-group">
          <label>{$t('transactions.dateRange')}</label>
          <div class="date-controls">
            <button
              class="date-mode-btn"
              class:active={dateRangeMode === 'month'}
              onclick={() => dateRangeMode = 'month'}
            >
              <Calendar size={16} />
              {$t('transactions.byMonth')}
            </button>
            <button
              class="date-mode-btn"
              class:active={dateRangeMode === 'custom'}
              onclick={() => dateRangeMode = 'custom'}
            >
              <CalendarRange size={16} />
              {$t('transactions.customRange')}
            </button>
            <button
              class="all-toggle-btn"
              class:active={showAllTransactions}
              onclick={() => showAllTransactions = !showAllTransactions}
            >
              <Layers size={16} />
            </button>
          </div>

          {#if dateRangeMode === 'month' && !showAllTransactions}
            <div class="period-navigation">
              <button class="nav-btn" onclick={previousPeriod}>
                <ChevronLeft size={16} />
              </button>
              <span class="period-label">
                {selectedPeriod ? new Date(selectedPeriod + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : $t('transactions.allPeriods')}
              </span>
              <button class="nav-btn" onclick={nextPeriod}>
                <ChevronRight size={16} />
              </button>
            </div>
          {:else if dateRangeMode === 'custom' && !showAllTransactions}
            <div class="custom-date-inputs">
              <input
                type="date"
                bind:value={customStartDate}
                class="date-input"
              />
              <span>—</span>
              <input
                type="date"
                bind:value={customEndDate}
                class="date-input"
              />
            </div>
          {/if}
        </div>

        <!-- Transaction type filter -->
        <div class="filter-group">
          <label>{$t('transactions.type')}</label>
          <div class="type-filter-buttons">
            <button
              class="filter-btn"
              class:active={transactionTypeFilter === 'all'}
              onclick={() => transactionTypeFilter = 'all'}
            >
              {$t('transactions.all')}
            </button>
            <button
              class="filter-btn"
              class:active={transactionTypeFilter === 'income'}
              onclick={() => transactionTypeFilter = 'income'}
            >
              <TrendingUp size={14} />
              {$t('transactions.income')}
            </button>
            <button
              class="filter-btn"
              class:active={transactionTypeFilter === 'expenses'}
              onclick={() => transactionTypeFilter = 'expenses'}
            >
              <TrendingDown size={14} />
              {$t('transactions.expenses')}
            </button>
          </div>
        </div>

        <!-- Hidden transactions toggle -->
        <div class="filter-group">
          <label>{$t('transactions.visibility')}</label>
          <button
            class="hidden-toggle-btn"
            class:active={showHiddenTransactions}
            onclick={() => showHiddenTransactions = !showHiddenTransactions}
          >
            {#if showHiddenTransactions}
              <Eye size={16} />
            {:else}
              <EyeOff size={16} />
            {/if}
            {$t('transactions.showHidden')}
          </button>
        </div>
      </div>
    {/if}

    <!-- Selection toolbar -->
    {#if isSelectionMode && virtualSelectedTransactions.size > 0}
      <div class="selection-toolbar">
        <span class="selection-count">
          {virtualSelectedTransactions.size} {$t('transactions.selected')}
        </span>
        <div class="selection-actions">
          <button
            class="danger-btn"
            onclick={() => showDeleteSelectedModal = true}
          >
            <Trash2 size={16} />
            {$t('transactions.deleteSelected')}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Virtual Transaction List -->
  <div class="content-area">
    <VirtualTransactionList
      query={virtualListQuery}
      {isSelectionMode}
      selectedTransactions={virtualSelectedTransactions}
      {showHiddenTransactions}
      onTransactionSelect={handleTransactionSelect}
      onTransactionEdit={handleTransactionEdit}
      onTransactionDelete={handleTransactionDelete}
      onTransactionToggleHidden={handleTransactionToggleHidden}
      onCategoryAssign={handleCategoryAssign}
    />
  </div>
</div>

<!-- Modals -->
{#if showAddModal}
  <AddTransactionModal
    transaction={editingTransaction}
    onClose={() => { showAddModal = false; editingTransaction = null; }}
    onSave={() => { showAddModal = false; editingTransaction = null; }}
  />
{/if}

{#if showCategoryModal && categoryModalTransaction}
  <CategorySelectionModal
    onClose={() => { showCategoryModal = false; categoryModalTransaction = null; }}
    onSelect={handleCategoryAssignment}
  />
{/if}

{#if showDeleteSingleModal}
  <ConfirmModal
    title={$t('transactions.deleteConfirmTitle')}
    message={$t('transactions.deleteConfirmMessage')}
    onConfirm={confirmDeleteSingle}
    onCancel={() => { showDeleteSingleModal = false; transactionToDelete = null; }}
  />
{/if}

{#if showDeleteSelectedModal}
  <ConfirmModal
    title={$t('transactions.deleteSelectedTitle')}
    message={$t('transactions.deleteSelectedMessage', { count: virtualSelectedTransactions.size })}
    onConfirm={confirmDeleteSelected}
    onCancel={() => showDeleteSelectedModal = false}
  />
{/if}

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--surface);
  }

  .page-header {
    flex-shrink: 0;
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--gray-200);
    padding: 1.5rem;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header-main h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .search-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background: var(--surface);
    font-size: 0.875rem;
    min-width: 240px;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  .icon-btn {
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .icon-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .icon-btn.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .primary-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .primary-btn:hover {
    background: var(--acapulco-dark, #5a9d7a);
  }

  .filters-panel {
    background: var(--gray-50);
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 200px;
  }

  .filter-group label {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .date-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .date-mode-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8125rem;
  }

  .date-mode-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .date-mode-btn.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .all-toggle-btn {
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .all-toggle-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .all-toggle-btn.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .period-navigation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .nav-btn {
    padding: 0.25rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.375rem;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .period-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    min-width: 120px;
    text-align: center;
  }

  .custom-date-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .date-input {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.375rem;
    background: var(--surface);
    font-size: 0.8125rem;
  }

  .date-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .type-filter-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8125rem;
  }

  .filter-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .filter-btn.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .hidden-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8125rem;
    width: fit-content;
  }

  .hidden-toggle-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .hidden-toggle-btn.active {
    background: var(--gray-600);
    border-color: var(--gray-600);
    color: white;
  }

  .selection-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--acapulco);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .selection-count {
    font-weight: 500;
  }

  .selection-actions {
    display: flex;
    gap: 0.5rem;
  }

  .danger-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .danger-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .content-area {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .page-header {
      padding: 1rem;
    }

    .header-main {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .header-actions {
      justify-content: space-between;
    }

    .search-input {
      min-width: 200px;
    }

    .filters-panel {
      flex-direction: column;
      gap: 1rem;
    }

    .filter-group {
      min-width: unset;
    }

    .selection-toolbar {
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }
  }
</style>