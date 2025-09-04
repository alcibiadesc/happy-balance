<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Plus, Check, X, Home, ShoppingCart, Coffee, Car, Plane, Heart, Briefcase, Gift, Zap, Music, Gamepad2 } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  let {
    currentCategory = null,
    isOpen = false,
    categories = [],
    transaction = null,
    showAllCategories = false
  } = $props();
  
  let newCategoryName = '';
  let newCategoryType = 'DISCRETIONARY_EXPENSE';
  let showNewCategoryForm = false;
  let dropdownElement: HTMLElement;
  let buttonElement: HTMLElement;
  let dropdownPosition = 'bottom'; // 'bottom' or 'top'
  let showSmartOptions = false;
  let pendingCategory: any = null;
  let smartAction = 'single'; // 'single', 'similar_existing', 'similar_future', 'all_future'
  let searchTerm = '';
  let searchInputElement: HTMLInputElement;
  
  // Category types with labels
  const categoryTypes = [
    { value: 'INCOME', label: 'Ingresos', color: '#059669' },
    { value: 'ESSENTIAL_EXPENSE', label: 'Gastos Esenciales', color: '#DC2626' },
    { value: 'DISCRETIONARY_EXPENSE', label: 'Gastos Discrecionales', color: '#D97706' },
    { value: 'DEBT_PAYMENT', label: 'Pagos de Deuda', color: '#7C2D12' },
    { value: 'SAVINGS', label: 'Ahorros', color: '#4F46E5' },
    { value: 'INVESTMENT', label: 'Inversiones', color: '#7C3AED' },
    { value: 'OMIT', label: 'Omitir', color: '#6B7280' }
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
    { name: 'Gamepad2', icon: Gamepad2 }
  ];
  
  let selectedIcon = availableIcons[0];
  
  function selectCategory(category: any) {
    // If transaction is provided and category changed, show smart options
    if (transaction && currentCategory?.id !== category?.id) {
      pendingCategory = category;
      showSmartOptions = true;
      return;
    }
    
    // Direct selection without smart options
    dispatch('select', category);
    isOpen = false;
  }
  
  function applySmartSelection() {
    if (!pendingCategory) return;
    
    dispatch('smartSelect', {
      category: pendingCategory,
      action: smartAction,
      transaction: transaction
    });
    
    // Reset state
    showSmartOptions = false;
    pendingCategory = null;
    smartAction = 'single';
    isOpen = false;
  }
  
  function cancelSmartSelection() {
    showSmartOptions = false;
    pendingCategory = null;
    smartAction = 'single';
  }
  
  function createNewCategory() {
    if (newCategoryName.trim()) {
      const selectedTypeData = categoryTypes.find(t => t.value === newCategoryType);
      dispatch('create', {
        name: newCategoryName.trim(),
        type: newCategoryType,
        icon: selectedIcon.name,
        color: selectedTypeData?.color || '#6366f1'
      });
      newCategoryName = '';
      showNewCategoryForm = false;
      isOpen = false;
    }
  }
  
  function clearCategory() {
    dispatch('select', null);
    isOpen = false;
  }
  
  function calculateDropdownPosition() {
    if (!buttonElement || !dropdownElement) return;
    
    const buttonRect = buttonElement.getBoundingClientRect();
    const dropdownHeight = 320; // Approximate max height
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // If there's not enough space below and more space above, position on top
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      dropdownPosition = 'top';
    } else {
      dropdownPosition = 'bottom';
    }
  }
  
  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      // Calculate position after the dropdown is opened
      setTimeout(() => {
        calculateDropdownPosition();
        // Focus on search input when opening
        if (searchInputElement) {
          searchInputElement.focus();
        }
      }, 0);
      searchTerm = '';
    }
  }
  
  // Filter categories based on search term and transaction type
  const filteredCategoriesByType = $derived.by(() => {
    let baseCategories = categories;
    
    // Filter by transaction type if applicable
    if (transaction && !showAllCategories) {
      const isIncome = transaction.amount > 0;
      
      if (isIncome) {
        // For income transactions, show INCOME, SAVINGS, INVESTMENT, and OMIT categories
        baseCategories = categories.filter(cat => 
          cat.type === 'INCOME' || 
          cat.type === 'SAVINGS' || 
          cat.type === 'INVESTMENT' ||
          cat.type === 'OMIT'
        );
      } else {
        // For expense transactions, show expense-related and OMIT categories
        baseCategories = categories.filter(cat => 
          cat.type === 'ESSENTIAL_EXPENSE' ||
          cat.type === 'DISCRETIONARY_EXPENSE' ||
          cat.type === 'DEBT_PAYMENT' ||
          cat.type === 'OMIT'
        );
      }
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      return baseCategories.filter(cat => 
        cat.name.toLowerCase().includes(search) ||
        categoryTypes.find(t => t.value === cat.type)?.label.toLowerCase().includes(search)
      );
    }
    
    return baseCategories;
  });
  
  // Check if we have filtered categories (to show the toggle button)
  const hasFilteredCategories = $derived.by(() => {
    if (!transaction) return false;
    return filteredCategoriesByType.length < categories.length;
  });
</script>

<div class="relative">
  <!-- Category Display Button -->
  <button
    bind:this={buttonElement}
    class="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 text-sm"
    onclick={toggleDropdown}
  >
    {#if currentCategory}
      <svelte:component this={availableIcons.find(i => i.name === currentCategory.icon)?.icon || Home} class="w-4 h-4" style="color: {currentCategory.color || '#6b7280'}" />
      <span class="text-gray-900">{currentCategory.name}</span>
    {:else}
      <div class="w-4 h-4 rounded border border-dashed border-gray-300"></div>
      <span class="text-gray-500">Sin categoría</span>
    {/if}
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div 
      bind:this={dropdownElement}
      class="absolute {dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      <div class="p-2 max-h-80 overflow-y-auto">
        <!-- Clear Category Option -->
        <button
          class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm transition-colors"
          onclick={clearCategory}
        >
          <div class="w-4 h-4 rounded border border-dashed border-gray-300"></div>
          <span class="text-gray-500">Sin categoría</span>
        </button>
        
        <div class="border-t border-gray-100 my-2"></div>
        
        <!-- Existing Categories -->
        {#each filteredCategoriesByType as category}
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm transition-colors {currentCategory?.id === category.id ? 'bg-indigo-50 text-indigo-900' : ''}"
            onclick={() => selectCategory(category)}
          >
            <svelte:component this={availableIcons.find(i => i.name === category.icon)?.icon || Home} class="w-4 h-4" style="color: {category.color || '#6b7280'}" />
            <span class="flex-1 text-left">{category.name}</span>
            <span class="text-xs text-gray-400">{categoryTypes.find(t => t.value === category.type)?.label}</span>
            {#if currentCategory?.id === category.id}
              <Check class="w-4 h-4 ml-2 text-indigo-600" />
            {/if}
          </button>
        {/each}
        
        <!-- Toggle to show all categories -->
        {#if transaction && hasFilteredCategories}
          <div class="border-t border-gray-100 my-2"></div>
          <button
            class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            onclick={() => showAllCategories = !showAllCategories}
          >
            {#if showAllCategories}
              Mostrar solo categorías relevantes
            {:else}
              Mostrar todas las categorías
            {/if}
          </button>
        {/if}
        
        <!-- Smart Options Modal -->
        {#if showSmartOptions && pendingCategory}
          <div class="absolute inset-0 bg-white border border-indigo-200 rounded-lg p-4 z-60">
            <div class="space-y-4">
              <!-- Header -->
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
                <svelte:component this={availableIcons.find(i => i.name === pendingCategory.icon)?.icon || Home} class="w-5 h-5" style="color: {pendingCategory.color || '#6b7280'}" />
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{pendingCategory.name}</h3>
                  <p class="text-xs text-gray-500">Elige cómo aplicar esta categoría</p>
                </div>
              </div>
              
              <!-- Smart Action Options -->
              <div class="space-y-2">
                <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="radio" 
                    bind:group={smartAction} 
                    value="single" 
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">Solo esta transacción</div>
                    <div class="text-xs text-gray-500">Aplicar únicamente a esta transacción</div>
                  </div>
                </label>
                
                <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="radio" 
                    bind:group={smartAction} 
                    value="similar_existing" 
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">Todas las similares existentes</div>
                    <div class="text-xs text-gray-500">Aplicar a transacciones similares ya registradas</div>
                  </div>
                </label>
                
                <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="radio" 
                    bind:group={smartAction} 
                    value="similar_future" 
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">Similares futuras</div>
                    <div class="text-xs text-gray-500">Crear regla para aplicar automáticamente a futuras transacciones similares</div>
                  </div>
                </label>
                
                <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="radio" 
                    bind:group={smartAction} 
                    value="all_future" 
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">Todas las futuras de este comercio</div>
                    <div class="text-xs text-gray-500">Crear regla para todas las futuras transacciones de "{transaction?.partnerName || 'este comercio'}"</div>
                  </div>
                </label>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex items-center gap-2 pt-2 border-t border-gray-200">
                <button
                  class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors flex-1"
                  onclick={applySmartSelection}
                >
                  <Check class="w-3 h-3" />
                  Aplicar
                </button>
                <button
                  class="flex items-center gap-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                  onclick={cancelSmartSelection}
                >
                  <X class="w-3 h-3" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        {/if}
        
        <div class="border-t border-gray-100 my-2"></div>
        
        <!-- New Category Form -->
        {#if showNewCategoryForm}
          <div class="p-3 border border-gray-200 rounded-md bg-gray-50 space-y-3">
            <!-- Category Name -->
            <div>
              <label for="category-name-input" class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
              <input
                id="category-name-input"
                type="text"
                bind:value={newCategoryName}
                placeholder="Nombre de categoría"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                onkeydown={(e) => e.key === 'Enter' && createNewCategory()}
              />
            </div>
            
            <!-- Category Type -->
            <div>
              <label for="category-type-select" class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                id="category-type-select"
                bind:value={newCategoryType} 
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {#each categoryTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
            
            <!-- Icon Selection -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Icono</label>
              <div class="grid grid-cols-6 gap-1">
                {#each availableIcons as iconOption}
                  <button
                    type="button"
                    class="p-2 rounded border border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors {selectedIcon.name === iconOption.name ? 'border-indigo-500 bg-indigo-50' : ''}"
                    onclick={() => selectedIcon = iconOption}
                  >
                    <svelte:component this={iconOption.icon} class="w-4 h-4 mx-auto" />
                  </button>
                {/each}
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center gap-2 pt-1">
              <button
                class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                onclick={createNewCategory}
              >
                <Check class="w-3 h-3" />
                Crear
              </button>
              <button
                class="flex items-center gap-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                onclick={() => showNewCategoryForm = false}
              >
                <X class="w-3 h-3" />
                Cancelar
              </button>
            </div>
          </div>
        {:else}
          <!-- No results message -->
          {#if filteredCategoriesByType.length === 0 && searchTerm}
            <div class="px-3 py-4 text-center">
              <p class="text-sm text-gray-500 mb-2">No se encontraron categorías</p>
              {#if searchTerm.trim()}
                <button
                  class="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  onclick={() => {
                    newCategoryName = searchTerm.trim();
                    showNewCategoryForm = true;
                    searchTerm = '';
                  }}
                >
                  Crear "{searchTerm.trim()}"
                </button>
              {/if}
            </div>
          {:else}
            <button
              class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm text-gray-600 transition-colors"
              onclick={() => {
                showNewCategoryForm = true;
                // Pre-select appropriate category type based on transaction
                if (transaction) {
                  const isIncome = transaction.amount > 0;
                  newCategoryType = isIncome ? 'INCOME' : 'DISCRETIONARY_EXPENSE';
                }
              }}
            >
              <Plus class="w-4 h-4" />
              <span>Crear nueva categoría</span>
            </button>
          {/if}
          
          <!-- Toggle to show all categories -->
          {#if transaction && hasFilteredCategories && !searchTerm}
            <div class="border-t border-gray-100 my-2"></div>
            <button
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              onclick={() => showAllCategories = !showAllCategories}
            >
              {#if showAllCategories}
                Mostrar solo categorías relevantes
              {:else}
                Mostrar todas las categorías
              {/if}
            </button>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Close dropdown when clicking outside -->
{#if isOpen}
  <button 
    class="fixed inset-0 z-40 cursor-default" 
    onclick={() => {
      if (!showSmartOptions) {
        isOpen = false;
      }
    }}
    aria-label="Close category selector"
  ></button>
{/if}