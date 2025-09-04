import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RepositoryFactory } from '$lib/infrastructure/factories/RepositoryFactory.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
import { Transaction } from '$lib/domain/entities/Transaction.js';

const transactionRepository = RepositoryFactory.createTransactionRepository();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { fileName, transactions } = body;

    if (!fileName || !transactions || !Array.isArray(transactions)) {
      return json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const results = {
      fileName,
      summary: {
        totalRows: transactions.length,
        savedRows: 0,
        duplicateRows: 0,
        errorRows: 0,
        skippedRows: 0
      },
      errors: [] as string[]
    };

    // Get default account ID (assuming first account or create if none exists)
    const defaultAccountId = new AccountId('default-account-001');

    for (let i = 0; i < transactions.length; i++) {
      const transactionData = transactions[i];
      
      try {
        // Create transaction entity
        const transactionId = TransactionId.generate();
        const categoryId = transactionData.categoryId ? new CategoryId(transactionData.categoryId) : null;
        
        const transaction = new Transaction(
          transactionId,
          defaultAccountId,
          transactionData.amount,
          transactionData.partnerName || 'Unknown',
          new Date(transactionData.bookingDate),
          categoryId
        );

        // Set additional properties
        transaction.valueDate = new Date(transactionData.valueDate || transactionData.bookingDate);
        transaction.partnerIban = transactionData.partnerIban || null;
        transaction.paymentReference = transactionData.paymentReference || null;
        transaction.originalAmount = transactionData.originalAmount || transactionData.amount;
        transaction.originalCurrency = transactionData.originalCurrency || 'EUR';
        transaction.exchangeRate = transactionData.exchangeRate || 1.0;

        // Check for duplicates
        const isDuplicate = await checkForDuplicate(transaction);
        
        if (isDuplicate) {
          results.summary.duplicateRows++;
          continue;
        }

        // Save transaction
        await transactionRepository.save(transaction);
        results.summary.savedRows++;

      } catch (error) {
        const errorMessage = `Row ${transactionData.rowNumber || i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMessage);
        results.summary.errorRows++;
        console.error('Transaction import error:', errorMessage);
      }
    }

    // Calculate skipped rows
    results.summary.skippedRows = results.summary.totalRows - 
      results.summary.savedRows - 
      results.summary.duplicateRows - 
      results.summary.errorRows;

    return json({
      success: true,
      data: results,
      message: `Import completed. ${results.summary.savedRows} transactions imported successfully.`
    });

  } catch (error) {
    console.error('Error confirming import:', error);
    return json(
      {
        success: false,
        error: 'Failed to confirm import',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

async function checkForDuplicate(transaction: Transaction): Promise<boolean> {
  try {
    // Check for transactions with same amount, partner, and date (within same day)
    const startOfDay = new Date(transaction.bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(transaction.bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingTransactions = await transactionRepository.findAll({
      startDate: startOfDay,
      endDate: endOfDay
    });

    // Check for exact matches
    const isDuplicate = existingTransactions.some(existing => 
      Math.abs(existing.amount - transaction.amount) < 0.01 && // Same amount (accounting for floating point precision)
      existing.partnerName === transaction.partnerName &&
      existing.bookingDate.toDateString() === transaction.bookingDate.toDateString()
    );

    return isDuplicate;
  } catch (error) {
    console.warn('Error checking for duplicates:', error);
    return false; // If we can't check, allow the import
  }
}