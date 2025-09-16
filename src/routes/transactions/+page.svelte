<script lang="ts">
  import { onMount } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
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
  
  // State
  let searchQuery = $state('');
  let showFilters = $state(false);
  let selectedPeriod = $state(new Date().toISOString().slice(0, 7)); // Current month by default
  let selectedCategories = $state<string[]>([]);
  let isSelectionMode = $state(false);
  let showCategoryModal = $state(false);
  let editingTransaction = $state<Transaction | null>(null);
  let showAddModal = $state(false);
  let showCategoryDropdown = $state<string | null>(null); // Transaction ID showing category dropdown
  let showAllTransactions = $state(false); // Toggle for showing all transactions
  let dateRangeMode = $state<'month' | 'custom'>('month');
  let customStartDate = $state('');
  let customEndDate = $state('');
  let showDatePicker = $state(false);

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

    // Hide hidden transactions unless explicitly showing them
    if (!showHiddenTransactions) {
      filtered = filtered.filter(t => !t.hidden);
    }

    return filtered;
  });
  
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
      if (applyToAll) {
        await apiTransactions.applyCategoryToPattern(transaction, categoryId);
      } else {
        await apiTransactions.update(transaction.id, { categoryId });
      }
      // Force a reactive update by ensuring the store subscription triggers
      console.log('✅ Transaction categorized successfully', { transactionId: transaction.id, categoryId });
    } catch (error) {
      console.error('❌ Failed to categorize transaction:', error);
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
  
  onMount(async () => {
    await apiTransactions.load();
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
      <div class="date-selector-section">
        {#if !showAllTransactions}
          {#if dateRangeMode === 'month'}
            <button class="date-nav-btn" onclick={previousPeriod}>
              <ChevronLeft size={14} />
            </button>
            <button class="date-display" onclick={() => showDatePicker = !showDatePicker}>
              <CalendarDays size={14} />
              <span>{selectedPeriod ? new Date(selectedPeriod + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Seleccionar mes'}</span>
              <ChevronDown size={14} />
            </button>
            <button class="date-nav-btn" onclick={nextPeriod}>
              <ChevronRight size={14} />
            </button>
          {:else}
            <div class="custom-date-range">
              <input
                type="date"
                class="date-input"
                bind:value={customStartDate}
                placeholder="Desde"
              />
              <span class="date-separator">-</span>
              <input
                type="date"
                class="date-input"
                bind:value={customEndDate}
                placeholder="Hasta"
              />
            </div>
          {/if}

          <button
            class="date-mode-btn"
            onclick={() => dateRangeMode = dateRangeMode === 'month' ? 'custom' : 'month'}
            title={dateRangeMode === 'month' ? 'Cambiar a rango personalizado' : 'Cambiar a selección de mes'}
          >
            <CalendarRange size={14} />
          </button>
        {/if}

        <button
          class="all-toggle-btn"
          class:active={showAllTransactions}
          onclick={() => showAllTransactions = !showAllTransactions}
          title={showAllTransactions ? 'Mostrar período seleccionado' : 'Mostrar todas las transacciones'}
        >
          <Layers size={14} />
        </button>

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
      <div class="search-bar">
        <Search size={14} />
        <input
          type="text"
          placeholder={$t('transactions.search_placeholder')}
          bind:value={searchQuery}
        />
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
          <button class="toolbar-btn" onclick={() => isSelectionMode = true}>
            {$t('transactions.select')}
          </button>
          <button class="toolbar-btn" onclick={() => showFilters = !showFilters}>
            <Filter size={14} />
          </button>
          <button class="toolbar-btn">
            <Download size={14} />
          </button>
        {/if}
      </div>
    </div>

    {#if showDatePicker && dateRangeMode === 'month'}
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
      <div class="filters">
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
                  onclick={() => showCategoryDropdown = showCategoryDropdown === transaction.id ? null : transaction.id}
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
                  {@const filteredCategories = transaction.amount > 0
                    ? $apiCategories.filter(c => c.type === 'income')
                    : $apiCategories.filter(c => c.type === 'essential' || c.type === 'discretionary' || c.type === 'investment')
                  }
                  <div class="category-dropdown">
                    {#if filteredCategories.length > 0}
                      {#each filteredCategories as cat}
                        <button
                          class="category-option"
                          onclick={() => {
                            categorizeTransaction(transaction, cat.id);
                            showCategoryDropdown = null;
                          }}
                        >
                          <span class="category-icon">{cat.icon}</span>
                          <span class="category-name">{cat.name}</span>
                        </button>
                      {/each}
                    {:else}
                      <div class="no-categories">
                        <span>No hay categorías de {transaction.amount > 0 ? 'ingreso' : 'gasto'}</span>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="transaction-actions">
              <button
                class="action-btn"
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
    background: var(--surface);
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
    gap: var(--space-xs);
  }

  .date-nav-btn {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .date-nav-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  .date-display {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 0 var(--space-sm);
    height: 1.75rem;
    background: var(--surface);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .date-display:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
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

  .date-separator {
    color: var(--text-muted);
    font-size: 0.8125rem;
  }

  .date-mode-btn {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    margin-left: var(--space-xs);
  }

  .date-mode-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
    color: var(--acapulco);
  }

  .all-toggle-btn {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    margin-left: var(--space-sm);
  }

  .all-toggle-btn:hover {
    background: var(--gray-100);
    border-color: var(--gray-300);
  }

  .all-toggle-btn.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .all-toggle-btn.active:hover {
    background: var(--success-hover);
    border-color: var(--success-hover);
  }

  .hidden-toggle-btn {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    margin-left: var(--space-xs);
  }

  .hidden-toggle-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  .hidden-toggle-btn.active {
    background: var(--gray-600);
    border-color: var(--gray-600);
    color: white;
  }

  .hidden-toggle-btn.active:hover {
    background: var(--gray-700);
    border-color: var(--gray-700);
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
    z-index: 20;
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
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--gray-200);
    position: sticky;
    top: 0;
    z-index: 15;
  }

  .toolbar-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-sm) var(--space-lg);
    display: flex;
    gap: var(--space-md);
    align-items: center;
    flex-wrap: wrap;
  }

  @media (min-width: 768px) {
    .toolbar-content {
      flex-wrap: nowrap;
    }
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 0 var(--space-sm);
    height: 1.75rem;
    background: var(--surface);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    flex: 1;
    max-width: 280px;
    transition: all 0.15s ease;
  }

  .search-bar:focus-within {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
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
  }

  .toolbar-actions {
    display: flex;
    gap: var(--space-xs);
  }

  .toolbar-btn {
    height: 1.75rem;
    padding: 0 var(--space-sm);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.8125rem;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .toolbar-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  .toolbar-btn.danger:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
    color: rgb(239, 68, 68);
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

  .transaction-card.hidden {
    opacity: 0.5;
    background: var(--gray-50);
  }

  .transaction-card.hidden:hover {
    transform: none;
    border-color: var(--gray-300);
  }

  .transaction-card.hidden .transaction-description,
  .transaction-card.hidden .transaction-amount,
  .transaction-card.hidden .transaction-meta {
    color: var(--text-muted);
    text-decoration: line-through;
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

  .category-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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

  .no-categories {
    padding: var(--space-md);
    text-align: center;
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-style: italic;
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
  }

  .fab:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }
</style>
