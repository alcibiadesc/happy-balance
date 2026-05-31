import { Request, Response } from 'express';
import { z } from 'zod';
import { CategoryId, Category } from '@domain/entities/Category';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { IInvestmentRepository } from '@domain/repositories/IInvestmentRepository';
import { CategoryType, CategoryTypeHelper } from '@domain/entities/CategoryType';
import { CategoryInvestmentSyncService } from '@domain/services/CategoryInvestmentSyncService';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  validateBody,
  validateQuery,
  handleResult,
  handleFindResult,
  successResponse,
  createdResponse,
} from '@infrastructure/errors';
import { mapCategoryToDTO } from '@infrastructure/mappers/CategoryMapper';
import { logger } from '@infrastructure/logging/logger';

// Validation schemas
const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'income',
    'essential',
    'discretionary',
    'investment',
    'debt_payment',
    'no_compute',
  ]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(10).optional(),
  annualBudget: z.number().min(0).optional().default(0),
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(10).optional(),
  annualBudget: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const CategoryFiltersSchema = z.object({
  type: z
    .enum(['income', 'essential', 'discretionary', 'investment', 'debt_payment', 'no_compute'])
    .optional(),
  isActive: z.boolean().optional(),
  searchTerm: z.string().optional(),
});

export class CategoryController {
  private syncService: CategoryInvestmentSyncService | null = null;

  constructor(
    private readonly categoryRepository: ICategoryRepository,
    investmentRepository?: IInvestmentRepository,
    userId?: string
  ) {
    if (investmentRepository && userId) {
      this.syncService = new CategoryInvestmentSyncService(
        investmentRepository,
        categoryRepository,
        userId
      );
    }
  }

  /**
   * Get all categories with optional filters
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    const parsedFilters = validateQuery(CategoryFiltersSchema, req);

    const categoryType = parsedFilters.type
      ? CategoryTypeHelper.fromString(parsedFilters.type)
      : undefined;
    const filters = {
      ...parsedFilters,
      type: categoryType || undefined,
      isActive: parsedFilters.isActive !== undefined ? parsedFilters.isActive : true,
    };

    const result = await this.categoryRepository.findWithFilters(filters);
    const categories = handleResult(result, 'Failed to fetch categories');

    successResponse(res, categories.map(mapCategoryToDTO));
  }

  /**
   * Get a single category by ID
   */
  async getCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const categoryId = handleResult(CategoryId.create(id), 'Invalid category ID');
    const result = await this.categoryRepository.findById(categoryId);
    const category = handleFindResult(result, 'Category');

    successResponse(res, mapCategoryToDTO(category));
  }

  /**
   * Create a new category
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    const validatedData = validateBody(CreateCategorySchema, req);

    // Convert string type to CategoryType enum
    const categoryType = CategoryTypeHelper.fromString(validatedData.type);
    if (!categoryType) {
      throw new BadRequestError('Invalid category type');
    }

    // Check if category with same name and type already exists
    const existsResult = await this.categoryRepository.existsByName(
      validatedData.name,
      categoryType
    );
    const exists = handleResult(existsResult, 'Failed to check category existence');

    if (exists) {
      throw new ConflictError('Category with this name and type already exists');
    }

    // Generate UUID for the category
    const categoryId = crypto.randomUUID();
    handleResult(CategoryId.create(categoryId), 'Failed to generate category ID');

    // Create category from snapshot
    const categoryResult = Category.fromSnapshot({
      id: categoryId,
      name: validatedData.name,
      type: categoryType,
      color: validatedData.color || '#3B82F6',
      icon: validatedData.icon || '💰',
      isActive: true,
      annualBudget: validatedData.annualBudget || 0,
      createdAt: new Date().toISOString(),
    });

    const category = handleResult(categoryResult, 'Failed to create category');
    const saveResult = await this.categoryRepository.save(category);
    handleResult(saveResult, 'Failed to save category');

    // Auto-create Investment if category type is INVESTMENT
    if (this.syncService && categoryType === CategoryType.INVESTMENT) {
      const syncResult = await this.syncService.onCategoryCreated(category);
      if (syncResult.isFailure()) {
        logger.warn({ error: syncResult.getError() }, 'Failed to sync investment from category');
      }
    }

    createdResponse(res, mapCategoryToDTO(category));
  }

  /**
   * Update an existing category
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const validatedData = validateBody(UpdateCategorySchema, req);

    const categoryId = handleResult(CategoryId.create(id), 'Invalid category ID');

    // Get existing category
    const existingResult = await this.categoryRepository.findById(categoryId);
    const existingCategory = handleFindResult(existingResult, 'Category');

    // Update category fields
    const updatedSnapshot = {
      ...existingCategory.toSnapshot(),
      ...validatedData,
    };

    const categoryResult = Category.fromSnapshot(updatedSnapshot);
    const updatedCategory = handleResult(categoryResult, 'Failed to update category');

    const updateResult = await this.categoryRepository.update(updatedCategory);
    handleResult(updateResult, 'Failed to save category update');

    // Sync updates to linked investments
    if (this.syncService) {
      await this.syncService.onCategoryUpdated(updatedCategory);
    }

    successResponse(res, mapCategoryToDTO(updatedCategory));
  }

  /**
   * Delete a category (soft delete)
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const categoryId = handleResult(CategoryId.create(id), 'Invalid category ID');

    // Check if category exists
    const existsResult = await this.categoryRepository.exists(categoryId);
    const exists = handleResult(existsResult, 'Failed to check category existence');

    if (!exists) {
      throw new NotFoundError('Category');
    }

    // Deactivate linked investments first
    if (this.syncService) {
      await this.syncService.onCategoryDeleted(id);
    }

    // Soft delete (set isActive to false)
    const deleteResult = await this.categoryRepository.delete(categoryId);
    handleResult(deleteResult, 'Failed to delete category');

    successResponse(res, { message: 'Category deleted successfully' });
  }

  /**
   * Get usage statistics for a category
   */
  async getCategoryUsageStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const categoryId = handleResult(CategoryId.create(id), 'Invalid category ID');
    const statsResult = await this.categoryRepository.getUsageStatistics(categoryId);
    const stats = handleResult(statsResult, 'Failed to fetch category usage statistics');

    successResponse(res, stats);
  }

  /**
   * Clear all categories
   */
  async clearAllCategories(_req: Request, res: Response): Promise<void> {
    const clearResult = await this.categoryRepository.clear();
    handleResult(clearResult, 'Failed to clear categories');

    successResponse(res, { message: 'All categories have been deleted' });
  }
}
