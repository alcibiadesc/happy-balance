import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaCategoryRepository } from '$lib/infrastructure/repositories/PrismaCategoryRepository.js';
import { AutoIntelligenceService } from '$lib/domain/services/AutoIntelligenceService.js';

const transactionRepository = new PrismaTransactionRepository();
const categoryRepository = new PrismaCategoryRepository();

// GET /api/intelligence/suggestions - Get suggested rules and auto-categories
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const transactionId = searchParams.get('transactionId');
    
    if (transactionId) {
      // Get suggestions for a specific transaction
      const transaction = await transactionRepository.findById({ value: transactionId });
      if (!transaction) {
        return json(
          { 
            success: false, 
            error: 'Transaction not found' 
          },
          { status: 404 }
        );
      }

      // TODO: Get user's rules from database
      const rules: any[] = [];
      const categories = await categoryRepository.findAll();
      
      const suggestion = AutoIntelligenceService.applySuggestedCategories(
        transaction,
        rules,
        categories
      );
      
      return json({
        success: true,
        data: {
          transactionId,
          suggestion
        }
      });
    } else {
      // Get general rule suggestions based on user actions
      // TODO: Get user actions from database
      const userActions: any[] = [];
      const allTransactions = await transactionRepository.findAll();
      
      const suggestions = AutoIntelligenceService.suggestRulesFromActions(
        userActions,
        allTransactions
      );
      
      return json({
        success: true,
        data: {
          suggestions
        }
      });
    }

  } catch (error) {
    console.error('Error getting intelligence suggestions:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to get suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};