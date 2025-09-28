import type { Transaction, Category } from '$lib/types/transaction';
import type { ApiTransactionsStore } from '$lib/stores/api-transactions';
import { get } from 'svelte/store';

export class TransactionOperationsService {
  constructor(
    private apiTransactions: ApiTransactionsStore,
    private getCategory: (id: string) => Category | undefined
  ) {}

  async deleteSelected(selectedIds: Set<string>): Promise<void> {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await this.apiTransactions.delete(id);
    }
  }

  async hideSelected(selectedIds: Set<string>): Promise<void> {
    const ids = Array.from(selectedIds);
    await this.apiTransactions.bulkUpdate(ids, { hidden: true });
  }

  async toggleHide(transaction: Transaction): Promise<void> {
    const newHiddenState = !transaction.hidden;
    try {
      await this.apiTransactions.update(transaction.id, { hidden: newHiddenState });
    } catch (error) {
      console.error('Failed to toggle transaction visibility:', error);
    }
  }

  async delete(id: string): Promise<void> {
    await this.apiTransactions.delete(id);
  }

  async add(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tags' | 'hash'>): Promise<void> {
    try {
      await this.apiTransactions.add(transaction);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  }

  async categorize(
    transaction: Transaction,
    categoryId: string | null,
    applyToAll: boolean = false
  ): Promise<void> {
    try {
      const selectedCategory = categoryId ? this.getCategory(categoryId) : null;

      let updates: Partial<Transaction> = {
        categoryId: categoryId
      };

      // Handle amount conversion based on category type
      if (selectedCategory) {
        if (selectedCategory.type === 'income' && transaction.amount < 0) {
          updates.amount = Math.abs(transaction.amount);
        } else if (
          (selectedCategory.type === 'essential' ||
           selectedCategory.type === 'discretionary' ||
           selectedCategory.type === 'investment') &&
          transaction.amount > 0
        ) {
          updates.amount = -Math.abs(transaction.amount);
        }
      } else if (!categoryId && transaction.amount < 0) {
        // Uncategorizing an expense - it stays as expense
        updates.amount = transaction.amount;
      }

      await this.apiTransactions.update(transaction.id, updates);

      // Apply to all similar transactions if requested
      if (applyToAll && categoryId) {
        await this.categorizeSimilarTransactions(transaction, categoryId);
      }
    } catch (error) {
      console.error('Failed to categorize transaction:', error);
      throw error;
    }
  }

  async categorizeSimilarTransactions(
    transaction: Transaction,
    categoryId: string
  ): Promise<void> {
    const allTransactions = get(this.apiTransactions);
    const similar = this.findSimilarTransactions(transaction, allTransactions);

    for (const t of similar) {
      await this.categorize(t, categoryId, false);
    }
  }

  private findSimilarTransactions(
    transaction: Transaction,
    allTransactions: Transaction[],
    threshold: number = 0.8
  ): Transaction[] {
    const cleanDescription = (desc: string): string => {
      return desc
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const calculateSimilarity = (str1: string, str2: string): number => {
      const clean1 = cleanDescription(str1);
      const clean2 = cleanDescription(str2);

      if (clean1 === clean2) return 1;

      const words1 = new Set(clean1.split(' '));
      const words2 = new Set(clean2.split(' '));

      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);

      return intersection.size / union.size;
    };

    const targetDesc = transaction.description;
    const targetMerchant = transaction.merchant;

    return allTransactions.filter(t => {
      if (t.id === transaction.id) return false;
      if (t.categoryId) return false;

      const descSimilarity = calculateSimilarity(targetDesc, t.description);
      const merchantSimilarity = calculateSimilarity(targetMerchant, t.merchant);

      const overallSimilarity = Math.max(descSimilarity, merchantSimilarity);
      return overallSimilarity >= threshold;
    });
  }

  async updateObservations(
    transactionId: string,
    observations: string | null
  ): Promise<boolean> {
    try {
      await this.apiTransactions.update(transactionId, { observations });
      return true;
    } catch (error) {
      console.error('Error updating observations:', error);
      return false;
    }
  }
}