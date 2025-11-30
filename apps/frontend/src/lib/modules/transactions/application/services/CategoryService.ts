import type { Transaction, Category } from '$lib/types/transaction';
import { getApiUrl } from '$lib/utils/api-url';

export const findMatchingTransactions = async (
  transaction: Transaction,
  _allTransactions: Transaction[]
): Promise<Transaction[]> => {
  try {
    // Call backend API with ultra-strict matching (85% threshold + type validation)
    const apiUrl = getApiUrl();
    const response = await fetch(
      `${apiUrl}/transactions/${transaction.id}/similar?maxResults=100&includeHidden=false`
    );

    if (!response.ok) {
      console.error('Failed to fetch similar transactions from backend:', response.statusText);
      // Fallback to empty array if backend fails
      return [];
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data.similarTransactions) {
      console.error('Invalid response format from similar transactions endpoint');
      return [];
    }

    // Extract transactions from response and filter out already categorized ones
    const similarTransactions: Transaction[] = result.data.similarTransactions
      .map((item: any) => item.transaction)
      .filter((t: Transaction) => !t.categoryId); // Only uncategorized transactions

    return similarTransactions;
  } catch (error) {
    console.error('Error fetching similar transactions:', error);
    // Fallback to empty array on error
    return [];
  }
};

export const getCategoryById = (categories: Category[], id?: string): Category | undefined => {
  if (!id) return undefined;
  return categories.find((c) => c.id === id);
};

export const formatAmount = (amount: number): string => {
  if (isNaN(amount)) return '€0.00';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });
  return amount < 0 && abs !== 0 ? `-${formatted}` : formatted;
};
