export interface Transaction {
  id: string;
  date: string;
  time: string;
  merchant: string;
  description: string;
  amount: number;
  categoryId?: string;
  category?: Category;
  status: 'completed' | 'pending' | 'hidden';
  tags: string[];
  patternHash?: string; // Hash for pattern matching
  hash?: string; // Hash for duplicate detection
  createdAt: Date;
  updatedAt: Date;
  hidden?: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'essential' | 'discretionary' | 'investment';
  color: string;
  icon: string;
  parentId?: string; // For subcategories
  description?: string;
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
