<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Edit, Trash2, Check, X, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, DollarSign, PieChart } from 'lucide-svelte';
  
  let categories = $state([]);
  let budgets = $state([]);
  let categorySpending = $state([]);
  let isLoading = $state(true);
  let error = $state('');
  let showCreateForm = $state(false);
  let editingBudget = $state(null);
  let selectedPeriod = $state('current_month');
  
  // Form data
  let formData = $state({
    name: '',
    categoryId: '',
    amount: 0,
    period: 'MONTHLY',
    startDate: '',
    endDate: ''
  });
  
  // Budget periods
  const budgetPeriods = [
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'YEARLY', label: 'Anual' }
  ];
  
  const periodOptions = [
    { value: 'current_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: 'current_quarter', label: 'Este trimestre' },
    { value: 'last_quarter', label: 'Trimestre pasado' },
    { value: 'current_year', label: 'Este año' },
    { value: 'last_year', label: 'Año pasado' }
  ];

  onMount(() => {
    loadData();
    
    // Set default dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    formData.startDate = startOfMonth.toISOString().split('T')[0];
    formData.endDate = endOfMonth.toISOString().split('T')[0];
  });

  async function loadData() {
    try {
      isLoading = true;
      error = '';
      
      // Load categories, budgets, and spending data in parallel
      const [categoriesRes, budgetsRes, spendingRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/budgets'),
        fetch(`/api/analytics/category-spending?period=${selectedPeriod}`)
      ]);
      
      const [categoriesResult, budgetsResult, spendingResult] = await Promise.all([
        categoriesRes.json(),
        budgetsRes.json(),
        spendingRes.json()
      ]);
      
      if (categoriesResult.success) categories = categoriesResult.data;
      if (budgetsResult.success) budgets = budgetsResult.data;
      if (spendingResult.success) categorySpending = spendingResult.data;
      
    } catch (err) {
      console.error('Error loading data:', err);
      error = 'Error de conexión';
    } finally {
      isLoading = false;
    }
  }

  async function createBudget() {
    if (!formData.name.trim() || !formData.amount || formData.amount <= 0) {
      alert('Todos los campos son obligatorios y el monto debe ser mayor a 0');
      return;
    }

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          categoryId: formData.categoryId || null,
          amount: formData.amount,
          period: formData.period,
          startDate: formData.startDate,
          endDate: formData.endDate || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadData();
          resetForm();
        } else {
          alert(`Error al crear el presupuesto: ${result.error || 'Error desconocido'}`);
        }
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      alert('Error al crear el presupuesto');
    }
  }

  async function updateBudget() {
    if (!formData.name.trim() || !formData.amount || formData.amount <= 0) {
      alert('Todos los campos son obligatorios y el monto debe ser mayor a 0');
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          categoryId: formData.categoryId || null,
          amount: formData.amount,
          period: formData.period,
          startDate: formData.startDate,
          endDate: formData.endDate || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadData();
          resetForm();
        } else {
          alert(`Error al actualizar el presupuesto: ${result.error || 'Error desconocido'}`);
        }
      }
    } catch (err) {
      console.error('Error updating budget:', err);
      alert('Error al actualizar el presupuesto');
    }
  }

  async function deleteBudget(budget: any) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el presupuesto "${budget.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error desconocido' }));
        alert(`Error al eliminar el presupuesto: ${errorResult.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('Error al eliminar el presupuesto');
    }
  }

  function startEditing(budget: any) {
    editingBudget = budget;
    formData = {
      name: budget.name,
      categoryId: budget.categoryId || '',
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate ? budget.endDate.split('T')[0] : ''
    };
    showCreateForm = true;
  }

  function resetForm() {
    formData = {
      name: '',
      categoryId: '',
      amount: 0,
      period: 'MONTHLY',
      startDate: '',
      endDate: ''
    };
    showCreateForm = false;
    editingBudget = null;
    
    // Reset dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    formData.startDate = startOfMonth.toISOString().split('T')[0];
    formData.endDate = endOfMonth.toISOString().split('T')[0];
  }

  function getCategoryName(categoryId: string) {
    const category = categories.find(c => (c.id.value || c.id) === categoryId);
    return category ? category.name : 'Todas las categorías';
  }

  function getCategorySpending(categoryId: string) {
    const spending = categorySpending.find(s => s.categoryId === categoryId);
    const amount = spending ? spending.amount : 0;
    return isFinite(amount) ? Math.max(0, amount) : 0;
  }

  function getBudgetStatus(budget: any) {
    const spent = budget.categoryId ? getCategorySpending(budget.categoryId) : 
                  categorySpending.reduce((total, s) => {
                    const amount = isFinite(s.amount) ? s.amount : 0;
                    return total + Math.max(0, amount);
                  }, 0);
    
    const safeSpent = isFinite(spent) ? Math.max(0, spent) : 0;
    const safeBudgetAmount = isFinite(budget.amount) && budget.amount > 0 ? budget.amount : 1;
    const percentage = (safeSpent / safeBudgetAmount) * 100;
    const safePercentage = isFinite(percentage) ? Math.max(0, percentage) : 0;
    
    if (safePercentage >= 100) return { status: 'over', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (safePercentage >= 80) return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
  }

  function formatCurrency(amount: number) {
    const safeAmount = isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(safeAmount);
  }

  // Watch for period changes
  $effect(() => {
    loadData();
  });
</script>

<svelte:head>
  <title>Presupuestos por Categorías - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen" style="background-color: var(--color-background-primary);">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10" style="border-color: var(--color-border-primary); background-color: var(--color-background-elevated);">
    <div class="container-editorial">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
        <div>
          <h1 class="text-h3" style="color: var(--color-text-primary);">Presupuestos por Categorías</h1>
          <p class="text-secondary mt-1">
            Controla tus gastos y gestiona tus presupuestos
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <select
            bind:value={selectedPeriod}
            class="input-editorial"
          >
            {#each periodOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <button 
            class="btn-primary gap-2"
            onclick={() => showCreateForm = true}
          >
            <Plus class="w-4 h-4" />
            Nuevo Presupuesto
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container-editorial py-6">
    <!-- Create/Edit Form -->
    {#if showCreateForm}
      <div class="card-editorial p-6 mb-6 border-l-4 border-indigo-500">
        <h2 class="text-h4 mb-4">
          {editingBudget ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}
        </h2>
        
        <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); editingBudget ? updateBudget() : createBudget(); }}>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Name -->
            <div>
              <label for="budget-name" class="block text-caption mb-2">Nombre del Presupuesto *</label>
              <input
                id="budget-name"
                type="text"
                bind:value={formData.name}
                placeholder="Ej: Gastos de supermercado"
                class="input-editorial"
                required
              />
            </div>

            <!-- Amount -->
            <div>
              <label for="budget-amount" class="block text-caption mb-2">Monto *</label>
              <input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                bind:value={formData.amount}
                placeholder="0.00"
                class="input-editorial"
                required
              />
            </div>
            
            <!-- Category -->
            <div>
              <label for="budget-category" class="block text-caption mb-2">Categoría</label>
              <select 
                id="budget-category"
                bind:value={formData.categoryId}
                class="input-editorial"
              >
                <option value="">Todas las categorías</option>
                {#each categories.filter(c => c.type !== 'OMIT') as category}
                  <option value={category.id.value || category.id}>{category.name}</option>
                {/each}
              </select>
            </div>

            <!-- Period -->
            <div>
              <label for="budget-period" class="block text-caption mb-2">Periodo *</label>
              <select 
                id="budget-period"
                bind:value={formData.period}
                class="input-editorial"
              >
                {#each budgetPeriods as period}
                  <option value={period.value}>{period.label}</option>
                {/each}
              </select>
            </div>
            
            <!-- Start Date -->
            <div>
              <label for="budget-start" class="block text-caption mb-2">Fecha de Inicio *</label>
              <input
                id="budget-start"
                type="date"
                bind:value={formData.startDate}
                class="input-editorial"
                required
              />
            </div>
            
            <!-- End Date -->
            <div>
              <label for="budget-end" class="block text-caption mb-2">Fecha de Fin</label>
              <input
                id="budget-end"
                type="date"
                bind:value={formData.endDate}
                class="input-editorial"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              class="btn-primary gap-2"
            >
              <Check class="w-4 h-4" />
              {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
            </button>
            <button
              type="button"
              class="btn-ghost gap-2"
              onclick={resetForm}
            >
              <X class="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Budget Overview Cards -->
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-secondary">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span>Cargando presupuestos...</span>
        </div>
      </div>
    {:else if error}
      <div class="card-editorial p-8 text-center">
        <div class="status-error mb-4">{error}</div>
        <button 
          onclick={loadData}
          class="btn-primary"
        >
          Reintentar
        </button>
      </div>
    {:else if budgets.length === 0}
      <div class="card-editorial p-8 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-h4 mb-2">No hay presupuestos</h3>
        <p class="text-body mb-4 max-w-md mx-auto">
          Crea tu primer presupuesto para empezar a controlar tus gastos por categorías.
        </p>
        <button 
          onclick={() => showCreateForm = true}
          class="btn-primary gap-2"
        >
          <Plus class="w-4 h-4" />
          Crear Presupuesto
        </button>
      </div>
    {:else}
      <!-- Budgets Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {#each budgets as budget}
          {@const spent = budget.categoryId ? getCategorySpending(budget.categoryId) : 
                          categorySpending.reduce((total, s) => total + s.amount, 0)}
          {@const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0}
          {@const status = getBudgetStatus(budget)}
          
          <div class="card-editorial p-6 border-l-4 {status.status === 'over' ? 'border-red-500' : status.status === 'warning' ? 'border-orange-500' : 'border-green-500'}">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-h5 mb-1">{budget.name}</h3>
                <p class="text-caption text-secondary">{getCategoryName(budget.categoryId)}</p>
                <p class="text-xs text-tertiary mt-1">
                  {budget.period === 'MONTHLY' ? 'Mensual' : budget.period === 'QUARTERLY' ? 'Trimestral' : 'Anual'}
                </p>
              </div>
              
              <div class="flex items-center gap-1">
                <button
                  onclick={() => startEditing(budget)}
                  class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar presupuesto"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  onclick={() => deleteBudget(budget)}
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar presupuesto"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- Budget Progress -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-secondary">Gastado</span>
                <span class="text-sm font-mono {status.color}">
                  {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300 {percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-orange-500' : 'bg-green-500'}"
                  style="width: {Math.min(percentage, 100)}%"
                ></div>
              </div>
              
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-tertiary">
                  {percentage.toFixed(1)}% utilizado
                </span>
                <span class="text-xs text-tertiary">
                  {percentage >= 100 ? 'Excedido' : `${formatCurrency(budget.amount - spent)} restante`}
                </span>
              </div>
            </div>
            
            <!-- Status Badge -->
            <div class="flex items-center justify-center">
              <span class="px-3 py-1 rounded-full text-xs font-medium {status.bgColor} {status.color}">
                {#if status.status === 'over'}
                  <AlertTriangle class="w-3 h-3 inline mr-1" />
                  Presupuesto excedido
                {:else if status.status === 'warning'}
                  <TrendingUp class="w-3 h-3 inline mr-1" />
                  Cerca del límite
                {:else}
                  <Target class="w-3 h-3 inline mr-1" />
                  Dentro del presupuesto
                {/if}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>