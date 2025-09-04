import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { description } = await request.json();
    const transactionId = new TransactionId(params.id);
    
    const transactionRepository = new PrismaTransactionRepository();
    
    // Get the transaction to ensure it exists
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) {
      return json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    // Update transaction description
    await transactionRepository.updateDescription(transactionId, description?.trim() || null);
    
    return json({
      success: true,
      message: 'Description updated'
    });
    
  } catch (error) {
    console.error('Update description error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};