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
  isActive: boolean;
  parentId?: string | null;
  annualBudget?: number | null;
  /** Computed: annualBudget / 12. Not stored in DB. */
  monthlyBudget?: number | null;
  isGlobal?: boolean;
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
  color?: string;
  icon?: string;
  annualBudget?: number;
}

/**
 * Request body for updating a category.
 */
export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
  annualBudget?: number | null;
  isActive?: boolean;
}
