import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { AutoIntelligenceService } from '$lib/domain/services/AutoIntelligenceService.js';
import type { UserAction } from '$lib/domain/services/AutoIntelligenceService.js';

const transactionRepository = new PrismaTransactionRepository();

// POST /api/intelligence/actions - Log user action for learning
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.transactionId || !body.action) {
      return json(
        { 
          success: false, 
          error: 'Missing required fields: transactionId, action' 
        },
        { status: 400 }
      );
    }

    // Get the transaction
    const transaction = await transactionRepository.findById({ value: body.transactionId });
    if (!transaction) {
      return json(
        { 
          success: false, 
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    // Store the user action (in a real app, this would go to a dedicated table)
    // For now, we'll use localStorage on the frontend or implement a simple storage
    const userAction: UserAction = {
      transactionId: body.transactionId,
      action: body.action,
      categoryId: body.categoryId,
      timestamp: new Date(),
      transaction
    };

    // TODO: Store in database
    // await userActionRepository.save(userAction);
    
    return json({
      success: true,
      message: 'Action logged successfully'
    });

  } catch (error) {
    console.error('Error logging user action:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to log user action',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// GET /api/intelligence/actions - Get user actions for analysis
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // TODO: Get from database
    // const userActions = await userActionRepository.findRecent(limit);
    
    // For now, return empty array
    const userActions: UserAction[] = [];
    
    return json({
      success: true,
      data: userActions
    });

  } catch (error) {
    console.error('Error fetching user actions:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch user actions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};