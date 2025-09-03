<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Hash, Plus, Edit3, Trash2, ArrowLeft } from 'lucide-svelte';

  let categories = $state([]);
  let searchQuery = $state('');
  let selectedType = $state('ALL');
  let showCreateModal = $state(false);
  let editingCategory = $state(null);
  let isLoading = $state(true);
  let error = $state('');
  
  // Constants for colors and icons
  const NOTION_COLORS = [
    { name: 'Blue', value: '#3B82F6', bg: '#EFF6FF' },
    { name: 'Green', value: '#10B981', bg: '#ECFDF5' },
    { name: 'Red', value: '#EF4444', bg: '#FEF2F2' },
    { name: 'Orange', value: '#F59E0B', bg: '#FFFBEB' },
    { name: 'Purple', value: '#8B5CF6', bg: '#F5F3FF' },
    { name: 'Pink', value: '#EC4899', bg: '#FDF2F8' },
    { name: 'Indigo', value: '#6366F1', bg: '#EEF2FF' },
    { name: 'Teal', value: '#14B8A6', bg: '#F0FDFA' }
  ];
  
  const NOTION_ICONS = [
    '💰', '💸', '🏠', '🍽️', '🚗', '🎨', '🎥', '📚', '✈️', '💼', '🏥', '💱', '📈', '🎆', '⚡', '🎭', '🛍️', '🎆'
  ];
  
  const CategoryType = {
    INCOME: 'INCOME',
    ESSENTIAL_EXPENSE: 'ESSENTIAL_EXPENSE',
    DISCRETIONARY_EXPENSE: 'DISCRETIONARY_EXPENSE',
    DEBT_PAYMENT: 'DEBT_PAYMENT',
    SAVINGS: 'SAVINGS',
    INVESTMENT: 'INVESTMENT'
  };

  // New category form
  let newCategory = $state({
    name: '',
    type: 'DISCRETIONARY_EXPENSE',
    color: NOTION_COLORS[0].value,
    icon: NOTION_ICONS[0]
  });
  
  // Load categories from API
  async function loadCategories() {
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch('/api/categories');
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

  // Filtered categories
  let filteredCategories = $derived(
    categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || category.type === selectedType;
      return matchesSearch && matchesType;
    })
  );

  // Group categories by type
  let groupedCategories = $derived(
    filteredCategories.reduce((acc, category) => {
      if (!acc[category.type]) acc[category.type] = [];
      acc[category.type].push(category);
      return acc;
    }, {})
  );

  function openCreateModal() {
    showCreateModal = true;
    newCategory = {
      name: '',
      type: 'DISCRETIONARY_EXPENSE',
      color: NOTION_COLORS[0].value,
      icon: NOTION_ICONS[0]
    };
  }

  function openEditModal(category) {
    editingCategory = category;
    newCategory = {
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    };
    showCreateModal = true;
  }

  function closeModal() {
    showCreateModal = false;
    editingCategory = null;
  }

  async function saveCategory() {
    if (!newCategory.name.trim()) return;

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          type: newCategory.type,
          color: newCategory.color,
          icon: newCategory.icon,
          isActive: true
        })
      });
      
      if (response.ok) {
        await loadCategories(); // Reload categories
        closeModal();
      } else {
        const result = await response.json();
        error = result.error || 'Error al guardar categoría';
      }
    } catch (err) {
      console.error('Error saving category:', err);
      error = 'Error de conexión al guardar';
    }
  }

  async function deleteCategory(category) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadCategories(); // Reload categories
      } else {
        alert('Error al eliminar la categoría');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error de conexión al eliminar');
    }
  }

  function getTypeLabel(type) {
    const labels = {
      'INCOME': 'Ingresos',
      'ESSENTIAL_EXPENSE': 'Gastos Esenciales',
      'DISCRETIONARY_EXPENSE': 'Gastos Discrecionales',
      'DEBT_PAYMENT': 'Pagos de Deuda',
      'SAVINGS': 'Ahorros',
      'INVESTMENT': 'Inversiones'
    };
    return labels[type] || type;
  }

  function getTypeColor(type) {
    const colors = {
      'INCOME': '#10B981',
      'ESSENTIAL_EXPENSE': '#EF4444',
      'DISCRETIONARY_EXPENSE': '#F59E0B',
      'DEBT_PAYMENT': '#EF4444',
      'SAVINGS': '#3B82F6',
      'INVESTMENT': '#8B5CF6'
    };
    return colors[type] || '#6B7280';
  }

  function getColorClasses(color) {
    const colorConfig = NOTION_COLORS.find(c => c.value === color) || NOTION_COLORS[0];
    return {
      bg: colorConfig.bg,
      text: colorConfig.value,
      border: colorConfig.value + '40'
    };
  }
  
  onMount(() => {
    loadCategories();
  });
</script>

<svelte:head>
  <title>Gestión de Categorías - Expense Tracker</title>
</svelte:head>

<!-- Main Content -->
<div class="p-6">
  <!-- Page Header -->
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Categorías</h1>
        <p class="text-gray-600">Organiza tus gastos e ingresos</p>
      </div>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        onclick={openCreateModal}
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">Nueva</span>
      </button>
    </div>
  </div>
    <!-- Search and Filter Bar -->
    <div class="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
      <div class="flex-1 relative">
        <Hash class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          bind:value={searchQuery}
          placeholder="Buscar categorías..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div class="sm:w-48">
        <select
          bind:value={selectedType}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">Todos los tipos</option>
          {#each Object.values(CategoryType) as type}
            <option value={type}>{getTypeLabel(type)}</option>
          {/each}
        </select>
      </div>
    </div>

    {#if isLoading}
      <!-- Loading State -->
      <div class="animate-pulse space-y-6">
        {#each Array(3) as _}
          <div class="bg-gray-200 h-48 rounded-lg"></div>
        {/each}
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="bg-white rounded-lg border border-red-200 p-6 text-center">
        <p class="text-red-600 mb-4">{error}</p>
        <button onclick={loadCategories} class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          Reintentar
        </button>
      </div>
    {:else if Object.keys(groupedCategories).length === 0}
      <!-- Empty State -->
      <div class="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Hash class="w-8 h-8 text-gray-400" />
        </div>
        <h2 class="text-lg sm:text-xl font-medium text-gray-900 mb-2">No se encontraron categorías</h2>
        <p class="text-gray-600 mb-6 max-w-md mx-auto">
          Crea tu primera categoría o ajusta los filtros de búsqueda
        </p>
        <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors" onclick={openCreateModal}>
          Crear Primera Categoría
        </button>
      </div>
    {:else}
      <!-- Categories List -->
      <div class="space-y-8">
        {#each Object.entries(groupedCategories) as [type, typeCategories]}
          <section class="bg-white rounded-lg border border-gray-200 p-6">
            <header class="flex items-center gap-3 mb-6">
              <div 
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                style="background-color: {getTypeColor(type)}20; color: {getTypeColor(type)};"
              >
                <Hash class="w-4 h-4" />
              </div>
              <h2 class="text-lg font-semibold text-gray-900">{getTypeLabel(type)}</h2>
              <span class="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {typeCategories.length} {typeCategories.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </header>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each typeCategories as category}
                <div 
                  class="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm"
                  style="background-color: {getColorClasses(category.color).bg};"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <span class="text-xl">{category.icon}</span>
                      <div>
                        <div class="font-medium text-gray-900">{category.name}</div>
                        <div 
                          class="w-3 h-3 rounded-full mt-1"
                          style="background-color: {category.color};"
                        ></div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        class="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                        onclick={() => openEditModal(category)}
                        title="Editar {category.name}"
                      >
                        <Edit3 class="w-3 h-3" />
                      </button>
                      <button
                        class="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                        onclick={() => deleteCategory(category)}
                        title="Eliminar {category.name}"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div class="text-xs text-gray-500">
                    Creada {new Date(category.createdAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
  <div 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
    onclick={closeModal}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
    role="button"
    aria-label="Close modal"
    tabindex="0"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full" 
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header class="p-6 border-b border-gray-200">
        <h3 id="modal-title" class="text-lg font-semibold text-gray-900">
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>
      </header>
      
      <div class="p-6 space-y-6">
        <!-- Name -->
        <div>
          <label for="category-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
          <input
            id="category-name"
            bind:value={newCategory.name}
            placeholder="Nombre de la categoría"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <!-- Type -->
        <div>
          <label for="category-type" class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select id="category-type" bind:value={newCategory.type} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            {#each Object.values(CategoryType) as type}
              <option value={type}>{getTypeLabel(type)}</option>
            {/each}
          </select>
        </div>
        
        <!-- Color -->
        <div>
          <label id="color-label" class="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="color-label">
            {#each NOTION_COLORS as color}
              <button
                class={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color.value ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                style="background-color: {color.value};"
                onclick={() => newCategory.color = color.value}
                role="radio"
                aria-checked={newCategory.color === color.value}
                aria-label="Color {color.name}"
              ></button>
            {/each}
          </div>
        </div>
        
        <!-- Icon -->
        <div>
          <label id="icon-label" class="block text-sm font-medium text-gray-700 mb-2">Icono</label>
          <div class="grid grid-cols-8 gap-1" role="radiogroup" aria-labelledby="icon-label">
            {#each NOTION_ICONS as icon}
              <button
                class={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${newCategory.icon === icon ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                onclick={() => newCategory.icon = icon}
                role="radio"
                aria-checked={newCategory.icon === icon}
                aria-label="Icon {icon}"
              >
                <span class="text-lg">{icon}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
      
      <footer class="p-6 border-t border-gray-200 flex justify-end gap-3">
        <button class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onclick={closeModal}>
          Cancelar
        </button>
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onclick={saveCategory}
          disabled={!newCategory.name.trim()}
        >
          {editingCategory ? 'Actualizar' : 'Crear'} Categoría
        </button>
      </footer>
    </div>
  </div>
{/if}