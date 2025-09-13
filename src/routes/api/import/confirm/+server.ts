import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ImportTransactionsUseCase } from '$lib/application/use-cases/ImportTransactionsUseCase.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaAccountRepository } from '$lib/infrastructure/repositories/PrismaAccountRepository.js';
import { CSVParserFactory } from '$lib/infrastructure/parsers/CSVParserFactory.js';
import { ConsoleLogger } from '$lib/shared/utils/logger.js';
import { Transaction } from '$lib/domain/entities/Transaction.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';

export interface ConfirmImportRequest {
  accountId: string;
  transactions: Array<{
    id: string; // Preview ID
    date: string;
    description: string;
    amount: number;
    paymentReference?: string;
    counterparty?: string;
    categoryId?: string;
    willBeHidden: boolean;
    originalData: any;
  }>;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: ConfirmImportRequest = await request.json();
    
    if (!body.accountId || !Array.isArray(body.transactions)) {
      return json({
        success: false,
        error: 'Invalid request data',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    // Initialize dependencies
    const transactionRepository = new PrismaTransactionRepository();
    const accountRepository = new PrismaAccountRepository();
    const logger = new ConsoleLogger();

    // Verify account exists
    const accountId = new AccountId(body.accountId);
    const account = await accountRepository.findById(accountId);
    
    if (!account) {
      return json({
        success: false,
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      }, { status: 404 });
    }

    // Process selected transactions
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    const validTransactions: Transaction[] = [];

    for (const previewTx of body.transactions) {
      try {
        // Create domain transaction from preview data
        const transactionResult = Transaction.create({
          amount: new Money(previewTx.amount, 'EUR'),
          description: previewTx.description,
          accountId: account.id,
          transactionDate: new TransactionDate(new Date(previewTx.date)),
          paymentReference: previewTx.paymentReference,
          counterparty: previewTx.counterparty || previewTx.description
        }, account);

        if (transactionResult.isFailure()) {
          errors.push(`Failed to create transaction "${previewTx.description}": ${transactionResult.error.message}`);
          continue;
        }

        const transaction = transactionResult.data;
        
        // Set visibility based on preview selection
        transaction.isHidden = previewTx.willBeHidden;
        
        // Set category if provided
        if (previewTx.categoryId) {
          transaction.categoryId = previewTx.categoryId;
        }

        validTransactions.push(transaction);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing transaction "${previewTx.description}": ${errorMessage}`);
        logger.error('Transaction processing error', error);
      }
    }

    // Save all valid transactions in batch
    if (validTransactions.length > 0) {
      try {
        await transactionRepository.saveMany(validTransactions);
        imported = validTransactions.length;
        logger.info(`Successfully imported ${imported} transactions`);
      } catch (error) {
        // If batch save fails, try individual saves with duplicate handling
        logger.warn('Batch save failed, trying individual saves', error);
        
        imported = 0;
        for (const transaction of validTransactions) {
          try {
            // Check if transaction already exists by hash
            const existing = await transactionRepository.findByHash(transaction.hash);
            if (existing) {
              skipped++;
              warnings.push(`Transaction already exists: ${transaction.partnerName}`);
              continue;
            }

            await transactionRepository.save(transaction);
            imported++;
          } catch (saveError) {
            const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown save error';
            errors.push(`Error saving transaction: ${errorMessage}`);
          }
        }
      }
    }

    // Update account balance if needed
    if (imported > 0) {
      try {
        const totalAmount = await transactionRepository.calculateTotalByAccount(account.id.value);
        const balanceResult = account.setBalance(totalAmount);
        
        if (balanceResult.isFailure()) {
          warnings.push('Failed to update account balance');
        } else {
          await accountRepository.update(account);
        }
      } catch (error) {
        warnings.push('Failed to update account balance');
        logger.error('Account balance update error', error);
      }
    }

    const result = {
      imported,
      skipped,
      errors,
      warnings,
      total: body.transactions.length
    };

    logger.info('Transaction import completed', result);

    return json({
      success: true,
      data: result,
      message: `Successfully imported ${imported} of ${body.transactions.length} transactions${skipped > 0 ? ` (${skipped} skipped)` : ''}`
    });

  } catch (error) {
    console.error('Confirm import error:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
};