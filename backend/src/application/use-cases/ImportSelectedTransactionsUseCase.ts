import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { DuplicateDetectionService } from '@domain/services/DuplicateDetectionService';
import { TransactionFactory } from '@domain/factories/TransactionFactory';
import { Result } from '@domain/shared/Result';
import { Transaction } from '@domain/entities/Transaction';

export interface ImportSelectedTransactionData {
  hash: string;
  date: string;
  merchant: string;
  amount: number;
  description?: string;
  currency: string;
}

export interface ImportSelectedTransactionsCommand {
  transactions: ImportSelectedTransactionData[];
  currency: string;
  duplicateDetectionEnabled: boolean;
  skipDuplicates: boolean;
  autoCategorizationEnabled: boolean;
}

export interface ImportSelectedTransactionsResponse {
  imported: {
    count: number;
    transactions: Transaction[];
  };
  skipped: {
    count: number;
    duplicates: number;
    errors: number;
  };
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
}

/**
 * Use case for importing selected transactions
 * Follows CQRS pattern and hexagonal architecture
 */
export class ImportSelectedTransactionsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly transactionFactory: TransactionFactory
  ) {}

  async execute(command: ImportSelectedTransactionsCommand): Promise<Result<ImportSelectedTransactionsResponse>> {
    try {
      // Input validation
      if (!command.transactions || command.transactions.length === 0) {
        return Result.fail('No transactions provided');
      }

      // Convert selected transaction data to Transaction entities
      const transactionResults = command.transactions.map(txData => {
        return this.transactionFactory.createFromImportData({
          date: txData.date,
          merchant: txData.merchant,
          amount: txData.amount,
          type: txData.amount < 0 ? 'EXPENSE' : 'INCOME',
          description: txData.description || '',
          currency: txData.currency
        });
      });

      // Check for factory errors
      const failedCreations = transactionResults.filter(result => result.isFailure());
      if (failedCreations.length > 0) {
        return Result.fail(`Failed to create transactions: ${failedCreations[0].getError()}`);
      }

      const transactions = transactionResults.map(result => result.getValue());

      // Handle duplicate detection if enabled
      let uniqueTransactions = transactions;
      let duplicateCount = 0;

      if (command.duplicateDetectionEnabled) {
        // Get existing transactions for comparison
        const existingTransactionsResult = await this.transactionRepository.findAll();
        if (existingTransactionsResult.isFailure()) {
          return Result.fail(`Failed to fetch existing transactions: ${existingTransactionsResult.getError()}`);
        }

        const existingTransactions = existingTransactionsResult.getValue();

        // Use domain service to detect duplicates against existing
        const duplicateResult = this.duplicateDetectionService.detectAgainstExisting(
          transactions,
          existingTransactions
        );

        if (duplicateResult.isFailure()) {
          return Result.fail(duplicateResult.getError());
        }

        const { unique, duplicates } = duplicateResult.getValue();
        uniqueTransactions = unique;
        duplicateCount = duplicates.length;

        // If skipDuplicates is false, we still process duplicates
        if (!command.skipDuplicates) {
          uniqueTransactions = transactions; // Process all regardless of duplicates
          duplicateCount = 0; // Don't count as skipped since we're processing them
        }
      }

      // Save unique transactions
      const saveResults = await Promise.allSettled(
        uniqueTransactions.map(transaction => this.transactionRepository.save(transaction))
      );

      const successfulSaves = saveResults.filter((result): result is PromiseFulfilledResult<any> =>
        result.status === 'fulfilled' && result.value.isSuccess()
      );

      const failedSaves = saveResults.filter(result =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && result.value.isFailure())
      );

      // Collect successfully saved transactions
      const importedTransactions = successfulSaves.map(result =>
        result.value.getValue()
      );

      const response: ImportSelectedTransactionsResponse = {
        imported: {
          count: importedTransactions.length,
          transactions: importedTransactions
        },
        skipped: {
          count: duplicateCount + failedSaves.length,
          duplicates: duplicateCount,
          errors: failedSaves.length
        },
        summary: {
          total: command.transactions.length,
          successful: importedTransactions.length,
          failed: failedSaves.length,
          duplicates: duplicateCount
        }
      };

      return Result.ok(response);

    } catch (error) {
      return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}