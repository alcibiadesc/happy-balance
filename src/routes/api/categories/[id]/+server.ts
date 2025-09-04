import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CategoryServiceFactory } from '$lib/application/factories/CategoryServiceFactory.js';
import { logger } from '$lib/shared/utils/logger.js';

const categoryService = CategoryServiceFactory.create();

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    logger.api('Updating category', { id, fields: Object.keys(data) });

    // If only isActive is being updated (visibility toggle)
    if (data.isActive !== undefined && Object.keys(data).length === 1) {
      const result = await categoryService.toggleCategoryVisibility(id);
      
      if (result.isFailure()) {
        logger.warn('Category visibility toggle failed', { id, error: result.error.message });
        return json(
          { success: false, error: result.error.message },
          { status: 404 }
        );
      }

      return json({
        success: true,
        data: result.data,
        message: `Category ${result.data.isActive ? 'shown' : 'hidden'} successfully`
      });
    }

    // Full or partial category update
    const result = await categoryService.updateCategory({
      id,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      isActive: data.isActive
    });

    if (result.isFailure()) {
      logger.warn('Category update failed', { id, error: result.error.message });
      
      const errorMessage = result.error.message;
      let status = 400;
      if (errorMessage.includes('no encontrada') || errorMessage.includes('not found')) {
        status = 404;
      } else if (errorMessage.includes('ya existe') || errorMessage.includes('already exists')) {
        status = 409;
      }
      
      return json(
        { success: false, error: errorMessage },
        { status }
      );
    }

    logger.api('Category updated successfully', { id });
    return json({
      success: true,
      data: result.data,
      message: 'Category updated successfully'
    });

  } catch (error) {
    logger.error('Unexpected error updating category', error);
    return json(
      {
        success: false,
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    logger.api('Deleting category', { id });

    const result = await categoryService.deleteCategory(id);

    if (result.isFailure()) {
      logger.warn('Category deletion failed', { id, error: result.error.message });
      
      const errorMessage = result.error.message;
      let status = 400;
      if (errorMessage.includes('no encontrada') || errorMessage.includes('not found')) {
        status = 404;
      } else if (errorMessage.includes('transacciones') || errorMessage.includes('transactions')) {
        status = 409;
      }
      
      return json(
        { success: false, error: errorMessage },
        { status }
      );
    }

    logger.api('Category deleted successfully', { id });
    return json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    logger.error('Unexpected error deleting category', error);
    return json(
      {
        success: false,
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};