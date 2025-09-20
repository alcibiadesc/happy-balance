import { Request, Response } from "express";
import { z } from "zod";
import { CategoryId } from "@domain/entities/Category";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import {
  CategoryType,
  CategoryTypeHelper,
} from "@domain/entities/CategoryType";

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "income",
    "essential",
    "discretionary",
    "investment",
    "debt_payment",
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
    .enum([
      "income",
      "essential",
      "discretionary",
      "investment",
      "debt_payment",
    ])
    .optional(),
  isActive: z.boolean().optional(),
  searchTerm: z.string().optional(),
});

export class CategoryController {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const parsedFilters = CategoryFiltersSchema.parse(req.query);

      // Convert string type to CategoryType enum
      const filters: any = {
        ...parsedFilters,
        type: parsedFilters.type
          ? CategoryTypeHelper.fromString(parsedFilters.type)
          : undefined,
        // Default to active categories only unless explicitly set
        isActive:
          parsedFilters.isActive !== undefined ? parsedFilters.isActive : true,
      };

      const result = await this.categoryRepository.findWithFilters(filters);

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      const categories = result.getValue();
      const categorySnapshots = categories.map((cat) => cat.toSnapshot());

      res.json({
        success: true,
        data: categorySnapshots,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
        return;
      }

      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch categories",
      });
    }
  }

  async getCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const categoryIdResult = CategoryId.create(id);
      if (categoryIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: "Invalid category ID",
        });
        return;
      }

      const result = await this.categoryRepository.findById(
        categoryIdResult.getValue(),
      );

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      const category = result.getValue();
      if (!category) {
        res.status(404).json({
          success: false,
          error: "Category not found",
        });
        return;
      }

      res.json({
        success: true,
        data: category.toSnapshot(),
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch category",
      });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateCategorySchema.parse(req.body);

      // Convert string type to CategoryType enum
      const categoryType = CategoryTypeHelper.fromString(validatedData.type);
      if (!categoryType) {
        res.status(400).json({
          success: false,
          error: "Invalid category type",
        });
        return;
      }

      // Check if category with same name and type already exists
      const existsResult = await this.categoryRepository.existsByName(
        validatedData.name,
        categoryType,
      );

      if (existsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: existsResult.getError(),
        });
        return;
      }

      if (existsResult.getValue()) {
        res.status(409).json({
          success: false,
          error: "Category with this name and type already exists",
        });
        return;
      }

      // Generate UUID for the category
      const categoryId = crypto.randomUUID();
      const categoryIdResult = CategoryId.create(categoryId);

      if (categoryIdResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: "Failed to generate category ID",
        });
        return;
      }

      // Create category from snapshot
      const categoryResult = await import("@domain/entities/Category").then(
        (module) =>
          module.Category.fromSnapshot({
            id: categoryId,
            name: validatedData.name,
            type: categoryType,
            color: validatedData.color || "#3B82F6",
            icon: validatedData.icon || "💰",
            isActive: true,
            createdAt: new Date().toISOString(),
          }),
      );

      if (categoryResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: categoryResult.getError(),
        });
        return;
      }

      const category = categoryResult.getValue();
      const saveResult = await this.categoryRepository.save(category);

      if (saveResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: saveResult.getError(),
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: category.toSnapshot(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
        return;
      }

      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create category",
      });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateCategorySchema.parse(req.body);

      const categoryIdResult = CategoryId.create(id);
      if (categoryIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: "Invalid category ID",
        });
        return;
      }

      // Get existing category
      const existingResult = await this.categoryRepository.findById(
        categoryIdResult.getValue(),
      );

      if (existingResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: existingResult.getError(),
        });
        return;
      }

      const existingCategory = existingResult.getValue();
      if (!existingCategory) {
        res.status(404).json({
          success: false,
          error: "Category not found",
        });
        return;
      }

      // Update category fields
      const updatedSnapshot = {
        ...existingCategory.toSnapshot(),
        ...validatedData,
      };

      const categoryResult = await import("@domain/entities/Category").then(
        (module) => module.Category.fromSnapshot(updatedSnapshot),
      );

      if (categoryResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: categoryResult.getError(),
        });
        return;
      }

      const updatedCategory = categoryResult.getValue();
      const updateResult =
        await this.categoryRepository.update(updatedCategory);

      if (updateResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: updateResult.getError(),
        });
        return;
      }

      res.json({
        success: true,
        data: updatedCategory.toSnapshot(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
        return;
      }

      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update category",
      });
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const categoryIdResult = CategoryId.create(id);
      if (categoryIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: "Invalid category ID",
        });
        return;
      }

      // Check if category exists
      const existsResult = await this.categoryRepository.exists(
        categoryIdResult.getValue(),
      );

      if (existsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: existsResult.getError(),
        });
        return;
      }

      if (!existsResult.getValue()) {
        res.status(404).json({
          success: false,
          error: "Category not found",
        });
        return;
      }

      // Soft delete (set isActive to false)
      const deleteResult = await this.categoryRepository.delete(
        categoryIdResult.getValue(),
      );

      if (deleteResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: deleteResult.getError(),
        });
        return;
      }

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete category",
      });
    }
  }

  async getCategoryUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const categoryIdResult = CategoryId.create(id);
      if (categoryIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: "Invalid category ID",
        });
        return;
      }

      const statsResult = await this.categoryRepository.getUsageStatistics(
        categoryIdResult.getValue(),
      );

      if (statsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: statsResult.getError(),
        });
        return;
      }

      res.json({
        success: true,
        data: statsResult.getValue(),
      });
    } catch (error) {
      console.error("Error fetching category usage stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch category usage statistics",
      });
    }
  }

  async clearAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const clearResult = await this.categoryRepository.clear();

      if (clearResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: clearResult.getError(),
        });
        return;
      }

      res.json({
        success: true,
        message: "All categories have been deleted",
      });
    } catch (error) {
      console.error("Error clearing categories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear categories",
      });
    }
  }
}
