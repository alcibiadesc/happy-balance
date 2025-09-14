<script lang="ts">
  import { onMount } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { 
    ChevronDown, Search, Filter, Download, Plus, Calendar, 
    TrendingUp, TrendingDown, Check, X, Eye, EyeOff, Trash2,
    Tag, MoreVertical, ChevronLeft, ChevronRight, Layers
  } from 'lucide-svelte';
  import {
    apiTransactions,
    apiCategories,
    apiSelectedTransactions,
    apiTransactionStats
  } from '$lib/stores/api-transactions';
  import type { Transaction, Category } from '$lib/types/transaction';
  
  // State
  let searchQuery = $state('');
  let showFilters = $state(false);
  let selectedPeriod = $state(''); // Empty means show all transactions
  let selectedCategories = $state<string[]>([]);
  let selectedTypes = $state<string[]>([]);
  let isSelectionMode = $state(false);
  let showCategoryModal = $state(false);
  let editingTransaction = $state<Transaction | null>(null);
  let showAddModal = $state(false);
  let showCategoryDropdown = $state<string | null>(null); // Transaction ID showing category dropdown

  // Modal states
  let showDeleteSelectedModal = $state(false);
  let showDeleteSingleModal = $state(false);
  let transactionToDelete = $state<string | null>(null);
  
  // Period navigation
  function previousPeriod() {
    const [year, month] = selectedPeriod.split('-');
    const date = new Date(Number(year), Number(month) - 2);
    selectedPeriod = date.toISOString().slice(0, 7);
  }
  
  function nextPeriod() {
    const [year, month] = selectedPeriod.split('-');
    const date = new Date(Number(year), Number(month));
    selectedPeriod = date.toISOString().slice(0, 7);
  }
  
  // Computed
  let filteredTransactions = $derived(() => {
    let filtered = $apiTransactions;
    console.log('Raw API transactions:', filtered.length);
    
    // Period filter
    if (selectedPeriod) {
      filtered = filtered.filter(t =>
        t.date.startsWith(selectedPeriod)
      );
    }
    
    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t =>
        t.categoryId && selectedCategories.includes(t.categoryId)
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(t => {
        const category = getCategoryById(t.categoryId);
        return category && selectedTypes.includes(category.type);
      });
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.merchant.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }
    
    // Hide hidden transactions (only if hidden property exists)
    // filtered = filtered.filter(t => !t.hidden); // Disabled for API transactions
    
    return filtered;
  });
  
  let groupedTransactions = $derived(() => {
    const filtered = filteredTransactions();
    console.log('Filtered transactions:', filtered.length);

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
        items: items.sort((a, b) => b.createdAt?.localeCompare(a.createdAt || '') || 0)
      }));

    console.log('Grouped transactions:', result.length);
    return result;
  });
  
  let periodStats = $derived(() => {
    const filtered = filteredTransactions();
    const income = filtered
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return { 
      income: isNaN(income) ? 0 : income,
      expenses: isNaN(expenses) ? 0 : expenses,
      balance: isNaN(income - expenses) ? 0 : income - expenses
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
    await apiTransactions.update(transaction.id, { hidden: newHiddenState });
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
  
  async function categorizeTransaction(transaction: Transaction, categoryId: string, applyToAll = false) {
    // Update the transaction category
    await apiTransactions.update(transaction.id, { categoryId });

    // Learn from this correction for future imports
    await apiCategories.learnFromCorrection(transaction.id, categoryId, applyToAll);
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
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
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
  
  onMount(async () => {
    await Promise.all([
      apiTransactions.load(),
      apiCategories.load()
    ]);
  });
</script>

<div class="transactions-page">
  <!-- Header -->
  <header class="transactions-header">
    <div class="header-content">
      <!-- Period Selector -->
      <div class="period-controls">
        <button class="period-btn" onclick={previousPeriod}>
          <ChevronLeft size={16} />
        </button>
        <div class="period-display">
          <Calendar size={16} />
          <span>{new Date(selectedPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
        <button class="period-btn" onclick={nextPeriod}>
          <ChevronRight size={16} />
        </button>
      </div>
      
      <!-- Stats -->
      <div class="period-stats">
        <div class="stat-item">
          <TrendingUp size={14} />
          <span class="stat-value income">{formatAmount(periodStats().income)}</span>
        </div>
        <div class="stat-item">
          <TrendingDown size={14} />
          <span class="stat-value expense">{formatAmount(periodStats().expenses)}</span>
        </div>
        <div class="stat-item balance">
          <span class="stat-label">Balance</span>
          <span class="stat-value" class:positive={periodStats().balance >= 0} class:negative={periodStats().balance < 0}>
            {formatAmount(periodStats().balance)}
          </span>
        </div>
      </div>
    </div>
  </header>
  
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-content">
      <div class="search-bar">
        <Search size={16} />
        <input 
          type="text" 
          placeholder="Search transactions..."
          bind:value={searchQuery}
        />
      </div>
      
      <div class="toolbar-actions">
        {#if isSelectionMode}
          <button class="toolbar-btn" onclick={selectAll}>
            Select All
          </button>
          <button class="toolbar-btn danger" onclick={deleteSelected}>
            <Trash2 size={16} />
          </button>
          <button class="toolbar-btn" onclick={hideSelected}>
            <EyeOff size={16} />
          </button>
          <button class="toolbar-btn" onclick={clearSelection}>
            Cancel
          </button>
        {:else}
          <button class="toolbar-btn" onclick={() => isSelectionMode = true}>
            Select
          </button>
          <button class="toolbar-btn" onclick={() => showFilters = !showFilters}>
            <Filter size={16} />
          </button>
          <button class="toolbar-btn">
            <Download size={16} />
          </button>
        {/if}
      </div>
    </div>
    
    {#if showFilters}
      <div class="filters">
        <!-- Type filters -->
        <div class="filter-group">
          <span class="filter-label">Type:</span>
          {#each ['essential', 'discretionary', 'investment', 'income'] as type}
            <button
              class="type-chip"
              class:active={selectedTypes.includes(type)}
              data-type={type}
              onclick={() => {
                if (selectedTypes.includes(type)) {
                  selectedTypes = selectedTypes.filter(t => t !== type);
                } else {
                  selectedTypes = [...selectedTypes, type];
                }
              }}
            >
              {type === 'essential' ? 'Essential' :
               type === 'discretionary' ? 'Discretionary' :
               type === 'investment' ? 'Investment' : 'Income'}
            </button>
          {/each}
        </div>

        <!-- Category filters -->
        <div class="filter-group">
          <span class="filter-label">Category:</span>
          {#each $apiCategories as category}
            <button
              class="category-chip"
              class:active={selectedCategories.includes(category.id)}
              style="--chip-color: {category.color}"
              onclick={() => {
                if (selectedCategories.includes(category.id)) {
                  selectedCategories = selectedCategories.filter(c => c !== category.id);
                } else {
                  selectedCategories = [...selectedCategories, category.id];
                }
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          {/each}
        </div>

        {#if selectedCategories.length > 0 || selectedTypes.length > 0}
          <button
            class="clear-filters-btn"
            onclick={() => {
              selectedCategories = [];
              selectedTypes = [];
            }}
          >
            <X size={14} />
            Clear filters
          </button>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Transaction List -->
  <main class="transactions-list">
    <!-- DEBUG: Show raw transaction count -->
    <div>Total transactions: {$apiTransactions.length}</div>
    <div>Filtered transactions: {filteredTransactions().length}</div>
    <div>Grouped transactions: {groupedTransactions().length}</div>

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
          >
            {#if isSelectionMode}
              <input 
                type="checkbox"
                checked={$apiSelectedTransactions.has(transaction.id)}
                onchange={() => toggleSelection(transaction.id)}
              />
            {/if}
            
            <div
              class="transaction-category"
              style="background-color: {category?.color || '#e0e0e0'}20"
            >
              <span>{category?.icon || '📄'}</span>
            </div>

            <div class="transaction-details">
              <div class="transaction-main">
                <div>
                  <div class="transaction-description">{transaction.description}</div>
                  <div class="transaction-meta">
                    <span>{transaction.merchant}</span>
                    <span>•</span>
                    <span>{transaction.time}</span>
                    {#if category}
                      <span>•</span>
                      <span class="category-type-badge" data-type={category.type}>
                        {category.type === 'essential' ? 'Essential' :
                         category.type === 'discretionary' ? 'Discretionary' :
                         category.type === 'investment' ? 'Investment' : 'Income'}
                      </span>
                    {/if}
                  </div>
                </div>
                <div class="transaction-amount" class:income={transaction.amount > 0}>
                  {formatAmount(transaction.amount)}
                </div>
              </div>
              
              <div class="category-selector">
                {#if !category}
                  <button
                    class="category-btn"
                    onclick={() => showCategoryDropdown = showCategoryDropdown === transaction.id ? null : transaction.id}
                  >
                    <Tag size={14} />
                    Add category
                  </button>
                {:else}
                  <button
                    class="category-btn has-category"
                    onclick={() => showCategoryDropdown = showCategoryDropdown === transaction.id ? null : transaction.id}
                  >
                    <span class="category-icon">{category.icon}</span>
                    <span class="category-name">{category.name}</span>
                  </button>
                {/if}

                {#if showCategoryDropdown === transaction.id}
                  <div class="category-dropdown">
                    {#each $apiCategories as cat}
                      <button
                        class="category-option"
                        onclick={async () => {
                          showCategoryDropdown = null;
                          const shouldApplyToAll = confirm(`Apply "${cat.name}" to all transactions from "${transaction.merchant}"?`);
                          await categorizeTransaction(transaction, cat.id, shouldApplyToAll);
                        }}
                      >
                        <span class="category-icon">{cat.icon}</span>
                        <span class="category-name">{cat.name}</span>
                        <span class="category-type">{cat.type}</span>
                      </button>
                    {/each}
                    {#if category}
                      <button
                        class="category-option remove"
                        onclick={() => {
                          categorizeTransaction(transaction, '', false);
                          showCategoryDropdown = null;
                        }}
                      >
                        <X size={14} />
                        <span>Remove category</span>
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="transaction-actions">
              <button
                class="action-btn"
                title={transaction.hidden ? 'Show transaction' : 'Hide transaction'}
                onclick={() => toggleHideTransaction(transaction)}
              >
                {#if transaction.hidden}
                  <Eye size={14} />
                {:else}
                  <EyeOff size={14} />
                {/if}
              </button>
              <button
                class="action-btn delete-btn"
                title="Delete transaction"
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
    <Plus size={20} />
  </button>
</div>

<!-- Delete Selected Modal -->
<ConfirmModal
  bind:isOpen={showDeleteSelectedModal}
  title="Delete Selected Transactions"
  message="Are you sure you want to delete {$apiSelectedTransactions.size} selected transactions? This action cannot be undone."
  confirmText="Delete All"
  cancelText="Cancel"
  type="danger"
  onConfirm={confirmDeleteSelected}
  onCancel={() => {}}
/>

<!-- Delete Single Transaction Modal -->
<ConfirmModal
  bind:isOpen={showDeleteSingleModal}
  title="Delete Transaction"
  message="Are you sure you want to delete this transaction? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  type="danger"
  onConfirm={confirmDeleteSingle}
  onCancel={() => transactionToDelete = null}
/>

<style>
  .transactions-page {
    min-height: 100vh;
    background: var(--surface);
  }
  
  .transactions-header {
    background: var(--surface-elevated);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    padding: var(--space-lg);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .period-controls {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  
  .period-btn {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(2, 60, 70, 0.1);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .period-btn:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }
  
  .period-display {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--surface);
    border-radius: var(--radius-lg);
    font-weight: 500;
  }
  
  .period-stats {
    display: flex;
    gap: var(--space-xl);
    align-items: center;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.875rem;
  }
  
  .stat-item.balance {
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .stat-value {
    font-weight: 600;
  }
  
  .stat-value.income {
    color: var(--acapulco);
  }
  
  .stat-value.expense {
    color: var(--froly);
  }
  
  .stat-value.positive {
    color: var(--acapulco);
    font-size: 1.25rem;
  }
  
  .stat-value.negative {
    color: var(--froly);
    font-size: 1.25rem;
  }
  
  .toolbar {
    background: var(--surface-elevated);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    position: sticky;
    top: 73px;
    z-index: 9;
  }
  
  .toolbar-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-md) var(--space-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .search-bar {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--surface);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-lg);
    flex: 1;
    max-width: 400px;
  }
  
  .search-bar input {
    border: none;
    background: none;
    outline: none;
    flex: 1;
    font-size: 0.875rem;
  }
  
  .toolbar-actions {
    display: flex;
    gap: var(--space-sm);
  }
  
  .toolbar-btn {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .toolbar-btn:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }
  
  .toolbar-btn.danger:hover {
    border-color: var(--froly);
    color: var(--froly);
  }
  
  .filters {
    padding: var(--space-md) var(--space-lg);
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    min-width: 60px;
  }

  .type-chip {
    padding: 0.375rem 0.75rem;
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-xl);
    background: var(--surface);
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 500;
    transition: all 0.2s;
    text-transform: capitalize;
  }

  .type-chip:hover {
    border-color: var(--acapulco);
  }

  .type-chip.active[data-type="essential"] {
    background: rgba(2, 60, 70, 0.1);
    border-color: #023c46;
    color: #023c46;
  }

  .type-chip.active[data-type="discretionary"] {
    background: rgba(254, 205, 44, 0.15);
    border-color: #d89e00;
    color: #d89e00;
  }

  .type-chip.active[data-type="investment"] {
    background: rgba(2, 60, 70, 0.08);
    border-color: #023c46;
    color: #023c46;
  }

  .type-chip.active[data-type="income"] {
    background: rgba(122, 186, 165, 0.15);
    border-color: #5ca98a;
    color: #5ca98a;
  }

  .clear-filters-btn {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--froly);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--froly);
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .clear-filters-btn:hover {
    background: rgba(245, 121, 108, 0.1);
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-md);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-xl);
    background: var(--surface);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .category-chip.active {
    background: var(--chip-color);
    border-color: var(--chip-color);
    color: white;
  }
  
  .transactions-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-lg);
  }
  
  .transaction-group {
    margin-bottom: var(--space-xl);
  }
  
  .group-header {
    display: flex;
    justify-content: space-between;
    padding: var(--space-md) 0;
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    margin-bottom: var(--space-md);
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .transaction-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    background: var(--surface-elevated);
    border: 1px solid rgba(2, 60, 70, 0.05);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-xs);
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .transaction-card:hover {
    border-color: var(--acapulco);
    transform: translateX(2px);
  }
  
  .transaction-card.selected {
    background: rgba(122, 186, 165, 0.1);
    border-color: var(--acapulco);
  }
  
  .transaction-category {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
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
    transition: all 0.2s;
  }
  
  .category-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  .category-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    max-height: 200px;
    overflow-y: auto;
    margin-top: 0.25rem;
  }

  .category-option {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    padding: var(--space-sm);
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .category-option:hover {
    background: var(--surface);
  }

  .category-icon {
    font-size: 1rem;
  }

  .category-name {
    font-size: 0.875rem;
    color: var(--text);
  }

  .category-type-badge {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
    letter-spacing: 0.025em;
  }

  .category-type-badge[data-type="essential"] {
    background: rgba(2, 60, 70, 0.1);
    color: #023c46;
  }

  .category-type-badge[data-type="discretionary"] {
    background: rgba(254, 205, 44, 0.15);
    color: #d89e00;
  }

  .category-type-badge[data-type="investment"] {
    background: rgba(2, 60, 70, 0.08);
    color: #023c46;
  }

  .category-type-badge[data-type="income"] {
    background: rgba(122, 186, 165, 0.15);
    color: #5ca98a;
  }

  .category-btn.has-category {
    background: var(--surface);
    border-color: var(--border);
    padding: 0.25rem 0.5rem;
    gap: 0.375rem;
  }

  .category-btn.has-category .category-icon {
    font-size: 0.875rem;
  }

  .category-btn.has-category .category-name {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .category-option .category-type {
    margin-left: auto;
    font-size: 0.625rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .category-option.remove {
    color: var(--froly);
    border-top: 1px solid var(--border);
  }

  .category-option.remove:hover {
    background: rgba(245, 121, 108, 0.1);
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
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: var(--surface);
    color: var(--text);
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }
  
  .fab {
    position: fixed;
    bottom: var(--space-xl);
    right: var(--space-xl);
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: var(--acapulco);
    color: var(--bridesmaid);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(122, 186, 165, 0.4);
    transition: all 0.3s;
  }
  
  .fab:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 30px rgba(122, 186, 165, 0.5);
  }
</style>
