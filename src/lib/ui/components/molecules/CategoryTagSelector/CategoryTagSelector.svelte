<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { categoryStore, NOTION_COLORS, NOTION_ICONS } from '$lib/shared/stores/categoryStore.js';
  import { Category, CategoryType } from '$lib/domain/entities/Category.js';
  import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
  import { X, Plus, Search, Hash } from 'lucide-svelte';

  interface Props {
    selectedCategories?: Category[];
    categoryType?: CategoryType;
    placeholder?: string;
    maxTags?: number;
    allowCreate?: boolean;
    class?: string;
  }

  let {
    selectedCategories = [],
    categoryType,
    placeholder = 'Seleccionar categorías...',
    maxTags = 5,
    allowCreate = true,
    class: className = ''
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    change: { categories: Category[] };
    create: { category: Category };
  }>();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let inputElement: HTMLInputElement;
  let showCreateForm = $state(false);
  let newCategoryName = $state('');
  let newCategoryColor = $state(NOTION_COLORS[0].value);
  let newCategoryIcon = $state(NOTION_ICONS[0]);

  // Derived stores
  let filteredCategories = $derived(categoryStore.findCategories(searchQuery));
  let availableCategories = $derived(
    $filteredCategories.filter(cat => {
      const isSelected = selectedCategories.some(selected => selected.id.equals(cat.id));
      const matchesType = !categoryType || cat.type === categoryType;
      return !isSelected && matchesType;
    })
  );

  function openDropdown() {
    isOpen = true;
    searchQuery = '';
    setTimeout(() => inputElement?.focus(), 50);
  }

  function closeDropdown() {
    isOpen = false;
    showCreateForm = false;
    newCategoryName = '';
  }

  function selectCategory(category: Category) {
    if (selectedCategories.length >= maxTags) return;
    
    const newSelection = [...selectedCategories, category];
    selectedCategories = newSelection;
    dispatch('change', { categories: newSelection });
    
    searchQuery = '';
    if (maxTags === 1) {
      closeDropdown();
    }
  }

  function removeCategory(category: Category) {
    const newSelection = selectedCategories.filter(cat => !cat.id.equals(category.id));
    selectedCategories = newSelection;
    dispatch('change', { categories: newSelection });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && searchQuery.trim() && allowCreate) {
      event.preventDefault();
      if (availableCategories.length === 0) {
        openCreateForm();
      } else {
        selectCategory(availableCategories[0]);
      }
    } else if (event.key === 'Escape') {
      closeDropdown();
    } else if (event.key === 'Backspace' && !searchQuery && selectedCategories.length > 0) {
      removeCategory(selectedCategories[selectedCategories.length - 1]);
    }
  }

  function openCreateForm() {
    showCreateForm = true;
    newCategoryName = searchQuery;
  }

  function createCategory() {
    if (!newCategoryName.trim()) return;

    const newCategory = categoryStore.addCategory({
      name: newCategoryName.trim(),
      type: categoryType || CategoryType.DISCRETIONARY_EXPENSE,
      color: newCategoryColor,
      icon: newCategoryIcon,
      parent: null,
      isActive: true
    });

    selectCategory(newCategory);
    dispatch('create', { category: newCategory });
    
    closeDropdown();
  }

  function getColorClasses(color: string) {
    const colorConfig = NOTION_COLORS.find(c => c.value === color) || NOTION_COLORS[0];
    return {
      bg: colorConfig.bg,
      text: colorConfig.value,
      border: colorConfig.value + '40' // 25% opacity
    };
  }

  let containerElement: HTMLDivElement;

  onMount(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerElement && !containerElement.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div bind:this={containerElement} class="category-tag-selector {className}">
  <!-- Selected Tags -->
  <div 
    class="relative min-h-10 p-2 border border-medium-grey rounded-lg bg-white cursor-text transition-all duration-default focus-within:border-charcoal focus-within:shadow-subtle"
    onclick={openDropdown}
    role="combobox"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    tabindex="0"
  >
    <div class="flex flex-wrap gap-2 items-center">
      {#each selectedCategories as category}
        <div 
          class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all duration-fast hover:scale-105"
          style="background-color: {getColorClasses(category.color).bg}; color: {getColorClasses(category.color).text};"
        >
          <span class="text-sm">{category.icon}</span>
          <span class="font-medium">{category.name}</span>
          <button
            class="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors duration-fast"
            onclick={(e) => { e.stopPropagation(); removeCategory(category); }}
            aria-label="Eliminar {category.name}"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      {/each}
      
      {#if selectedCategories.length < maxTags}
        <input
          bind:this={inputElement}
          bind:value={searchQuery}
          class="flex-1 min-w-24 bg-transparent border-none outline-none text-body placeholder-text-grey"
          placeholder={selectedCategories.length === 0 ? placeholder : ''}
          onkeydown={handleKeyDown}
          aria-label="Buscar categorías"
        />
      {/if}
      
      {#if !isOpen && selectedCategories.length === 0}
        <div class="flex items-center gap-2 text-text-grey">
          <Hash class="w-4 h-4" />
          <span class="text-body-small">Agregar categorías</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Dropdown -->
  {#if isOpen}
    <div class="absolute z-50 w-full mt-2 bg-white border border-medium-grey rounded-lg shadow-medium max-h-80 overflow-hidden">
      {#if !showCreateForm}
        <!-- Search Results -->
        <div class="max-h-64 overflow-y-auto">
          {#if availableCategories.length === 0 && !searchQuery}
            <div class="p-4 text-center text-text-grey">
              <Search class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p class="text-body-small">Escribe para buscar categorías</p>
            </div>
          {:else if availableCategories.length === 0 && searchQuery}
            <div class="p-4 text-center">
              <p class="text-body-small text-text-grey mb-3">
                No se encontraron categorías para "{searchQuery}"
              </p>
              {#if allowCreate}
                <button
                  class="btn-secondary text-sm flex items-center gap-2 mx-auto"
                  onclick={openCreateForm}
                >
                  <Plus class="w-4 h-4" />
                  Crear "{searchQuery}"
                </button>
              {/if}
            </div>
          {:else}
            {#each availableCategories as category}
              <button
                class="w-full px-4 py-3 text-left hover:bg-warm-beige flex items-center gap-3 transition-colors duration-fast"
                onclick={() => selectCategory(category)}
              >
                <span class="text-lg">{category.icon}</span>
                <div class="flex-1">
                  <div class="text-body font-medium text-charcoal">{category.name}</div>
                  <div class="text-caption text-text-grey">{category.type.replace('_', ' ').toLowerCase()}</div>
                </div>
                <div 
                  class="w-3 h-3 rounded-full border"
                  style="background-color: {category.color}; border-color: {category.color};"
                ></div>
              </button>
            {/each}
          {/if}
        </div>
        
        {#if allowCreate && searchQuery && availableCategories.length > 0}
          <div class="border-t border-medium-grey p-2">
            <button
              class="w-full px-3 py-2 text-left hover:bg-warm-beige rounded-md flex items-center gap-2 text-body-small transition-colors duration-fast"
              onclick={openCreateForm}
            >
              <Plus class="w-4 h-4" />
              Crear nueva categoría "{searchQuery}"
            </button>
          </div>
        {/if}
      {:else}
        <!-- Create Form -->
        <div class="p-4 border-t border-medium-grey scale-in">
          <h3 class="text-h4 mb-4 text-charcoal">Crear Nueva Categoría</h3>
          
          <div class="space-y-4">
            <div>
              <label class="text-body-small font-medium text-charcoal mb-2 block">Nombre</label>
              <input
                bind:value={newCategoryName}
                class="w-full input-editorial"
                placeholder="Nombre de la categoría"
                autofocus
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-body-small font-medium text-charcoal mb-2 block">Color</label>
                <div class="flex flex-wrap gap-2">
                  {#each NOTION_COLORS.slice(0, 6) as color}
                    <button
                      class={`w-6 h-6 rounded-full border-2 transition-all duration-fast ${newCategoryColor === color.value ? 'border-charcoal scale-110' : 'border-transparent'}`}
                      style="background-color: {color.value};"
                      onclick={() => newCategoryColor = color.value}
                      aria-label="Seleccionar color {color.name}"
                    ></button>
                  {/each}
                </div>
              </div>
              
              <div>
                <label class="text-body-small font-medium text-charcoal mb-2 block">Icono</label>
                <div class="flex flex-wrap gap-1">
                  {#each NOTION_ICONS.slice(0, 8) as icon}
                    <button
                      class={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-fast ${newCategoryIcon === icon ? 'bg-warm-beige' : 'hover:bg-light-grey'}`}
                      onclick={() => newCategoryIcon = icon}
                      aria-label="Seleccionar icono {icon}"
                    >
                      {icon}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-6">
            <button class="btn-secondary" onclick={closeDropdown}>
              Cancelar
            </button>
            <button 
              class="btn-primary"
              onclick={createCategory}
              disabled={!newCategoryName.trim()}
            >
              Crear Categoría
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .category-tag-selector {
    position: relative;
  }
</style>