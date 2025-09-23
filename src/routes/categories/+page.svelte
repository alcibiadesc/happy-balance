<script lang="ts">
  import { onMount } from 'svelte';
  import {
    TrendingUp, TrendingDown, Wallet, Coins, ArrowRightLeft, Info
  } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  // Components
  import CategoryListItem from '$lib/components/molecules/CategoryListItem.svelte';
  import CategoryEditListItem from '$lib/components/molecules/CategoryEditListItem.svelte';
  import CategorySection from '$lib/components/organisms/CategorySection.svelte';
  import CategoryIconPicker from '$lib/components/organisms/CategoryIconPicker.svelte';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';

  // Store
  import { createCategoriesStore } from '$lib/modules/categories/presentation/stores/categoriesStore.svelte.ts';

  const store = createCategoriesStore();

  // Helper Tooltip
  let tooltipButtonElement = $state<HTMLElement | null>(null);

  function calculateTooltipPosition(buttonElement: HTMLElement) {
    const rect = buttonElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 80;
    const spacing = 8;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    let top, left, position;

    if (spaceBelow >= tooltipHeight + spacing) {
      position = 'bottom';
      top = rect.bottom + spacing;
    } else if (spaceAbove >= tooltipHeight + spacing) {
      position = 'top';
      top = rect.top - tooltipHeight - spacing;
    } else {
      if (spaceAbove > spaceBelow) {
        position = 'top';
        top = rect.top - tooltipHeight - spacing;
      } else {
        position = 'bottom';
        top = rect.bottom + spacing;
      }
    }

    left = Math.max(spacing, Math.min(rect.left + (rect.width / 2) - (tooltipWidth / 2), viewportWidth - tooltipWidth - spacing));

    return { top, left, position };
  }

  function handleHelperClick(e: Event) {
    tooltipButtonElement = e.currentTarget as HTMLElement;
    store.tooltipPosition = calculateTooltipPosition(e.currentTarget as HTMLElement);
    store.showHelperTooltip = !store.showHelperTooltip;
  }

  function handleIconClick(e: Event, forNew: boolean = false) {
    const buttonElement = e.currentTarget as HTMLElement;
    store.pickerPosition = store.calculatePickerPosition(buttonElement);

    if (forNew) {
      store.showIconPickerNew = !store.showIconPickerNew;
    } else {
      store.showIconPickerEdit = store.showIconPickerEdit === store.editingCategory ? null : store.editingCategory;
    }
  }

  onMount(async () => {
    await store.loadCategories();
  });
</script>

<svelte:head>
  <title>{$t('categories.title')} - Happy Balance</title>
</svelte:head>

<div class="categories-container">
  <header class="page-header">
    <h1 class="page-title">{$t('categories.title')}</h1>
    <p class="page-subtitle">{$t('categories.subtitle')}</p>
  </header>

  <main class="categories-content">
    {#each store.categoryTypes as { value, type }}
      <CategorySection
        title={type.getTitle()}
        description={type.getDescription()}
        icon={value === 'income' ? TrendingUp :
              value === 'essential' ? Wallet :
              value === 'discretionary' ? Coins :
              value === 'investment' ? TrendingDown :
              value === 'debt_payment' ? ArrowRightLeft :
              Wallet}
        iconClass={type.getIconClass()}
        categories={store.categoriesByType[value]}
        onAddNew={() => store.startNewCategory(value)}
        showHelperButton={value === 'no_compute'}
        onHelperClick={handleHelperClick}
      >
        {#if store.newCategory && store.selectedType === value}
          <CategoryEditListItem
            bind:editForm={store.newCategory}
            availableColors={store.availableColors}
            getCurrencySymbol={store.getCurrencySymbol}
            onSave={store.saveNewCategory}
            onCancel={store.cancelNewCategory}
            onIconClick={(e) => handleIconClick(e, true)}
            onColorSelect={(color) => {
              if (store.newCategory) {
                store.newCategory.color = color;
              }
            }}
            showIconPicker={store.showIconPickerNew}
          />
        {/if}

        {#each store.categoriesByType[value] as category}
          {#if store.editingCategory === category.getId()}
            <CategoryEditListItem
              bind:editForm={store.editForm}
              availableColors={store.availableColors}
              getCurrencySymbol={store.getCurrencySymbol}
              onSave={store.saveEdit}
              onCancel={store.cancelEdit}
              onIconClick={handleIconClick}
              onColorSelect={(color) => store.editForm.color = color}
              showIconPicker={store.showIconPickerEdit === category.getId()}
            />
          {:else}
            <CategoryListItem
              category={category.toJSON()}
              onEdit={() => store.startEdit(category)}
              onDelete={() => store.prepareDelete(category)}
              formatCurrency={store.formatCurrency}
            />
          {/if}
        {/each}
      </CategorySection>
    {/each}
  </main>
</div>

<!-- Icon Picker Modal -->
<CategoryIconPicker
  isOpen={store.showIconPickerNew || store.showIconPickerEdit !== null}
  position={store.pickerPosition}
  availableEmojis={store.availableEmojis}
  onSelect={store.selectIcon}
  onClose={store.closeIconPicker}
/>

<!-- Helper Tooltip -->
{#if store.showHelperTooltip && tooltipButtonElement}
  <div
    class="helper-tooltip"
    class:position-top={store.tooltipPosition.position === 'top'}
    style="
      top: {store.tooltipPosition.top}px;
      left: {store.tooltipPosition.left}px;
    "
    role="tooltip"
  >
    <div class="tooltip-content">
      <p class="tooltip-text">
        Las categorías "Sin Computar" son útiles para transferencias entre cuentas propias,
        reembolsos o movimientos que no afectan tu balance real.
      </p>
    </div>
    <button
      class="tooltip-close"
      onclick={() => store.showHelperTooltip = false}
    >×</button>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
<ConfirmModal
  isOpen={store.showDeleteModal}
  title="Eliminar categoría"
  message={store.transactionsWithCategory > 0
    ? `Esta categoría tiene ${store.transactionsWithCategory} transacciones asociadas. ¿Qué deseas hacer con ellas?`
    : `¿Estás seguro de que deseas eliminar la categoría "${store.categoryToDelete?.getName()}"?`}
  confirmText="Eliminar"
  cancelText="Cancelar"
  type="danger"
  onConfirm={store.confirmDelete}
  onCancel={() => store.showDeleteModal = false}
>
  {#if store.transactionsWithCategory > 0}
    <div class="recategorize-options">
      <label class="radio-option">
        <input
          type="radio"
          name="recategorize"
          value="remove"
          bind:group={store.recategorizeTarget}
        />
        <span>Dejar sin categoría</span>
      </label>
      {#each store.categories as cat}
        {#if cat.getId() !== store.categoryToDelete?.getId()}
          <label class="radio-option">
            <input
              type="radio"
              name="recategorize"
              value={cat.getId()}
              bind:group={store.recategorizeTarget}
            />
            <span>Mover a: {cat.getName()}</span>
          </label>
        {/if}
      {/each}
    </div>
  {/if}
</ConfirmModal>

<style>
  /* Main Container */
  .categories-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    background: var(--surface);
  }

  /* Header */
  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: 300;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
  }

  /* Content Grid */
  .categories-content {
    display: grid;
    gap: 1.5rem;
  }

  /* Helper Tooltip */
  .helper-tooltip {
    position: fixed;
    z-index: 1000;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    width: 320px;
    animation: tooltipFadeIn 0.2s ease;
  }

  .helper-tooltip.position-top {
    transform-origin: center bottom;
  }

  .tooltip-content {
    position: relative;
  }

  .tooltip-text {
    font-size: 0.875rem;
    color: var(--text-primary);
    line-height: 1.5;
    margin: 0;
  }

  .tooltip-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: var(--surface);
    border-radius: 50%;
    color: var(--text-muted);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tooltip-close:hover {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  /* Recategorize Options in Modal */
  .recategorize-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    max-height: 300px;
    overflow-y: auto;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .radio-option:hover {
    background: var(--surface-elevated);
    border-color: var(--acapulco);
  }

  .radio-option:has(input:checked) {
    background: rgba(122, 186, 165, 0.05);
    border-color: var(--acapulco);
  }

  .radio-option input {
    cursor: pointer;
    accent-color: var(--acapulco);
  }

  .radio-option span {
    font-size: 0.875rem;
    color: var(--text-primary);
    flex: 1;
  }

  .category-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .category-select:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  /* Animations */
  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .categories-container {
      padding: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .helper-tooltip {
      width: calc(100vw - 2rem);
      max-width: 320px;
    }
  }
</style>