<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Plus, Edit2, Trash2, Check, X, DollarSign,
    TrendingUp, TrendingDown, Wallet, Coins, AlertCircle
  } from 'lucide-svelte';
  import { apiCategories, apiTransactions } from '$lib/stores/api-transactions';
  import type { Category, Transaction } from '$lib/types/transaction';
  import { t } from '$lib/stores/i18n';
  import { currentCurrency, currencies } from '$lib/stores/currency';

  // States
  let editingCategory = $state<string | null>(null);
  let newCategory = $state<Partial<Category> | null>(null);
  let selectedType = $state<'income' | 'essential' | 'discretionary' | 'investment' | 'debt_payment' | null>(null);
  let showDeleteModal = $state(false);
  let categoryToDelete = $state<Category | null>(null);
  let recategorizeTarget = $state<string>('none');
  let transactionsWithCategory = $state(0);
  let showIconPickerNew = $state(false);
  let showIconPickerEdit = $state<string | null>(null);
  let pickerButtonElement = $state<HTMLElement | null>(null);
  let pickerPosition = $state({
    top: 0,
    left: 0,
    maxHeight: 'none',
    position: 'bottom',
    width: 160
  });

  // Form data for editing
  let editForm = $state({
    name: '',
    icon: '',
    color: '',
    annualBudget: 0,
    type: 'essential' as Category['type']
  });

  // Advanced positioning system with proper viewport detection
  function calculatePickerPosition(buttonElement: HTMLElement) {
    const rect = buttonElement.getBoundingClientRect();

    // Picker dimensions
    const pickerWidth = 160;
    const pickerEstimatedHeight = 260; // Height including header + content
    const spacing = 8;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    let top, left, maxHeight, position;

    // Choose position based on available space - prioritize above if below is insufficient
    if (spaceBelow >= pickerEstimatedHeight) {
      // Enough space below
      position = 'bottom';
      top = rect.bottom + spacing;
      maxHeight = Math.min(280, spaceBelow - spacing * 2);
    } else if (spaceAbove >= pickerEstimatedHeight) {
      // Not enough space below, but enough above
      position = 'top';
      maxHeight = Math.min(280, spaceAbove - spacing * 2);
      top = rect.top - maxHeight - spacing - 50; // 50px for header
    } else {
      // Not enough space either direction - use the larger space
      if (spaceAbove > spaceBelow) {
        position = 'top';
        maxHeight = Math.max(150, spaceAbove - spacing * 2);
        top = spacing;
      } else {
        position = 'bottom';
        top = rect.bottom + spacing;
        maxHeight = Math.max(150, spaceBelow - spacing * 2);
      }
    }

    // Horizontal positioning
    left = Math.max(spacing, Math.min(rect.left, viewportWidth - pickerWidth - spacing));

    return {
      top,
      left,
      maxHeight: `${maxHeight}px`,
      position,
      width: pickerWidth
    };
  }



  // Enhanced keyboard navigation and accessibility
  function handleKeydown(event: KeyboardEvent) {
    // Close modal with Escape
    if (event.key === 'Escape' && (showIconPickerNew || showIconPickerEdit)) {
      closeEmojiPicker();
      event.preventDefault();
      return;
    }

    // Handle arrow key navigation within the picker
    if ((showIconPickerNew || showIconPickerEdit) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      handleArrowNavigation(event);
      event.preventDefault();
    }
  }

  // Unified close function
  function closeEmojiPicker() {
    showIconPickerNew = false;
    showIconPickerEdit = null;

    // Return focus to the button that opened the picker
    if (pickerButtonElement) {
      pickerButtonElement.focus();
      pickerButtonElement = null;
    }
  }

  // Arrow key navigation in the emoji grid
  function handleArrowNavigation(event: KeyboardEvent) {
    const focusedElement = document.activeElement as HTMLElement;
    if (!focusedElement?.classList.contains('icon-option')) return;

    const options = Array.from(document.querySelectorAll('.icon-option')) as HTMLElement[];
    const currentIndex = options.indexOf(focusedElement);
    const columns = 4;
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex >= columns ? currentIndex - columns : options.length - columns + (currentIndex % columns);
        if (nextIndex >= options.length) nextIndex = currentIndex;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex + columns < options.length ? currentIndex + columns : currentIndex % columns;
        break;
    }

    if (nextIndex !== currentIndex && options[nextIndex]) {
      options[nextIndex].focus();
    }
  }

  // Enhanced click outside handler
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;

    // Don't close if clicking within the picker or on trigger buttons
    if (!target.closest('.emoji-picker-overlay') &&
        !target.closest('.emoji-picker-backdrop') &&
        !target.closest('.category-icon-picker')) {
      closeEmojiPicker();
    }
  }

  // Debounced resize handler for better performance
  let resizeTimeout: number;
  function handleWindowResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if ((showIconPickerNew || showIconPickerEdit) && pickerButtonElement) {
        // Recalculate position since scroll is locked
        pickerPosition = calculatePickerPosition(pickerButtonElement);
      }
    }, 100);
  }

  // Focus management for modal
  function focusFirstOption() {
    setTimeout(() => {
      const firstOption = document.querySelector('.icon-option') as HTMLElement;
      if (firstOption) {
        firstOption.focus();
      }
    }, 50); // Small delay to ensure DOM is ready
  }

  // Body scroll lock and focus management
  $effect(() => {
    if ((showIconPickerNew || showIconPickerEdit) && pickerButtonElement) {
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      focusFirstOption();

      return () => {
        // Restore scroll
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  });


  // Available icons and colors
  const availableIcons = [
    '🏠', '🍽️', '🚗', '🎮', '💰', '📚', '🏥', '🛒',
    '✈️', '🎬', '☕', '🎯', '💡', '🏋️', '🎨', '🛍️',
    '👔', '⚡', '💊', '🔧', '📱', '🎵', '🌮', '🍕',
    '🏦', '⛽', '🚇', '🚌', '🏪', '💻', '📺', '👟',
    '🍺', '🍎', '🥬', '🧘', '📊', '💳', '🏆', '🎊',
    '🌍', '📸', '🎪', '🏖️', '🎂', '🍔', '🌟', '🔥'
  ];

  const availableColors = [
    '#7ABAA5', // acapulco
    '#FC8181', // froly
    '#63B3ED', // blue
    '#68D391', // green
    '#F6AD55', // orange
    '#A78BFA', // purple
    '#FBB6CE', // pink
    '#9CA3AF', // gray
  ];

  let categoryTypes = $derived([
    { value: 'income', label: $t('categories.types.income'), icon: TrendingUp },
    { value: 'investment', label: $t('categories.types.investment'), icon: TrendingDown },
    { value: 'essential', label: $t('categories.types.essential'), icon: Wallet },
    { value: 'discretionary', label: $t('categories.types.discretionary'), icon: Coins },
    { value: 'debt_payment', label: $t('categories.types.debt_payment'), icon: AlertCircle }
  ]);

  // Computed categories by type
  let categoriesByType = $derived(() => {
    const grouped = {
      income: [] as Category[],
      essential: [] as Category[],
      discretionary: [] as Category[],
      investment: [] as Category[],
      debt_payment: [] as Category[]
    };

    $apiCategories.forEach(cat => {
      if (grouped[cat.type]) {
        grouped[cat.type].push(cat);
      }
    });

    return grouped;
  });

  // Get alternative categories for recategorization
  let alternativeCategories = $derived(() => {
    if (!categoryToDelete) return [];
    return $apiCategories.filter(c =>
      c.id !== categoryToDelete.id &&
      c.type === categoryToDelete.type
    );
  });

  // Actions
  function startNewCategory(type: Category['type']) {
    newCategory = {
      name: '',
      icon: availableIcons[0],
      color: availableColors[0],
      type,
      annualBudget: 0
    };
    selectedType = type;
    showIconPickerNew = false; // Start with icon picker closed
  }

  async function saveNewCategory() {
    if (!newCategory || !newCategory.name) return;

    const category: Omit<Category, 'id'> = {
      name: newCategory.name,
      icon: newCategory.icon || '📄',
      color: newCategory.color || '#7ABAA5',
      type: newCategory.type || 'essential',
      annualBudget: newCategory.annualBudget || 0
    };

    await apiCategories.add(category);
    newCategory = null;
    selectedType = null;
    showIconPickerNew = false;
  }

  function cancelNewCategory() {
    newCategory = null;
    selectedType = null;
    showIconPickerNew = false;
  }

  function startEdit(category: Category) {
    editingCategory = category.id;
    editForm = {
      name: category.name,
      icon: category.icon,
      color: category.color,
      annualBudget: category.annualBudget || 0,
      type: category.type
    };
    showIconPickerEdit = null; // Start with icon picker closed
  }

  async function saveEdit() {
    if (!editingCategory) return;

    await apiCategories.update(editingCategory, editForm);
    editingCategory = null;
    showIconPickerEdit = null;
  }

  function cancelEdit() {
    editingCategory = null;
    showIconPickerEdit = null;
  }

  function prepareDelete(category: Category) {
    categoryToDelete = category;
    // Count transactions with this category
    const transactions = $apiTransactions;
    transactionsWithCategory = transactions.filter(t => t.categoryId === category.id).length;
    recategorizeTarget = 'none';

    // Close any open emoji pickers before showing delete modal
    closeEmojiPicker();

    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;

    // Handle recategorization
    if (recategorizeTarget !== 'none' && transactionsWithCategory > 0) {
      const transactions = $apiTransactions.filter(t => t.categoryId === categoryToDelete.id);
      for (const transaction of transactions) {
        await apiTransactions.update(transaction.id, {
          categoryId: recategorizeTarget === 'remove' ? undefined : recategorizeTarget
        });
      }
    }

    await apiCategories.delete(categoryToDelete.id);
    categoryToDelete = null;
    recategorizeTarget = 'none';
    showDeleteModal = false;
  }

  function formatCurrency(amount: number): string {
    const currency = currencies[$currentCurrency];
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code
    }).format(amount);
  }

  function getCurrencySymbol(): string {
    return currencies[$currentCurrency].symbol;
  }

  onMount(async () => {
    await apiCategories.load();
    await apiTransactions.load();

    // Add event listeners
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', handleWindowResize);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', handleWindowResize);
    };
  });
</script>

<div class="categories-page">
  <header class="page-header">
    <div class="header-content">
      <h1 class="page-title">Configuración de Categorías</h1>
      <p class="page-subtitle">Gestiona tus categorías y presupuestos anuales</p>
    </div>
  </header>

  <main class="categories-container">
    {#each categoryTypes as categoryType}
      {@const categories = categoriesByType()[categoryType.value]}
      <section class="category-section">
        <div class="section-header">
          <div class="section-title">
            <svelte:component this={categoryType.icon} size={16} />
            <h2>{categoryType.label}</h2>
            <span class="category-count">{categories.length}</span>
          </div>

          {#if selectedType !== categoryType.value}
            <button
              class="add-button"
              onclick={() => startNewCategory(categoryType.value)}
            >
              <Plus size={14} />
            </button>
          {/if}
        </div>

        <div class="category-list">
          {#if selectedType === categoryType.value && newCategory}
            <div class="category-card editing">
              <div class="category-icon-picker">
                <button
                  class="icon-display"
                  style="background-color: {newCategory.color}20"
                  aria-label="Seleccionar icono para nueva categoría"
                  aria-expanded={showIconPickerNew}
                  aria-haspopup="listbox"
                  onclick={(e) => {
                    pickerButtonElement = e.currentTarget;
                    if (!showIconPickerNew) {
                      pickerPosition = calculatePickerPosition(e.currentTarget);
                    }
                    showIconPickerNew = !showIconPickerNew;
                  }}
                >
                  {newCategory.icon}
                </button>
              </div>

              <div class="category-details">
                <input
                  type="text"
                  class="category-name-input"
                  placeholder="Nombre de la categoría"
                  bind:value={newCategory.name}
                  onkeydown={(e) => e.key === 'Enter' && saveNewCategory()}
                />

                <div class="budget-section">
                  <label class="budget-label">Presupuesto anual</label>
                  <div class="budget-input-group">
                    <span class="currency-symbol">{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      class="budget-input"
                      placeholder="0"
                      bind:value={newCategory.annualBudget}
                    />
                    <span class="budget-period">/ año</span>
                  </div>
                </div>

                <div class="color-picker">
                  {#each availableColors as color}
                    <button
                      class="color-option"
                      class:selected={newCategory.color === color}
                      style="background-color: {color}"
                      onclick={() => newCategory.color = color}
                    ></button>
                  {/each}
                </div>
              </div>

              <div class="category-actions">
                <button class="save-btn" onclick={saveNewCategory}>
                  <Check size={14} />
                </button>
                <button class="cancel-btn" onclick={cancelNewCategory}>
                  <X size={14} />
                </button>
              </div>
            </div>
          {/if}

          {#each categories as category}
            {#if editingCategory === category.id}
              <div class="category-card editing">
                <div class="category-icon-picker">
                  <button
                    class="icon-display"
                    style="background-color: {editForm.color}20"
                    aria-label="Seleccionar icono para {category.name}"
                    aria-expanded={showIconPickerEdit === category.id}
                    aria-haspopup="listbox"
                    onclick={(e) => {
                      pickerButtonElement = e.currentTarget;
                      if (showIconPickerEdit !== category.id) {
                        pickerPosition = calculatePickerPosition(e.currentTarget);
                      }
                      showIconPickerEdit = showIconPickerEdit === category.id ? null : category.id;
                    }}
                  >
                    {editForm.icon}
                  </button>
                </div>

                <div class="category-details">
                  <input
                    type="text"
                    class="category-name-input"
                    bind:value={editForm.name}
                    onkeydown={(e) => e.key === 'Enter' && saveEdit()}
                  />

                  <div class="budget-section">
                    <label class="budget-label">Presupuesto anual</label>
                    <div class="budget-input-group">
                      <span class="currency-symbol">{getCurrencySymbol()}</span>
                      <input
                        type="number"
                        class="budget-input"
                        placeholder="0"
                        bind:value={editForm.annualBudget}
                      />
                      <span class="budget-period">/ año</span>
                    </div>
                  </div>

                  <div class="color-picker">
                    {#each availableColors as color}
                      <button
                        class="color-option"
                        class:selected={editForm.color === color}
                        style="background-color: {color}"
                        onclick={() => editForm.color = color}
                      ></button>
                    {/each}
                  </div>
                </div>

                <div class="category-actions">
                  <button class="save-btn" onclick={saveEdit}>
                    <Check size={14} />
                  </button>
                  <button class="cancel-btn" onclick={cancelEdit}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            {:else}
              <div class="category-card">
                <div
                  class="category-icon"
                  style="background-color: {category.color}20"
                >
                  {category.icon}
                </div>

                <div class="category-info">
                  <h3 class="category-name">{category.name}</h3>
                  {#if category.annualBudget}
                    <span class="category-budget">
                      {formatCurrency(category.annualBudget)} / año
                    </span>
                  {:else}
                    <span class="category-budget no-budget">
                      Sin presupuesto
                    </span>
                  {/if}
                </div>

                <div class="category-actions">
                  <button
                    class="action-btn"
                    onclick={() => startEdit(category)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    class="action-btn delete"
                    onclick={() => prepareDelete(category)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </section>
    {/each}
  </main>
</div>

<!-- Advanced Emoji Picker Modal -->
{#if (showIconPickerNew || showIconPickerEdit) && pickerButtonElement}
  <!-- Modal backdrop for better UX -->
  <div class="emoji-picker-backdrop" onclick={closeEmojiPicker}></div>

  <!-- Positioned picker container -->
  <div
    class="emoji-picker-overlay"
    class:position-top={pickerPosition.position === 'top'}
    class:position-center={pickerPosition.position === 'center'}
    style="
      top: {pickerPosition.top}px;
      left: {pickerPosition.left}px;
      width: {pickerPosition.width}px;
    "
    role="dialog"
    aria-modal="true"
    aria-label="Selector de iconos"
  >
    <!-- Picker header for better UX -->
    <div class="emoji-picker-header">
      <span class="emoji-picker-title">Seleccionar icono</span>
      <button
        class="emoji-picker-close"
        onclick={closeEmojiPicker}
        aria-label="Cerrar selector"
      >
        <X size={14} />
      </button>
    </div>

    <!-- Scrollable content area -->
    <div
      class="emoji-picker-content"
      style="max-height: {pickerPosition.maxHeight};"
      role="listbox"
      aria-label="Lista de iconos disponibles"
    >
      {#each availableIcons as icon}
        <button
          class="icon-option"
          class:selected={showIconPickerNew ? newCategory?.icon === icon : editForm.icon === icon}
          role="option"
          aria-selected={showIconPickerNew ? newCategory?.icon === icon : editForm.icon === icon}
          aria-label="Icono {icon}"
          onclick={() => {
            if (showIconPickerNew && newCategory) {
              newCategory.icon = icon;
            } else if (showIconPickerEdit) {
              editForm.icon = icon;
            }
            closeEmojiPicker();
          }}
        >
          {icon}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Delete Category Modal with Recategorization -->
{#if showDeleteModal && categoryToDelete}
  <!-- Custom Delete Modal -->
  <div class="modal-backdrop" onclick={() => showDeleteModal = false}>
    <div class="modal-container" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">Eliminar categoría</h3>
        <button class="close-button" onclick={() => showDeleteModal = false}>
          <X size={20} />
        </button>
      </div>

      <div class="modal-body">
        <p class="delete-warning">
          ¿Estás seguro de eliminar la categoría <strong>{categoryToDelete.name}</strong>?
        </p>

        {#if transactionsWithCategory > 0}
          <div class="recategorize-section">
            <div class="transaction-count">
              <AlertCircle size={16} />
              <span>Hay {transactionsWithCategory} transacción{transactionsWithCategory !== 1 ? 'es' : ''} con esta categoría</span>
            </div>

            <p class="recategorize-label">¿Qué deseas hacer con ellas?</p>

            <div class="recategorize-options">
              <label class="recategorize-option">
                <input
                  type="radio"
                  name="recategorize"
                  value="remove"
                  bind:group={recategorizeTarget}
                />
                <span>Dejar sin categoría</span>
              </label>

              {#if alternativeCategories().length > 0}
                {#each alternativeCategories() as altCategory}
                  <label class="recategorize-option">
                    <input
                      type="radio"
                      name="recategorize"
                      value={altCategory.id}
                      bind:group={recategorizeTarget}
                    />
                    <span class="category-option-display">
                      <span class="category-icon-small">{altCategory.icon}</span>
                      <span>{altCategory.name}</span>
                    </span>
                  </label>
                {/each}
              {/if}
            </div>
          </div>
        {:else}
          <p class="no-transactions">Esta categoría no tiene transacciones asociadas.</p>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="cancel-button" onclick={() => showDeleteModal = false}>
          Cancelar
        </button>
        <button class="delete-button" onclick={confirmDelete}>
          Eliminar
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .categories-page {
    min-height: 100vh;
    background: var(--surface);
  }

  .page-header {
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--gray-200);
    padding: var(--space-2xl) var(--space-lg);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-bottom: var(--space-xs);
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .categories-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg);
    display: grid;
    gap: var(--space-2xl);
  }

  .category-section {
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--gray-200);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .section-title h2 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .category-count {
    background: var(--gray-100);
    color: var(--text-muted);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .add-button {
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

  .add-button:hover {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .category-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    background: var(--surface);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  .category-card:hover {
    border-color: var(--gray-300);
    transform: translateX(2px);
  }

  .category-card.editing {
    background: var(--gray-50);
    border-color: var(--acapulco);
  }

  .category-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .category-icon-picker {
    position: relative;
  }

  .icon-display {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  /* Z-Index Hierarchy (Updated to match main branch):
   * - Content overlays: 20-30
   * - Navigation: 40-50
   * - Modals and overlays: 70-80
   * - System alerts: 100+
   *
   * Emoji picker (75) appears above modal backdrop (70)
   * while respecting the established hierarchy
   */

  /* Modal backdrop for better UX */
  .emoji-picker-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(4px);
    z-index: 74;
    animation: fadeIn 0.2s ease-out;
    cursor: pointer;
  }

  /* Main picker container */
  .emoji-picker-overlay {
    position: fixed;
    z-index: 75;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: var(--transform-origin, center bottom);
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Animation variants based on position */
  .emoji-picker-overlay.position-top {
    --transform-origin: center bottom;
    animation: modalSlideInFromTop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .emoji-picker-overlay.position-center {
    --transform-origin: center center;
    animation: modalSlideInCenter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Picker header */
  .emoji-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--gray-200);
    background: var(--gray-50);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .emoji-picker-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .emoji-picker-close {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .emoji-picker-close:hover {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  /* Scrollable content area */
  .emoji-picker-content {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    padding: var(--space-md);
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--gray-300) transparent;
    flex: 1;
    min-height: 0; /* Important for flex child scrolling */
  }

  .emoji-picker-content::-webkit-scrollbar {
    width: 6px;
  }

  .emoji-picker-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .emoji-picker-content::-webkit-scrollbar-thumb {
    background-color: var(--gray-300);
    border-radius: 3px;
  }

  .emoji-picker-content::-webkit-scrollbar-thumb:hover {
    background-color: var(--gray-400);
  }

  /* Modal animations for different positions */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes modalSlideInFromTop {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes modalSlideInCenter {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Enhanced icon option styles */
  .icon-option {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    background: var(--surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .icon-option:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .icon-option:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow:
      0 0 0 3px rgba(122, 186, 165, 0.2),
      0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .icon-option.selected {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
    transform: scale(1.05);
    box-shadow:
      0 0 0 3px rgba(122, 186, 165, 0.3),
      0 8px 20px rgba(122, 186, 165, 0.4);
  }

  .icon-option.selected:hover {
    background: #6ba085;
    border-color: #6ba085;
    transform: scale(1.05) translateY(-1px);
  }

  .icon-option:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }

  .category-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .category-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .category-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .category-name-input {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 0.875rem;
    color: var(--text-primary);
    outline: none;
    transition: all 0.15s ease;
  }

  .category-name-input:focus {
    border-color: var(--acapulco);
  }

  .category-budget {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .category-budget.no-budget {
    font-style: italic;
  }

  .budget-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .budget-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .budget-input-group {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }

  .currency-symbol {
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .budget-input {
    flex: 1;
    border: none;
    background: none;
    outline: none;
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .budget-period {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .color-picker {
    display: flex;
    gap: var(--space-xs);
  }

  .color-option {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.selected {
    border-color: var(--text-primary);
  }

  .category-actions {
    display: flex;
    gap: var(--space-xs);
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
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }

  .save-btn,
  .cancel-btn {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .save-btn {
    color: var(--acapulco);
    border-color: var(--acapulco);
  }

  .save-btn:hover {
    background: var(--acapulco);
    color: white;
  }

  .cancel-btn {
    color: var(--text-muted);
  }

  .cancel-btn:hover {
    background: var(--gray-100);
    border-color: var(--gray-300);
  }

  /* Delete Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 80;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-container {
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    max-width: 480px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
    position: relative;
    z-index: 81;
    box-shadow: var(--shadow-lg);
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--gray-200);
    background: var(--surface-elevated);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.4;
  }

  .close-button {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .close-button:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .modal-body {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    color: var(--text-primary);
    background: transparent;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-top: 1px solid var(--gray-200);
  }

  .cancel-button,
  .delete-button {
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-button {
    background: var(--surface);
    border: 1px solid var(--gray-200);
    color: var(--text-primary);
  }

  .cancel-button:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  .delete-button {
    background: var(--froly);
    border: 1px solid var(--froly);
    color: white;
  }

  .delete-button:hover {
    background: #e53e3e;
    border-color: #e53e3e;
  }

  .delete-warning {
    font-size: 0.875rem;
    color: var(--text-primary);
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .delete-warning strong {
    color: var(--froly);
    font-weight: 600;
  }

  .recategorize-section {
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .transaction-count {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .transaction-count :global(svg) {
    color: var(--acapulco);
  }

  .recategorize-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .recategorize-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .recategorize-option {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .recategorize-option:hover {
    border-color: var(--acapulco);
    background: rgba(122, 186, 165, 0.05);
  }

  .recategorize-option input[type="radio"] {
    margin: 0;
  }

  .category-option-display {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .category-icon-small {
    font-size: 1rem;
    display: inline-block;
    line-height: 1;
  }

  .no-transactions {
    font-size: 0.875rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>