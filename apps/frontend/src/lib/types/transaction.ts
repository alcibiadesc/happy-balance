import type { TransactionType, CategoryType } from '@happy-balance/shared-types';

// Re-export shared types for convenience
export type { TransactionType, CategoryType } from '@happy-balance/shared-types';

/**
 * Frontend ViewModel for transactions.
 * Unlike TransactionDTO (wire format), this has:
 * - Signed amounts (negative for expenses)
 * - Parsed Date objects
 * - Extracted time string
 * - Status field for UI state
 *
 * Conversion: TransactionDTO → mapApiToTransaction() → Transaction
 */
export interface Transaction {
  id: string;
  date: string;
  time: string;
  merchant: string;
  description: string;
  /** Signed amount: negative for EXPENSE, positive for INCOME/INVESTMENT */
  amount: number;
  type?: TransactionType;
  categoryId?: string | null;
  category?: Category;
  status: 'completed' | 'pending' | 'hidden';
  tags: string[];
  patternHash?: string;
  hash?: string;
  createdAt: Date;
  updatedAt: Date;
  hidden?: boolean;
  observations?: string;
  splitPercentage?: number;
  linkedTransactionId?: string;
  isReimbursement?: boolean;
}

export interface PotentialReimbursement {
  transaction: Transaction;
  matchScore: number;
  matchReasons: string[];
}

/**
 * Frontend Category ViewModel.
 * Uses CategoryType from shared types for the type field.
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parentId?: string;
  description?: string;
  annualBudget?: number;
}

export interface CategoryRule {
  id: string;
  patternHash: string;
  merchant?: string;
  descriptionPattern?: string;
  categoryId: string;
  priority: number;
  createdAt: Date;
}

export interface TransactionFilter {
  period?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  searchQuery?: string;
  status?: string[];
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export interface BulkAction {
  type: 'categorize' | 'delete' | 'hide' | 'tag';
  payload: any;
}
