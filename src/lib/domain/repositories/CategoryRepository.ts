import type { Category } from '../entities/Category.js';
import type { CategoryId } from '../value-objects/CategoryId.js';
import type { CategoryType } from '../entities/Category.js';

export interface CategoryRepository {
  // Core CRUD operations
  findById(id: CategoryId): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findAllIncludingInactive?(): Promise<Category[]>; // Optional for backward compatibility
  findByType(type: string): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  findChildren(parentId: CategoryId): Promise<Category[]>;
  save(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  updateById(id: CategoryId, data: { 
    name?: string; 
    type?: string; 
    icon?: string; 
    color?: string; 
    isActive?: boolean;
  }): Promise<Category>;
  delete(id: CategoryId): Promise<void>;
  count(): Promise<number>;
  
  // Transaction management
  hasTransactions(id: CategoryId): Promise<boolean>;
  
  // Analytics
  findWithTransactionCount(): Promise<Array<Category & { transactionCount: number }>>;
}