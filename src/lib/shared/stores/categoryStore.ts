import { writable, derived, type Readable } from 'svelte/store';
import { Category, CategoryType } from '$lib/domain/entities/Category.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';

// Store para las categorías
const categories = writable<Category[]>([]);

// Inicializar con categorías por defecto
categories.set(Category.createEssentialCategories());

// Colores predefinidos estilo Notion
export const NOTION_COLORS = [
  { name: 'Gray', value: '#6B7280', bg: '#F3F4F6' },
  { name: 'Brown', value: '#92400E', bg: '#FEF3C7' },
  { name: 'Red', value: '#EF4444', bg: '#FEE2E2' },
  { name: 'Orange', value: '#F59E0B', bg: '#FED7AA' },
  { name: 'Yellow', value: '#EAB308', bg: '#FEF3C7' },
  { name: 'Green', value: '#10B981', bg: '#D1FAE5' },
  { name: 'Blue', value: '#3B82F6', bg: '#DBEAFE' },
  { name: 'Purple', value: '#8B5CF6', bg: '#E9D5FF' },
  { name: 'Pink', value: '#EC4899', bg: '#FCE7F3' },
];

// Iconos predefinidos
export const NOTION_ICONS = [
  '💰', '🏠', '🛒', '🍽️', '🚗', '📱', '🎬', '🛍️', 
  '💊', '⚽', '📚', '✈️', '☕', '🎵', '💻', '🏥',
  '🧑‍🎓', '🐕', '🚊', '⛽', '💡', '🔧', '🎁', '🌱'
];

export interface CategoryStore {
  categories: Readable<Category[]>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Category;
  updateCategory: (id: CategoryId, updates: Partial<Category>) => void;
  deleteCategory: (id: CategoryId) => void;
  findCategories: (query: string) => Readable<Category[]>;
  getCategoryByName: (name: string) => Category | undefined;
  getCategoriesByType: (type: CategoryType) => Readable<Category[]>;
}

function createCategoryStore(): CategoryStore {
  return {
    categories: categories,

    addCategory: (categoryData) => {
      const newCategory = new Category(
        CategoryId.generate(),
        categoryData.name,
        categoryData.type,
        categoryData.color,
        categoryData.icon,
        categoryData.parent,
        [],
        categoryData.isActive,
        new Date(),
        new Date()
      );

      categories.update(cats => [...cats, newCategory]);
      return newCategory;
    },

    updateCategory: (id, updates) => {
      categories.update(cats =>
        cats.map(cat =>
          cat.id.equals(id) 
            ? new Category(
                cat.id,
                updates.name ?? cat.name,
                updates.type ?? cat.type,
                updates.color ?? cat.color,
                updates.icon ?? cat.icon,
                updates.parent ?? cat.parent,
                cat.rules as any,
                updates.isActive ?? cat.isActive,
                cat.createdAt,
                new Date()
              )
            : cat
        )
      );
    },

    deleteCategory: (id) => {
      categories.update(cats => 
        cats.filter(cat => !cat.id.equals(id))
      );
    },

    findCategories: (query) => {
      return derived(categories, $categories => {
        if (!query.trim()) return $categories;
        
        const searchTerm = query.toLowerCase().trim();
        return $categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.type.toLowerCase().includes(searchTerm)
        );
      });
    },

    getCategoryByName: (name) => {
      let result: Category | undefined;
      categories.subscribe(cats => {
        result = cats.find(cat => cat.name.toLowerCase() === name.toLowerCase());
      })();
      return result;
    },

    getCategoriesByType: (type) => {
      return derived(categories, $categories =>
        $categories.filter(category => category.type === type)
      );
    }
  };
}

export const categoryStore = createCategoryStore();