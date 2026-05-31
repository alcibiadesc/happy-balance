import {
  fetchTinderSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  undoCategorization,
  type TinderSuggestion,
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

class TinderPageStore {
  suggestions = $state<TinderSuggestion[]>([]);
  categories = $state<Category[]>([]);
  currentIndex = $state(0);
  isLoading = $state(false);
  showCategoryPicker = $state(false);
  totalUncategorized = $state(0);
  error = $state<string | null>(null);
  hasLoaded = $state(false);

  // Stats
  acceptedCount = $state(0);
  rejectedCount = $state(0);
  skippedCount = $state(0);

  // Action history — used to power Undo.
  history = $state<TinderHistoryEntry[]>([]);

  // Derived
  currentSuggestion = $derived(
    this.currentIndex < this.suggestions.length ? this.suggestions[this.currentIndex] : null
  );

  isComplete = $derived(
    this.hasLoaded && this.currentIndex >= this.suggestions.length && !this.isLoading
  );

  remaining = $derived(Math.max(0, this.suggestions.length - this.currentIndex));

  total = $derived(this.suggestions.length);

  canUndo = $derived(this.history.length > 0);

  progress = $derived(
    this.suggestions.length > 0 ? (this.currentIndex / this.suggestions.length) * 100 : 0
  );

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
      this.history = [];
      this.hasLoaded = true;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load suggestions';
      this.hasLoaded = true;
      console.error('Failed to load tinder suggestions:', e);
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
   */
  async undo() {
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
