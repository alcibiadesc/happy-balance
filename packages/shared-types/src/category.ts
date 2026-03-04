/**
 * Category types shared between frontend and backend.
 */

export type CategoryType =
  | 'income'
  | 'essential'
  | 'discretionary'
  | 'investment'
  | 'debt_payment'
  | 'no_compute';

/**
 * Full category as returned by the API.
 */
export interface CategoryDTO {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parentId?: string | null;
  annualBudget?: number | null;
  monthlyBudget?: number | null;
  isDefault?: boolean;
  sortOrder?: number;
}

/**
 * Category with usage statistics.
 */
export interface CategoryWithStatsDTO extends CategoryDTO {
  transactionCount: number;
  totalAmount: number;
}

/**
 * Request body for creating a category.
 */
export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parentId?: string;
  annualBudget?: number;
}

/**
 * Request body for updating a category.
 */
export interface UpdateCategoryRequest {
  name?: string;
  type?: CategoryType;
  color?: string;
  icon?: string;
  parentId?: string | null;
  annualBudget?: number | null;
}
