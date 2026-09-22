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

    // Determine source transaction type
    const sourceType = transaction.type || (transaction.amount < 0 ? 'EXPENSE' : 'INCOME');

    // Extract transactions from response and filter:
    // 1. Only uncategorized transactions
    // 2. Only transactions of the same type (expense with expense, income with income)
    const similarTransactions: Transaction[] = result.data.similarTransactions
      .map((item: any) => item.transaction)
      .filter((t: Transaction) => {
        // Filter out already categorized transactions
        if (t.categoryId) return false;

        // Filter by same transaction type
        const tType = t.type || (t.amount < 0 ? 'EXPENSE' : 'INCOME');
        return tType === sourceType;
      });

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
      // Parse actual error message from backend
      let errorMsg = response.statusText;
      try {
        const errorBody = await response.json();
        errorMsg = errorBody.error || errorBody.message || errorMsg;
      } catch {
        // ignore parse errors
      }
      console.error(`Smart categorize failed (${response.status}): ${errorMsg}`);

      // Fallback to simple PUT update if smart categorize fails
      const fallbackResponse = await fetch(`${apiUrl}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ categoryId }),
      });

      if (fallbackResponse.ok) {
        return { success: true, categorizedCount: 1, patternCreated: false };
      }

      throw new Error(`Failed to categorize: ${errorMsg}`);
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

export interface AiProposal {
  transactionId: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  categoryType: string;
  confidence: number;
  reason: string;
  applied: boolean;
}

export interface AiCategorizeResult {
  success: boolean;
  configured: boolean;
  model: string;
  examined: number;
  proposals: AiProposal[];
  appliedCount: number;
  patternsLearned: number;
  undecided: number;
  usage: { inputTokens: number; outputTokens: number; batches: number };
  warnings: string[];
  message: string;
}

/**
 * Ask the backend's LLM pass to categorize what the rule engine left behind.
 *
 * Defaults to a dry run so the caller can show the proposals for review;
 * pass `apply` (usually together with the reviewed `transactionIds`) to write.
 */
export const aiCategorizeTransactions = async (
  opts: {
    apply?: boolean;
    limit?: number;
    minConfidence?: number;
    transactionIds?: string[];
    learnPatterns?: boolean;
  } = {}
): Promise<AiCategorizeResult> => {
  const empty: AiCategorizeResult = {
    success: false,
    configured: false,
    model: '',
    examined: 0,
    proposals: [],
    appliedCount: 0,
    patternsLearned: 0,
    undecided: 0,
    usage: { inputTokens: 0, outputTokens: 0, batches: 0 },
    warnings: [],
    message: '',
  };

  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/transactions/ai-categorize`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apply: opts.apply ?? false,
        learnPatterns: opts.learnPatterns ?? false,
        ...(opts.limit ? { limit: opts.limit } : {}),
        ...(opts.minConfidence !== undefined ? { minConfidence: opts.minConfidence } : {}),
        ...(opts.transactionIds ? { transactionIds: opts.transactionIds } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { ...empty, message: `Error ${response.status}: ${detail.slice(0, 200)}` };
    }

    const result = await response.json();
    const data = result.data ?? {};

    return {
      success: true,
      configured: data.configured ?? false,
      model: data.model ?? '',
      examined: data.examined ?? 0,
      proposals: data.proposals ?? [],
      appliedCount: data.appliedCount ?? 0,
      patternsLearned: data.patternsLearned ?? 0,
      undecided: data.undecided ?? 0,
      usage: data.usage ?? { inputTokens: 0, outputTokens: 0, batches: 0 },
      warnings: data.warnings ?? [],
      message: '',
    };
  } catch (error) {
    console.error('Error in ai-categorize:', error);
    return { ...empty, message: 'No se pudo contactar con el backend' };
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
