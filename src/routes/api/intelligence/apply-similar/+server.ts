import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';

const transactionRepository = new PrismaTransactionRepository();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { categoryId, referenceTransaction, applyToExisting, applyToFuture } = await request.json();
    
    if (!categoryId || !referenceTransaction) {
      return json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    let updatedCount = 0;
    
    if (applyToExisting) {
      // Find similar transactions
      const allTransactions = await transactionRepository.findAll({});
      
      const similarTransactions = allTransactions.filter(transaction => {
        const isSamePartner = transaction.partnerName.toLowerCase()
          .includes(referenceTransaction.partnerName.toLowerCase()) ||
          referenceTransaction.partnerName.toLowerCase()
          .includes(transaction.partnerName.toLowerCase());
          
        const isAmountRange = Math.abs(transaction.amount) >= Math.abs(referenceTransaction.amount) * 0.8 &&
                             Math.abs(transaction.amount) <= Math.abs(referenceTransaction.amount) * 1.2;
                             
        return isSamePartner && isAmountRange && !transaction.categoryId;
      });
      
      // Update similar transactions
      for (const transaction of similarTransactions) {
        try {
          await transactionRepository.updateCategory(
            transaction.id,
            new CategoryId(categoryId)
          );
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update transaction ${transaction.id.value}:`, error);
        }
      }
    }
    
    return json({
      success: true,
      updatedCount,
      message: `Successfully applied category to ${updatedCount} similar transactions`
    });

  } catch (error) {
    console.error('Error applying category to similar transactions:', error);
    return json(
      {
        success: false,
        error: 'Failed to apply category to similar transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};