/**
 * Transaction types shared between frontend and backend.
 * These represent the API wire format (DTOs), NOT domain objects.
 *
 * IMPORTANT: Amount is ALWAYS positive. The `type` field determines
 * whether it's income, expense, or investment. Sign conversion for
 * display purposes happens in the frontend mapper layer.
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';

export type TransactionStatus = 'completed' | 'pending' | 'hidden';

/**
 * Transaction as returned by the API.
 * Maps to: Backend domain Transaction → TransactionDTO
 * Maps to: Frontend receives this → maps to TransactionViewModel
 */
export interface TransactionDTO {
  id: string;
  merchant: string;
  description: string;
  /** Always positive. Use `type` to determine sign semantics. */
  amount: number;
  type: TransactionType;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  categoryId: string | null;
  category?: CategorySummaryDTO;
  hash?: string;
  observations?: string;
  splitPercentage?: number;
  linkedTransactionId?: string;
  isReimbursement: boolean;
  hidden: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Minimal category info embedded in transaction responses.
 */
export interface CategorySummaryDTO {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

/**
 * Request body for creating a transaction.
 */
export interface CreateTransactionRequest {
  merchant: string;
  description?: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId?: string;
  observations?: string;
  tags?: string[];
}

/**
 * Request body for updating a transaction.
 */
export interface UpdateTransactionRequest {
  merchant?: string;
  description?: string;
  amount?: number;
  type?: TransactionType;
  date?: string;
  categoryId?: string | null;
  observations?: string;
  hidden?: boolean;
  tags?: string[];
}

/**
 * Paginated transactions response from the API.
 */
export interface PaginatedTransactionsResponse {
  transactions: TransactionDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
