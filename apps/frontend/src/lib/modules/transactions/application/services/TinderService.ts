import { getApiUrl, getAuthHeaders } from '$lib/utils/api-helpers';

export interface TinderSuggestion {
  transaction: any; // TransactionDTO from backend
  suggestion: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    categoryType: string;
    confidence: number;
    matchedOn: 'alias' | 'pattern';
  } | null;
}

export async function fetchTinderSuggestions(
  limit = 50
): Promise<{ suggestions: TinderSuggestion[]; totalUncategorized: number }> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/transactions/tinder-suggestions?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch suggestions');
  const result = await response.json();
  return result.data;
}

export async function acceptSuggestion(transactionId: string, categoryId: string) {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/transactions/${transactionId}/categorize`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      categoryId,
      applyToFuture: true,
      createPattern: true,
      applyToAll: false,
    }),
  });
  if (!response.ok) {
    // Fallback to simple PUT
    await fetch(`${apiUrl}/transactions/${transactionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ categoryId }),
    });
  }
}

export async function rejectSuggestion(transactionId: string, categoryId: string) {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/transactions/${transactionId}/categorize`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      categoryId,
      applyToFuture: true,
      createPattern: true,
      applyToAll: false,
    }),
  });
  if (!response.ok) {
    await fetch(`${apiUrl}/transactions/${transactionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ categoryId }),
    });
  }
}
