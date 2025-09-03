import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';

const transactionRepository = new PrismaTransactionRepository();

// GET /api/transactions/[id] - Get transaction by ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await transactionRepository.findById(new TransactionId(id));
    
    if (!transaction) {
      return json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// PUT /api/transactions/[id] - Update transaction
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Check if transaction exists
    const existingTransaction = await transactionRepository.findById(new TransactionId(id));
    if (!existingTransaction) {
      return json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction object
    const updatedTransaction = {
      ...existingTransaction,
      partnerName: body.partnerName ?? existingTransaction.partnerName,
      partnerIban: body.partnerIban ?? existingTransaction.partnerIban,
      type: body.type ?? existingTransaction.type,
      paymentReference: body.paymentReference ?? existingTransaction.paymentReference,
      amount: body.amount !== undefined ? parseFloat(body.amount) : existingTransaction.amount,
      originalAmount: body.originalAmount !== undefined ? parseFloat(body.originalAmount) : existingTransaction.originalAmount,
      originalCurrency: body.originalCurrency ?? existingTransaction.originalCurrency,
      exchangeRate: body.exchangeRate !== undefined ? parseFloat(body.exchangeRate) : existingTransaction.exchangeRate,
      categoryId: body.categoryId ?? existingTransaction.categoryId,
      accountId: body.accountId ?? existingTransaction.accountId,
      isRecurring: body.isRecurring ?? existingTransaction.isRecurring,
      confidence: body.confidence !== undefined ? parseFloat(body.confidence) : existingTransaction.confidence,
      notes: body.notes ?? existingTransaction.notes,
      updatedAt: new Date(),
      bookingDate: body.bookingDate ? new Date(body.bookingDate) : existingTransaction.bookingDate,
      valueDate: body.valueDate ? new Date(body.valueDate) : existingTransaction.valueDate,
    };

    await transactionRepository.update(updatedTransaction);
    
    return json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully'
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to update transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// DELETE /api/transactions/[id] - Delete transaction
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existingTransaction = await transactionRepository.findById(new TransactionId(id));
    if (!existingTransaction) {
      return json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    await transactionRepository.delete(new TransactionId(id));
    
    return json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};