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

  async findAllIncludingInactive(): Promise<Category[]> {
    const results = await prisma.category.findMany({
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
        parentId: null
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

  async findChildren(parentId: CategoryId): Promise<Category[]> {
    const results = await prisma.category.findMany({
      where: { 
        parentId: parentId.value
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
      }
    });
  }

  async updateById(id: CategoryId, data: { name?: string, type?: string, icon?: string, color?: string }): Promise<Category> {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;

    const result = await prisma.category.update({
      where: { id: id.value },
      data: updateData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    return this.mapToEntity(result);
  }

  async hasTransactions(id: CategoryId): Promise<boolean> {
    const count = await prisma.transaction.count({
      where: { categoryId: id.value }
    });
    
    return count > 0;
  }

  async delete(id: CategoryId): Promise<void> {
    // Check if category has transactions
    const hasTransactions = await this.hasTransactions(id);
    
    if (hasTransactions) {
      throw new Error('Cannot delete category with existing transactions');
    }
    
    // Hard delete if no transactions
    await prisma.category.delete({
      where: { id: id.value }
    });
  }

  async count(): Promise<number> {
    return await prisma.category.count();
  }

  async findWithTransactionCount(): Promise<Array<Category & { transactionCount: number }>> {
    const results = await prisma.category.findMany({
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
      createdAt: dbCategory.createdAt,
      updatedAt: dbCategory.updatedAt,
      // Include related entities if loaded
      parent: dbCategory.parent,
      children: dbCategory.children || []
    } as Category;
  }
}