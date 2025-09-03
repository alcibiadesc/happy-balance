import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaCategoryRepository } from '$lib/infrastructure/repositories/PrismaCategoryRepository.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
import { v4 as uuidv4 } from 'uuid';

const categoryRepository = new PrismaCategoryRepository();

// GET /api/categories - List all categories
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const type = searchParams.get('type');
    const rootOnly = searchParams.get('rootOnly') === 'true';
    
    let categories;
    
    if (rootOnly) {
      categories = await categoryRepository.findRootCategories();
    } else if (type) {
      categories = await categoryRepository.findByType(type);
    } else {
      categories = await categoryRepository.findAll();
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
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Check if category with same name already exists
    const existingCategory = await categoryRepository.findByName(body.name);
    if (existingCategory) {
      return json(
        { 
          success: false, 
          error: 'Category with this name already exists' 
        },
        { status: 409 }
      );
    }

    // Validate category type
    const validTypes = ['INCOME', 'ESSENTIAL_EXPENSE', 'DISCRETIONARY_EXPENSE', 'DEBT_PAYMENT', 'SAVINGS', 'INVESTMENT'];
    if (!validTypes.includes(body.type)) {
      return json(
        { 
          success: false, 
          error: `Invalid category type. Must be one of: ${validTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create category object
    const now = new Date();
    const category = {
      id: { value: uuidv4() },
      name: body.name,
      type: body.type,
      color: body.color || '#3B82F6',
      icon: body.icon || '📊',
      parentId: body.parentId || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    await categoryRepository.save(category);
    
    return json({
      success: true,
      data: category,
      message: 'Category created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
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