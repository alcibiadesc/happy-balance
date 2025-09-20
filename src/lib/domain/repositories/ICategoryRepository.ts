import { Result } from "../shared/Result";
import { Category, CategoryId, type CategorySnapshot } from "../entities/Category";
import { TransactionType } from "../entities/TransactionType";

export interface CategoryFilters {
  type?: TransactionType;
  isActive?: boolean;
  searchTerm?: string;
}

/**
 * Category repository interface (Port in hexagonal architecture)
 * Defines the contract for category persistence operations
 */
export interface ICategoryRepository {
  /**
   * Save a single category
   */
  save(category: Category): Promise<Result<void>>;

  /**
   * Save multiple categories
   */
  saveMany(categories: Category[]): Promise<Result<number>>;

  /**
   * Find category by ID
   */
  findById(id: CategoryId): Promise<Result<Category | null>>;

  /**
   * Find all categories
   */
  findAll(): Promise<Result<Category[]>>;

  /**
   * Find categories with filters
   */
  findWithFilters(filters?: CategoryFilters): Promise<Result<Category[]>>;

  /**
   * Find categories by type
   */
  findByType(type: TransactionType): Promise<Result<Category[]>>;

  /**
   * Find active categories
   */
  findActive(): Promise<Result<Category[]>>;

  /**
   * Find categories by name (fuzzy search)
   */
  findByName(name: string): Promise<Result<Category[]>>;

  /**
   * Update an existing category
   */
  update(category: Category): Promise<Result<void>>;

  /**
   * Delete a category (soft delete - mark as inactive)
   */
  delete(id: CategoryId): Promise<Result<void>>;

  /**
   * Permanently delete a category (hard delete)
   */
  permanentDelete(id: CategoryId): Promise<Result<void>>;

  /**
   * Check if a category exists
   */
  exists(id: CategoryId): Promise<Result<boolean>>;

  /**
   * Check if category name exists for a given type
   */
  existsByName(name: string, type: TransactionType): Promise<Result<boolean>>;

  /**
   * Count total categories
   */
  count(filters?: CategoryFilters): Promise<Result<number>>;

  /**
   * Get default categories for a transaction type
   */
  getDefaults(type: TransactionType): Promise<Result<Category[]>>;

  /**
   * Create default categories if none exist
   */
  seedDefaults(): Promise<Result<number>>;

  /**
   * Get category usage statistics
   */
  getUsageStatistics(id: CategoryId): Promise<
    Result<{
      transactionCount: number;
      totalAmount: number;
      lastUsed?: Date;
    }>
  >;

  /**
   * Find categories that might match a merchant name
   */
  findMatchingCategories(
    merchantName: string,
    type: TransactionType,
  ): Promise<Result<Category[]>>;

  /**
   * Clear all categories (for testing/reset purposes)
   */
  clear(): Promise<Result<void>>;

  /**
   * Export categories to snapshots
   */
  export(filters?: CategoryFilters): Promise<Result<CategorySnapshot[]>>;

  /**
   * Import categories from snapshots
   */
  import(snapshots: CategorySnapshot[]): Promise<Result<number>>;
}
