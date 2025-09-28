<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import "$lib/modules/transactions/presentation/styles/transactions-page.css";

  // Components
  import ConfirmModal from "$lib/components/organisms/ConfirmModal.svelte";
  import AddTransactionModal from "$lib/components/organisms/AddTransactionModal.svelte";
  import SmartCategorizationModal from "$lib/components/organisms/SmartCategorizationModal.svelte";
  import CategorySelectionModal from "$lib/components/organisms/CategorySelectionModal.svelte";
  import PeriodStats from "$lib/components/molecules/PeriodStats.svelte";
  import DateSelector from "$lib/components/molecules/DateSelector.svelte";
  import SearchBar from "$lib/components/molecules/SearchBar.svelte";
  import TransactionRow from "$lib/components/organisms/TransactionRow.svelte";
  import FiltersPanel from "$lib/components/organisms/FiltersPanel.svelte";
  import TransactionGroup from "$lib/components/organisms/TransactionGroup.svelte";

  // Services and utilities
  import { createTransactionsPageStore } from "$lib/modules/transactions/infrastructure/stores/transactionsPageStore.svelte";
  import { calculatePeriodStats } from "$lib/modules/transactions/domain/services/PeriodStatsCalculator";
  import { createDateNavigationService } from "$lib/modules/transactions/domain/services/DateNavigationService";
  import { filterTransactions } from "$lib/modules/transactions/application/services/FilterService";
  import {
    groupTransactionsByDate,
    formatDate,
  } from "$lib/modules/transactions/application/services/GroupingService";
  import {
    findMatchingTransactions,
    getCategoryById,
    formatAmount,
  } from "$lib/modules/transactions/application/services/CategoryService";
  import { createObservationsHandler } from "$lib/modules/transactions/application/services/ObservationsService";
  import { TransactionOperationsService } from "$lib/modules/transactions/application/services/TransactionOperationsService";

  // Icons
  import {
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Filter,
    Download,
    Plus,
    TrendingUp,
    TrendingDown,
    Check,
    X,
    Trash2,
    Tag,
    MoreVertical,
    Minimize2,
    Maximize2,
    EyeOff,
  } from "lucide-svelte";

  // Stores
  import {
    apiTransactions,
    apiCategories,
    apiSelectedTransactions,
  } from "$lib/stores/api-transactions";
  import type { Transaction, Category } from "$lib/types/transaction";
  import { t } from "$lib/stores/i18n";
  import {
    exportTransactionsToCSV,
    downloadCSV,
    generateFilename,
  } from "$lib/utils/csv-export";

  // Initialize page store
  const pageStore = createTransactionsPageStore();
  const dateNavigationService = createDateNavigationService();
  const transactionOps = new TransactionOperationsService(
    apiTransactions,
    (id) => getCategoryById($apiCategories, id),
  );
  const observationsHandler = createObservationsHandler((id, updates) =>
    apiTransactions.update(id, updates),
  );

  // Reactive computations
  const filteredTransactions = $derived(
    filterTransactions($apiTransactions, pageStore.filterState, $apiCategories),
  );

  const groupedTransactions = $derived(
    groupTransactionsByDate(filteredTransactions),
  );

  const periodStats = $derived(
    calculatePeriodStats(filteredTransactions, $apiCategories),
  );

  // Period navigation
  function previousPeriod() {
    pageStore.setPeriod(
      dateNavigationService.previousPeriod(
        pageStore.filterState.selectedPeriod,
      ),
    );
  }

  function nextPeriod() {
    pageStore.setPeriod(
      dateNavigationService.nextPeriod(pageStore.filterState.selectedPeriod),
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

  async function addTransaction(
    transaction: Omit<
      Transaction,
      "id" | "createdAt" | "updatedAt" | "status" | "tags" | "hash"
    >,
  ) {
    try {
      await transactionOps.add(transaction);
      pageStore.closeAddModal();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  }

  // Category operations
  async function handleCategorySelection(categoryId: string | null) {
    const transaction = pageStore.modalState.categoryModalTransaction;
    if (!transaction) return;

    try {
      if (!categoryId || categoryId === "") {
        await transactionOps.categorize(transaction, null, false);
        pageStore.closeCategoryModal();
        return;
      }

      const matchingTransactions = findMatchingTransactions(
        transaction,
        $apiTransactions,
      );
      if (matchingTransactions.length > 0) {
        const category = getCategoryById($apiCategories, categoryId);
        if (category) {
          pageStore.openSmartCategorization(
            transaction,
            category,
            matchingTransactions,
          );
        }
      } else {
        await transactionOps.categorize(transaction, categoryId, false);
      }

      pageStore.closeCategoryModal();
    } catch (error) {
      console.error("Failed to categorize transaction:", error);
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
    observationsHandler.saveObservationsDebounced(transaction, text, () =>
      pageStore.cancelEditingObservations(),
    );
  }

  function cancelEditingObservations() {
    pageStore.cancelEditingObservations();
  }

  // Selection operations
  function toggleSelection(id: string) {
    apiSelectedTransactions.update((s) => {
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
    const allIds = filteredTransactions.map((t) => t.id);
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
      if (
        pageStore.filterState.dateRangeMode === "month" &&
        pageStore.filterState.selectedPeriod
      ) {
        const date = new Date(pageStore.filterState.selectedPeriod + "-01");
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        dateRange = {
          start: date.toISOString().split("T")[0],
          end: lastDay.toISOString().split("T")[0],
        };
      } else if (
        pageStore.filterState.dateRangeMode === "custom" &&
        pageStore.filterState.customStartDate &&
        pageStore.filterState.customEndDate
      ) {
        dateRange = {
          start: pageStore.filterState.customStartDate,
          end: pageStore.filterState.customEndDate,
        };
      }
    }

    const transactionsToExport = filteredTransactions;
    const csv = exportTransactionsToCSV(transactionsToExport, $apiCategories);
    const filename = generateFilename(dateRange);
    downloadCSV(csv, filename);
  }

  // Click outside handler
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (
      pageStore.isShowingCategoryFilterDropdown &&
      !target.closest(".category-selector")
    ) {
      pageStore.closeCategoryFilterDropdown();
    }

    if (
      pageStore.isShowingDatePicker &&
      !target.closest(".date-selector-section")
    ) {
      pageStore.closeDatePicker();
    }
  }

  // Lifecycle
  onMount(async () => {
    if (browser) {
      document.addEventListener("click", handleClickOutside);
      // Load transactions and categories
      await Promise.all([
        apiTransactions.load(),
        apiCategories.load()
      ]);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener("click", handleClickOutside);
      observationsHandler.cleanup();
    }
  });
</script>

<div class="transactions-page">
  <header class="transactions-header">
    <div class="header-content">
      <PeriodStats stats={periodStats} />
    </div>
  </header>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-content">
      <!-- Date selector section -->
      <DateSelector
        bind:selectedPeriod={pageStore.filterState.selectedPeriod}
        bind:showAllTransactions={pageStore.filterState.showAllTransactions}
        bind:showHiddenTransactions={
          pageStore.filterState.showHiddenTransactions
        }
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
        onClear={() => pageStore.setSearchQuery("")}
      />

      <!-- Action buttons -->
      <div class="toolbar-actions">
        {#if pageStore.selectionState.isSelectionMode}
          <button class="toolbar-btn" onclick={selectAll}>
            {$t("transactions.select_all")}
          </button>
          <button class="toolbar-btn danger" onclick={deleteSelected}>
            <Trash2 size={14} />
          </button>
          <button class="toolbar-btn" onclick={hideSelected}>
            <EyeOff size={14} />
          </button>
          <button class="toolbar-btn" onclick={clearSelection}>
            {$t("transactions.cancel")}
          </button>
        {:else}
          {#if groupedTransactions.length > 1}
            <button
              class="toolbar-btn icon-only"
              onclick={pageStore.groupingState.allExpanded
                ? () =>
                    pageStore.collapseAll(
                      groupedTransactions.map((g) => g.date),
                    )
                : () => pageStore.expandAll()}
              title={pageStore.groupingState.allExpanded
                ? "Colapsar todo"
                : "Expandir todo"}
              aria-label={pageStore.groupingState.allExpanded
                ? "Colapsar grupos"
                : "Expandir grupos"}
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
            aria-label={$t("accessibility.select_transactions")}
          >
            {$t("transactions.select")}
          </button>
          <button
            class="toolbar-btn"
            class:active={pageStore.modalState.showFilters}
            class:has-filters={pageStore.filterState.selectedCategories.length >
              0 || pageStore.filterState.transactionTypeFilter !== "all"}
            onclick={() => pageStore.toggleFilters()}
            aria-label={$t("accessibility.show_filters")}
          >
            <Filter size={14} />
            {#if pageStore.filterState.selectedCategories.length > 0 || pageStore.filterState.transactionTypeFilter !== "all"}
              <span class="filter-badge"></span>
            {/if}
          </button>
          <button
            class="toolbar-btn"
            onclick={downloadTransactionsCSV}
            aria-label={$t("accessibility.export_transactions")}
          >
            <Download size={14} />
          </button>
        {/if}
      </div>
    </div>

    <FiltersPanel
      visible={pageStore.modalState.showFilters}
      transactionTypeFilter={pageStore.filterState.transactionTypeFilter}
      selectedCategories={pageStore.filterState.selectedCategories}
      categories={$apiCategories}
      onTransactionTypeFilter={(type) =>
        pageStore.setTransactionTypeFilter(type)}
      onToggleCategory={(id) => pageStore.toggleCategory(id)}
      onClearFilters={() => pageStore.clearFilters()}
    />
  </div>

  <!-- Transactions list -->
  <main class="transactions-list">
    {#each groupedTransactions as group}
      <TransactionGroup
        date={formatDate(group.date)}
        transactions={group.items}
        categories={$apiCategories}
        isExpanded={!pageStore.groupingState.collapsedGroups.has(group.date)}
        isSelectionMode={pageStore.selectionState.isSelectionMode}
        selectedIds={$apiSelectedTransactions}
        editingObservationsId={pageStore.observationsState.editingTransactionId}
        observationsText={pageStore.observationsState.editingText}
        onToggleGroup={() => pageStore.toggleGroup(group.date)}
        onToggleSelection={(id) => toggleSelection(id)}
        onCategorize={(transaction) => pageStore.openCategoryModal(transaction)}
        onToggleHide={(transaction) => toggleHideTransaction(transaction)}
        onDelete={(id) => deleteTransaction(id)}
        onEditObservations={(transaction) =>
          startEditingObservations(transaction)}
        onUpdateObservationsText={(text) =>
          pageStore.updateObservationsText(text)}
        onSaveObservations={async () => {
          const transaction = group.items.find(
            (t) => t.id === pageStore.observationsState.editingTransactionId,
          );
          if (transaction) await saveObservations(transaction);
        }}
        onCancelObservations={cancelEditingObservations}
        {formatAmount}
      />
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
  title={$t("transactions.delete_selected_title")}
  message={$t("transactions.delete_selected_message", {
    count: $apiSelectedTransactions.size,
  })}
  confirmText={$t("transactions.delete_all")}
  cancelText={$t("common.cancel")}
  type="danger"
  onConfirm={confirmDeleteSelected}
  onCancel={() => pageStore.closeDeleteSelectedModal()}
/>

<ConfirmModal
  bind:isOpen={pageStore.modalState.showDeleteSingleModal}
  title={$t("transactions.delete_single_title")}
  message={$t("transactions.delete_single_message")}
  confirmText={$t("common.delete")}
  cancelText={$t("common.cancel")}
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
    background: var(--surface);
  }

  .transactions-header {
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border-color);
    padding: var(--space-2xl) var(--space-lg);
    position: relative;
    z-index: 25;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .transactions-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem 1.5rem;
  }
</style>
