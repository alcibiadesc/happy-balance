<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Edit, Trash2, Check, X, Home, ShoppingCart, Coffee, Car, Plane, Heart, Briefcase, Gift, Zap, Music, Gamepad2, Filter, AlertCircle, CreditCard, PiggyBank, TrendingUp, Eye, EyeOff } from 'lucide-svelte';
  import { notifications } from '$lib/shared/stores/notifications.js';
  
  let categories = $state([]);
  let isLoading = $state(true);
  let error = $state('');
  let showCreateForm = $state(false);
  let editingCategory = $state(null);
  let filterType = $state('all');
  
  // Form data
  let formData = $state({
    name: '',
    type: 'DISCRETIONARY_EXPENSE',
    icon: 'Home',
    color: '#3B82F6'
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

  onMount(() => {
    loadCategories();
  });

  async function loadCategories() {
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch('/api/categories?includeInactive=true');
      const result = await response.json();
      
      if (result.success) {
        categories = result.data;
      } else {
        error = result.error || 'Error al cargar categorías';
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      error = 'Error de conexión';
    } finally {
      isLoading = false;
    }
  }

  async function createCategory() {
    if (!formData.name.trim()) {
      notifications.error('El nombre de la categoría es obligatorio');
      return;
    }

    try {
      const selectedTypeData = categoryTypes.find(t => t.value === formData.type);
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          icon: formData.icon,
          color: selectedTypeData?.color || formData.color
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadCategories();
          resetForm();
          error = ''; // Clear any previous errors
          notifications.success('Categoría creada exitosamente');
        } else {
          error = result.error || 'Error desconocido';
        }
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error de red' }));
        error = errorResult.error || 'Error de red';
      }
    } catch (err) {
      console.error('Error creating category:', err);
      error = 'Error de conexión. Por favor intenta de nuevo.';
    }
  }

  async function updateCategory() {
    if (!formData.name.trim()) {
      notifications.error('El nombre de la categoría es obligatorio');
      return;
    }

    try {
      const selectedTypeData = categoryTypes.find(t => t.value === formData.type);
      
      const response = await fetch(`/api/categories/${editingCategory.id.value || editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          icon: formData.icon,
          color: selectedTypeData?.color || formData.color
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadCategories();
          resetForm();
          notifications.success('Categoría actualizada exitosamente');
        } else {
          notifications.error(`Error al actualizar la categoría: ${result.error || 'Error desconocido'}`);
        }
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error de red' }));
        notifications.error(`Error al actualizar la categoría: ${errorResult.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error updating category:', err);
      notifications.error('Error al actualizar la categoría');
    }
  }

  async function deleteCategory(category: any) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?\n\nEsto también afectará a todas las transacciones que tengan esta categoría asignada.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id.value || category.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCategories();
        notifications.success('Categoría eliminada exitosamente');
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Error desconocido' }));
        notifications.error(`Error al eliminar la categoría: ${errorResult.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      notifications.error('Error al eliminar la categoría');
    }
  }

  function startEditing(category: any) {
    editingCategory = category;
    formData = {
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color
    };
    showCreateForm = true;
  }

  function openCreateForm() {
    resetForm();
    showCreateForm = true;
    error = ''; // Clear any errors when opening form
  }

  function resetForm() {
    formData = {
      name: '',
      type: 'DISCRETIONARY_EXPENSE',
      icon: 'Home',
      color: '#3B82F6'
    };
    showCreateForm = false;
    editingCategory = null;
    error = ''; // Clear any errors when form is closed
  }

  async function toggleCategoryVisibility(category) {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !category.isActive
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          const categoryIndex = categories.findIndex(c => c.id === category.id);
          if (categoryIndex !== -1) {
            categories[categoryIndex] = { ...categories[categoryIndex], isActive: !category.isActive };
          }
        } else {
          error = result.error || 'Error al cambiar visibilidad';
        }
      } else {
        error = 'Error de conexión al cambiar visibilidad';
      }
    } catch (err) {
      console.error('Error toggling category visibility:', err);
      error = 'Error de conexión. Por favor intenta de nuevo.';
    }
  }

  const filteredCategories = $derived(
    filterType === 'all' 
      ? categories 
      : categories.filter(cat => cat.type === filterType)
  );

  function getCategoryTypeInfo(type: string) {
    return categoryTypes.find(t => t.value === type) || categoryTypes[1];
  }
</script>

<svelte:head>
  <title>Gestión de Categorías - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen" style="background-color: var(--color-background-primary);">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10" style="border-color: var(--color-border-primary); background-color: var(--color-background-elevated);">
    <div class="container-editorial">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
        <div>
          <h1 class="text-h3" style="color: var(--color-text-primary);">Gestión de Categorías</h1>
          <p class="text-secondary mt-1">
            Organiza y personaliza tus categorías de transacciones
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button 
            class="btn-primary gap-2"
            onclick={openCreateForm}
          >
            <Plus class="w-4 h-4" />
            Nueva Categoría
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container-editorial py-6">
    <!-- Filter by Type -->
    <div class="card-editorial p-4 mb-6">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            class="px-3 py-1.5 text-sm rounded-full transition-colors {
              filterType === 'all'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'text-secondary hover:text-primary'
            }"
            onclick={() => filterType = 'all'}
          >
            Todas ({categories.length})
          </button>
          {#each categoryTypes as type}
            <button
              class="px-3 py-1.5 text-sm rounded-full transition-colors {
                filterType === type.value
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'text-secondary hover:text-primary'
              }"
              onclick={() => filterType = type.value}
            >
{type.label} ({categories.filter(cat => cat.type === type.value).length})
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Create/Edit Form -->
    {#if showCreateForm}
      <div class="card-editorial p-6 mb-6 border-l-4 border-indigo-500">
        <h2 class="text-h4 mb-4">
          {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
        </h2>
        
        <!-- Error Message -->
        {#if error}
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm text-red-700 font-medium">Error</p>
              <p class="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        {/if}
        
        <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); editingCategory ? updateCategory() : createCategory(); }}>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Name -->
            <div>
              <label for="category-name" class="block text-caption mb-2">Nombre *</label>
              <input
                id="category-name"
                type="text"
                bind:value={formData.name}
                placeholder="Nombre de la categoría"
                class="input-editorial"
                required
              />
            </div>

            <!-- Type -->
            <div>
              <label for="category-type" class="block text-caption mb-2">Tipo *</label>
              <select 
                id="category-type"
                bind:value={formData.type}
                class="input-editorial"
                onchange={() => {
                  const selectedType = categoryTypes.find(t => t.value === formData.type);
                  if (selectedType) {
                    formData.color = selectedType.color;
                  }
                }}
              >
                {#each categoryTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Icon Selection -->
          <div>
            <fieldset class="space-y-2">
              <legend class="block text-caption mb-2">Icono</legend>
              <div class="grid grid-cols-8 sm:grid-cols-11 gap-2">
              {#each availableIcons as iconOption}
                {@const IconComponent = iconOption.icon}
                <button
                  type="button"
                  class="p-3 rounded-lg border-2 transition-all hover:border-indigo-300 hover:bg-indigo-50 {
                    formData.icon === iconOption.name 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }"
                  onclick={() => formData.icon = iconOption.name}
                >
                  <IconComponent class="w-5 h-5 mx-auto" style="color: {formData.color}" />
                </button>
              {/each}
              </div>
            </fieldset>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              class="btn-primary gap-2"
            >
              <Check class="w-4 h-4" />
              {editingCategory ? 'Actualizar' : 'Crear'} Categoría
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

    <!-- Categories Grid -->
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-gray-600">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span>Cargando categorías...</span>
        </div>
      </div>
    {:else if error}
      <div class="card-editorial p-8 text-center">
        <div class="status-error mb-4">{error}</div>
        <button 
          onclick={loadCategories}
          class="btn-primary"
        >
          Reintentar
        </button>
      </div>
    {:else if filteredCategories.length === 0}
      <div class="card-editorial p-8 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-h4 mb-2">
          {filterType === 'all' ? 'No hay categorías' : 'No hay categorías de este tipo'}
        </h3>
        <p class="text-body mb-4 max-w-md mx-auto">
          {filterType === 'all' 
            ? 'Crea tu primera categoría para empezar a organizar tus transacciones.'
            : 'No se encontraron categorías del tipo seleccionado.'
          }
        </p>
        <button 
          onclick={() => {
            if (filterType !== 'all') {
              formData.type = filterType;
              const selectedType = categoryTypes.find(t => t.value === filterType);
              if (selectedType) {
                formData.color = selectedType.color;
              }
            }
            showCreateForm = true;
          }}
          class="btn-primary gap-2"
        >
          <Plus class="w-4 h-4" />
          Crear Categoría
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each filteredCategories as category}
          {@const IconComponent = availableIcons.find(i => i.name === category.icon)?.icon || Home}
          <div class="card-editorial p-4 hover:shadow-md transition-shadow border-l-4 {!category.isActive ? 'opacity-60 bg-gray-50' : ''}" style="border-left-color: {category.color}">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: {category.color}20">
                  <IconComponent 
                    class="w-5 h-5" 
                    style="color: {category.color}" 
                  />
                </div>
                <div>
                  <h3 class="font-medium text-gray-900">{category.name}</h3>
                  <p class="text-xs text-gray-500">{getCategoryTypeInfo(category.type).label}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-1">
                <button
                  onclick={() => toggleCategoryVisibility(category)}
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={category.isActive ? "Ocultar categoría" : "Mostrar categoría"}
                >
                  {#if category.isActive}
                    <Eye class="w-4 h-4" />
                  {:else}
                    <EyeOff class="w-4 h-4" />
                  {/if}
                </button>
                <button
                  onclick={() => startEditing(category)}
                  class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar categoría"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  onclick={() => deleteCategory(category)}
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar categoría"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{getCategoryTypeInfo(category.type).label}</span>
              <span class="px-2 py-1 bg-gray-100 rounded-full">
                {category.transactionCount || 0} transacciones
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>