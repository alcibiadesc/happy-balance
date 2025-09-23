import type { Transaction } from '$lib/types/transaction';

export interface ObservationsState {
  editingTransactionId: string | null;
  editingText: string;
  saveTimeoutId: number | null;
}

export const createInitialObservationsState = (): ObservationsState => ({
  editingTransactionId: null,
  editingText: '',
  saveTimeoutId: null
});

export const observationsActions = {
  startEditing: (
    state: ObservationsState,
    transaction: Transaction
  ): ObservationsState => ({
    ...state,
    editingTransactionId: transaction.id,
    editingText: transaction.observations || ''
  }),

  cancelEditing: (state: ObservationsState): ObservationsState => {
    if (state.saveTimeoutId) {
      clearTimeout(state.saveTimeoutId);
    }
    return {
      editingTransactionId: null,
      editingText: '',
      saveTimeoutId: null
    };
  },

  updateText: (state: ObservationsState, text: string): ObservationsState => ({
    ...state,
    editingText: text
  }),

  setSaveTimeout: (state: ObservationsState, timeoutId: number): ObservationsState => {
    if (state.saveTimeoutId) {
      clearTimeout(state.saveTimeoutId);
    }
    return {
      ...state,
      saveTimeoutId: timeoutId
    };
  }
};

export const createObservationsHandler = (
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>
) => {
  let saveTimeoutId: number | null = null;

  const saveObservations = async (
    transaction: Transaction,
    text: string
  ): Promise<boolean> => {
    try {
      const trimmedText = text.trim();
      if (trimmedText === transaction.observations?.trim()) {
        return true;
      }

      return await updateTransaction(transaction.id, {
        observations: trimmedText || null
      });
    } catch (error) {
      console.error('Error saving observations:', error);
      return false;
    }
  };

  const saveObservationsDebounced = (
    transaction: Transaction,
    text: string,
    onSave: () => void
  ) => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    saveTimeoutId = setTimeout(async () => {
      await saveObservations(transaction, text);
      onSave();
    }, 1000) as unknown as number;
  };

  const cleanup = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
  };

  return {
    saveObservations,
    saveObservationsDebounced,
    cleanup
  };
};