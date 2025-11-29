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
  let showNewForm = $state(false);
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
  let showAddHistoryModal = $state(false);
  let addHistoryInvestmentId = $state<string | null>(null);
  let addHistoryForm = $state<AddHistoryForm>({
    amount: 0,
    type: 'CONTRIBUTION',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Delete modal
  let showDeleteModal = $state(false);
  let investmentToDelete = $state<Investment | null>(null);

  // Constants
  const availableColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    '#F59E0B', '#EF4444', '#14B8A6', '#6366F1',
    '#84CC16', '#F97316', '#06B6D4', '#A855F7'
  ];

  const availableIcons = [
    '📈', '💹', '📊', '💰', '🏦', '💎', '🪙', '📉',
    '💵', '💴', '💶', '💷', '🏠', '🚗', '✈️', '🎯',
    '📱', '💻', '🔒', '🌍', '⚡', '🛢️', '🏭', '🎨'
  ];

  // Computed
  const highlightedInvestments = $derived(
    investments.filter(inv => inv.highlight)
  );

  const totalPortfolioValue = $derived(
    portfolioSummary?.totalValue ?? investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  );

  const totalProfit = $derived(
    portfolioSummary?.totalProfit ?? investments.reduce((sum, inv) => sum + inv.profit, 0)
  );

  const profitPercentage = $derived(
    portfolioSummary?.profitPercentage ?? 0
  );

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
  function startNewInvestment() {
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
    showNewForm = true;
  }

  async function saveNewInvestment() {
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
      showNewForm = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create investment';
    }
  }

  function cancelNewInvestment() {
    showNewForm = false;
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

  function prepareDelete(investment: Investment) {
    investmentToDelete = investment;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!investmentToDelete) return;

    try {
      await investmentsApi.delete(investmentToDelete.id);
      await loadAll();
      showDeleteModal = false;
      investmentToDelete = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete investment';
    }
  }

  // History operations
  function startAddHistory(investmentId: string) {
    addHistoryInvestmentId = investmentId;
    addHistoryForm = {
      amount: 0,
      type: 'CONTRIBUTION',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    };
    showAddHistoryModal = true;
  }

  async function saveHistoryEntry() {
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

      showAddHistoryModal = false;
      addHistoryInvestmentId = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to add history entry';
    }
  }

  function cancelAddHistory() {
    showAddHistoryModal = false;
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

  return {
    // State
    get investments() { return investments; },
    get portfolioSummary() { return portfolioSummary; },
    get timeline() { return timeline; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    get selectedInvestment() { return selectedInvestment; },
    set selectedInvestment(value: Investment | null) { selectedInvestment = value; },

    // Computed
    get highlightedInvestments() { return highlightedInvestments; },
    get totalPortfolioValue() { return totalPortfolioValue; },
    get totalProfit() { return totalProfit; },
    get profitPercentage() { return profitPercentage; },

    // Edit state
    get editingInvestment() { return editingInvestment; },
    get editForm() { return editForm; },
    set editForm(value: InvestmentEditForm) { editForm = value; },

    // New form state
    get showNewForm() { return showNewForm; },
    set showNewForm(value: boolean) { showNewForm = value; },
    get newInvestmentForm() { return newInvestmentForm; },
    set newInvestmentForm(value: InvestmentEditForm) { newInvestmentForm = value; },

    // Add history state
    get showAddHistoryModal() { return showAddHistoryModal; },
    set showAddHistoryModal(value: boolean) { showAddHistoryModal = value; },
    get addHistoryForm() { return addHistoryForm; },
    set addHistoryForm(value: AddHistoryForm) { addHistoryForm = value; },
    get addHistoryInvestmentId() { return addHistoryInvestmentId; },

    // Delete state
    get showDeleteModal() { return showDeleteModal; },
    set showDeleteModal(value: boolean) { showDeleteModal = value; },
    get investmentToDelete() { return investmentToDelete; },

    // Constants
    availableColors,
    availableIcons,

    // Actions
    loadAll,
    loadTimeline,
    loadInvestmentDetails,
    startNewInvestment,
    saveNewInvestment,
    cancelNewInvestment,
    startEdit,
    saveEdit,
    cancelEdit,
    toggleHighlight,
    prepareDelete,
    confirmDelete,
    startAddHistory,
    saveHistoryEntry,
    cancelAddHistory,
    deleteHistoryEntry,
    reorderInvestments,

    // Utilities
    formatCurrency,
    formatPercentage,
    formatDate,
    getHistoryTypeLabel,
    getHistoryTypeColor,
  };
}

export type InvestmentsStore = ReturnType<typeof createInvestmentsStore>;
