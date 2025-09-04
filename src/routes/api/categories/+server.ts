import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RepositoryFactory } from '$lib/infrastructure/factories/RepositoryFactory.js';
import { CategoryServiceFactory } from '$lib/application/factories/CategoryServiceFactory.js';
import { logger } from '$lib/shared/utils/logger.js';

const categoryRepository = RepositoryFactory.createCategoryRepository();
const categoryService = CategoryServiceFactory.create();

// GET /api/categories - List all categories
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const type = searchParams.get('type');
    const rootOnly = searchParams.get('rootOnly') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let categories;
    
    // Use the method that includes transaction counts
    if (rootOnly) {
      categories = await categoryRepository.findRootCategories();
    } else if (type) {
      categories = await categoryRepository.findByType(type);
    } else if (includeInactive && categoryRepository.findAllIncludingInactive) {
      // Use the new method that includes inactive categories if available
      const allCategories = await categoryRepository.findAllIncludingInactive();
      categories = allCategories.map(cat => ({
        ...cat,
        transactionCount: 0 // We'll need to get this separately for now
      }));
    } else {
      categories = await categoryRepository.findWithTransactionCount();
    }
    
    return json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// POST /api/categories - Create new category
export const POST: RequestHandler = async ({ request }) => {
  try {
    logger.api('Creating new category');
    const body = await request.json();
    
    const result = await categoryService.createCategory({
      name: body.name,
      type: body.type,
      color: body.color || '#3B82F6',
      icon: body.icon || 'Home',
      isActive: body.isActive
    });

    if (result.isFailure()) {
      logger.warn('Category creation failed', { error: result.error.message });
      
      // Determine appropriate HTTP status based on error message
      const errorMessage = result.error.message;
      let status = 400;
      if (errorMessage.includes('ya existe') || errorMessage.includes('already exists')) {
        status = 409;
      }
      
      return json(
        { 
          success: false, 
          error: errorMessage
        },
        { status }
      );
    }

    logger.api('Category created successfully', { id: result.data.id.value });
    return json({
      success: true,
      data: result.data,
      message: 'Category created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Unexpected error creating category', error);
    return json(
      { 
        success: false, 
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};