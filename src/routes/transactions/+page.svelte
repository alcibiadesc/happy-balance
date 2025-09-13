<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    ChevronDown, Search, Filter, Download, Plus, Calendar, 
    TrendingUp, TrendingDown, Check, X, Eye, EyeOff, Trash2,
    Tag, MoreVertical, ChevronLeft, ChevronRight, Layers
  } from 'lucide-svelte';
  import { 
    transactions, 
    categories, 
    selectedTransactions,
    transactionStats 
  } from '$lib/stores/transactions';
  import type { Transaction, Category } from '$lib/types/transaction';
  
  // State
  let searchQuery = $state('');
  let showFilters = $state(false);
  let selectedPeriod = $state(new Date().toISOString().slice(0, 7));
  let selectedCategories = $state<string[]>([]);
  let isSelectionMode = $state(false);
  let showCategoryModal = $state(false);
  let editingTransaction = $state<Transaction | null>(null);
  let showAddModal = $state(false);
  
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
    let filtered = $transactions;
    
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
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.merchant.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }
    
    // Hide hidden transactions
    filtered = filtered.filter(t => !t.hidden);
    
    return filtered;
  });
  
  let groupedTransactions = $derived(() => {
    const groups = new Map<string, Transaction[]>();
    
    filteredTransactions().forEach(transaction => {
      const date = transaction.date;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(transaction);
    });
    
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => b.time.localeCompare(a.time))
      }));
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
    selectedTransactions.update(s => {
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
    selectedTransactions.set(new Set(allIds));
  }
  
  function clearSelection() {
    selectedTransactions.set(new Set());
    isSelectionMode = false;
  }
  
  async function deleteSelected() {
    if (!confirm('Delete selected transactions?')) return;
    
    const ids = Array.from($selectedTransactions);
    for (const id of ids) {
      await transactions.delete(id);
    }
    clearSelection();
  }
  
  async function hideSelected() {
    const ids = Array.from($selectedTransactions);
    await transactions.bulkUpdate(ids, { hidden: true });
    clearSelection();
  }
  
  async function categorizeTransaction(transaction: Transaction, categoryId: string, applyToAll = false) {
    if (applyToAll) {
      await transactions.applyCategoryToPattern(transaction, categoryId);
    } else {
      await transactions.update(transaction.id, { categoryId });
    }
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
    return $categories.find(c => c.id === id);
  }
  
  onMount(() => {
    transactions.load();
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
        {#each $categories as category}
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
            class:selected={$selectedTransactions.has(transaction.id)}
          >
            {#if isSelectionMode}
              <input 
                type="checkbox"
                checked={$selectedTransactions.has(transaction.id)}
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
                  </div>
                </div>
                <div class="transaction-amount" class:income={transaction.amount > 0}>
                  {formatAmount(transaction.amount)}
                </div>
              </div>
              
              {#if !category}
                <div class="category-selector">
                  <button class="category-btn">
                    <Tag size={14} />
                    Add category
                  </button>
                </div>
              {/if}
            </div>
            
            <button class="transaction-menu">
              <MoreVertical size={16} />
            </button>
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
    gap: var(--space-sm);
    flex-wrap: wrap;
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
  
  .transaction-menu {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .transaction-menu:hover {
    background: var(--surface);
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
