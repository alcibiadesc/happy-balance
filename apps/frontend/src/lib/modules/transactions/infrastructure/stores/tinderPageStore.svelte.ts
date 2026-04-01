import {
  fetchTinderSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  type TinderSuggestion,
} from '../../application/services/TinderService';
import type { Category } from '$lib/types/transaction';

class TinderPageStore {
  suggestions = $state<TinderSuggestion[]>([]);
  categories = $state<Category[]>([]);
  currentIndex = $state(0);
  isLoading = $state(false);
  showCategoryPicker = $state(false);
  totalUncategorized = $state(0);
  error = $state<string | null>(null);

  // Stats
  acceptedCount = $state(0);
  rejectedCount = $state(0);
  skippedCount = $state(0);

  // Derived
  currentSuggestion = $derived(
    this.currentIndex < this.suggestions.length ? this.suggestions[this.currentIndex] : null
  );

  isComplete = $derived(this.currentIndex >= this.suggestions.length && !this.isLoading);

  remaining = $derived(Math.max(0, this.suggestions.length - this.currentIndex));

  total = $derived(this.suggestions.length);

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
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load suggestions';
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
      await acceptSuggestion(current.transaction.id, current.suggestion.categoryId);
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
      await rejectSuggestion(current.transaction.id, categoryId);
      this.rejectedCount++;
      this.showCategoryPicker = false;
      this.nextCard();
    } catch (e) {
      console.error('Failed to reject suggestion:', e);
    }
  }

  skip() {
    this.skippedCount++;
    this.nextCard();
  }

  nextCard() {
    this.showCategoryPicker = false;
    if (this.currentIndex < this.suggestions.length) {
      this.currentIndex++;
    }
  }
}

export const createTinderPageStore = () => new TinderPageStore();
