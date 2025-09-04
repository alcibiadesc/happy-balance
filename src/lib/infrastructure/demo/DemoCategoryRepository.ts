import type { ICategoryRepository } from '$lib/domain/repositories/ICategoryRepository.js';
import { Category } from '$lib/domain/entities/Category.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
import { demoCategories } from './DemoData.js';

export class DemoCategoryRepository implements ICategoryRepository {
  private categories: Category[] = [...demoCategories];

  async findById(id: CategoryId): Promise<Category | null> {
    const category = this.categories.find(c => c.id.equals(id));
    return category || null;
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByName(name: string): Promise<Category | null> {
    const category = this.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    return category || null;
  }

  async findByType(type: string): Promise<Category[]> {
    return this.categories
      .filter(c => c.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async save(category: Category): Promise<void> {
    const existingIndex = this.categories.findIndex(c => c.id.equals(category.id));
    
    if (existingIndex >= 0) {
      // Updating existing category - check name conflicts with other categories
      const nameConflict = this.categories.find(c => 
        !c.id.equals(category.id) && c.name.toLowerCase() === category.name.toLowerCase()
      );
      if (nameConflict) {
        throw new Error('Category with this name already exists');
      }
      this.categories[existingIndex] = category;
    } else {
      // Creating new category - check name conflicts
      const nameConflict = this.categories.find(c => 
        c.name.toLowerCase() === category.name.toLowerCase()
      );
      if (nameConflict) {
        throw new Error('Category with this name already exists');
      }
      this.categories.push(category);
    }
  }

  async delete(id: CategoryId): Promise<void> {
    this.categories = this.categories.filter(c => !c.id.equals(id));
  }

  async findActiveCategories(): Promise<Category[]> {
    return this.categories
      .filter(c => c.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByParent(parentId: CategoryId | null): Promise<Category[]> {
    return this.categories
      .filter(c => {
        if (parentId === null) {
          return c.parentId === null;
        }
        return c.parentId?.equals(parentId);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateById(id: CategoryId, updates: {
    name?: string;
    type?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
  }): Promise<void> {
    const categoryIndex = this.categories.findIndex(c => c.id.equals(id));
    
    if (categoryIndex === -1) {
      throw new Error('Category not found');
    }

    const category = this.categories[categoryIndex];
    
    // Create updated category
    const updatedCategory = new Category(
      category.id,
      updates.name ?? category.name,
      updates.type ?? category.type,
      updates.color ?? category.color,
      updates.icon ?? category.icon,
      updates.isActive ?? category.isActive,
      category.parentId,
      category.createdAt,
      new Date() // updatedAt
    );

    this.categories[categoryIndex] = updatedCategory;
  }
}