import { Transaction } from '../entities/Transaction';
import { TransactionType } from '../entities/TransactionType';
import { Money } from '../value-objects/Money';
import { TransactionDate } from '../value-objects/TransactionDate';
import { Merchant } from '../value-objects/Merchant';
import { TransactionId } from '../value-objects/TransactionId';
import { Result } from '../shared/Result';

export interface ImportTransactionData {
  date: string;
  merchant: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  currency: string;
}

/**
 * Factory for creating Transaction domain entities
 * Follows DDD patterns for complex object creation
 */
export class TransactionFactory {

  /**
   * Create a transaction from import data
   */
  createFromImportData(data: ImportTransactionData): Result<Transaction> {
    try {
      // Create value objects
      const id = TransactionId.generate(); // Use generate() method that returns TransactionId directly

      // Convert amount to positive for domain model (sign is handled by type)
      const absoluteAmount = Math.abs(data.amount);
      const amount = Money.create(absoluteAmount, data.currency);
      const date = TransactionDate.create(data.date);

      // Handle empty or invalid merchant names
      const merchantName = data.merchant && data.merchant.trim().length >= 2
        ? data.merchant.trim()
        : 'Unknown Merchant';
      const merchant = Merchant.create(merchantName);

      // Validate amount
      if (amount.isFailure()) {
        return Result.fail(`Invalid amount: ${amount.getError()}`);
      }

      // Validate date
      if (date.isFailure()) {
        return Result.fail(`Invalid date: ${date.getError()}`);
      }

      // Validate merchant
      if (merchant.isFailure()) {
        return Result.fail(`Invalid merchant: ${merchant.getError()}`);
      }

      // Convert string type to TransactionType enum
      const transactionType = data.type === 'INCOME' ? TransactionType.INCOME :
                             data.type === 'INVESTMENT' ? TransactionType.INVESTMENT :
                             TransactionType.EXPENSE;

      // Create transaction using correct parameters
      const transaction = Transaction.create(
        amount.getValue(),
        date.getValue(),
        merchant.getValue(),
        transactionType,
        data.description || '',
        id
      );

      return transaction;

    } catch (error) {
      return Result.fail(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a transaction with manual data
   */
  create(data: {
    amount: number;
    currency: string;
    date: string;
    merchant: string;
    type: 'INCOME' | 'EXPENSE';
    description?: string;
    categoryId?: string | null;
  }): Result<Transaction> {
    return this.createFromImportData({
      date: data.date,
      merchant: data.merchant,
      amount: data.amount,
      type: data.type,
      description: data.description || '',
      currency: data.currency
    });
  }
}