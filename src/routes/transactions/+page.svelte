<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Filter, Download, Plus, Eye, EyeOff, Edit2, Trash2, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown, X } from 'lucide-svelte';

  // Sample data - replace with real API calls
  let loading = $state(true);
  let searchTerm = $state('');
  let selectedCategory = $state('todas');
  let selectedDateRange = $state('30');
  let showFilters = $state(false);
  
  let transactions = $state([
    { 
      id: 1, 
      date: '2025-01-13', 
      description: 'Supermercado Mercadona', 
      category: 'Alimentación', 
      amount: -125.50, 
      account: 'Cuenta Principal',
      type: 'expense',
      visible: true,
      reference: 'TARJETA *4321'
    },
    { 
      id: 2, 
      date: '2025-01-12', 
      description: 'Salario Enero', 
      category: 'Ingresos', 
      amount: 4250.00, 
      account: 'Cuenta Principal',
      type: 'income',
      visible: true,
      reference: 'TRANSFER-001'
    },
    { 
      id: 3, 
      date: '2025-01-11', 
      description: 'Gasolina Repsol', 
      category: 'Transporte', 
      amount: -65.30, 
      account: 'Cuenta Principal',
      type: 'expense',
      visible: true,
      reference: 'TARJETA *4321'
    },
    { 
      id: 4, 
      date: '2025-01-10', 
      description: 'Netflix Suscripción', 
      category: 'Entretenimiento', 
      amount: -15.99, 
      account: 'Cuenta Principal',
      type: 'expense',
      visible: true,
      reference: 'DOMICILIACION'
    },
    { 
      id: 5, 
      date: '2025-01-09', 
      description: 'Freelance Proyecto', 
      category: 'Ingresos', 
      amount: 850.00, 
      account: 'Cuenta Ahorros',
      type: 'income',
      visible: true,
      reference: 'TRANSFER-002'
    },
    { 
      id: 6, 
      date: '2025-01-08', 
      description: 'Farmacia', 
      category: 'Salud', 
      amount: -28.45, 
      account: 'Cuenta Principal',
      type: 'expense',
      visible: false,
      reference: 'TARJETA *4321'
    },
    { 
      id: 7, 
      date: '2025-01-07', 
      description: 'Restaurante', 
      category: 'Alimentación', 
      amount: -42.80, 
      account: 'Cuenta Principal',
      type: 'expense',
      visible: true,
      reference: 'TARJETA *4321'
    },
    { 
      id: 8, 
      date: '2025-01-06', 
      description: 'Amazon Compra', 
      category: 'Otros', 
      amount: -89.99, 
      account: 'Cuenta Principal',
      type: 'expense',
      visible: true,
      reference: 'TARJETA *4321'
    }
  ]);

  let categories = ['todas', 'Alimentación', 'Transporte', 'Entretenimiento', 'Ingresos', 'Salud', 'Otros'];
  let selectedTransactions = $state(new Set());

  // Computed properties
  let filteredTransactions = $derived(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'todas' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  });

  let totalIncome = $derived(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  let totalExpenses = $derived(() => {
    return Math.abs(filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));
  });

  let netAmount = $derived(() => totalIncome - totalExpenses);

  function toggleTransactionVisibility(id: number) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      transaction.visible = !transaction.visible;
    }
  }

  function toggleTransactionSelection(id: number) {
    if (selectedTransactions.has(id)) {
      selectedTransactions.delete(id);
    } else {
      selectedTransactions.add(id);
    }
    selectedTransactions = new Set(selectedTransactions);
  }

  function selectAllTransactions() {
    if (selectedTransactions.size === filteredTransactions.length) {
      selectedTransactions.clear();
    } else {
      selectedTransactions = new Set(filteredTransactions.map(t => t.id));
    }
  }

  function clearFilters() {
    searchTerm = '';
    selectedCategory = 'todas';
    selectedDateRange = '30';
    showFilters = false;
  }

  onMount(async () => {
    // Simulate API loading
    setTimeout(() => {
      loading = false;
    }, 800);
  });
</script>

<svelte:head>
  <title>Transacciones - Happy Balance</title>
</svelte:head>

<div class="transactions-container">
  <!-- Header Section -->
  <div class="transactions-header">
    <div class="header-content">
      <div class="header-text">
        <h1 class="page-title">Transacciones</h1>
        <p class="page-subtitle">Gestiona y revisa todos tus movimientos financieros</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" onclick={() => showFilters = !showFilters}>
          <Filter size={16} />
          Filtros
        </button>
        <button class="btn-secondary">
          <Download size={16} />
          Exportar
        </button>
        <button class="btn-primary">
          <Plus size={16} />
          Nueva Transacción
        </button>
      </div>
    </div>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando transacciones...</p>
    </div>
  {:else}
    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card income-summary">
        <div class="summary-icon income-icon">
          <ArrowUpRight size={20} />
        </div>
        <div class="summary-content">
          <p class="summary-label">Total Ingresos</p>
          <p class="summary-value income-value">+€{totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      
      <div class="summary-card expense-summary">
        <div class="summary-icon expense-icon">
          <ArrowDownRight size={20} />
        </div>
        <div class="summary-content">
          <p class="summary-label">Total Gastos</p>
          <p class="summary-value expense-value">-€{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      
      <div class="summary-card net-summary {netAmount >= 0 ? 'positive' : 'negative'}">
        <div class="summary-icon net-icon">
          {#if netAmount >= 0}
            <ArrowUpRight size={20} />
          {:else}
            <ArrowDownRight size={20} />
          {/if}
        </div>
        <div class="summary-content">
          <p class="summary-label">Balance Neto</p>
          <p class="summary-value net-value">
            {netAmount >= 0 ? '+' : ''}€{netAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    {#if showFilters}
      <div class="filters-section">
        <div class="filters-header">
          <h3 class="filters-title">Filtros</h3>
          <button class="filters-close" onclick={() => showFilters = false}>
            <X size={16} />
          </button>
        </div>
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Buscar</label>
            <div class="search-input-wrapper">
              <Search size={16} class="search-icon" />
              <input 
                type="text" 
                class="search-input" 
                placeholder="Buscar por descripción o categoría..."
                bind:value={searchTerm}
              />
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Categoría</label>
            <div class="select-wrapper">
              <select class="filter-select" bind:value={selectedCategory}>
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
              <ChevronDown size={16} class="select-icon" />
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Periodo</label>
            <div class="select-wrapper">
              <select class="filter-select" bind:value={selectedDateRange}>
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 3 meses</option>
                <option value="365">Último año</option>
              </select>
              <ChevronDown size={16} class="select-icon" />
            </div>
          </div>
          
          <div class="filter-actions">
            <button class="btn-clear" onclick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Transactions Table -->
    <div class="table-container">
      <div class="table-header">
        <div class="table-title-section">
          <h2 class="table-title">Listado de Transacciones</h2>
          <p class="table-subtitle">{filteredTransactions.length} transacciones encontradas</p>
        </div>
        
        {#if selectedTransactions.size > 0}
          <div class="bulk-actions">
            <p class="selected-count">{selectedTransactions.size} seleccionadas</p>
            <button class="btn-bulk">Ocultar seleccionadas</button>
            <button class="btn-bulk danger">Eliminar seleccionadas</button>
          </div>
        {/if}
      </div>

      <div class="table-wrapper">
        <table class="transactions-table">
          <thead>
            <tr>
              <th class="checkbox-column">
                <input 
                  type="checkbox" 
                  class="table-checkbox"
                  checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                  onchange={selectAllTransactions}
                />
              </th>
              <th class="date-column">Fecha</th>
              <th class="description-column">Descripción</th>
              <th class="category-column">Categoría</th>
              <th class="account-column">Cuenta</th>
              <th class="amount-column">Importe</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredTransactions as transaction}
              <tr class="transaction-row {transaction.visible ? '' : 'hidden-transaction'}">
                <td class="checkbox-column">
                  <input 
                    type="checkbox" 
                    class="table-checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onchange={() => toggleTransactionSelection(transaction.id)}
                  />
                </td>
                <td class="date-column">
                  <div class="date-info">
                    <span class="date-primary">{new Date(transaction.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                    <span class="date-year">{new Date(transaction.date).getFullYear()}</span>
                  </div>
                </td>
                <td class="description-column">
                  <div class="description-info">
                    <span class="description-primary">{transaction.description}</span>
                    <span class="description-reference">{transaction.reference}</span>
                  </div>
                </td>
                <td class="category-column">
                  <span class="category-badge {transaction.type}">{transaction.category}</span>
                </td>
                <td class="account-column">
                  <span class="account-name">{transaction.account}</span>
                </td>
                <td class="amount-column">
                  <span class="amount-value {transaction.type}">
                    {transaction.type === 'income' ? '+' : ''}€{Math.abs(transaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td class="actions-column">
                  <div class="transaction-actions">
                    <button 
                      class="action-btn visibility-btn"
                      onclick={() => toggleTransactionVisibility(transaction.id)}
                      title={transaction.visible ? 'Ocultar transacción' : 'Mostrar transacción'}
                    >
                      {#if transaction.visible}
                        <Eye size={14} />
                      {:else}
                        <EyeOff size={14} />
                      {/if}
                    </button>
                    <button class="action-btn edit-btn" title="Editar transacción">
                      <Edit2 size={14} />
                    </button>
                    <button class="action-btn delete-btn" title="Eliminar transacción">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if filteredTransactions.length === 0}
        <div class="empty-state">
          <div class="empty-icon">
            <Search size={48} />
          </div>
          <h3 class="empty-title">No se encontraron transacciones</h3>
          <p class="empty-description">
            {searchTerm || selectedCategory !== 'todas' 
              ? 'Intenta cambiar los filtros de búsqueda' 
              : 'Aún no tienes transacciones registradas'}
          </p>
          {#if searchTerm || selectedCategory !== 'todas'}
            <button class="btn-secondary" onclick={clearFilters}>Limpiar filtros</button>
          {:else}
            <button class="btn-primary">
              <Plus size={16} />
              Crear primera transacción
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .transactions-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
  }

  /* Header */
  .transactions-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-text {
    flex: 1;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 1rem;
    color: var(--color-gray-600);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .btn-primary, .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    box-shadow: var(--shadow-md);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .btn-secondary {
    background: white;
    color: var(--color-gray-700);
    border: 1px solid var(--color-gray-300);
  }

  .btn-secondary:hover {
    background: var(--color-gray-50);
    border-color: var(--color-gray-400);
  }

  /* Loading */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--color-gray-200);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    color: var(--color-gray-600);
    font-size: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Summary Cards */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .summary-card {
    background: white;
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-gray-200);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .summary-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .income-icon { background: linear-gradient(135deg, #059669, #10b981); }
  .expense-icon { background: linear-gradient(135deg, #dc2626, #ef4444); }
  .net-icon.positive { background: linear-gradient(135deg, #059669, #10b981); }
  .net-icon.negative { background: linear-gradient(135deg, #dc2626, #ef4444); }

  .summary-content {
    flex: 1;
  }

  .summary-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-gray-600);
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    line-height: 1;
  }

  .income-value { color: #059669; }
  .expense-value { color: #dc2626; }
  .net-value { color: #059669; }
  .negative .net-value { color: #dc2626; }

  /* Filters */
  .filters-section {
    background: white;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-gray-200);
    margin-bottom: 2rem;
  }

  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .filters-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0;
  }

  .filters-close {
    background: none;
    border: none;
    color: var(--color-gray-500);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }

  .filters-close:hover {
    background: var(--color-gray-100);
    color: var(--color-gray-700);
  }

  .filters-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 1rem;
    align-items: end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-gray-700);
  }

  .search-input-wrapper {
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid var(--color-gray-300);
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-gray-400);
  }

  .select-wrapper {
    position: relative;
  }

  .filter-select {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid var(--color-gray-300);
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    background: white;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .select-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-gray-400);
    pointer-events: none;
  }

  .btn-clear {
    padding: 0.75rem 1.25rem;
    background: var(--color-gray-100);
    color: var(--color-gray-700);
    border: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-clear:hover {
    background: var(--color-gray-200);
  }

  /* Table */
  .table-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-gray-200);
    overflow: hidden;
  }

  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-gray-200);
  }

  .table-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0;
  }

  .table-subtitle {
    font-size: 0.875rem;
    color: var(--color-gray-500);
    margin: 0.25rem 0 0 0;
  }

  .bulk-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .selected-count {
    font-size: 0.875rem;
    color: var(--color-gray-600);
    font-weight: 600;
    margin: 0;
  }

  .btn-bulk {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-gray-300);
    border-radius: var(--radius-md);
    background: white;
    color: var(--color-gray-700);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-bulk:hover {
    background: var(--color-gray-50);
  }

  .btn-bulk.danger {
    border-color: #fecaca;
    color: #dc2626;
  }

  .btn-bulk.danger:hover {
    background: #fef2f2;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .transactions-table th {
    background: var(--color-gray-50);
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-gray-700);
    border-bottom: 1px solid var(--color-gray-200);
    white-space: nowrap;
  }

  .transactions-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--color-gray-100);
    vertical-align: middle;
  }

  .transaction-row:hover {
    background: var(--color-gray-50);
  }

  .transaction-row.hidden-transaction {
    opacity: 0.5;
    background: var(--color-gray-50);
  }

  .checkbox-column {
    width: 50px;
    text-align: center;
  }

  .table-checkbox {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
  }

  .date-column {
    width: 100px;
  }

  .date-info {
    display: flex;
    flex-direction: column;
  }

  .date-primary {
    font-weight: 600;
    color: var(--color-gray-900);
    font-size: 0.875rem;
  }

  .date-year {
    font-size: 0.75rem;
    color: var(--color-gray-500);
  }

  .description-column {
    min-width: 200px;
  }

  .description-info {
    display: flex;
    flex-direction: column;
  }

  .description-primary {
    font-weight: 600;
    color: var(--color-gray-900);
    font-size: 0.875rem;
    margin-bottom: 0.125rem;
  }

  .description-reference {
    font-size: 0.75rem;
    color: var(--color-gray-500);
  }

  .category-column {
    width: 150px;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .category-badge.income {
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
  }

  .category-badge.expense {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  .account-column {
    width: 150px;
  }

  .account-name {
    font-size: 0.875rem;
    color: var(--color-gray-600);
  }

  .amount-column {
    width: 120px;
    text-align: right;
  }

  .amount-value {
    font-weight: 700;
    font-size: 0.875rem;
  }

  .amount-value.income {
    color: #059669;
  }

  .amount-value.expense {
    color: #dc2626;
  }

  .actions-column {
    width: 120px;
  }

  .transaction-actions {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--color-gray-100);
  }

  .visibility-btn {
    color: var(--color-gray-500);
  }

  .edit-btn {
    color: var(--color-primary);
  }

  .delete-btn {
    color: #dc2626;
  }

  .delete-btn:hover {
    background: #fef2f2;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .empty-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: var(--color-gray-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-gray-400);
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 0.5rem 0;
  }

  .empty-description {
    font-size: 1rem;
    color: var(--color-gray-600);
    margin: 0 0 1.5rem 0;
  }

  /* Responsive Design */
  @media (max-width: 1023px) {
    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: stretch;
    }

    .btn-primary, .btn-secondary {
      flex: 1;
      justify-content: center;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .filter-actions {
      justify-self: stretch;
    }

    .table-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .bulk-actions {
      justify-content: space-between;
    }
  }

  @media (max-width: 640px) {
    .page-title {
      font-size: 1.5rem;
    }

    .summary-value {
      font-size: 1.25rem;
    }

    .transactions-table th,
    .transactions-table td {
      padding: 0.75rem 0.5rem;
    }

    .description-column {
      min-width: 150px;
    }

    .category-column,
    .account-column {
      width: 100px;
    }

    .amount-column {
      width: 100px;
    }
  }

  /* Dark Mode */
  :global(html.dark) .summary-card,
  :global(html.dark) .filters-section,
  :global(html.dark) .table-container {
    background: #1f2937;
    border-color: #374151;
  }

  :global(html.dark) .table-header,
  :global(html.dark) .transactions-table th {
    border-bottom-color: #374151;
  }

  :global(html.dark) .transactions-table th {
    background: #374151;
  }

  :global(html.dark) .transactions-table td {
    border-bottom-color: #4b5563;
  }

  :global(html.dark) .transaction-row:hover {
    background: #374151;
  }

  :global(html.dark) .search-input,
  :global(html.dark) .filter-select {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  :global(html.dark) .btn-secondary {
    background: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }

  :global(html.dark) .btn-clear {
    background: #4b5563;
    color: #f3f4f6;
  }

  :global(html.dark) .empty-icon {
    background: #374151;
  }
</style>
