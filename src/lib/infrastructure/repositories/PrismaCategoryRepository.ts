import type { Category } from '../../domain/entities/Category.js';
import type { CategoryId } from '../../domain/value-objects/CategoryId.js';
import type { CategoryRepository } from '../../domain/repositories/CategoryRepository.js';
import { prisma } from '../database/prisma.js';

export class PrismaCategoryRepository implements CategoryRepository {
  async findById(id: CategoryId): Promise<Category | null> {
    const result = await prisma.category.findUnique({
      where: { id: id.value },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    return result ? this.mapToEntity(result) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const result = await prisma.category.findFirst({
      where: { name },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<Category[]> {
    const results = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findByType(type: string): Promise<Category[]> {
    const results = await prisma.category.findMany({
      where: { 
        type: type as any, // CategoryType enum
        isActive: true 
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findRootCategories(): Promise<Category[]> {
    const results = await prisma.category.findMany({
      where: { 
        parentId: null,
        isActive: true 
      },
      include: {
        children: {
          where: { isActive: true }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async findChildren(parentId: CategoryId): Promise<Category[]> {
    const results = await prisma.category.findMany({
      where: { 
        parentId: parentId.value,
        isActive: true 
      },
      include: {
        children: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return results.map(this.mapToEntity);
  }

  async save(category: Category): Promise<void> {
    await prisma.category.create({
      data: {
        id: category.id.value,
        name: category.name,
        type: category.type as any,
        color: category.color,
        icon: category.icon,
        parentId: category.parentId,
        isActive: category.isActive
      }
    });
  }

  async update(category: Category): Promise<void> {
    await prisma.category.update({
      where: { id: category.id.value },
      data: {
        name: category.name,
        type: category.type as any,
        color: category.color,
        icon: category.icon,
        parentId: category.parentId,
        isActive: category.isActive
      }
    });
  }

  async delete(id: CategoryId): Promise<void> {
    // Soft delete by setting isActive to false
    await prisma.category.update({
      where: { id: id.value },
      data: { isActive: false }
    });
  }

  async count(): Promise<number> {
    return await prisma.category.count({
      where: { isActive: true }
    });
  }

  async findWithTransactionCount(): Promise<Array<Category & { transactionCount: number }>> {
    const results = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return results.map(result => ({
      ...this.mapToEntity(result),
      transactionCount: result._count.transactions
    }));
  }

  private mapToEntity(dbCategory: any): Category {
    return {
      id: { value: dbCategory.id },
      name: dbCategory.name,
      type: dbCategory.type,
      color: dbCategory.color,
      icon: dbCategory.icon,
      parentId: dbCategory.parentId,
      isActive: dbCategory.isActive,
      createdAt: dbCategory.createdAt,
      updatedAt: dbCategory.updatedAt,
      // Include related entities if loaded
      parent: dbCategory.parent,
      children: dbCategory.children || []
    } as Category;
  }
}