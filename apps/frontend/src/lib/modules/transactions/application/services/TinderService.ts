import { getApiUrl, getAuthHeaders } from '$lib/utils/api-helpers';
import type { TransactionDTO } from '@happy-balance/shared-types';

export interface TinderSuggestion {
  transaction: TransactionDTO;
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

export interface ReimbursementSuggestion {
  income: TransactionDTO;
  expense: TransactionDTO;
  matchScore: number;
  matchReasons: string[];
  suggestedSplitPercentage: number;
}

export async function fetchReimbursementSuggestions(
  limit = 50,
  minScore = 50
): Promise<{ suggestions: ReimbursementSuggestion[]; totalScanned: number }> {
  const apiUrl = getApiUrl();
  const response = await fetch(
    `${apiUrl}/transactions/reimbursement-suggestions?limit=${limit}&minScore=${minScore}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch reimbursement suggestions');
  const result = await response.json();
  return result.data;
}

/**
 * Confirm a shared-expense link: marks the income as a reimbursement of the
 * expense and records the split % the user actually bears. Source is the income
 * (any of the two works — the backend detects roles by type).
 */
export async function linkReimbursement(
  incomeId: string,
  expenseId: string,
  splitPercentage: number
) {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/transactions/${incomeId}/link-split`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetTransactionId: expenseId, splitPercentage }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Failed to link reimbursement');
  }
}

export async function unlinkReimbursement(transactionId: string) {
  const apiUrl = getApiUrl();
  await fetch(`${apiUrl}/transactions/${transactionId}/unlink-split`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
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
      // Cascade to similar uncategorized transactions so the algorithm
      // visibly "learns" — one swipe categorizes the whole merchant family.
      applyToAll: true,
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
      // Apply to all matching uncategorized transactions so the user
      // doesn't have to swipe Mapfre 30 times.
      applyToAll: true,
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

/**
 * Undo a tinder action: restore the transaction to its previous category
 * (or null = uncategorized). Done via simple PUT — we can't fully undo
 * the side-effects of `applyToAll` here, but reverting the visible card is
 * the high-value piece for the user.
 */
export async function undoCategorization(transactionId: string, previousCategoryId: string | null) {
  const apiUrl = getApiUrl();
  await fetch(`${apiUrl}/transactions/${transactionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ categoryId: previousCategoryId }),
  });
}
