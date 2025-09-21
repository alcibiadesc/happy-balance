<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import VirtualTransactionList from '$lib/components/VirtualTransactionList.svelte';
  import {
    paginatedTransactions,
    transactions,
    pagination,
    loading,
    transactionFilters
  } from '$lib/stores/paginated-transactions';
  import { apiCategories } from '$lib/stores/api-transactions';
  import type { Transaction, Category } from '$lib/types/transaction';
  import {
    Search, Filter, Download, Plus, Calendar,
    TrendingUp, TrendingDown, Layers, ChevronDown,
    Eye, EyeOff, Trash2, MoreVertical
  } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  // State
  let searchQuery = $state('');
  let showFilters = $state(false);
  let selectedPeriod = $state(new Date().toISOString().slice(0, 7));
  let selectedCategories = $state<string[]>([]);
  let transactionTypeFilter = $state<'all' | 'income' | 'expenses'>('all');
  let showHiddenTransactions = $state(false);
  let virtualListRef: VirtualTransactionList;

  // Filter debouncing
  let filterTimeout: number;

  // Apply filters with debouncing
  function applyFiltersDebounced() {
    if (filterTimeout) clearTimeout(filterTimeout);

    filterTimeout = setTimeout(async () => {
      const filters: any = {
        includeHidden: showHiddenTransactions
      };

      // Search query
      if (searchQuery.trim()) {
        filters.merchantName = searchQuery.trim();
      }

      // Period filter
      if (selectedPeriod) {
        const [year, month] = selectedPeriod.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);

        filters.startDate = startDate.toISOString().split('T')[0];
        filters.endDate = endDate.toISOString().split('T')[0];
      }

      // Type filter
      if (transactionTypeFilter !== 'all') {
        filters.type = transactionTypeFilter === 'income' ? 'INCOME' : 'EXPENSE';
      }

      // Category filter
      if (selectedCategories.length > 0) {
        // For now, we'll filter by the first selected category
        // TODO: Support multiple category filtering in backend
        filters.categoryId = selectedCategories[0];
      }

      await paginatedTransactions.applyFilters(filters);
    }, 300);
  }

  // Watch for filter changes
  $effect(() => {
    if (browser) {
      applyFiltersDebounced();
    }
  });

  // Load more transactions
  async function handleLoadMore() {
    try {
      await paginatedTransactions.loadMore();
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    }
  }

  // Handle transaction item click
  function handleTransactionClick(event: CustomEvent<{ transaction: Transaction; index: number }>) {
    const { transaction } = event.detail;
    console.log('Transaction clicked:', transaction);
    // TODO: Implement transaction detail modal or navigation
  }

  // Handle transaction selection
  function handleTransactionSelect(event: CustomEvent<{ transaction: Transaction; selected: boolean }>) {
    const { transaction, selected } = event.detail;
    console.log('Transaction selected:', transaction.id, selected);
    // TODO: Implement multi-selection for bulk operations
  }

  // Refresh data
  async function refreshData() {
    try {
      await paginatedTransactions.refresh();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  // Export transactions
  function exportTransactions() {
    // TODO: Implement CSV export
    console.log('Export transactions');
  }

  // Toggle filter panel
  function toggleFilters() {
    showFilters = !showFilters;
  }

  // Clear all filters
  function clearFilters() {
    searchQuery = '';
    selectedPeriod = new Date().toISOString().slice(0, 7);
    selectedCategories = [];
    transactionTypeFilter = 'all';
    showHiddenTransactions = false;
  }

  // Scroll to top
  function scrollToTop() {
    if (virtualListRef) {
      virtualListRef.scrollToTop();
    }
  }

  onMount(async () => {
    if (browser) {
      try {
        // Load initial data
        await Promise.all([
          paginatedTransactions.loadPage(1),
          apiCategories.load()
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    }
  });

  onDestroy(() => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
  });
</script>

<svelte:head>
  <title>Transactions - Happy Balance</title>
</svelte:head>

<div class="transactions-page">
  <header class="page-header">
    <div class="header-content">
      <h1>Transactions</h1>
      <div class="header-stats">
        <div class="stat">
          <span class="stat-label">Total</span>
          <span class="stat-value">{$pagination.totalCount}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Loaded</span>
          <span class="stat-value">{$transactions.length}</span>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="btn btn-secondary"
        on:click={refreshData}
        disabled={$loading}
      >
        <TrendingUp size={16} />
        Refresh
      </button>

      <button
        type="button"
        class="btn btn-secondary"
        on:click={exportTransactions}
      >
        <Download size={16} />
        Export
      </button>

      <button
        type="button"
        class="btn btn-primary"
      >
        <Plus size={16} />
        Add Transaction
      </button>
    </div>
  </header>

  <div class="controls">
    <!-- Search -->
    <div class="search-bar">
      <Search size={20} class="search-icon" />
      <input
        type="text"
        placeholder={$t('accessibility.search_transactions')}
        bind:value={searchQuery}
        class="search-input"
      />
    </div>

    <!-- Filter toggle -->
    <button
      type="button"
      class="btn btn-outline"
      class:active={showFilters}
      on:click={toggleFilters}
    >
      <Filter size={16} />
      Filters
      <ChevronDown size={16} class="chevron" class:rotated={showFilters} />
    </button>

    <!-- Quick filters -->
    <div class="quick-filters">
      <select bind:value={transactionTypeFilter} class="filter-select">
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expenses">Expenses</option>
      </select>

      <input
        type="month"
        bind:value={selectedPeriod}
        class="filter-input"
        title={$t('accessibility.filter_by_month')}
      />

      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={showHiddenTransactions}
        />
        <span class="checkbox-text">Show hidden</span>
      </label>
    </div>
  </div>

  <!-- Advanced filters panel -->
  {#if showFilters}
    <div class="filters-panel">
      <div class="filters-content">
        <h3>Advanced Filters</h3>

        <div class="filter-group">
          <label>Categories</label>
          <select
            multiple
            bind:value={selectedCategories}
            class="filter-select"
            size="4"
          >
            {#each $apiCategories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <div class="filter-actions">
          <button
            type="button"
            class="btn btn-secondary"
            on:click={clearFilters}
          >
            Clear All
          </button>
          <button
            type="button"
            class="btn btn-outline"
            on:click={toggleFilters}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Transaction list -->
  <div class="transaction-list-container">
    {#if $loading && $transactions.length === 0}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    {:else}
      <VirtualTransactionList
        bind:this={virtualListRef}
        transactions={$transactions}
        itemHeight={80}
        containerHeight={600}
        on:loadMore={handleLoadMore}
        on:itemClick={handleTransactionClick}
        on:itemSelect={handleTransactionSelect}
      >
        <svelte:fragment slot="let:transaction" let:transaction let:onItemClick let:onItemSelect>
          <div class="transaction-item" on:click={onItemClick} role="button" tabindex="0">
            <div class="transaction-main">
              <div class="merchant-info">
                <h4 class="merchant-name">{transaction.merchant}</h4>
                <p class="transaction-date">
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.time}
                </p>
                {#if transaction.description}
                  <p class="transaction-description">{transaction.description}</p>
                {/if}
              </div>

              <div class="amount-info">
                <span class="amount" class:income={transaction.amount > 0} class:expense={transaction.amount < 0}>
                  {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount).toFixed(2)} €
                </span>
                {#if transaction.hidden}
                  <span class="hidden-badge">Hidden</span>
                {/if}
              </div>
            </div>

            <div class="transaction-actions">
              <button
                type="button"
                class="action-btn"
                title={$t('accessibility.more_actions')}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </svelte:fragment>

        <svelte:fragment slot="empty">
          <div class="empty-state">
            <Layers size={48} class="empty-icon" />
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or add some transactions.</p>
            <button type="button" class="btn btn-primary">
              <Plus size={16} />
              Add Transaction
            </button>
          </div>
        </svelte:fragment>
      </VirtualTransactionList>
    {/if}
  </div>

  <!-- Scroll to top button -->
  {#if $pagination.currentPage > 1}
    <button
      type="button"
      class="scroll-top-btn"
      on:click={scrollToTop}
      title={$t('accessibility.scroll_to_top')}
    >
      ↑
    </button>
  {/if}
</div>

<style>
  .transactions-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
  }

  .header-content h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .header-stats {
    display: flex;
    gap: 24px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 2px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .controls {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-bar {
    position: relative;
    flex: 1;
    min-width: 300px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .search-input {
    width: 100%;
    padding: 12px 12px 12px 44px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.15s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .quick-filters {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .filter-select, .filter-input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
  }

  .filters-panel {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .filters-content h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #1f2937;
  }

  .filter-group {
    margin-bottom: 16px;
  }

  .filter-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
  }

  .filter-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .transaction-list-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .transaction-item {
    display: flex;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid #f3f4f6;
  }

  .transaction-item:hover {
    background: #f9fafb;
  }

  .transaction-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
  }

  .merchant-info {
    flex: 1;
  }

  .merchant-name {
    font-size: 16px;
    font-weight: 500;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .transaction-date {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 2px 0;
  }

  .transaction-description {
    font-size: 13px;
    color: #9ca3af;
    margin: 0;
  }

  .amount-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .amount {
    font-size: 16px;
    font-weight: 600;
  }

  .amount.income {
    color: #10b981;
  }

  .amount.expense {
    color: #ef4444;
  }

  .hidden-badge {
    font-size: 12px;
    background: #fef3c7;
    color: #92400e;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .transaction-actions {
    margin-left: 16px;
  }

  .action-btn {
    padding: 8px;
    border: none;
    background: none;
    border-radius: 6px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }

  .empty-icon {
    color: #d1d5db;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    font-size: 20px;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .scroll-top-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    border: none;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: all 0.15s ease;
  }

  .scroll-top-btn:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }

  /* Button styles */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
    text-decoration: none;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-outline {
    background: white;
    color: #374151;
    border-color: #d1d5db;
  }

  .btn-outline:hover, .btn-outline.active {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chevron {
    transition: transform 0.15s ease;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .transactions-page {
      padding: 16px;
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: flex-end;
    }

    .controls {
      flex-direction: column;
      align-items: stretch;
    }

    .search-bar {
      min-width: auto;
    }

    .quick-filters {
      flex-wrap: wrap;
    }

    .transaction-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .amount-info {
      align-items: flex-start;
    }
  }
</style>