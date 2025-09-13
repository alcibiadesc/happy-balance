<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronDown, Search, Filter, Download, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-svelte';
  
  // Mock data - esto vendría de la base de datos
  let transactions = $state([
    {
      id: '1',
      date: '2025-09-13',
      time: '14:30',
      merchant: 'Mercadona',
      description: 'Compra semanal',
      amount: -87.45,
      category: 'food',
      status: 'completed',
      tags: ['groceries']
    },
    {
      id: '2', 
      date: '2025-09-13',
      time: '10:15',
      merchant: 'Metro Madrid',
      description: 'Transporte público',
      amount: -2.50,
      category: 'transport',
      status: 'completed',
      tags: ['recurring']
    },
    {
      id: '3',
      date: '2025-09-12',
      time: '19:45',
      merchant: 'Netflix',
      description: 'Suscripción mensual',
      amount: -15.99,
      category: 'entertainment',
      status: 'completed',
      tags: ['subscription', 'recurring']
    },
    {
      id: '4',
      date: '2025-09-12',
      time: '09:00',
      merchant: 'Nómina Empresa',
      description: 'Salario septiembre',
      amount: 3200.00,
      category: 'income',
      status: 'completed',
      tags: ['salary']
    }
  ]);

  let searchQuery = $state('');
  let selectedPeriod = $state('September 2025');
  let showFilters = $state(false);
  let selectedCategories = $state<string[]>([]);
  
  // Computed values
  let filteredTransactions = $derived(() => {
    return transactions.filter(t => {
      const matchesSearch = !searchQuery || 
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(t.category);
        
      return matchesSearch && matchesCategory;
    });
  });
  
  let groupedTransactions = $derived(() => {
    const groups = new Map();
    
    filteredTransactions().forEach(transaction => {
      const date = transaction.date;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date).push(transaction);
    });
    
    // Sort groups by date (newest first)
    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => b.time.localeCompare(a.time))
      }));
  });
  
  let totalBalance = $derived(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  });
  
  let monthlyFlow = $derived(() => {
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses };
  });

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
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

  function formatAmount(amount: number): string {
    const formatted = Math.abs(amount).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    });
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  function getCategoryIcon(category: string): string {
    const icons = {
      food: '🍽️',
      transport: '🚇',
      entertainment: '🎬',
      income: '💰',
      utilities: '⚡',
      shopping: '🛍️',
      health: '🏥'
    };
    return icons[category] || '📄';
  }
</script>

<svelte:head>
  <title>Transactions - Expense Tracker</title>
</svelte:head>

<div class="transactions-page">
  <!-- Header Contextual -->
  <header class="transactions-header">
    <div class="header-content">
      <!-- Período Selector -->
      <button class="period-selector">
        <Calendar size={16} strokeWidth={2} />
        <span>{selectedPeriod}</span>
        <ChevronDown size={16} strokeWidth={2} />
      </button>
      
      <!-- Balance Total -->
      <div class="balance-section">
        <div class="balance-item balance-total">
          <span class="balance-label">Balance</span>
          <span class="balance-value" class:positive={totalBalance >= 0} class:negative={totalBalance < 0}>
            {formatAmount(totalBalance)}
          </span>
        </div>
        
        <!-- Flujo del Mes -->
        <div class="flow-indicators">
          <div class="flow-item income">
            <TrendingUp size={14} strokeWidth={2} />
            <span>{formatAmount(monthlyFlow().income)}</span>
          </div>
          <div class="flow-item expense">
            <TrendingDown size={14} strokeWidth={2} />
            <span>{formatAmount(-monthlyFlow().expenses)}</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Toolbar -->
  <div class="transactions-toolbar">
    <div class="toolbar-content">
      <!-- Búsqueda -->
      <div class="search-container">
        <Search size={16} strokeWidth={2} />
        <input 
          type="text" 
          placeholder="Search transactions..."
          bind:value={searchQuery}
          class="search-input"
        />
      </div>
      
      <!-- Acciones -->
      <div class="toolbar-actions">
        <button class="toolbar-btn" class:active={showFilters} onclick={() => showFilters = !showFilters}>
          <Filter size={16} strokeWidth={2} />
        </button>
        
        <button class="toolbar-btn">
          <Download size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
    
    <!-- Filtros expandidos -->
    {#if showFilters}
      <div class="filters-section">
        <div class="category-filters">
          {#each ['food', 'transport', 'entertainment', 'utilities', 'shopping'] as category}
            <button 
              class="category-chip"
              class:active={selectedCategories.includes(category)}
              onclick={() => {
                if (selectedCategories.includes(category)) {
                  selectedCategories = selectedCategories.filter(c => c !== category);
                } else {
                  selectedCategories = [...selectedCategories, category];
                }
              }}
            >
              <span class="category-icon">{getCategoryIcon(category)}</span>
              <span class="category-name">{category}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Lista de Transacciones -->
  <main class="transactions-main">
    <div class="transactions-list">
      {#each groupedTransactions() as group}
        <div class="transaction-group">
          <h3 class="group-header">
            <span class="group-date">{formatDate(group.date)}</span>
            <span class="group-total">
              {formatAmount(group.items.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </h3>
          
          <div class="group-items">
            {#each group.items as transaction}
              <div class="transaction-card" class:income={transaction.amount >= 0}>
                <div class="transaction-category">
                  <span class="category-icon">{getCategoryIcon(transaction.category)}</span>
                </div>
                
                <div class="transaction-details">
                  <div class="transaction-main">
                    <span class="transaction-description">{transaction.description}</span>
                    <span class="transaction-amount" class:positive={transaction.amount >= 0} class:negative={transaction.amount < 0}>
                      {formatAmount(transaction.amount)}
                    </span>
                  </div>
                  
                  <div class="transaction-meta">
                    <span class="transaction-merchant">{transaction.merchant}</span>
                    <span class="transaction-time">{transaction.time}</span>
                    
                    {#if transaction.tags.length > 0}
                      <div class="transaction-tags">
                        {#each transaction.tags as tag}
                          <span class="tag">{tag}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
      
      {#if groupedTransactions().length === 0}
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No transactions found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      {/if}
    </div>
  </main>

  <!-- FAB -->
  <button class="fab-add" title="Add transaction">
    <Plus size={20} strokeWidth={2} />
  </button>
</div>

<style>
  .transactions-page {
    min-height: 100vh;
    background: var(--surface);
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .transactions-header {
    background: var(--surface-elevated);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    padding: var(--space-lg) var(--space-xl);
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
    gap: var(--space-lg);
  }

  .period-selector {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--surface);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .period-selector:hover {
    border-color: var(--acapulco);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.1);
  }

  .balance-section {
    display: flex;
    align-items: center;
    gap: var(--space-xl);
  }

  .balance-item {
    text-align: right;
  }

  .balance-label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
  }

  .balance-value {
    font-size: 1.75rem;
    font-weight: 600;
    line-height: 1;
  }

  .balance-value.positive {
    color: var(--acapulco);
  }

  .balance-value.negative {
    color: var(--froly);
  }

  .flow-indicators {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .flow-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.875rem;
  }

  .flow-item.income {
    color: var(--acapulco);
  }

  .flow-item.expense {
    color: var(--froly);
  }

  /* Toolbar */
  .transactions-toolbar {
    background: var(--surface-elevated);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    position: sticky;
    top: 73px;
    z-index: 9;
  }

  .toolbar-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-md) var(--space-xl);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-container {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: var(--surface);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-lg);
    padding: var(--space-sm) var(--space-md);
    flex: 1;
    max-width: 400px;
  }

  .search-container:focus-within {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  .search-input {
    border: none;
    background: none;
    outline: none;
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .toolbar-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toolbar-btn:hover,
  .toolbar-btn.active {
    border-color: var(--acapulco);
    color: var(--acapulco);
    background: var(--surface-elevated);
  }

  .filters-section {
    padding: var(--space-md) var(--space-xl);
    border-top: 1px solid rgba(2, 60, 70, 0.05);
    max-width: 1200px;
    margin: 0 auto;
  }

  .category-filters {
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
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .category-chip:hover,
  .category-chip.active {
    border-color: var(--acapulco);
    color: var(--acapulco);
    background: rgba(122, 186, 165, 0.1);
  }

  .category-name {
    text-transform: capitalize;
  }

  /* Main Content */
  .transactions-main {
    flex: 1;
    padding: var(--space-lg) var(--space-xl);
  }

  .transactions-list {
    max-width: 1200px;
    margin: 0 auto;
  }

  .transaction-group {
    margin-bottom: var(--space-xl);
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) 0;
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    margin-bottom: var(--space-md);
  }

  .group-date {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .group-total {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .group-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .transaction-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    background: var(--surface-elevated);
    border: 1px solid rgba(2, 60, 70, 0.05);
    border-radius: var(--radius-lg);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .transaction-card:hover {
    border-color: var(--acapulco);
    box-shadow: 0 2px 12px rgba(122, 186, 165, 0.1);
    transform: translateY(-1px);
  }

  .transaction-card.income {
    border-left: 3px solid var(--acapulco);
  }

  .transaction-card:not(.income) {
    border-left: 3px solid var(--froly);
  }

  .transaction-category {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border-radius: var(--radius-lg);
    font-size: 1.2rem;
  }

  .transaction-details {
    flex: 1;
    min-width: 0;
  }

  .transaction-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xs);
  }

  .transaction-description {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transaction-amount {
    font-weight: 600;
    white-space: nowrap;
  }

  .transaction-amount.positive {
    color: var(--acapulco);
  }

  .transaction-amount.negative {
    color: var(--froly);
  }

  .transaction-meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .transaction-merchant {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transaction-time::before {
    content: '•';
    margin-right: var(--space-xs);
  }

  .transaction-tags {
    display: flex;
    gap: var(--space-xs);
    margin-left: auto;
  }

  .tag {
    padding: 2px var(--space-xs);
    background: rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: var(--space-3xl);
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--space-lg);
  }

  .empty-state h3 {
    margin-bottom: var(--space-sm);
    color: var(--text-secondary);
  }

  /* FAB */
  .fab-add {
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
    transition: all 0.3s ease;
    z-index: 100;
  }

  .fab-add:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 30px rgba(122, 186, 165, 0.5);
  }

  /* Dark Mode */
  html.dark .transactions-header,
  html.dark .transactions-toolbar {
    background: var(--surface-elevated);
    border-color: rgba(254, 247, 238, 0.1);
  }

  html.dark .period-selector,
  html.dark .search-container,
  html.dark .toolbar-btn,
  html.dark .category-chip {
    border-color: rgba(254, 247, 238, 0.1);
    background: var(--surface-muted);
  }

  html.dark .transaction-card {
    background: var(--surface-elevated);
    border-color: rgba(254, 247, 238, 0.05);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .transactions-header {
      padding: var(--space-md);
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-md);
    }

    .balance-section {
      justify-content: space-between;
    }

    .toolbar-content {
      padding: var(--space-md);
    }

    .search-container {
      max-width: none;
      margin-right: var(--space-md);
    }

    .transactions-main {
      padding: var(--space-md);
    }

    .transaction-card {
      padding: var(--space-sm) var(--space-md);
    }

    .transaction-meta {
      flex-wrap: wrap;
    }

    .fab-add {
      bottom: var(--space-lg);
      right: var(--space-lg);
    }
  }
</style>
