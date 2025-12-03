import type { Transaction, Category } from '$lib/types/transaction';
import { getApiUrl } from '$lib/utils/api-url';
import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = authStore.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const findMatchingTransactions = async (
  transaction: Transaction,
  _allTransactions: Transaction[]
): Promise<Transaction[]> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(
      `${apiUrl}/transactions/${transaction.id}/similar?maxResults=100&includeHidden=false`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      console.error('Failed to fetch similar transactions from backend:', response.statusText);
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
      .filter((t: Transaction) => !t.categoryId);

    return similarTransactions;
  } catch (error) {
    console.error('Error fetching similar transactions:', error);
    return [];
  }
};

/**
 * Smart categorize a transaction using backend intelligence
 */
export const smartCategorize = async (
  transactionId: string,
  categoryId: string,
  options: {
    applyToAll?: boolean;
    applyToFuture?: boolean;
    createPattern?: boolean;
    selectedTransactionIds?: string[];
  } = {}
): Promise<{ success: boolean; categorizedCount: number; patternCreated: boolean }> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/transactions/${transactionId}/categorize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        categoryId,
        applyToAll: options.applyToAll || false,
        applyToFuture: options.applyToFuture ?? true,
        createPattern: options.createPattern ?? true,
        selectedTransactionIds: options.selectedTransactionIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to smart categorize: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      categorizedCount: result.data?.categorizedCount || 1,
      patternCreated: result.data?.patternCreated || false,
    };
  } catch (error) {
    console.error('Error in smart categorize:', error);
    return { success: false, categorizedCount: 0, patternCreated: false };
  }
};

export const getCategoryById = (categories: Category[], id?: string): Category | undefined => {
  if (!id) return undefined;
  return categories.find((c) => c.id === id);
};

/**
 * Auto-categorize all uncategorized transactions using learned patterns
 */
export const autoCategorizeTransactions = async (): Promise<{
  success: boolean;
  categorizedCount: number;
  patternsApplied: number;
  normalizedMatches: number;
  message: string;
}> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/transactions/auto-categorize`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to auto-categorize: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      categorizedCount: result.data?.categorizedCount || 0,
      patternsApplied: result.data?.patternsApplied || 0,
      normalizedMatches: result.data?.normalizedMatches || 0,
      message: result.data?.message || 'Auto-categorization completed',
    };
  } catch (error) {
    console.error('Error in auto-categorize:', error);
    return {
      success: false,
      categorizedCount: 0,
      patternsApplied: 0,
      normalizedMatches: 0,
      message: 'Failed to auto-categorize transactions',
    };
  }
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
