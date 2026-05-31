import {
  fetchTinderSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  undoCategorization,
  fetchReimbursementSuggestions,
  linkReimbursement,
  type TinderSuggestion,
  type ReimbursementSuggestion,
} from '../../application/services/TinderService';
import type { Category } from '$lib/types/transaction';

/** Snapshot of an action we can revert when the user taps Undo. */
interface TinderHistoryEntry {
  index: number;
  transactionId: string;
  /** category id the tx had before the action (null = uncategorized) */
  previousCategoryId: string | null;
  /** what bucket the action was counted in */
  kind: 'accept' | 'reject' | 'skip';
}

type Phase = 'categorize' | 'reimburse';

class TinderPageStore {
  suggestions = $state<TinderSuggestion[]>([]);
  categories = $state<Category[]>([]);
  currentIndex = $state(0);
  isLoading = $state(false);
  showCategoryPicker = $state(false);
  totalUncategorized = $state(0);
  error = $state<string | null>(null);
  hasLoaded = $state(false);

  // Reimbursement (shared-expense) phase
  phase = $state<Phase>('categorize');
  reimbursements = $state<ReimbursementSuggestion[]>([]);
  reimburseIndex = $state(0);
  reimbursePhaseStarted = $state(false);

  // Stats
  acceptedCount = $state(0);
  rejectedCount = $state(0);
  skippedCount = $state(0);
  linkedCount = $state(0);

  // Action history — used to power Undo.
  history = $state<TinderHistoryEntry[]>([]);

  // Derived
  currentSuggestion = $derived(
    this.currentIndex < this.suggestions.length ? this.suggestions[this.currentIndex] : null
  );

  currentReimbursement = $derived(
    this.phase === 'reimburse' && this.reimburseIndex < this.reimbursements.length
      ? this.reimbursements[this.reimburseIndex]
      : null
  );

  /** Categorize deck exhausted — time to move on to the reimburse phase. */
  categorizeDone = $derived(
    this.hasLoaded &&
      this.phase === 'categorize' &&
      this.currentIndex >= this.suggestions.length &&
      !this.isLoading
  );

  isComplete = $derived(
    this.phase === 'reimburse' &&
      this.reimbursePhaseStarted &&
      this.reimburseIndex >= this.reimbursements.length &&
      !this.isLoading
  );

  remaining = $derived(
    this.phase === 'reimburse'
      ? Math.max(0, this.reimbursements.length - this.reimburseIndex)
      : Math.max(0, this.suggestions.length - this.currentIndex)
  );

  total = $derived(
    this.phase === 'reimburse' ? this.reimbursements.length : this.suggestions.length
  );

  currentCardIndex = $derived(this.phase === 'reimburse' ? this.reimburseIndex : this.currentIndex);

  canUndo = $derived(this.history.length > 0);

  progress = $derived(this.total > 0 ? (this.currentCardIndex / this.total) * 100 : 0);

  async loadSuggestions(limit = 50) {
    this.isLoading = true;
    this.error = null;
    try {
      const data = await fetchTinderSuggestions(limit);
      this.suggestions = data.suggestions;
      this.totalUncategorized = data.totalUncategorized;
      this.currentIndex = 0;
      this.acceptedCount = 0;
      this.rejectedCount = 0;
      this.skippedCount = 0;
      this.linkedCount = 0;
      this.history = [];
      this.phase = 'categorize';
      this.reimbursements = [];
      this.reimburseIndex = 0;
      this.reimbursePhaseStarted = false;
      this.hasLoaded = true;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load suggestions';
      this.hasLoaded = true;
      console.error('Failed to load tinder suggestions:', e);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Move from the categorize deck to the shared-expense (reimbursement) deck.
   * Loads the suggestions lazily; if there are none, the completion screen shows.
   */
  async enterReimbursePhase(limit = 50) {
    if (this.reimbursePhaseStarted) return;
    this.reimbursePhaseStarted = true;
    this.phase = 'reimburse';
    this.isLoading = true;
    try {
      const data = await fetchReimbursementSuggestions(limit);
      this.reimbursements = data.suggestions;
      this.reimburseIndex = 0;
    } catch (e) {
      // Non-fatal: just skip the phase if it fails.
      this.reimbursements = [];
      console.error('Failed to load reimbursement suggestions:', e);
    } finally {
      this.isLoading = false;
    }
  }

  setCategories(categories: Category[]) {
    this.categories = categories;
  }

  async accept() {
    const current = this.currentSuggestion;
    if (!current?.suggestion) return;

    try {
      const previousCategoryId = current.transaction.categoryId ?? null;
      await acceptSuggestion(current.transaction.id, current.suggestion.categoryId);
      this.history.push({
        index: this.currentIndex,
        transactionId: current.transaction.id,
        previousCategoryId,
        kind: 'accept',
      });
      this.acceptedCount++;
      this.nextCard();
    } catch (e) {
      console.error('Failed to accept suggestion:', e);
    }
  }

  openCategoryPicker() {
    this.showCategoryPicker = true;
  }

  closeCategoryPicker() {
    this.showCategoryPicker = false;
  }

  async reject(categoryId: string) {
    const current = this.currentSuggestion;
    if (!current) return;

    try {
      const previousCategoryId = current.transaction.categoryId ?? null;
      await rejectSuggestion(current.transaction.id, categoryId);
      this.history.push({
        index: this.currentIndex,
        transactionId: current.transaction.id,
        previousCategoryId,
        kind: 'reject',
      });
      this.rejectedCount++;
      this.showCategoryPicker = false;
      this.nextCard();
    } catch (e) {
      console.error('Failed to reject suggestion:', e);
    }
  }

  /** Confirm the current shared-expense link (income ↔ expense). */
  async linkCurrent() {
    const current = this.currentReimbursement;
    if (!current) return;
    try {
      await linkReimbursement(
        current.income.id,
        current.expense.id,
        current.suggestedSplitPercentage
      );
      this.linkedCount++;
    } catch (e) {
      console.error('Failed to link reimbursement:', e);
      this.error = e instanceof Error ? e.message : 'Failed to link reimbursement';
    } finally {
      this.reimburseIndex++;
    }
  }

  /** Skip the current shared-expense suggestion without linking. */
  skipReimbursement() {
    this.skippedCount++;
    this.reimburseIndex++;
  }

  skip() {
    const current = this.currentSuggestion;
    if (current) {
      this.history.push({
        index: this.currentIndex,
        transactionId: current.transaction.id,
        previousCategoryId: current.transaction.categoryId ?? null,
        kind: 'skip',
      });
    }
    this.skippedCount++;
    this.nextCard();
  }

  /**
   * Revert the last action and restore the previous card. For accept/reject
   * we also try to roll back the server categorization (best-effort: doesn't
   * cascade to other transactions that may have been touched by applyToAll).
   * Undo only applies to the categorize phase.
   */
  async undo() {
    if (this.phase !== 'categorize') return;
    const last = this.history.pop();
    if (!last) return;

    if (last.kind === 'accept') this.acceptedCount = Math.max(0, this.acceptedCount - 1);
    if (last.kind === 'reject') this.rejectedCount = Math.max(0, this.rejectedCount - 1);
    if (last.kind === 'skip') this.skippedCount = Math.max(0, this.skippedCount - 1);

    if (last.kind !== 'skip') {
      try {
        await undoCategorization(last.transactionId, last.previousCategoryId);
      } catch (e) {
        console.error('Failed to undo categorization:', e);
      }
    }

    this.showCategoryPicker = false;
    this.currentIndex = last.index;
  }

  nextCard() {
    this.showCategoryPicker = false;
    if (this.currentIndex < this.suggestions.length) {
      this.currentIndex++;
    }
  }
}

export const createTinderPageStore = () => new TinderPageStore();
