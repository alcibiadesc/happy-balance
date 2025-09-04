import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaCategoryRepository } from '$lib/infrastructure/repositories/PrismaCategoryRepository.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { categoryId } = await request.json();
    const transactionId = new TransactionId(params.id);
    
    const transactionRepository = new PrismaTransactionRepository();
    const categoryRepository = new PrismaCategoryRepository();
    
    // Get the transaction
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) {
      return json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    // Validate category exists if provided
    if (categoryId) {
      const category = await categoryRepository.findById(new CategoryId(categoryId));
      if (!category) {
        return json({
          success: false,
          error: 'Category not found'
        }, { status: 404 });
      }
    }
    
    // Update transaction category
    await transactionRepository.updateCategory(transactionId, categoryId);
    
    return json({
      success: true,
      message: 'Transaction category updated'
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};