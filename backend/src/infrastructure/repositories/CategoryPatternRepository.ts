import { PrismaClient } from "@prisma/client";
import {
  CategoryPattern,
  CategoryPatternSnapshot,
  PatternType,
} from "../../domain/entities/CategoryPattern";
import { ICategoryPatternRepository } from "../../domain/services/SmartCategorizationService";
import { Result } from "../../domain/shared/Result";

export class CategoryPatternRepository implements ICategoryPatternRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCategory(categoryId: string): Promise<CategoryPattern[]> {
    try {
      const patterns = await this.prisma.categoryPattern.findMany({
        where: {
          categoryId,
          isActive: true,
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });

      return patterns
        .map((p) => this.toDomain(p))
        .filter((p) => p !== null) as CategoryPattern[];
    } catch (error) {
      console.error("Error finding patterns by category:", error);
      return [];
    }
  }

  async findActivePatterns(): Promise<CategoryPattern[]> {
    try {
      const patterns = await this.prisma.categoryPattern.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ priority: "desc" }, { matchCount: "desc" }],
      });

      return patterns
        .map((p) => this.toDomain(p))
        .filter((p) => p !== null) as CategoryPattern[];
    } catch (error) {
      console.error("Error finding active patterns:", error);
      return [];
    }
  }

  async save(pattern: CategoryPattern): Promise<void> {
    try {
      const snapshot = pattern.toSnapshot();

      await this.prisma.categoryPattern.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          categoryId: snapshot.categoryId,
          pattern: snapshot.pattern,
          patternType: snapshot.patternType,
          isActive: snapshot.isActive,
          applyToFuture: snapshot.applyToFuture,
          priority: snapshot.priority,
          matchCount: snapshot.matchCount,
        },
        update: {
          pattern: snapshot.pattern,
          patternType: snapshot.patternType,
          isActive: snapshot.isActive,
          applyToFuture: snapshot.applyToFuture,
          priority: snapshot.priority,
          matchCount: snapshot.matchCount,
        },
      });
    } catch (error) {
      console.error("Error saving category pattern:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<CategoryPattern | null> {
    try {
      const pattern = await this.prisma.categoryPattern.findUnique({
        where: { id },
      });

      if (!pattern) {
        return null;
      }

      return this.toDomain(pattern);
    } catch (error) {
      console.error("Error finding pattern by id:", error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.categoryPattern.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting category pattern:", error);
      throw error;
    }
  }

  private toDomain(raw: any): CategoryPattern | null {
    try {
      const snapshot: CategoryPatternSnapshot = {
        id: raw.id,
        categoryId: raw.categoryId,
        pattern: raw.pattern,
        patternType: raw.patternType as PatternType,
        isActive: raw.isActive,
        applyToFuture: raw.applyToFuture,
        priority: raw.priority,
        matchCount: raw.matchCount,
        createdAt: raw.createdAt.toISOString(),
      };

      const result = CategoryPattern.fromSnapshot(snapshot);
      if (result.isSuccess()) {
        return result.getValue();
      }

      console.error("Failed to convert pattern to domain:", result.getError());
      return null;
    } catch (error) {
      console.error("Error converting pattern to domain:", error);
      return null;
    }
  }
}
