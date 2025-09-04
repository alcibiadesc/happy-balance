import { Result, success, failure } from '$lib/shared/utils/result.js';
import { CategoryValidator } from '$lib/domain/validation/CategoryValidator.js';
import { CategoryRepository } from '$lib/domain/repositories/CategoryRepository.js';
import { Category, CategoryType } from '$lib/domain/entities/Category.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
import { logger } from '$lib/shared/utils/logger.js';

export interface CreateCategoryCommand {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isActive?: boolean;
}

export interface UpdateCategoryCommand {
  id: string;
  name?: string;
  type?: CategoryType;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export class CategoryApplicationService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(command: CreateCategoryCommand): Promise<Result<Category, Error>> {
    try {
      logger.info('Creating category', { name: command.name, type: command.type });
      
      // Validate input data
      const validation = CategoryValidator.validateCategoryData({
        name: command.name,
        type: command.type,
        color: command.color,
        icon: command.icon
      });

      if (!validation.isValid) {
        const firstError = validation.getFirstError();
        logger.warn('Category validation failed', { errors: validation.errors });
        return failure(new Error(firstError?.message || 'Validation failed'));
      }

      // Check for duplicate names
      const existingCategory = await this.categoryRepository.findByName(command.name.trim());
      if (existingCategory) {
        logger.warn('Category with same name already exists', { name: command.name });
        return failure(new Error('Ya existe una categoría con este nombre'));
      }

      // Create new category
      const categoryId = CategoryId.generate();
      const category = new Category(
        categoryId,
        command.name.trim(),
        command.type,
        command.color,
        command.icon,
        null, // parent
        [], // rules
        command.isActive ?? true
      );

      await this.categoryRepository.save(category);
      logger.info('Category created successfully', { id: categoryId.value, name: command.name });
      
      return success(category);
      
    } catch (error) {
      logger.error('Failed to create category', error, 'CategoryApplicationService');
      return failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateCategory(command: UpdateCategoryCommand): Promise<Result<Category, Error>> {
    try {
      logger.info('Updating category', { id: command.id });
      
      const categoryId = new CategoryId(command.id);
      const existingCategory = await this.categoryRepository.findById(categoryId);
      
      if (!existingCategory) {
        logger.warn('Category not found', { id: command.id });
        return failure(new Error('Categoría no encontrada'));
      }

      // Validate only provided fields
      if (command.name !== undefined) {
        const nameValidation = CategoryValidator.validateName(command.name);
        if (!nameValidation.isValid) {
          const firstError = nameValidation.getFirstError();
          return failure(new Error(firstError?.message || 'Invalid name'));
        }
      }

      if (command.type !== undefined) {
        const typeValidation = CategoryValidator.validateType(command.type);
        if (!typeValidation.isValid) {
          const firstError = typeValidation.getFirstError();
          return failure(new Error(firstError?.message || 'Invalid type'));
        }
      }

      if (command.color !== undefined) {
        const colorValidation = CategoryValidator.validateColor(command.color);
        if (!colorValidation.isValid) {
          const firstError = colorValidation.getFirstError();
          return failure(new Error(firstError?.message || 'Invalid color'));
        }
      }

      if (command.icon !== undefined) {
        const iconValidation = CategoryValidator.validateIcon(command.icon);
        if (!iconValidation.isValid) {
          const firstError = iconValidation.getFirstError();
          return failure(new Error(firstError?.message || 'Invalid icon'));
        }
      }

      // Check for duplicate name if name is being updated
      if (command.name !== undefined && command.name.trim() !== existingCategory.name) {
        const duplicateCategory = await this.categoryRepository.findByName(command.name.trim());
        if (duplicateCategory && !duplicateCategory.id.equals(categoryId)) {
          return failure(new Error('Ya existe una categoría con este nombre'));
        }
      }

      // Update category using repository method
      const updateData: any = {};
      if (command.name !== undefined) updateData.name = command.name.trim();
      if (command.type !== undefined) updateData.type = command.type;
      if (command.color !== undefined) updateData.color = command.color;
      if (command.icon !== undefined) updateData.icon = command.icon;
      if (command.isActive !== undefined) updateData.isActive = command.isActive;

      const updatedCategory = await this.categoryRepository.updateById(categoryId, updateData);
      logger.info('Category updated successfully', { id: command.id });
      
      return success(updatedCategory);
      
    } catch (error) {
      logger.error('Failed to update category', error, 'CategoryApplicationService');
      return failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deleteCategory(categoryId: string): Promise<Result<void, Error>> {
    try {
      logger.info('Deleting category', { id: categoryId });
      
      const id = new CategoryId(categoryId);
      const category = await this.categoryRepository.findById(id);
      
      if (!category) {
        logger.warn('Category not found for deletion', { id: categoryId });
        return failure(new Error('Categoría no encontrada'));
      }

      // Check if category has transactions
      const hasTransactions = await this.categoryRepository.hasTransactions(id);
      if (hasTransactions) {
        logger.warn('Cannot delete category with transactions', { id: categoryId });
        return failure(new Error('No se puede eliminar una categoría que tiene transacciones asociadas'));
      }

      await this.categoryRepository.delete(id);
      logger.info('Category deleted successfully', { id: categoryId });
      
      return success(undefined);
      
    } catch (error) {
      logger.error('Failed to delete category', error, 'CategoryApplicationService');
      return failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async toggleCategoryVisibility(categoryId: string): Promise<Result<Category, Error>> {
    try {
      logger.info('Toggling category visibility', { id: categoryId });
      
      const id = new CategoryId(categoryId);
      const category = await this.categoryRepository.findById(id);
      
      if (!category) {
        logger.warn('Category not found for visibility toggle', { id: categoryId });
        return failure(new Error('Categoría no encontrada'));
      }

      const updatedCategory = await this.categoryRepository.updateById(id, { 
        isActive: !category.isActive 
      });
      
      logger.info('Category visibility toggled successfully', { 
        id: categoryId, 
        isActive: updatedCategory.isActive 
      });
      
      return success(updatedCategory);
      
    } catch (error) {
      logger.error('Failed to toggle category visibility', error, 'CategoryApplicationService');
      return failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}