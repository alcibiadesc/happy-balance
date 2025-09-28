import {
  createInitialModalState,
  modalActions,
  type ModalState
} from '../../application/services/ModalStateService';
import {
  createInitialFilterState,
  filterActions,
  type FilterState
} from '../../application/services/FilterService';
import {
  createInitialObservationsState,
  observationsActions,
  type ObservationsState
} from '../../application/services/ObservationsService';
import {
  createInitialGroupingState,
  groupingActions,
  type GroupingState
} from '../../application/services/GroupingService';
import {
  createInitialSelectionState,
  selectionActions,
  type SelectionState
} from '../../application/services/SelectionService';

class TransactionsPageStore {
  private modals = $state<ModalState>(createInitialModalState());
  private filters = $state<FilterState>(createInitialFilterState());
  private observations = $state<ObservationsState>(createInitialObservationsState());
  private grouping = $state<GroupingState>(createInitialGroupingState());
  private selection = $state<SelectionState>(createInitialSelectionState());
  private showDatePicker = $state(false);
  private showCategoryFilterDropdown = $state(false);

  // Getters for state
  get modalState() { return this.modals; }
  get filterState() { return this.filters; }
  get observationsState() { return this.observations; }
  get groupingState() { return this.grouping; }
  get selectionState() { return this.selection; }
  get isShowingDatePicker() { return this.showDatePicker; }
  get isShowingCategoryFilterDropdown() { return this.showCategoryFilterDropdown; }

  // Modal actions
  openCategoryModal = (transaction: any) => {
    this.modals = modalActions.openCategoryModal(this.modals, transaction);
  };

  closeCategoryModal = () => {
    this.modals = modalActions.closeCategoryModal(this.modals);
  };

  openAddModal = () => {
    this.modals = modalActions.openAddModal(this.modals);
  };

  closeAddModal = () => {
    this.modals = modalActions.closeAddModal(this.modals);
  };

  toggleFilters = () => {
    this.modals = modalActions.toggleFilters(this.modals);
  };

  openSmartCategorization = (transaction: any, category: any, matchingTransactions: any[]) => {
    this.modals = modalActions.openSmartCategorization(
      this.modals,
      transaction,
      category,
      matchingTransactions
    );
  };

  closeSmartCategorization = () => {
    this.modals = modalActions.closeSmartCategorization(this.modals);
  };

  openDeleteSelectedModal = () => {
    this.modals = modalActions.openDeleteSelectedModal(this.modals);
  };

  closeDeleteSelectedModal = () => {
    this.modals = modalActions.closeDeleteSelectedModal(this.modals);
  };

  openDeleteSingleModal = (transactionId: string) => {
    this.modals = modalActions.openDeleteSingleModal(this.modals, transactionId);
  };

  closeDeleteSingleModal = () => {
    this.modals = modalActions.closeDeleteSingleModal(this.modals);
  };

  // Filter actions
  setSearchQuery = (query: string) => {
    this.filters = filterActions.setSearchQuery(this.filters, query);
  };

  setPeriod = (period: string) => {
    this.filters = { ...this.filters, selectedPeriod: period };
  };

  setCustomStartDate = (date: string) => {
    this.filters = { ...this.filters, customStartDate: date };
  };

  setCustomEndDate = (date: string) => {
    this.filters = { ...this.filters, customEndDate: date };
  };

  toggleAllTransactions = () => {
    this.filters = filterActions.toggleAllTransactions(this.filters);
  };

  toggleHiddenTransactions = () => {
    this.filters = filterActions.toggleHiddenTransactions(this.filters);
  };

  toggleDateRangeMode = () => {
    this.filters = filterActions.toggleDateRangeMode(this.filters);
  };

  setTransactionTypeFilter = (type: 'all' | 'income' | 'expenses' | 'uncategorized') => {
    this.filters = filterActions.setTransactionTypeFilter(this.filters, type);
  };

  toggleCategory = (categoryId: string) => {
    this.filters = filterActions.toggleCategory(this.filters, categoryId);
  };

  clearFilters = () => {
    this.filters = filterActions.clearFilters(this.filters);
  };

  // Observations actions
  startEditingObservations = (transaction: any) => {
    this.observations = observationsActions.startEditing(this.observations, transaction);
  };

  cancelEditingObservations = () => {
    this.observations = observationsActions.cancelEditing(this.observations);
  };

  updateObservationsText = (text: string) => {
    this.observations = observationsActions.updateText(this.observations, text);
  };

  // Grouping actions
  toggleGroup = (date: string) => {
    this.grouping = groupingActions.toggleGroup(this.grouping, date);
  };

  collapseAll = (dates: string[]) => {
    this.grouping = groupingActions.collapseAll(this.grouping, dates);
  };

  expandAll = () => {
    this.grouping = groupingActions.expandAll();
  };

  // Selection actions
  toggleSelectionMode = () => {
    this.selection = selectionActions.toggleSelectionMode(this.selection);
  };

  toggleSelection = (id: string) => {
    this.selection = selectionActions.toggleSelection(this.selection, id);
  };

  selectAll = (ids: string[]) => {
    this.selection = selectionActions.selectAll(this.selection, ids);
  };

  clearSelection = () => {
    this.selection = selectionActions.clearSelection();
  };

  // UI toggles
  toggleDatePicker = () => {
    this.showDatePicker = !this.showDatePicker;
  };

  closeDatePicker = () => {
    this.showDatePicker = false;
  };

  toggleCategoryFilterDropdown = () => {
    this.showCategoryFilterDropdown = !this.showCategoryFilterDropdown;
  };

  closeCategoryFilterDropdown = () => {
    this.showCategoryFilterDropdown = false;
  };
}

export const createTransactionsPageStore = () => new TransactionsPageStore();