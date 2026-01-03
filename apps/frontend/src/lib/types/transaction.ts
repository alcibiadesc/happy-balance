export interface Transaction {
  id: string;
  date: string;
  time: string;
  merchant: string;
  description: string;
  amount: number;
  type?: 'INCOME' | 'EXPENSE' | 'INVESTMENT'; // Transaction type from backend
  categoryId?: string | null;
  category?: Category;
  status: 'completed' | 'pending' | 'hidden';
  tags: string[];
  patternHash?: string; // Hash for pattern matching
  hash?: string; // Hash for duplicate detection
  createdAt: Date;
  updatedAt: Date;
  hidden?: boolean;
  observations?: string;
  // Split transaction fields
  splitPercentage?: number; // % you pay (0-100, undefined = 100%)
  linkedTransactionId?: string; // ID of linked reimbursement/expense
  isReimbursement?: boolean; // This is a reimbursement (not real income)
}

export interface PotentialReimbursement {
  transaction: Transaction;
  matchScore: number;
  matchReasons: string[];
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'essential' | 'discretionary' | 'investment' | 'debt_payment' | 'no_compute';
  color: string;
  icon: string;
  parentId?: string; // For subcategories
  description?: string;
  annualBudget?: number; // Annual budget for this category
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
