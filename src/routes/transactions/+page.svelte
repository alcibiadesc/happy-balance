<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Components
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';
  import AddTransactionModal from '$lib/components/organisms/AddTransactionModal.svelte';
  import SmartCategorizationModal from '$lib/components/organisms/SmartCategorizationModal.svelte';
  import CategorySelectionModal from '$lib/components/organisms/CategorySelectionModal.svelte';
  import PeriodStats from '$lib/components/molecules/PeriodStats.svelte';
  import DateSelector from '$lib/components/molecules/DateSelector.svelte';
  import SearchBar from '$lib/components/molecules/SearchBar.svelte';
  import TransactionRow from '$lib/components/organisms/TransactionRow.svelte';

  // Services and utilities
  import { createTransactionsPageStore } from '$lib/modules/transactions/infrastructure/stores/transactionsPageStore.svelte';
  import { calculatePeriodStats } from '$lib/modules/transactions/domain/services/PeriodStatsCalculator';
  import { createDateNavigationService } from '$lib/modules/transactions/domain/services/DateNavigationService';
  import { filterTransactions } from '$lib/modules/transactions/application/services/FilterService';
  import { groupTransactionsByDate, formatDate } from '$lib/modules/transactions/application/services/GroupingService';
  import { findMatchingTransactions, getCategoryById, formatAmount } from '$lib/modules/transactions/application/services/CategoryService';
  import { createObservationsHandler } from '$lib/modules/transactions/application/services/ObservationsService';
  import { TransactionOperationsService } from '$lib/modules/transactions/application/services/TransactionOperationsService';

  // Icons
  import {
    ChevronDown, ChevronUp, ChevronRight, Filter, Download, Plus,
    TrendingUp, TrendingDown, Check, X, Trash2,
    Tag, MoreVertical, Minimize2, Maximize2, EyeOff
  } from 'lucide-svelte';

  // Stores
  import {
    apiTransactions,
    apiCategories,
    apiSelectedTransactions
  } from '$lib/stores/api-transactions';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';
  import { exportTransactionsToCSV, downloadCSV, generateFilename } from '$lib/utils/csv-export';

  // Initialize page store
  const pageStore = createTransactionsPageStore();
  const dateNavigationService = createDateNavigationService();
  const transactionOps = new TransactionOperationsService(
    apiTransactions,
    (id) => getCategoryById($apiCategories, id)
  );
  const observationsHandler = createObservationsHandler(
    (id, updates) => apiTransactions.update(id, updates)
  );

  // Reactive computations
  let filteredTransactions = $derived(() => {
    return filterTransactions(
      $apiTransactions,
      pageStore.filterState,
      $apiCategories
    );
  });

  let groupedTransactions = $derived(() => {
    return groupTransactionsByDate(filteredTransactions());
  });

  let periodStats = $derived(() => {
    return calculatePeriodStats(filteredTransactions(), $apiCategories);
  });

  // Period navigation
  function previousPeriod() {
    pageStore.setPeriod(
      dateNavigationService.previousPeriod(pageStore.filterState.selectedPeriod)
    );
  }

  function nextPeriod() {
    pageStore.setPeriod(
      dateNavigationService.nextPeriod(pageStore.filterState.selectedPeriod)
    );
  }

  // Transaction operations
  async function deleteSelected() {
    const ids = Array.from($apiSelectedTransactions);
    for (const id of ids) {
      await apiTransactions.delete(id);
    }
    pageStore.clearSelection();
    apiSelectedTransactions.set(new Set());
  }

  async function confirmDeleteSelected() {
    await deleteSelected();
    pageStore.closeDeleteSelectedModal();
  }

  async function hideSelected() {
    const ids = Array.from($apiSelectedTransactions);
    await apiTransactions.bulkUpdate(ids, { hidden: true });
    pageStore.clearSelection();
    apiSelectedTransactions.set(new Set());
  }

  async function toggleHideTransaction(transaction: Transaction) {
    await transactionOps.toggleHide(transaction);
  }

  async function deleteTransaction(id: string) {
    pageStore.openDeleteSingleModal(id);
  }

  async function confirmDeleteSingle() {
    const transactionId = pageStore.modalState.transactionToDelete;
    if (!transactionId) return;
    await apiTransactions.delete(transactionId);
    pageStore.closeDeleteSingleModal();
  }

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tags' | 'hash'>) {
    try {
      await transactionOps.add(transaction);
      pageStore.closeAddModal();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  }

  // Category operations
  async function handleCategorySelection(categoryId: string | null) {
    const transaction = pageStore.modalState.categoryModalTransaction;
    if (!transaction) return;

    try {
      if (!categoryId || categoryId === '') {
        await transactionOps.categorize(transaction, null, false);
        pageStore.closeCategoryModal();
        return;
      }

      const matchingTransactions = findMatchingTransactions(transaction, $apiTransactions);
      if (matchingTransactions.length > 0) {
        const category = getCategoryById($apiCategories, categoryId);
        if (category) {
          pageStore.openSmartCategorization(transaction, category, matchingTransactions);
        }
      } else {
        await transactionOps.categorize(transaction, categoryId, false);
      }

      pageStore.closeCategoryModal();
    } catch (error) {
      console.error('Failed to categorize transaction:', error);
      pageStore.closeCategoryModal();
    }
  }

  async function handleSmartCategorization(applyToAll: boolean) {
    const transaction = pageStore.modalState.smartCategorizationTransaction;
    const category = pageStore.modalState.smartCategorizationCategory;

    if (!transaction || !category) return;

    await transactionOps.categorize(transaction, category.id, applyToAll);
    pageStore.closeSmartCategorization();
  }

  function handleSmartCategorizationCancel() {
    pageStore.closeSmartCategorization();
  }

  // Observations operations
  async function startEditingObservations(transaction: Transaction) {
    pageStore.startEditingObservations(transaction);
  }

  async function saveObservations(transaction: Transaction) {
    const text = pageStore.observationsState.editingText;
    return await observationsHandler.saveObservations(transaction, text);
  }

  function saveObservationsDebounced(transaction: Transaction) {
    const text = pageStore.observationsState.editingText;
    observationsHandler.saveObservationsDebounced(
      transaction,
      text,
      () => pageStore.cancelEditingObservations()
    );
  }

  function cancelEditingObservations() {
    pageStore.cancelEditingObservations();
  }

  // Selection operations
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
    pageStore.toggleSelectionMode();
  }

  // Export functionality
  function downloadTransactionsCSV() {
    let dateRange: { start: string; end: string } | undefined;

    if (!pageStore.filterState.showAllTransactions) {
      if (pageStore.filterState.dateRangeMode === 'month' && pageStore.filterState.selectedPeriod) {
        const date = new Date(pageStore.filterState.selectedPeriod + '-01');
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        dateRange = {
          start: date.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0]
        };
      } else if (pageStore.filterState.dateRangeMode === 'custom' &&
                 pageStore.filterState.customStartDate &&
                 pageStore.filterState.customEndDate) {
        dateRange = {
          start: pageStore.filterState.customStartDate,
          end: pageStore.filterState.customEndDate
        };
      }
    }

    const transactionsToExport = filteredTransactions();
    const csv = exportTransactionsToCSV(transactionsToExport, $apiCategories);
    const filename = generateFilename(dateRange);
    downloadCSV(csv, filename);
  }

  // Click outside handler
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (pageStore.isShowingCategoryFilterDropdown && !target.closest('.category-selector')) {
      pageStore.closeCategoryFilterDropdown();
    }

    if (pageStore.isShowingDatePicker && !target.closest('.date-selector-section')) {
      pageStore.closeDatePicker();
    }
  }

  // Lifecycle
  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('click', handleClickOutside);
      observationsHandler.cleanup();
    }
  });
</script>

<div class="transactions-page">
  <header class="transactions-header">
    <div class="header-content">
      <PeriodStats stats={periodStats()} />
    </div>
  </header>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-content">
      <!-- Date selector section -->
      <DateSelector
        bind:selectedPeriod={pageStore.filterState.selectedPeriod}
        bind:showAllTransactions={pageStore.filterState.showAllTransactions}
        bind:showHiddenTransactions={pageStore.filterState.showHiddenTransactions}
        bind:dateRangeMode={pageStore.filterState.dateRangeMode}
        bind:customStartDate={pageStore.filterState.customStartDate}
        bind:customEndDate={pageStore.filterState.customEndDate}
        bind:showDatePicker={pageStore.showDatePicker}
        onPreviousPeriod={previousPeriod}
        onNextPeriod={nextPeriod}
        onToggleAllTransactions={() => pageStore.toggleAllTransactions()}
        onToggleHiddenTransactions={() => pageStore.toggleHiddenTransactions()}
        onToggleDateRangeMode={() => pageStore.toggleDateRangeMode()}
        onToggleDatePicker={() => pageStore.toggleDatePicker()}
        onUpdatePeriod={(period) => pageStore.setPeriod(period)}
        onUpdateCustomStartDate={(date) => pageStore.setCustomStartDate(date)}
        onUpdateCustomEndDate={(date) => pageStore.setCustomEndDate(date)}
      />

      <!-- Search bar -->
      <SearchBar
        value={pageStore.filterState.searchQuery}
        onInput={(value) => pageStore.setSearchQuery(value)}
        onClear={() => pageStore.setSearchQuery('')}
      />

      <!-- Action buttons -->
      <div class="toolbar-actions">
        {#if pageStore.selectionState.isSelectionMode}
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
          {#if groupedTransactions().length > 1}
            <button
              class="toolbar-btn icon-only"
              onclick={pageStore.groupingState.allExpanded
                ? () => pageStore.collapseAll(groupedTransactions().map(g => g.date))
                : () => pageStore.expandAll()}
              title={pageStore.groupingState.allExpanded ? 'Colapsar todo' : 'Expandir todo'}
              aria-label={pageStore.groupingState.allExpanded ? 'Colapsar grupos' : 'Expandir grupos'}
            >
              {#if pageStore.groupingState.allExpanded}
                <Minimize2 size={14} />
              {:else}
                <Maximize2 size={14} />
              {/if}
            </button>
            <div class="toolbar-separator"></div>
          {/if}

          <button
            class="toolbar-btn"
            onclick={() => pageStore.toggleSelectionMode()}
            aria-label={$t('accessibility.select_transactions')}
          >
            {$t('transactions.select')}
          </button>
          <button
            class="toolbar-btn"
            class:active={pageStore.modalState.showFilters}
            class:has-filters={pageStore.filterState.selectedCategories.length > 0 ||
                              pageStore.filterState.transactionTypeFilter !== 'all'}
            onclick={() => pageStore.toggleFilters()}
            aria-label={$t('accessibility.show_filters')}
          >
            <Filter size={14} />
            {#if pageStore.filterState.selectedCategories.length > 0 ||
                 pageStore.filterState.transactionTypeFilter !== 'all'}
              <span class="filter-badge"></span>
            {/if}
          </button>
          <button
            class="toolbar-btn"
            onclick={downloadTransactionsCSV}
            aria-label={$t('accessibility.export_transactions')}
          >
            <Download size={14} />
          </button>
        {/if}
      </div>
    </div>

    {#if pageStore.modalState.showFilters}
      <div class="filters-bento" class:visible={pageStore.modalState.showFilters}>
        <div class="filter-grid">
          <div class="bento-item quick-filters">
            <button
              class="filter-pill income"
              class:active={pageStore.filterState.transactionTypeFilter === 'income' &&
                           pageStore.filterState.selectedCategories.length === 0}
              class:disabled={pageStore.filterState.selectedCategories.length > 0}
              onclick={() => {
                if (pageStore.filterState.selectedCategories.length === 0) {
                  pageStore.setTransactionTypeFilter(
                    pageStore.filterState.transactionTypeFilter === 'income' ? 'all' : 'income'
                  );
                }
              }}
            >
              <TrendingUp size={14} />
              <span>{$t('transactions.income')}</span>
              {#if pageStore.filterState.transactionTypeFilter === 'income' &&
                   pageStore.filterState.selectedCategories.length === 0}
                <Check size={12} />
              {/if}
            </button>

            <button
              class="filter-pill expenses"
              class:active={pageStore.filterState.transactionTypeFilter === 'expenses' &&
                           pageStore.filterState.selectedCategories.length === 0}
              class:disabled={pageStore.filterState.selectedCategories.length > 0}
              onclick={() => {
                if (pageStore.filterState.selectedCategories.length === 0) {
                  pageStore.setTransactionTypeFilter(
                    pageStore.filterState.transactionTypeFilter === 'expenses' ? 'all' : 'expenses'
                  );
                }
              }}
            >
              <TrendingDown size={14} />
              <span>{$t('transactions.expenses')}</span>
              {#if pageStore.filterState.transactionTypeFilter === 'expenses' &&
                   pageStore.filterState.selectedCategories.length === 0}
                <Check size={12} />
              {/if}
            </button>

            <button
              class="filter-pill uncategorized"
              class:active={pageStore.filterState.transactionTypeFilter === 'uncategorized' &&
                           pageStore.filterState.selectedCategories.length === 0}
              class:disabled={pageStore.filterState.selectedCategories.length > 0}
              onclick={() => {
                if (pageStore.filterState.selectedCategories.length === 0) {
                  pageStore.setTransactionTypeFilter(
                    pageStore.filterState.transactionTypeFilter === 'uncategorized' ? 'all' : 'uncategorized'
                  );
                }
              }}
            >
              <Tag size={14} />
              <span>{$t('transactions.uncategorized')}</span>
              {#if pageStore.filterState.transactionTypeFilter === 'uncategorized' &&
                   pageStore.filterState.selectedCategories.length === 0}
                <Check size={12} />
              {/if}
            </button>
          </div>

          <div class="bento-item category-selector">
            <button
              class="category-dropdown-trigger"
              onclick={() => pageStore.toggleCategoryFilterDropdown()}
              aria-expanded={pageStore.isShowingCategoryFilterDropdown}
            >
              <span>{$t('transactions.filter_by_category')}</span>
              <ChevronDown size={14} />
            </button>

            {#if pageStore.isShowingCategoryFilterDropdown}
              <div class="category-dropdown-mini">
                <div class="category-grid-compact">
                  {#each $apiCategories as category}
                    <button
                      class="category-chip"
                      class:selected={pageStore.filterState.selectedCategories.includes(category.id)}
                      onclick={() => pageStore.toggleCategory(category.id)}
                    >
                      <span class="category-icon">{category.icon}</span>
                      <span class="category-name">{category.name}</span>
                      {#if pageStore.filterState.selectedCategories.includes(category.id)}
                        <div class="chip-check">
                          <Check size={10} />
                        </div>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            {#if pageStore.filterState.selectedCategories.length > 0 ||
                 pageStore.filterState.transactionTypeFilter !== 'all'}
              <div class="bento-item clear-section">
                <button
                  class="clear-filters-btn"
                  onclick={() => pageStore.clearFilters()}
                >
                  <X size={14} />
                  <span>{$t('transactions.clear_filters')}</span>
                </button>
              </div>
            {/if}
          </div>

          <div class="active-tags-mini">
            {#each pageStore.filterState.selectedCategories as categoryId}
              {@const category = getCategoryById($apiCategories, categoryId)}
              {#if category}
                <span class="active-tag">
                  {category.icon} {category.name}
                  <button
                    class="remove-tag"
                    onclick={() => pageStore.toggleCategory(categoryId)}
                    aria-label="Remove filter"
                  >
                    <X size={10} />
                  </button>
                </span>
              {/if}
            {/each}

            {#if pageStore.filterState.transactionTypeFilter !== 'all' &&
                 pageStore.filterState.selectedCategories.length === 0}
              <span class="active-tag type-filter">
                {#if pageStore.filterState.transactionTypeFilter === 'income'}
                  <TrendingUp size={12} /> {$t('transactions.income')}
                {:else if pageStore.filterState.transactionTypeFilter === 'expenses'}
                  <TrendingDown size={12} /> {$t('transactions.expenses')}
                {:else if pageStore.filterState.transactionTypeFilter === 'uncategorized'}
                  <Tag size={12} /> {$t('transactions.uncategorized')}
                {/if}
                <button
                  class="remove-tag"
                  onclick={() => pageStore.setTransactionTypeFilter('all')}
                  aria-label="Remove filter"
                >
                  <X size={10} />
                </button>
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Transactions list -->
  <main class="transactions-list">
    {#each groupedTransactions() as group}
      <div class="transaction-group"
           class:collapsed={pageStore.groupingState.collapsedGroups.has(group.date)}>
        <button
          class="group-header"
          onclick={() => pageStore.toggleGroup(group.date)}
          aria-expanded={!pageStore.groupingState.collapsedGroups.has(group.date)}
        >
          <div class="group-header-left">
            {#if pageStore.groupingState.collapsedGroups.has(group.date)}
              <ChevronRight size={16} class="group-chevron" />
            {:else}
              <ChevronDown size={16} class="group-chevron" />
            {/if}
            <span>{formatDate(group.date)}</span>
            {#if pageStore.groupingState.collapsedGroups.has(group.date)}
              <span class="group-count">({group.items.length} transacciones)</span>
            {/if}
          </div>
          <span class="group-total">
            {formatAmount(group.items.reduce((sum, t) => sum + t.amount, 0))}
          </span>
        </button>

        {#if !pageStore.groupingState.collapsedGroups.has(group.date)}
          {#each group.items as transaction}
            {@const category = getCategoryById($apiCategories, transaction.categoryId)}
            <TransactionRow
              {transaction}
              {category}
              isSelectionMode={pageStore.selectionState.isSelectionMode}
              isSelected={$apiSelectedTransactions.has(transaction.id)}
              isEditingObservations={pageStore.observationsState.editingTransactionId === transaction.id}
              editingObservationsText={pageStore.observationsState.editingText}
              onToggleSelection={() => toggleSelection(transaction.id)}
              onOpenCategoryModal={() => pageStore.openCategoryModal(transaction)}
              onStartEditingObservations={() => startEditingObservations(transaction)}
              onSaveObservations={() => saveObservations(transaction)}
              onCancelEditingObservations={cancelEditingObservations}
              onUpdateObservationsText={(text) => {
                pageStore.updateObservationsText(text);
                saveObservationsDebounced(transaction);
              }}
              onToggleHide={() => toggleHideTransaction(transaction)}
              onDelete={() => deleteTransaction(transaction.id)}
              {formatAmount}
            />
          {/each}
        {/if}
      </div>
    {/each}
  </main>

  <!-- FAB -->
  <button class="fab" onclick={() => pageStore.openAddModal()}>
    <Plus size={16} />
  </button>
</div>

<!-- Modals -->
<CategorySelectionModal
  isOpen={pageStore.modalState.showCategoryModal}
  transaction={pageStore.modalState.categoryModalTransaction}
  categories={$apiCategories}
  onSelect={handleCategorySelection}
  onCancel={() => pageStore.closeCategoryModal()}
/>

<SmartCategorizationModal
  isOpen={pageStore.modalState.showSmartCategorization}
  transaction={pageStore.modalState.smartCategorizationTransaction}
  selectedCategory={pageStore.modalState.smartCategorizationCategory}
  matchingTransactions={pageStore.modalState.smartMatchingTransactions}
  suggestions={pageStore.modalState.smartSuggestions}
  onConfirm={handleSmartCategorization}
  onCancel={handleSmartCategorizationCancel}
/>

<ConfirmModal
  bind:isOpen={pageStore.modalState.showDeleteSelectedModal}
  title={$t('transactions.delete_selected_title')}
  message={$t('transactions.delete_selected_message', { count: $apiSelectedTransactions.size })}
  confirmText={$t('transactions.delete_all')}
  cancelText={$t('common.cancel')}
  type="danger"
  onConfirm={confirmDeleteSelected}
  onCancel={() => pageStore.closeDeleteSelectedModal()}
/>

<ConfirmModal
  bind:isOpen={pageStore.modalState.showDeleteSingleModal}
  title={$t('transactions.delete_single_title')}
  message={$t('transactions.delete_single_message')}
  confirmText={$t('common.delete')}
  cancelText={$t('common.cancel')}
  type="danger"
  onConfirm={confirmDeleteSingle}
  onCancel={() => pageStore.closeDeleteSingleModal()}
/>

<AddTransactionModal
  bind:isOpen={pageStore.modalState.showAddModal}
  categories={$apiCategories}
  onSubmit={addTransaction}
  onCancel={() => pageStore.closeAddModal()}
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

  /* Disabled state for date controls when showing all */
  .date-selector-section.show-all .date-display,
  .date-selector-section.show-all .date-nav-btn,
  .date-selector-section.show-all .date-mode-btn,
  .date-selector-section.show-all .custom-date-range {
    opacity: 0.3;
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
    padding: 0 2rem;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .toolbar-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .toolbar-btn {
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
  }

  .toolbar-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
    transform: translateY(-1px);
  }

  .toolbar-btn.active {
    background: var(--cornflower);
    color: white;
    border-color: var(--cornflower);
  }

  .toolbar-btn.has-filters {
    position: relative;
  }

  .filter-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    background: var(--froly);
    border-radius: 50%;
  }

  .toolbar-btn.icon-only {
    padding: 0.5rem;
  }

  .toolbar-btn.danger:hover {
    background: var(--froly);
    color: white;
    border-color: var(--froly);
  }

  .toolbar-separator {
    width: 1px;
    height: 24px;
    background: var(--gray-300);
  }

  /* Filters bento */
  .filters-bento {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    margin-top: 1rem;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  .filters-bento.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
  }

  .bento-item {
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .quick-filters {
    display: flex;
    gap: 0.5rem;
  }

  .filter-pill {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    background: white;
    border: 1.5px solid var(--gray-300);
    border-radius: 2rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .filter-pill:hover:not(.disabled) {
    border-color: var(--gray-400);
    transform: translateY(-1px);
  }

  .filter-pill.active {
    background: var(--cornflower);
    color: white;
    border-color: var(--cornflower);
  }

  .filter-pill.income.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
  }

  .filter-pill.expenses.active {
    background: var(--froly);
    border-color: var(--froly);
  }

  .filter-pill.uncategorized.active {
    background: var(--text-muted);
    border-color: var(--text-muted);
  }

  .filter-pill.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .category-selector {
    position: relative;
  }

  .category-dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: white;
    border: 1.5px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-dropdown-trigger:hover {
    border-color: var(--gray-400);
    background: var(--gray-50);
  }

  .category-dropdown-mini {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    z-index: 50;
    max-height: 300px;
    overflow-y: auto;
  }

  .category-grid-compact {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    background: white;
    border: 1.5px solid var(--gray-300);
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .category-chip:hover {
    border-color: var(--cornflower);
    background: var(--cornflower-alpha-5);
  }

  .category-chip.selected {
    background: var(--cornflower);
    color: white;
    border-color: var(--cornflower);
  }

  .category-icon {
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .category-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    color: var(--cornflower);
    flex-shrink: 0;
    margin-left: auto;
  }

  .clear-section {
    padding: 0.5rem;
    margin-left: auto;
  }

  .clear-filters-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    background: var(--gray-100);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clear-filters-btn:hover {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  .active-tags-mini {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .active-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--cornflower-alpha-10);
    border: 1px solid var(--cornflower-alpha-30);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--cornflower);
  }

  .active-tag.type-filter {
    background: var(--gray-100);
    border-color: var(--gray-300);
    color: var(--text-secondary);
  }

  .remove-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    background: var(--cornflower-alpha-20);
    border: none;
    border-radius: 50%;
    color: var(--cornflower);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 0.125rem;
  }

  .remove-tag:hover {
    background: var(--cornflower);
    color: white;
  }

  .type-filter .remove-tag {
    background: var(--gray-300);
    color: var(--text-secondary);
  }

  .type-filter .remove-tag:hover {
    background: var(--gray-400);
    color: white;
  }

  /* Transactions list */
  .transactions-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .transaction-group {
    background: white;
    border-radius: 1rem;
    border: 1px solid var(--gray-200);
    padding: 0.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .transaction-group:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    margin: -0.5rem -0.5rem 1rem -0.5rem;
    background: var(--gray-50);
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 600;
  }

  .group-header:hover {
    background: var(--gray-100);
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .group-chevron {
    color: var(--text-muted);
    transition: transform 0.2s ease;
  }

  .group-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 400;
  }

  .group-total {
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }

  .transaction-group.collapsed {
    padding-bottom: 0.5rem;
  }

  .transaction-group.collapsed .group-header {
    margin-bottom: 0;
  }

  /* FAB */
  .fab {
    position: fixed;
    bottom: var(--space-xl);
    right: var(--space-xl);
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    border: 1px solid var(--gray-200);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    transition: all 0.2s ease;
    font-weight: 300;
    z-index: 60;
  }

  .fab:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .toolbar-content {
      flex-wrap: wrap;
      padding: 0 1rem;
      gap: 0.5rem;
    }

    .date-selector-section {
      flex: 1;
      min-width: 100%;
    }

    .search-bar {
      flex: 1;
      min-width: 100%;
    }

    .toolbar-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .transactions-list {
      padding: 1rem;
    }

    .transaction-group {
      margin-bottom: 1rem;
    }

    .filter-grid {
      grid-template-columns: 1fr;
    }

    .quick-filters {
      flex-wrap: wrap;
    }

    .category-grid-compact {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .fab {
      width: 3.5rem;
      height: 3.5rem;
      bottom: 1rem;
      right: 1rem;
    }
  }
</style>