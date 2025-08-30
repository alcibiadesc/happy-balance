import type { Category } from '../entities/Category.js';
import type { CategoryId } from '../value-objects/CategoryId.js';
import type { CategoryType } from '../entities/Category.js';

export interface CategoryRepository {
  findById(id: CategoryId): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findByType(type: CategoryType): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  findAll(): Promise<Category[]>;
  findChildren(parentId: CategoryId): Promise<Category[]>;
  findRoots(): Promise<Category[]>; // Categories without parent
  save(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  delete(id: CategoryId): Promise<void>;
  count(): Promise<number>;
  
  // Hierarchy methods
  getHierarchy(): Promise<Category[]>; // Returns full tree structure
  moveTo(categoryId: CategoryId, newParentId: CategoryId | null): Promise<void>;
  
  // Rule management
  addRuleToCategory(categoryId: CategoryId, rule: any): Promise<void>;
  removeRuleFromCategory(categoryId: CategoryId, ruleId: string): Promise<void>;
  
  // Analytics
  getCategoryUsage(): Promise<{ categoryId: string; transactionCount: number }[]>;
}