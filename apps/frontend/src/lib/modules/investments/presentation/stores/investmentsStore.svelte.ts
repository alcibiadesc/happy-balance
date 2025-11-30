import type {
  Investment,
  InvestmentWithMetrics,
  PortfolioSummary,
  TimelineEntry,
  CreateInvestmentData,
  UpdateInvestmentData,
  AddHistoryEntryData,
  InvestmentHistoryType,
} from '../../domain/entities/Investment';
import { investmentsApi } from '../../infrastructure/api/investmentsApi';
import { get } from 'svelte/store';
import { currentCurrency } from '$lib/stores/currency';

export interface InvestmentEditForm {
  name: string;
  symbol: string;
  currentValue: number;
  currency: string;
  categoryId: string | null;
  highlight: boolean;
  color: string;
  icon: string;
  notes: string;
}

export interface AddHistoryForm {
  amount: number;
  type: InvestmentHistoryType;
  date: string;
  notes: string;
}

export function createInvestmentsStore() {
  // State
  let investments = $state<InvestmentWithMetrics[]>([]);
  let portfolioSummary = $state<PortfolioSummary | null>(null);
  let timeline = $state<TimelineEntry[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Selected investment for details view
  let selectedInvestment = $state<Investment | null>(null);

  // Edit state
  let editingInvestment = $state<string | null>(null);
  let editForm = $state<InvestmentEditForm>({
    name: '',
    symbol: '',
    currentValue: 0,
    currency: 'EUR',
    categoryId: null,
    highlight: false,
    color: '#10B981',
    icon: '📈',
    notes: '',
  });

  // New investment form
  let _showNewForm = $state(false);
  let newInvestmentForm = $state<InvestmentEditForm>({
    name: '',
    symbol: '',
    currentValue: 0,
    currency: 'EUR',
    categoryId: null,
    highlight: false,
    color: '#10B981',
    icon: '📈',
    notes: '',
  });

  // Add history modal
  let _showAddHistoryModal = $state(false);
  let addHistoryInvestmentId = $state<string | null>(null);
  let addHistoryForm = $state<AddHistoryForm>({
    amount: 0,
    type: 'CONTRIBUTION',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Delete modal
  let _showDeleteModal = $state(false);
  let investmentToDelete = $state<Investment | null>(null);

  // Inline value editing
  let inlineEditingId = $state<string | null>(null);
  let inlineEditValue = $state<number>(0);

  // History entry editing
  let editingHistoryEntry = $state<{
    investmentId: string;
    historyId: string;
    amount: number;
    date: string;
    notes: string;
    type: string;
  } | null>(null);

  // Constants
  const availableColors = [
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F59E0B',
    '#EF4444',
    '#14B8A6',
    '#6366F1',
    '#84CC16',
    '#F97316',
    '#06B6D4',
    '#A855F7',
  ];

  const availableIcons = [
    '📈',
    '💹',
    '📊',
    '💰',
    '🏦',
    '💎',
    '🪙',
    '📉',
    '💵',
    '💴',
    '💶',
    '💷',
    '🏠',
    '🚗',
    '✈️',
    '🎯',
    '📱',
    '💻',
    '🔒',
    '🌍',
    '⚡',
    '🛢️',
    '🏭',
    '🎨',
  ];

  // Computed
  const highlightedInvestments = $derived(investments.filter((inv) => inv.highlight));

  const totalPortfolioValue = $derived(
    portfolioSummary?.totalValue ?? investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  );

  const totalProfit = $derived(
    portfolioSummary?.totalProfit ?? investments.reduce((sum, inv) => sum + inv.profit, 0)
  );

  const profitPercentage = $derived(portfolioSummary?.profitPercentage ?? 0);

  // Load all data
  async function loadAll() {
    isLoading = true;
    error = null;
    try {
      const [invData, summaryData] = await Promise.all([
        investmentsApi.getWithMetrics(),
        investmentsApi.getPortfolioSummary(),
      ]);
      investments = invData;
      portfolioSummary = summaryData;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load investments';
      console.error('Error loading investments:', e);
    } finally {
      isLoading = false;
    }
  }

  async function loadTimeline(
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    dateFrom?: string,
    dateTo?: string
  ) {
    try {
      timeline = await investmentsApi.getTimeline(period, dateFrom, dateTo);
    } catch (e) {
      console.error('Error loading timeline:', e);
    }
  }

  async function loadInvestmentDetails(id: string) {
    try {
      selectedInvestment = await investmentsApi.getById(id);
    } catch (e) {
      console.error('Error loading investment details:', e);
    }
  }

  // CRUD operations
  function _startNewInvestment() {
    const currency = get(currentCurrency);
    newInvestmentForm = {
      name: '',
      symbol: '',
      currentValue: 0,
      currency: currency || 'EUR',
      categoryId: null,
      highlight: false,
      color: availableColors[0],
      icon: '📈',
      notes: '',
    };
    _showNewForm = true;
  }

  async function _saveNewInvestment() {
    if (!newInvestmentForm.name) return;

    try {
      const data: CreateInvestmentData = {
        name: newInvestmentForm.name,
        symbol: newInvestmentForm.symbol || undefined,
        currentValue: newInvestmentForm.currentValue,
        currency: newInvestmentForm.currency,
        categoryId: newInvestmentForm.categoryId || undefined,
        highlight: newInvestmentForm.highlight,
        color: newInvestmentForm.color,
        icon: newInvestmentForm.icon,
        notes: newInvestmentForm.notes || undefined,
      };

      await investmentsApi.create(data);
      await loadAll();
      _showNewForm = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create investment';
    }
  }

  function _cancelNewInvestment() {
    _showNewForm = false;
  }

  function startEdit(investment: Investment) {
    editingInvestment = investment.id;
    editForm = {
      name: investment.name,
      symbol: investment.symbol || '',
      currentValue: investment.currentValue,
      currency: investment.currency,
      categoryId: investment.categoryId,
      highlight: investment.highlight,
      color: investment.color,
      icon: investment.icon,
      notes: investment.notes || '',
    };
  }

  async function saveEdit() {
    if (!editingInvestment || !editForm.name) return;

    try {
      const data: UpdateInvestmentData = {
        name: editForm.name,
        symbol: editForm.symbol || null,
        currentValue: editForm.currentValue,
        currency: editForm.currency,
        categoryId: editForm.categoryId,
        highlight: editForm.highlight,
        color: editForm.color,
        icon: editForm.icon,
        notes: editForm.notes || null,
      };

      await investmentsApi.update(editingInvestment, data);
      await loadAll();
      cancelEdit();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update investment';
    }
  }

  function cancelEdit() {
    editingInvestment = null;
  }

  async function toggleHighlight(investment: Investment) {
    try {
      await investmentsApi.update(investment.id, { highlight: !investment.highlight });
      await loadAll();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to toggle highlight';
    }
  }

  function _prepareDelete(investment: Investment) {
    investmentToDelete = investment;
    _showDeleteModal = true;
  }

  async function _confirmDelete() {
    if (!investmentToDelete) return;

    try {
      await investmentsApi.delete(investmentToDelete.id);
      await loadAll();
      _showDeleteModal = false;
      investmentToDelete = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete investment';
    }
  }

  // History operations
  function _startAddHistory(investmentId: string) {
    addHistoryInvestmentId = investmentId;
    addHistoryForm = {
      amount: 0,
      type: 'CONTRIBUTION',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    };
    _showAddHistoryModal = true;
  }

  async function _saveHistoryEntry() {
    if (!addHistoryInvestmentId || addHistoryForm.amount <= 0) return;

    try {
      const data: AddHistoryEntryData = {
        amount: addHistoryForm.amount,
        type: addHistoryForm.type,
        date: addHistoryForm.date,
        notes: addHistoryForm.notes || undefined,
      };

      await investmentsApi.addHistoryEntry(addHistoryInvestmentId, data);
      await loadAll();

      // Refresh selected investment if viewing details
      if (selectedInvestment?.id === addHistoryInvestmentId) {
        await loadInvestmentDetails(addHistoryInvestmentId);
      }

      _showAddHistoryModal = false;
      addHistoryInvestmentId = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to add history entry';
    }
  }

  function _cancelAddHistory() {
    _showAddHistoryModal = false;
    addHistoryInvestmentId = null;
  }

  async function deleteHistoryEntry(investmentId: string, historyId: string) {
    try {
      await investmentsApi.deleteHistoryEntry(investmentId, historyId);
      await loadAll();

      // Refresh selected investment if viewing details
      if (selectedInvestment?.id === investmentId) {
        await loadInvestmentDetails(investmentId);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete history entry';
    }
  }

  // Inline value editing
  function startInlineEdit(investment: Investment) {
    inlineEditingId = investment.id;
    inlineEditValue = investment.currentValue;
  }

  async function saveInlineEdit() {
    if (!inlineEditingId) return;

    try {
      await investmentsApi.update(inlineEditingId, { currentValue: inlineEditValue });
      await loadAll();

      // Refresh selected investment if viewing details
      if (selectedInvestment?.id === inlineEditingId) {
        await loadInvestmentDetails(inlineEditingId);
      }

      inlineEditingId = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update investment value';
    }
  }

  function cancelInlineEdit() {
    inlineEditingId = null;
  }

  // History entry editing
  function startEditHistoryEntry(
    investmentId: string,
    entry: { id: string; amount: number; date: string; notes?: string; type: string }
  ) {
    editingHistoryEntry = {
      investmentId,
      historyId: entry.id,
      amount: entry.amount,
      date:
        typeof entry.date === 'string'
          ? entry.date.split('T')[0]
          : new Date(entry.date).toISOString().split('T')[0],
      notes: entry.notes || '',
      type: entry.type,
    };
  }

  async function saveHistoryEntryEdit() {
    if (!editingHistoryEntry) return;

    try {
      await investmentsApi.updateHistoryEntry(
        editingHistoryEntry.investmentId,
        editingHistoryEntry.historyId,
        {
          amount: editingHistoryEntry.amount,
          date: editingHistoryEntry.date,
          notes: editingHistoryEntry.notes,
          type: editingHistoryEntry.type,
        }
      );
      await loadAll();

      // Refresh selected investment if viewing details
      if (selectedInvestment?.id === editingHistoryEntry.investmentId) {
        await loadInvestmentDetails(editingHistoryEntry.investmentId);
      }

      editingHistoryEntry = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update history entry';
    }
  }

  function cancelHistoryEntryEdit() {
    editingHistoryEntry = null;
  }

  // Reorder investments (drag-and-drop)
  async function reorderInvestments(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    // Optimistic update
    const newOrder = [...investments];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    investments = newOrder;

    // Prepare sort order updates
    const sortUpdates = newOrder.map((inv, index) => ({
      id: inv.id,
      sortOrder: index,
    }));

    try {
      await investmentsApi.updateSortOrder(sortUpdates);
    } catch (e) {
      // Revert on error
      await loadAll();
      error = e instanceof Error ? e.message : 'Failed to reorder investments';
    }
  }

  // Utility functions
  function formatCurrency(amount: number): string {
    const currency = portfolioSummary?.currency || get(currentCurrency) || 'EUR';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatPercentage(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(value / 100);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getHistoryTypeLabel(type: InvestmentHistoryType): string {
    const labels: Record<InvestmentHistoryType, string> = {
      CONTRIBUTION: 'Aportación',
      WITHDRAWAL: 'Retirada',
      VALUE_UPDATE: 'Actualización',
    };
    return labels[type];
  }

  function getHistoryTypeColor(type: InvestmentHistoryType): string {
    const colors: Record<InvestmentHistoryType, string> = {
      CONTRIBUTION: 'text-green-600',
      WITHDRAWAL: 'text-red-600',
      VALUE_UPDATE: 'text-blue-600',
    };
    return colors[type];
  }

  // Expose state as reactive object
  // Using individual $state variables for modal states (for proper reactivity)
  let showAddHistoryModalState = $state(false);
  let showDeleteModalState = $state(false);
  let showNewFormState = $state(false);

  // Legacy modals object for backwards compatibility (not reactive)
  const modals = {
    get showAddHistoryModal() {
      return showAddHistoryModalState;
    },
    set showAddHistoryModal(v: boolean) {
      showAddHistoryModalState = v;
    },
    get showDeleteModal() {
      return showDeleteModalState;
    },
    set showDeleteModal(v: boolean) {
      showDeleteModalState = v;
    },
    get showNewForm() {
      return showNewFormState;
    },
    set showNewForm(v: boolean) {
      showNewFormState = v;
    },
  };

  // Separate reactive form data for add history (nested objects in $state don't bind well)
  const addHistoryFormData = $state<AddHistoryForm>({
    amount: 0,
    type: 'CONTRIBUTION' as InvestmentHistoryType,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Wrap modal functions to use the reactive state
  function _startAddHistoryReactive(investmentId: string) {
    addHistoryInvestmentId = investmentId;
    // Reset form data
    addHistoryFormData.amount = 0;
    addHistoryFormData.type = 'CONTRIBUTION';
    addHistoryFormData.date = new Date().toISOString().split('T')[0];
    addHistoryFormData.notes = '';
    showAddHistoryModalState = true;
  }

  function _cancelAddHistoryReactive() {
    showAddHistoryModalState = false;
    addHistoryInvestmentId = null;
  }

  async function _saveHistoryEntryReactive() {
    if (!addHistoryInvestmentId || addHistoryFormData.amount <= 0) return;

    try {
      const data: AddHistoryEntryData = {
        amount: addHistoryFormData.amount,
        type: addHistoryFormData.type,
        date: addHistoryFormData.date,
        notes: addHistoryFormData.notes || undefined,
      };

      await investmentsApi.addHistoryEntry(addHistoryInvestmentId, data);
      await loadAll();

      // Refresh selected investment if viewing details
      if (selectedInvestment?.id === addHistoryInvestmentId) {
        await loadInvestmentDetails(addHistoryInvestmentId);
      }

      showAddHistoryModalState = false;
      addHistoryInvestmentId = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to add history entry';
    }
  }

  function _prepareDeleteReactive(investment: Investment) {
    investmentToDelete = investment;
    showDeleteModalState = true;
  }

  async function _confirmDeleteReactive() {
    if (!investmentToDelete) return;

    try {
      await investmentsApi.delete(investmentToDelete.id);
      await loadAll();
      showDeleteModalState = false;
      investmentToDelete = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete investment';
    }
  }

  function _startNewInvestmentReactive() {
    const currency = get(currentCurrency);
    newInvestmentForm = {
      name: '',
      symbol: '',
      currentValue: 0,
      currency: currency || 'EUR',
      categoryId: null,
      highlight: false,
      color: availableColors[0],
      icon: '📈',
      notes: '',
    };
    showNewFormState = true;
  }

  async function _saveNewInvestmentReactive() {
    if (!newInvestmentForm.name) return;

    try {
      const data: CreateInvestmentData = {
        name: newInvestmentForm.name,
        symbol: newInvestmentForm.symbol || undefined,
        currentValue: newInvestmentForm.currentValue,
        currency: newInvestmentForm.currency,
        categoryId: newInvestmentForm.categoryId || undefined,
        highlight: newInvestmentForm.highlight,
        color: newInvestmentForm.color,
        icon: newInvestmentForm.icon,
        notes: newInvestmentForm.notes || undefined,
      };

      await investmentsApi.create(data);
      await loadAll();
      showNewFormState = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create investment';
    }
  }

  function _cancelNewInvestmentReactive() {
    showNewFormState = false;
  }

  return {
    // Reactive modals state - direct access to $state object
    modals,
    // Reactive form data for add history modal
    addHistoryFormData,

    // State (getters for non-modal state)
    get investments() {
      return investments;
    },
    get portfolioSummary() {
      return portfolioSummary;
    },
    get timeline() {
      return timeline;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    get selectedInvestment() {
      return selectedInvestment;
    },
    set selectedInvestment(value: Investment | null) {
      selectedInvestment = value;
    },

    // Computed
    get highlightedInvestments() {
      return highlightedInvestments;
    },
    get totalPortfolioValue() {
      return totalPortfolioValue;
    },
    get totalProfit() {
      return totalProfit;
    },
    get profitPercentage() {
      return profitPercentage;
    },

    // Edit state
    get editingInvestment() {
      return editingInvestment;
    },
    get editForm() {
      return editForm;
    },
    set editForm(value: InvestmentEditForm) {
      editForm = value;
    },

    // New form state
    get showNewForm() {
      return showNewFormState;
    },
    set showNewForm(value: boolean) {
      showNewFormState = value;
    },
    get newInvestmentForm() {
      return newInvestmentForm;
    },
    set newInvestmentForm(value: InvestmentEditForm) {
      newInvestmentForm = value;
    },

    // Add history state
    get showAddHistoryModal() {
      return showAddHistoryModalState;
    },
    set showAddHistoryModal(value: boolean) {
      showAddHistoryModalState = value;
    },
    get addHistoryForm() {
      return addHistoryForm;
    },
    set addHistoryForm(value: AddHistoryForm) {
      addHistoryForm = value;
    },
    get addHistoryInvestmentId() {
      return addHistoryInvestmentId;
    },

    // Delete state
    get showDeleteModal() {
      return showDeleteModalState;
    },
    set showDeleteModal(value: boolean) {
      showDeleteModalState = value;
    },
    get investmentToDelete() {
      return investmentToDelete;
    },

    // Inline value editing
    get inlineEditingId() {
      return inlineEditingId;
    },
    get inlineEditValue() {
      return inlineEditValue;
    },
    set inlineEditValue(value: number) {
      inlineEditValue = value;
    },

    // History entry editing
    get editingHistoryEntry() {
      return editingHistoryEntry;
    },
    set editingHistoryEntry(value: typeof editingHistoryEntry) {
      editingHistoryEntry = value;
    },

    // Constants
    availableColors,
    availableIcons,

    // Actions - using reactive versions for modal-related actions
    loadAll,
    loadTimeline,
    loadInvestmentDetails,
    startNewInvestment: _startNewInvestmentReactive,
    saveNewInvestment: _saveNewInvestmentReactive,
    cancelNewInvestment: _cancelNewInvestmentReactive,
    startEdit,
    saveEdit,
    cancelEdit,
    toggleHighlight,
    prepareDelete: _prepareDeleteReactive,
    confirmDelete: _confirmDeleteReactive,
    startAddHistory: _startAddHistoryReactive,
    saveHistoryEntry: _saveHistoryEntryReactive,
    cancelAddHistory: _cancelAddHistoryReactive,
    deleteHistoryEntry,
    reorderInvestments,
    startInlineEdit,
    saveInlineEdit,
    cancelInlineEdit,
    startEditHistoryEntry,
    saveHistoryEntryEdit,
    cancelHistoryEntryEdit,

    // Utilities
    formatCurrency,
    formatPercentage,
    formatDate,
    getHistoryTypeLabel,
    getHistoryTypeColor,
  };
}

export type InvestmentsStore = ReturnType<typeof createInvestmentsStore>;
