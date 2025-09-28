export interface SelectionState {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
}

export const createInitialSelectionState = (): SelectionState => ({
  isSelectionMode: false,
  selectedIds: new Set()
});

export const selectionActions = {
  toggleSelectionMode: (state: SelectionState): SelectionState => ({
    ...state,
    isSelectionMode: !state.isSelectionMode,
    selectedIds: state.isSelectionMode ? new Set() : state.selectedIds
  }),

  toggleSelection: (state: SelectionState, id: string): SelectionState => {
    const newSet = new Set(state.selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return {
      ...state,
      selectedIds: newSet
    };
  },

  selectAll: (state: SelectionState, ids: string[]): SelectionState => ({
    ...state,
    selectedIds: new Set(ids)
  }),

  clearSelection: (): SelectionState => ({
    isSelectionMode: false,
    selectedIds: new Set()
  })
};