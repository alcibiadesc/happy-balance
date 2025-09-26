import { PrismaClient, Category as PrismaCategory } from "@prisma/client";
import { Result } from "@domain/shared/Result";
import {
  ICategoryRepository,
  CategoryFilters,
} from "@domain/repositories/ICategoryRepository";
import {
  Category,
  CategoryId,
  CategorySnapshot,
} from "@domain/entities/Category";
import {
  CategoryType,
  CategoryTypeHelper,
} from "@domain/entities/CategoryType";

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId?: string
  ) {}

  private prismaToDomain(prismaCategory: PrismaCategory): Result<Category> {
    const categoryIdResult = CategoryId.create(prismaCategory.id);
    if (categoryIdResult.isFailure()) {
      return Result.fail(categoryIdResult.getError());
    }

    const categoryType = CategoryTypeHelper.fromString(prismaCategory.type);
    if (!categoryType) {
      return Result.failWithMessage(
        `Invalid category type: ${prismaCategory.type}`,
      );
    }

    return Category.fromSnapshot({
      id: prismaCategory.id,
      name: prismaCategory.name,
      color: prismaCategory.color || "#3B82F6",
      icon: prismaCategory.icon || "💰",
      type: categoryType,
      isActive: prismaCategory.isActive,
      annualBudget: prismaCategory.annualBudget ? Number(prismaCategory.annualBudget) : 0,
      createdAt: prismaCategory.createdAt.toISOString(),
    });
  }

  private domainToPrisma(category: Category, forceUserId?: string) {
    return {
      id: category.id.value,
      name: category.name,
      color: category.color,
      icon: category.icon,
      type: category.type,
      isActive: category.isActive,
      annualBudget: category.annualBudget,
      userId: forceUserId !== undefined ? forceUserId : (this.userId || 'default'),
      isGlobal: false, // User-created categories are not global
    };
  }

  async findAll(): Promise<Result<Category[]>> {
    try {
      // Get both global categories and user-specific categories
      const categories = await this.prisma.category.findMany({
        where: {
          OR: [
            { isGlobal: true },
            { userId: this.userId || 'default' }
          ]
        },
        orderBy: {
          name: "asc",
        },
      });

      const domainCategories: Category[] = [];
      for (const category of categories) {
        const domainCategoryResult = this.prismaToDomain(category);
        if (domainCategoryResult.isFailure()) {
          return Result.fail(domainCategoryResult.getError());
        }
        domainCategories.push(domainCategoryResult.getValue());
      }

      return Result.ok(domainCategories);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findActive(): Promise<Result<Category[]>> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      const domainCategories: Category[] = [];
      for (const category of categories) {
        const domainCategoryResult = this.prismaToDomain(category);
        if (domainCategoryResult.isFailure()) {
          return Result.fail(domainCategoryResult.getError());
        }
        domainCategories.push(domainCategoryResult.getValue());
      }

      return Result.ok(domainCategories);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch active categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findById(id: CategoryId): Promise<Result<Category | null>> {
    try {
      const category = await this.prisma.category.findUnique({
        where: {
          id: id.value,
        },
      });

      if (!category) {
        return Result.ok(null);
      }

      const domainCategoryResult = this.prismaToDomain(category);
      if (domainCategoryResult.isFailure()) {
        return Result.fail(domainCategoryResult.getError());
      }

      return Result.ok(domainCategoryResult.getValue());
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async save(category: Category): Promise<Result<void>> {
    try {
      await this.prisma.category.create({
        data: this.domainToPrisma(category),
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async saveMany(categories: Category[]): Promise<Result<number>> {
    try {
      const result = await this.prisma.category.createMany({
        data: categories.map((cat) => this.domainToPrisma(cat)),
      });
      return Result.ok(result.count);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to save categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findWithFilters(
    filters?: CategoryFilters,
  ): Promise<Result<Category[]>> {
    try {
      const where: any = {
        OR: [
          { isGlobal: true },
          { userId: this.userId || 'default' }
        ]
      };

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.searchTerm) {
        where.name = {
          contains: filters.searchTerm,
          mode: "insensitive",
        };
      }

      const categories = await this.prisma.category.findMany({
        where,
        orderBy: {
          name: "asc",
        },
      });

      const domainCategories: Category[] = [];
      for (const category of categories) {
        const domainCategoryResult = this.prismaToDomain(category);
        if (domainCategoryResult.isFailure()) {
          return Result.fail(domainCategoryResult.getError());
        }
        domainCategories.push(domainCategoryResult.getValue());
      }

      return Result.ok(domainCategories);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to fetch categories with filters: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByType(type: CategoryType): Promise<Result<Category[]>> {
    return this.findWithFilters({ type });
  }

  async findByName(name: string): Promise<Result<Category[]>> {
    return this.findWithFilters({ searchTerm: name });
  }

  async update(category: Category): Promise<Result<void>> {
    try {
      const { id, userId, isGlobal, ...updateData } = this.domainToPrisma(category);
      // Don't update userId or isGlobal - keep original values
      await this.prisma.category.update({
        where: {
          id: category.id.value,
        },
        data: updateData,
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(id: CategoryId): Promise<Result<void>> {
    try {
      await this.prisma.category.update({
        where: {
          id: id.value,
        },
        data: {
          isActive: false,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async permanentDelete(id: CategoryId): Promise<Result<void>> {
    try {
      await this.prisma.category.delete({
        where: {
          id: id.value,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to permanently delete category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async exists(id: CategoryId): Promise<Result<boolean>> {
    try {
      const count = await this.prisma.category.count({
        where: {
          id: id.value,
        },
      });
      return Result.ok(count > 0);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check category existence: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async existsByName(
    name: string,
    type: CategoryType,
  ): Promise<Result<boolean>> {
    try {
      const count = await this.prisma.category.count({
        where: {
          name,
          type,
        },
      });
      return Result.ok(count > 0);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check category name existence: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async count(filters?: CategoryFilters): Promise<Result<number>> {
    try {
      const where: any = {};

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.searchTerm) {
        where.name = {
          contains: filters.searchTerm,
          mode: "insensitive",
        };
      }

      const count = await this.prisma.category.count({ where });
      return Result.ok(count);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to count categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getDefaults(type: CategoryType): Promise<Result<Category[]>> {
    // For now, return empty array. Could be enhanced to return preset categories
    return Result.ok([]);
  }

  async seedDefaults(): Promise<Result<number>> {
    // For now, return 0. Could be enhanced to create default categories
    return Result.ok(0);
  }

  async getUsageStatistics(id: CategoryId): Promise<
    Result<{
      transactionCount: number;
      totalAmount: number;
      lastUsed?: Date;
    }>
  > {
    try {
      const stats = await this.prisma.transaction.aggregate({
        where: {
          categoryId: id.value,
        },
        _count: true,
        _sum: {
          amount: true,
        },
        _max: {
          date: true,
        },
      });

      return Result.ok({
        transactionCount: stats._count,
        totalAmount: Number(stats._sum.amount || 0),
        lastUsed: stats._max.date || undefined,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get usage statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findMatchingCategories(
    merchantName: string,
    type: CategoryType,
  ): Promise<Result<Category[]>> {
    // Simple keyword matching for now
    return this.findWithFilters({ searchTerm: merchantName, type });
  }

  async clear(): Promise<Result<void>> {
    try {
      await this.prisma.category.deleteMany({});
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to clear categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async export(filters?: CategoryFilters): Promise<Result<CategorySnapshot[]>> {
    const categoriesResult = await this.findWithFilters(filters);
    if (categoriesResult.isFailure()) {
      return Result.fail(categoriesResult.getError());
    }

    const categories = categoriesResult.getValue();
    const snapshots = categories.map((cat) => cat.toSnapshot());

    return Result.ok(snapshots);
  }

  async import(snapshots: CategorySnapshot[]): Promise<Result<number>> {
    try {
      const result = await this.prisma.category.createMany({
        data: snapshots.map((snap) => ({
          id: snap.id,
          name: snap.name,
          color: snap.color,
          icon: snap.icon,
          type: snap.type,
          isActive: snap.isActive !== undefined ? snap.isActive : true,
          createdAt: new Date(snap.createdAt),
        })),
        skipDuplicates: true,
      });
      return Result.ok(result.count);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to import categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
