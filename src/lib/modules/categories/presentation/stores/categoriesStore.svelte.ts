import { CategoryEntity, type CategoryData } from '../../domain/entities/CategoryEntity';
import { CategoryType, type CategoryTypeValue } from '../../domain/value-objects/CategoryType';
import { apiCategories, apiTransactions } from '$lib/stores/api-transactions';
import type { Category } from '$lib/types/transaction';
import { get } from 'svelte/store';
import { currentCurrency } from '$lib/stores/currency';

export interface EditForm {
  name: string;
  icon: string;
  color: string;
  annualBudget: number;
  type: CategoryTypeValue;
}

export interface PickerPosition {
  top: number;
  left: number;
  width: number;
  position: string;
  maxHeight?: string;
}

export function createCategoriesStore() {
  // State
  let categories = $state<CategoryEntity[]>([]);
  let editingCategory = $state<string | null>(null);
  let newCategory = $state<Partial<CategoryData> | null>(null);
  let selectedType = $state<CategoryTypeValue | null>(null);
  let editForm = $state<EditForm>({
    name: '',
    icon: '',
    color: '',
    annualBudget: 0,
    type: 'essential'
  });
  let newCategoryForm = $state<EditForm>({
    name: '',
    icon: '',
    color: '',
    annualBudget: 0,
    type: 'essential'
  });

  // UI State
  let showDeleteModal = $state(false);
  let categoryToDelete = $state<CategoryEntity | null>(null);
  let transactionsWithCategory = $state(0);
  let recategorizeTarget = $state<string>('remove');

  // Icon Picker State
  let showIconPickerNew = $state(false);
  let showIconPickerEdit = $state<string | null>(null);
  let pickerPosition = $state<PickerPosition>({
    top: 0,
    left: 0,
    width: 160,
    position: 'bottom'
  });

  // Helper Tooltip State
  let showHelperTooltip = $state(false);
  let tooltipPosition = $state({
    top: 0,
    left: 0,
    position: 'bottom'
  });

  // Constants
  const availableColors = [
    '#f5796c', '#fecd2c', '#7abaa5', '#6b5b95',
    '#ff6f69', '#88b04b', '#92a8d1', '#955251',
    '#b565a7', '#009b77', '#dd4124', '#d65076',
    '#45b8ac', '#efc050', '#5b5ea6', '#9b2335'
  ];

  const availableEmojis = [
    '🏠', '🍔', '🎮', '💼', '🚗', '✈️', '📚', '💊',
    '🎬', '👕', '💳', '🎁', '💰', '📱', '🏥', '🎓',
    '🏪', '⚡', '💧', '🌐', '🔧', '🐾', '🎨', '🎵',
    '🏋️', '🚕', '☕', '🍺', '💐', '📦', '🏦', '💸'
  ];

  // Computed
  const categoriesByType = $derived.by(() => {
    const grouped: Record<CategoryTypeValue, CategoryEntity[]> = {
      income: [],
      essential: [],
      discretionary: [],
      investment: [],
      debt_payment: [],
      no_compute: []
    };

    categories.forEach(cat => {
      grouped[cat.getTypeValue()].push(cat);
    });

    return grouped;
  });

  const categoryTypes = $derived([
    { value: 'income', type: CategoryType.income() },
    { value: 'essential', type: CategoryType.essential() },
    { value: 'discretionary', type: CategoryType.discretionary() },
    { value: 'investment', type: CategoryType.investment() },
    { value: 'debt_payment', type: CategoryType.debtPayment() },
    { value: 'no_compute', type: CategoryType.noCompute() }
  ]);

  // Load categories from API
  async function loadCategories() {
    await apiCategories.load();
    const apiCats = get(apiCategories);
    categories = apiCats.map(cat => CategoryEntity.create({
      ...cat,
      type: (cat.type || 'essential') as CategoryTypeValue
    }));
  }

  // Category CRUD operations
  function startNewCategory(type: CategoryTypeValue) {
    selectedType = type;
    newCategoryForm = {
      name: '',
      icon: '🏷️',
      color: availableColors[0],
      type: type,
      annualBudget: 0
    };
    newCategory = {
      name: '',
      icon: '🏷️',
      color: availableColors[0],
      type: type,
      annualBudget: 0
    };
  }

  async function saveNewCategory() {
    if (!newCategoryForm.name) return;

    const category = {
      name: newCategoryForm.name,
      icon: newCategoryForm.icon,
      color: newCategoryForm.color,
      type: newCategoryForm.type,
      annualBudget: newCategoryForm.annualBudget
    };

    await apiCategories.add(category);
    await loadCategories(); // Reload categories after adding
    newCategory = null;
    selectedType = null;
    showIconPickerNew = false;
  }

  function cancelNewCategory() {
    newCategory = null;
    selectedType = null;
    showIconPickerNew = false;
  }

  function startEdit(category: CategoryEntity) {
    editingCategory = category.getId();
    editForm = {
      name: category.getName(),
      icon: category.getIcon(),
      color: category.getColor(),
      annualBudget: category.getAnnualBudget(),
      type: category.getTypeValue()
    };
  }

  async function saveEdit() {
    if (!editingCategory || !editForm.name) return;

    try {
      const updateData = {
        name: editForm.name,
        icon: editForm.icon,
        color: editForm.color,
        type: editForm.type,
        annualBudget: editForm.annualBudget
      };

      await apiCategories.update(editingCategory, updateData);
      await loadCategories(); // Reload to get the updated list
      cancelEdit();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  }

  function cancelEdit() {
    editingCategory = null;
    showIconPickerEdit = null;
  }

  async function prepareDelete(category: CategoryEntity) {
    categoryToDelete = category;
    // Count transactions with this category
    await apiTransactions.load();
    const transactions = get(apiTransactions);
    transactionsWithCategory = transactions.filter(t => t.categoryId === category.getId()).length;
    recategorizeTarget = 'remove';
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;

    try {
      // Handle recategorization if there are transactions
      if (transactionsWithCategory > 0) {
        const transactions = get(apiTransactions);
        const affectedTransactions = transactions.filter(t => t.categoryId === categoryToDelete.getId());

        for (const transaction of affectedTransactions) {
          await apiTransactions.update(transaction.id, {
            categoryId: recategorizeTarget === 'remove' ? undefined : recategorizeTarget
          });
        }
      }

      // Delete the category
      await apiCategories.delete(categoryToDelete.getId());
      await loadCategories(); // Reload to get the updated list

      showDeleteModal = false;
      categoryToDelete = null;
      recategorizeTarget = 'remove';
      transactionsWithCategory = 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      showDeleteModal = false;
    }
  }

  // Icon Picker
  function selectIcon(icon: string) {
    if (showIconPickerNew) {
      newCategoryForm.icon = icon;
      showIconPickerNew = false;
    } else if (showIconPickerEdit) {
      editForm.icon = icon;
      showIconPickerEdit = null;
    }
  }

  function closeIconPicker() {
    showIconPickerNew = false;
    showIconPickerEdit = null;
  }

  // Positioning calculations
  function calculatePickerPosition(buttonElement: HTMLElement): PickerPosition {
    const rect = buttonElement.getBoundingClientRect();
    const pickerWidth = 160;
    const pickerEstimatedHeight = 260;
    const spacing = 8;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    let top, left, maxHeight, position, width = pickerWidth;

    if (spaceBelow >= pickerEstimatedHeight + spacing) {
      position = 'bottom';
      top = rect.bottom + spacing;
      maxHeight = spaceBelow - spacing * 2;
    } else if (spaceAbove >= pickerEstimatedHeight + spacing) {
      position = 'top';
      top = rect.top - pickerEstimatedHeight - spacing;
      maxHeight = spaceAbove - spacing * 2;
    } else if (viewportHeight >= pickerEstimatedHeight + spacing * 2) {
      position = 'center';
      top = (viewportHeight - pickerEstimatedHeight) / 2;
      maxHeight = viewportHeight - spacing * 4;
    } else {
      position = 'bottom';
      top = spacing;
      maxHeight = viewportHeight - spacing * 2;
    }

    if (spaceRight >= pickerWidth / 2) {
      left = rect.left + (rect.width / 2) - (pickerWidth / 2);
    } else if (spaceLeft >= pickerWidth / 2) {
      left = rect.right - pickerWidth / 2;
    } else {
      left = (viewportWidth - pickerWidth) / 2;
    }

    left = Math.max(spacing, Math.min(left, viewportWidth - pickerWidth - spacing));

    return { top, left, maxHeight: `${maxHeight}px`, position, width };
  }

  function getCurrencySymbol(): string {
    const currency = get(currentCurrency);
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹'
    };
    return symbols[currency] || currency;
  }

  function formatCurrency(amount: number): string {
    const currency = get(currentCurrency);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  return {
    // State
    get categories() { return categories; },
    get categoriesByType() { return categoriesByType; },
    get categoryTypes() { return categoryTypes; },
    get editingCategory() { return editingCategory; },
    get newCategory() { return newCategory; },
    get selectedType() { return selectedType; },
    get editForm() { return editForm; },
    set editForm(value: EditForm) { editForm = value; },
    get newCategoryForm() { return newCategoryForm; },
    set newCategoryForm(value: EditForm) { newCategoryForm = value; },

    // UI State
    get showDeleteModal() { return showDeleteModal; },
    set showDeleteModal(value: boolean) { showDeleteModal = value; },
    get categoryToDelete() { return categoryToDelete; },
    get transactionsWithCategory() { return transactionsWithCategory; },
    get recategorizeTarget() { return recategorizeTarget; },
    set recategorizeTarget(value: string) { recategorizeTarget = value; },

    // Icon Picker State
    get showIconPickerNew() { return showIconPickerNew; },
    set showIconPickerNew(value: boolean) { showIconPickerNew = value; },
    get showIconPickerEdit() { return showIconPickerEdit; },
    set showIconPickerEdit(value: string | null) { showIconPickerEdit = value; },
    get pickerPosition() { return pickerPosition; },
    set pickerPosition(value: PickerPosition) { pickerPosition = value; },

    // Helper Tooltip State
    get showHelperTooltip() { return showHelperTooltip; },
    set showHelperTooltip(value: boolean) { showHelperTooltip = value; },
    get tooltipPosition() { return tooltipPosition; },
    set tooltipPosition(value: any) { tooltipPosition = value; },

    // Constants
    availableColors,
    availableEmojis,

    // Actions
    loadCategories,
    startNewCategory,
    saveNewCategory,
    cancelNewCategory,
    startEdit,
    saveEdit,
    cancelEdit,
    prepareDelete,
    confirmDelete,
    selectIcon,
    closeIconPicker,
    calculatePickerPosition,
    getCurrencySymbol,
    formatCurrency
  };
}

export type CategoriesStore = ReturnType<typeof createCategoriesStore>;