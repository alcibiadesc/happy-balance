import type { CategoryDTO, CategoryType as SharedCategoryType } from '@happy-balance/shared-types';
import { Category } from '@domain/entities/Category';
import { CategoryType } from '@domain/entities/CategoryType';

/**
 * Maps domain CategoryType enum to shared-types CategoryType string literal.
 */
function mapCategoryType(type: CategoryType): SharedCategoryType {
  return type as SharedCategoryType;
}

/**
 * Maps domain Category to API CategoryDTO.
 */
export function mapCategoryToDTO(category: Category): CategoryDTO {
  const snapshot = category.toSnapshot();
  return {
    id: snapshot.id,
    name: snapshot.name,
    type: mapCategoryType(snapshot.type),
    color: snapshot.color,
    icon: snapshot.icon,
    isActive: snapshot.isActive,
    annualBudget: snapshot.annualBudget ?? null,
    monthlyBudget: snapshot.annualBudget ? snapshot.annualBudget / 12 : null,
    isDefault: false,
    sortOrder: 0,
  };
}

/**
 * Maps an array of categories to DTOs.
 */
export function mapCategoriesToDTO(categories: Category[]): CategoryDTO[] {
  return categories.map(mapCategoryToDTO);
}
