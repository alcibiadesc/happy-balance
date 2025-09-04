<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Edit, Trash2, Check, X, Home, ShoppingCart, Coffee, Car, Plane, Heart, Briefcase, Gift, Zap, Music, Gamepad2, Filter, AlertCircle, CreditCard, PiggyBank, TrendingUp, Target, DollarSign, Calendar } from 'lucide-svelte';
  import { notifications } from '$lib/shared/stores/notifications.js';
  
  let categories = $state([]);
  let budgets = $state([]);
  let categorySpending = $state([]);
  let isLoading = $state(true);
  let error = $state('');
  let activeTab = $state('categories'); // 'categories' | 'budgets' | 'unified'
  let showCreateForm = $state(false);
  let editingItem = $state(null);
  let filterType = $state('all');
  let selectedPeriod = $state('current_month');
  
  // Unified form data that works for both categories and budgets
  let formData = $state({
    // Category fields
    name: '',
    type: 'DISCRETIONARY_EXPENSE',
    icon: 'ShoppingCart',
    color: '#3B82F6',
    // Budget fields
    categoryId: '',
    amount: 0,
    period: 'MONTHLY',
    startDate: '',
    endDate: '',
    // Control fields
    createBudget: false, // When creating category, optionally create budget
    mode: 'category' // 'category' | 'budget' | 'unified'
  });
  
  // Category types with labels and colors
  const categoryTypes = [
    { value: 'INCOME', label: 'Ingresos', color: '#059669', icon: 'Briefcase' },
    { value: 'ESSENTIAL_EXPENSE', label: 'Gastos Esenciales', color: '#DC2626', icon: 'Home' },
    { value: 'DISCRETIONARY_EXPENSE', label: 'Gastos Discrecionales', color: '#D97706', icon: 'ShoppingCart' },
    { value: 'DEBT_PAYMENT', label: 'Pagos de Deuda', color: '#7C2D12', icon: 'CreditCard' },
    { value: 'SAVINGS', label: 'Ahorros', color: '#4F46E5', icon: 'PiggyBank' },
    { value: 'INVESTMENT', label: 'Inversiones', color: '#7C3AED', icon: 'TrendingUp' },
    { value: 'OMIT', label: 'Omitir', color: '#6B7280', icon: 'X' }
  ];
  
  // Available icons for categories
  const availableIcons = [
    { name: 'Home', icon: Home },
    { name: 'ShoppingCart', icon: ShoppingCart },
    { name: 'Coffee', icon: Coffee },
    { name: 'Car', icon: Car },
    { name: 'Plane', icon: Plane },
    { name: 'Heart', icon: Heart },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Gift', icon: Gift },
    { name: 'Zap', icon: Zap },
    { name: 'Music', icon: Music },
    { name: 'Gamepad2', icon: Gamepad2 },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'PiggyBank', icon: PiggyBank },
    { name: 'TrendingUp', icon: TrendingUp }
  ];
  
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
    setDefaultDates();
  });

  async function loadData() {
    try {
      isLoading = true;
      error = '';
      
      // Load all data in parallel
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
      notifications.add({
        type: 'error',
        message: 'Error al cargar los datos',
        timeout: 5000
      });
    } finally {
      isLoading = false;
    }
  }

  function setDefaultDates() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    formData.startDate = startOfMonth.toISOString().split('T')[0];
    formData.endDate = endOfMonth.toISOString().split('T')[0];
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (formData.mode === 'unified') {
      await createUnified();
    } else if (formData.mode === 'category') {
      if (editingItem) {
        await updateCategory();
      } else {
        await createCategory();
      }
    } else if (formData.mode === 'budget') {
      if (editingItem) {
        await updateBudget();
      } else {
        await createBudget();
      }
    }
  }

  async function createUnified() {
    // First create the category
    try {
      const categoryResponse = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          icon: formData.icon,
          color: formData.color
        })
      });

      if (categoryResponse.ok) {
        const categoryResult = await categoryResponse.json();
        
        if (categoryResult.success && formData.createBudget && formData.amount > 0) {
          // Then create the budget for this category
          const budgetResponse = await fetch('/api/budgets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `Presupuesto ${formData.name.trim()}`,
              categoryId: categoryResult.data.id.value || categoryResult.data.id,
              amount: formData.amount,
              period: formData.period,
              startDate: formData.startDate,
              endDate: formData.endDate || null
            })
          });

          if (budgetResponse.ok) {
            notifications.add({
              type: 'success',
              message: 'Categoría y presupuesto creados exitosamente',
              timeout: 3000
            });
          } else {
            notifications.add({
              type: 'warning',
              message: 'Categoría creada, pero hubo un error al crear el presupuesto',
              timeout: 5000
            });
          }
        } else {
          notifications.add({
            type: 'success',
            message: 'Categoría creada exitosamente',
            timeout: 3000
          });
        }

        await loadData();
        resetForm();
      } else {
        const errorResult = await categoryResponse.json().catch(() => ({ error: 'Error desconocido' }));
        notifications.add({
          type: 'error',
          message: `Error al crear la categoría: ${errorResult.error}`,
          timeout: 5000
        });
      }
    } catch (err) {
      console.error('Error creating unified:', err);
      notifications.add({
        type: 'error',
        message: 'Error al crear la categoría',
        timeout: 5000
      });
    }
  }

  async function createCategory() {
    if (!formData.name.trim()) {
      notifications.add({
        type: 'error',
        message: 'El nombre es obligatorio',
        timeout: 3000
      });
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          icon: formData.icon,
          color: formData.color
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notifications.add({
            type: 'success',
            message: 'Categoría creada exitosamente',
            timeout: 3000
          });
          await loadData();
          resetForm();
        } else {
          notifications.add({
            type: 'error',
            message: `Error al crear la categoría: ${result.error || 'Error desconocido'}`,
            timeout: 5000
          });
        }
      }
    } catch (err) {
      console.error('Error creating category:', err);
      notifications.add({
        type: 'error',
        message: 'Error al crear la categoría',
        timeout: 5000
      });
    }
  }

  async function createBudget() {
    if (!formData.name.trim() || !formData.amount || formData.amount <= 0) {
      notifications.add({
        type: 'error',
        message: 'Todos los campos son obligatorios y el monto debe ser mayor a 0',
        timeout: 3000
      });
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
          notifications.add({
            type: 'success',
            message: 'Presupuesto creado exitosamente',
            timeout: 3000
          });
          await loadData();
          resetForm();
        } else {
          notifications.add({
            type: 'error',
            message: `Error al crear el presupuesto: ${result.error || 'Error desconocido'}`,
            timeout: 5000
          });
        }
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      notifications.add({
        type: 'error',
        message: 'Error al crear el presupuesto',
        timeout: 5000
      });
    }
  }

  async function updateCategory() {
    if (!formData.name.trim()) {
      notifications.add({
        type: 'error',
        message: 'El nombre es obligatorio',
        timeout: 3000
      });
      return;
    }

    try {
      const categoryId = editingItem.id.value || editingItem.id;
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          icon: formData.icon,
          color: formData.color
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notifications.add({
            type: 'success',
            message: 'Categoría actualizada exitosamente',
            timeout: 3000
          });
          await loadData();
          resetForm();
        } else {
          notifications.add({
            type: 'error',
            message: `Error al actualizar la categoría: ${result.error || 'Error desconocido'}`,
            timeout: 5000
          });
        }
      }
    } catch (err) {
      console.error('Error updating category:', err);
      notifications.add({
        type: 'error',
        message: 'Error al actualizar la categoría',
        timeout: 5000
      });
    }
  }

  async function updateBudget() {
    if (!formData.name.trim() || !formData.amount || formData.amount <= 0) {
      notifications.add({
        type: 'error',
        message: 'Todos los campos son obligatorios y el monto debe ser mayor a 0',
        timeout: 3000
      });
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${editingItem.id}`, {
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
          notifications.add({
            type: 'success',
            message: 'Presupuesto actualizado exitosamente',
            timeout: 3000
          });
          await loadData();
          resetForm();
        } else {
          notifications.add({
            type: 'error',
            message: `Error al actualizar el presupuesto: ${result.error || 'Error desconocido'}`,
            timeout: 5000
          });
        }
      }
    } catch (err) {
      console.error('Error updating budget:', err);
      notifications.add({
        type: 'error',
        message: 'Error al actualizar el presupuesto',
        timeout: 5000
      });
    }
  }

  async function deleteCategory(category: any) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?\n\nEsto también afectará a todas las transacciones que tengan esta categoría asignada.`)) {
      return;
    }

    try {
      const categoryId = category.id.value || category.id;
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        notifications.add({
          type: 'success',
          message: 'Categoría eliminada exitosamente',
          timeout: 3000
        });
        await loadData();
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error desconocido' }));
        notifications.add({
          type: 'error',
          message: `Error al eliminar la categoría: ${errorResult.error}`,
          timeout: 5000
        });
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      notifications.add({
        type: 'error',
        message: 'Error al eliminar la categoría',
        timeout: 5000
      });
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
        notifications.add({
          type: 'success',
          message: 'Presupuesto eliminado exitosamente',
          timeout: 3000
        });
        await loadData();
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error desconocido' }));
        notifications.add({
          type: 'error',
          message: `Error al eliminar el presupuesto: ${errorResult.error}`,
          timeout: 5000
        });
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      notifications.add({
        type: 'error',
        message: 'Error al eliminar el presupuesto',
        timeout: 5000
      });
    }
  }

  function startEditingCategory(category: any) {
    editingItem = category;
    formData = {
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      categoryId: '',
      amount: 0,
      period: 'MONTHLY',
      startDate: '',
      endDate: '',
      createBudget: false,
      mode: 'category'
    };
    showCreateForm = true;
  }

  function startEditingBudget(budget: any) {
    editingItem = budget;
    formData = {
      name: budget.name,
      type: 'DISCRETIONARY_EXPENSE',
      icon: 'ShoppingCart',
      color: '#3B82F6',
      categoryId: budget.categoryId || '',
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate ? budget.endDate.split('T')[0] : '',
      createBudget: false,
      mode: 'budget'
    };
    showCreateForm = true;
  }

  function resetForm() {
    formData = {
      name: '',
      type: 'DISCRETIONARY_EXPENSE',
      icon: 'ShoppingCart',
      color: '#3B82F6',
      categoryId: '',
      amount: 0,
      period: 'MONTHLY',
      startDate: '',
      endDate: '',
      createBudget: false,
      mode: 'category'
    };
    showCreateForm = false;
    editingItem = null;
    setDefaultDates();
  }

  function startUnifiedCreation() {
    resetForm();
    formData.mode = 'unified';
    formData.createBudget = true;
    showCreateForm = true;
  }

  function startCategoryCreation() {
    resetForm();
    formData.mode = 'category';
    showCreateForm = true;
  }

  function startBudgetCreation() {
    resetForm();
    formData.mode = 'budget';
    showCreateForm = true;
  }

  function getIconComponent(iconName: string) {
    const iconObj = availableIcons.find(icon => icon.name === iconName);
    return iconObj ? iconObj.icon : ShoppingCart;
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

  // Derived values
  const filteredCategories = $derived(categories.filter(category => {
    if (filterType === 'all') return true;
    return category.type === filterType;
  }));

  // Watch for period changes
  $effect(() => {
    if (selectedPeriod) {
      loadData();
    }
  });
</script>

<svelte:head>
  <title>Gestión Financiera - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen bg-soft-white">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10 border-b border-warm">
    <div class="container-editorial">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
        <div>
          <h1 class="text-h3">Gestión Financiera</h1>
          <p class="text-body-small mt-1">Administra tus categorías y presupuestos de forma unificada</p>
        </div>
        <div class="flex gap-3">
          <button
            onclick={startUnifiedCreation}
            class="btn-editorial btn-primary flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            Crear Categoría + Presupuesto
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container-editorial py-6">
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-gray-600">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-green"></div>
          <span>Cargando datos...</span>
        </div>
      </div>
    {:else}
      <!-- Tab Navigation -->
      <div class="flex flex-wrap gap-1 bg-white rounded-lg p-1 border border-warm mb-6">
        <button
          onclick={() => activeTab = 'unified'}
          class="px-4 py-2 rounded-md text-sm font-medium transition-all {activeTab === 'unified' 
            ? 'bg-sage-green text-white shadow-sm' 
            : 'text-charcoal hover:text-sage-green hover:bg-sage-green/10'}"
        >
          Vista Unificada
        </button>
        <button
          onclick={() => activeTab = 'categories'}
          class="px-4 py-2 rounded-md text-sm font-medium transition-all {activeTab === 'categories' 
            ? 'bg-sage-green text-white shadow-sm' 
            : 'text-charcoal hover:text-sage-green hover:bg-sage-green/10'}"
        >
          Categorías ({categories.length})
        </button>
        <button
          onclick={() => activeTab = 'budgets'}
          class="px-4 py-2 rounded-md text-sm font-medium transition-all {activeTab === 'budgets' 
            ? 'bg-sage-green text-white shadow-sm' 
            : 'text-charcoal hover:text-sage-green hover:bg-sage-green/10'}"
        >
          Presupuestos ({budgets.length})
        </button>
      </div>

      <!-- Unified View -->
      {#if activeTab === 'unified'}
        <div class="space-y-6">
          <!-- Quick Actions -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onclick={startUnifiedCreation}
              class="card-editorial p-6 border-2 border-dashed border-sage-green/30 hover:border-sage-green/50 transition-all group text-left"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-sage-green/10 rounded-lg flex items-center justify-center group-hover:bg-sage-green/20 transition-colors">
                  <Plus class="w-6 h-6 text-sage-green" />
                </div>
                <div>
                  <h3 class="text-h5 group-hover:text-sage-green">Crear Conjunto</h3>
                  <p class="text-caption mt-1">Categoría + Presupuesto</p>
                </div>
              </div>
            </button>

            <button
              onclick={startCategoryCreation}
              class="card-editorial p-6 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all group text-left"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Filter class="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 class="text-h5 group-hover:text-blue-600">Solo Categoría</h3>
                  <p class="text-caption mt-1">Sin presupuesto</p>
                </div>
              </div>
            </button>

            <button
              onclick={startBudgetCreation}
              class="card-editorial p-6 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-all group text-left"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Target class="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 class="text-h5 group-hover:text-purple-600">Solo Presupuesto</h3>
                  <p class="text-caption mt-1">Para categoría existente</p>
                </div>
              </div>
            </button>
          </div>

          <!-- Categories with Budgets -->
          <div>
            <h3 class="text-h4 mb-4">Categorías con Presupuestos</h3>
            <div class="grid gap-4">
              {#each categories as category}
                {@const categoryId = category.id.value || category.id}
                {@const categoryBudgets = budgets.filter(b => b.categoryId === categoryId)}
                {@const IconComponent = getIconComponent(category.icon)}
                
                <div class="card-editorial p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-4">
                      <div 
                        class="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                        style="background-color: {category.color}"
                      >
                        <IconComponent class="w-6 h-6" />
                      </div>
                      <div>
                        <h4 class="text-h5">{category.name}</h4>
                        <p class="text-caption">{categoryTypes.find(t => t.value === category.type)?.label || category.type}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        onclick={() => startEditingCategory(category)}
                        class="w-8 h-8 rounded-lg border border-warm hover:bg-warm/50 flex items-center justify-center transition-colors"
                        title="Editar categoría"
                      >
                        <Edit class="w-4 h-4" />
                      </button>
                      <button
                        onclick={() => deleteCategory(category)}
                        class="w-8 h-8 rounded-lg border border-warm hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center transition-colors"
                        title="Eliminar categoría"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Associated Budgets -->
                  {#if categoryBudgets.length > 0}
                    <div class="space-y-3">
                      <h5 class="text-sm font-medium text-gray-600">Presupuestos asociados:</h5>
                      {#each categoryBudgets as budget}
                        {@const spent = getCategorySpending(budget.categoryId)}
                        {@const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0}
                        {@const status = getBudgetStatus(budget)}
                        
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-sm font-medium">{budget.name}</span>
                              <div class="flex items-center gap-2">
                                <span class="text-sm {status.color}">
                                  {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                                </span>
                                <button
                                  onclick={() => startEditingBudget(budget)}
                                  class="w-6 h-6 rounded hover:bg-white flex items-center justify-center"
                                  title="Editar presupuesto"
                                >
                                  <Edit class="w-3 h-3" />
                                </button>
                                <button
                                  onclick={() => deleteBudget(budget)}
                                  class="w-6 h-6 rounded hover:bg-white hover:text-red-600 flex items-center justify-center"
                                  title="Eliminar presupuesto"
                                >
                                  <Trash2 class="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                class="h-2 rounded-full {status.status === 'over' ? 'bg-red-500' : status.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'}"
                                style="width: {Math.min(percentage, 100)}%"
                              ></div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p class="text-sm text-blue-700">
                        Esta categoría no tiene presupuestos asociados.
                        <button
                          onclick={() => {
                            formData.categoryId = categoryId;
                            formData.name = `Presupuesto ${category.name}`;
                            formData.mode = 'budget';
                            showCreateForm = true;
                          }}
                          class="underline hover:no-underline"
                        >
                          Crear uno ahora
                        </button>
                      </p>
                    </div>
                  {/if}
                </div>
              {/each}

              {#if categories.length === 0}
                <div class="text-center py-12">
                  <Filter class="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p class="text-gray-600">No hay categorías creadas</p>
                  <button
                    onclick={startUnifiedCreation}
                    class="btn-editorial btn-primary mt-4"
                  >
                    Crear tu primera categoría
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Categories Tab -->
      {#if activeTab === 'categories'}
        <div class="space-y-6">
          <!-- Filters -->
          <div class="flex flex-wrap gap-2">
            <select 
              bind:value={filterType}
              class="input-editorial"
            >
              <option value="all">Todas las categorías</option>
              {#each categoryTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
            <button
              onclick={startCategoryCreation}
              class="btn-editorial btn-primary flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              Nueva Categoría
            </button>
          </div>

          <!-- Categories Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {#each filteredCategories as category}
              {@const IconComponent = getIconComponent(category.icon)}
              {@const categoryType = categoryTypes.find(t => t.value === category.type)}
              
              <div 
                class="card-editorial p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex items-center justify-between mb-3">
                  <div 
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style="background-color: {category.color}"
                  >
                    <IconComponent class="w-5 h-5" />
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      onclick={() => startEditingCategory(category)}
                      class="w-8 h-8 rounded-lg border border-warm hover:bg-warm/50 flex items-center justify-center transition-colors"
                      title="Editar"
                    >
                      <Edit class="w-3 h-3" />
                    </button>
                    <button
                      onclick={() => deleteCategory(category)}
                      class="w-8 h-8 rounded-lg border border-warm hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <h3 class="text-h6 mb-1">{category.name}</h3>
                <p class="text-caption" style="color: {categoryType?.color || '#6B7280'}">{categoryType?.label || category.type}</p>
              </div>
            {/each}
          </div>

          {#if filteredCategories.length === 0}
            <div class="text-center py-12">
              <Filter class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-600">
                {filterType === 'all' ? 'No hay categorías creadas' : 'No hay categorías de este tipo'}
              </p>
              <button
                onclick={startCategoryCreation}
                class="btn-editorial btn-primary mt-4"
              >
                Crear categoría
              </button>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Budgets Tab -->
      {#if activeTab === 'budgets'}
        <div class="space-y-6">
          <!-- Controls -->
          <div class="flex flex-col sm:flex-row gap-4 justify-between">
            <select
              bind:value={selectedPeriod}
              class="input-editorial max-w-xs"
            >
              {#each periodOptions as period}
                <option value={period.value}>{period.label}</option>
              {/each}
            </select>
            <button
              onclick={startBudgetCreation}
              class="btn-editorial btn-primary flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              Nuevo Presupuesto
            </button>
          </div>

          <!-- Budgets Grid -->
          <div class="grid gap-4">
            {#each budgets as budget}
              {@const spent = budget.categoryId ? getCategorySpending(budget.categoryId) : 
                            categorySpending.reduce((total, s) => total + s.amount, 0)}
              {@const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0}
              {@const status = getBudgetStatus(budget)}
              
              <div class="card-editorial p-6">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="text-h5">{budget.name}</h3>
                    <p class="text-caption mt-1">
                      {getCategoryName(budget.categoryId)} · {budgetPeriods.find(p => p.value === budget.period)?.label}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      onclick={() => startEditingBudget(budget)}
                      class="w-8 h-8 rounded-lg border border-warm hover:bg-warm/50 flex items-center justify-center transition-colors"
                      title="Editar"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      onclick={() => deleteBudget(budget)}
                      class="w-8 h-8 rounded-lg border border-warm hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Progreso</span>
                    <span class="text-sm font-medium {status.color}">
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      class="h-3 rounded-full {status.status === 'over' ? 'bg-red-500' : status.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'} transition-all"
                      style="width: {Math.min(percentage, 100)}%"
                    ></div>
                  </div>
                  
                  <div class="flex items-center justify-between text-sm">
                    <span class="{status.color}">
                      {percentage.toFixed(1)}% usado
                    </span>
                    <span class="text-gray-600">
                      {percentage >= 100 ? 'Excedido' : `${formatCurrency(budget.amount - spent)} restante`}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          {#if budgets.length === 0}
            <div class="text-center py-12">
              <Target class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-600">No hay presupuestos creados</p>
              <button
                onclick={startBudgetCreation}
                class="btn-editorial btn-primary mt-4"
              >
                Crear primer presupuesto
              </button>
            </div>
          {/if}
        </div>
      {/if}
    {/if}

    <!-- Create/Edit Form Modal -->
    {#if showCreateForm}
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-h4">
              {#if formData.mode === 'unified'}
                {editingItem ? 'Editar' : 'Crear'} Categoría + Presupuesto
              {:else if formData.mode === 'category'}
                {editingItem ? 'Editar' : 'Crear'} Categoría
              {:else}
                {editingItem ? 'Editar' : 'Crear'} Presupuesto
              {/if}
            </h3>
            <button
              onclick={resetForm}
              class="w-8 h-8 rounded-lg border border-warm hover:bg-warm/50 flex items-center justify-center transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <form onsubmit={handleSubmit} class="space-y-4">
            <!-- Category fields (for category and unified modes) -->
            {#if formData.mode === 'category' || formData.mode === 'unified'}
              <div>
                <label for="category-name" class="block text-caption mb-2">Nombre de la categoría *</label>
                <input
                  id="category-name"
                  type="text"
                  class="input-editorial w-full"
                  placeholder="Ej. Alimentación, Transporte..."
                  bind:value={formData.name}
                  required
                />
              </div>

              <div>
                <label for="category-type" class="block text-caption mb-2">Tipo de categoría *</label>
                <select
                  id="category-type"
                  bind:value={formData.type}
                  class="input-editorial w-full"
                  required
                >
                  {#each categoryTypes as type}
                    <option value={type.value}>{type.label}</option>
                  {/each}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="category-icon" class="block text-caption mb-2">Icono</label>
                  <select
                    id="category-icon"
                    bind:value={formData.icon}
                    class="input-editorial w-full"
                  >
                    {#each availableIcons as icon}
                      <option value={icon.name}>{icon.name}</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label for="category-color" class="block text-caption mb-2">Color</label>
                  <div class="flex items-center gap-2">
                    <input
                      id="category-color"
                      type="color"
                      class="w-full h-10 rounded-lg border border-warm cursor-pointer"
                      bind:value={formData.color}
                    />
                  </div>
                </div>
              </div>
            {/if}

            <!-- Budget creation toggle (for unified mode) -->
            {#if formData.mode === 'unified'}
              <div class="border-t border-warm pt-4">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    class="rounded border-gray-300"
                    bind:checked={formData.createBudget}
                  />
                  <span class="text-sm font-medium">Crear presupuesto para esta categoría</span>
                </label>
              </div>
            {/if}

            <!-- Budget fields (for budget mode, or unified mode with createBudget enabled) -->
            {#if formData.mode === 'budget' || (formData.mode === 'unified' && formData.createBudget)}
              <div class="space-y-4 {formData.mode === 'unified' ? 'border-t border-warm pt-4' : ''}">
                {#if formData.mode === 'budget'}
                  <div>
                    <label for="budget-name" class="block text-caption mb-2">Nombre del presupuesto *</label>
                    <input
                      id="budget-name"
                      type="text"
                      class="input-editorial w-full"
                      placeholder="Ej. Presupuesto Alimentación..."
                      bind:value={formData.name}
                      required
                    />
                  </div>

                  <div>
                    <label for="budget-category" class="block text-caption mb-2">Categoría</label>
                    <select
                      id="budget-category"
                      bind:value={formData.categoryId}
                      class="input-editorial w-full"
                    >
                      <option value="">Todas las categorías</option>
                      {#each categories as category}
                        <option value={category.id.value || category.id}>{category.name}</option>
                      {/each}
                    </select>
                  </div>
                {/if}

                <div>
                  <label for="budget-amount" class="block text-caption mb-2">Monto *</label>
                  <input
                    id="budget-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input-editorial w-full"
                    placeholder="0.00"
                    bind:value={formData.amount}
                    required
                  />
                </div>

                <div>
                  <label for="budget-period" class="block text-caption mb-2">Período</label>
                  <select
                    id="budget-period"
                    bind:value={formData.period}
                    class="input-editorial w-full"
                  >
                    {#each budgetPeriods as period}
                      <option value={period.value}>{period.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="budget-start" class="block text-caption mb-2">Fecha inicio</label>
                    <input
                      id="budget-start"
                      type="date"
                      class="input-editorial w-full"
                      bind:value={formData.startDate}
                      required
                    />
                  </div>

                  <div>
                    <label for="budget-end" class="block text-caption mb-2">Fecha fin (opcional)</label>
                    <input
                      id="budget-end"
                      type="date"
                      class="input-editorial w-full"
                      bind:value={formData.endDate}
                    />
                  </div>
                </div>
              </div>
            {/if}

            <!-- Form Actions -->
            <div class="flex gap-3 pt-4 border-t border-warm">
              <button
                type="button"
                onclick={resetForm}
                class="btn-editorial btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-editorial btn-primary flex-1"
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
</div>