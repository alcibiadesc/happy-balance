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

  // Form data for editing
  let editForm = $state({
    name: '',
    icon: '',
    color: '',
    annualBudget: 0,
    type: 'essential' as Category['type']
  });

  // Click outside handler
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.category-icon-picker') && !target.closest('.emoji-picker-overlay')) {
      showIconPickerNew = false;
      showIconPickerEdit = null;
      pickerButtonElement = null;
    }
  }


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

    // Add click outside listener
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
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
                  onclick={(e) => {
                    pickerButtonElement = e.currentTarget;
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
                    onclick={(e) => {
                      pickerButtonElement = e.currentTarget;
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

<!-- Global Emoji Picker -->
{#if (showIconPickerNew || showIconPickerEdit) && pickerButtonElement}
  {@const rect = pickerButtonElement.getBoundingClientRect()}
  <div
    class="emoji-picker-overlay"
    style="
      top: {rect.bottom + 8}px;
      left: {rect.left}px;
    "
  >
    <div class="icon-options-global">
      {#each availableIcons as icon}
        <button
          class="icon-option"
          class:selected={showIconPickerNew ? newCategory?.icon === icon : editForm.icon === icon}
          onclick={() => {
            if (showIconPickerNew && newCategory) {
              newCategory.icon = icon;
              showIconPickerNew = false;
            } else if (showIconPickerEdit) {
              editForm.icon = icon;
              showIconPickerEdit = null;
            }
            pickerButtonElement = null;
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

  .emoji-picker-overlay {
    position: fixed;
    z-index: 999999;
    pointer-events: none;
  }

  .icon-options-global {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    padding: var(--space-xs);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
    min-width: 144px;
    animation: slideDown 0.15s ease-out;
    pointer-events: auto;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .icon-option {
    width: 2rem;
    height: 2rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .icon-option:hover {
    background: var(--gray-100);
  }

  .icon-option.selected {
    background: var(--acapulco);
    border-color: var(--acapulco);
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
    z-index: 1000;
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
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
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
  }

  .no-transactions {
    font-size: 0.875rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>