import { Result, success, failure } from '$lib/shared/utils/result';
import { DomainError } from '$lib/shared/errors/DomainError.js';
import { ImportPreview, ImportPreviewTransaction, ImportTransactionStatus } from '$lib/domain/entities/ImportPreview.js';
import { TransactionRepository } from '$lib/domain/repositories/TransactionRepository.js';
import { AccountRepository } from '$lib/domain/repositories/IAccountRepository.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { CSVParserFactory } from '$lib/infrastructure/parsers/CSVParserFactory.js';
import { Logger } from '$lib/shared/utils/logger.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';

export interface GenerateImportPreviewCommand {
  csvContent: string;
  fileName: string;
  accountId: string;
}

export interface GenerateImportPreviewUseCaseDependencies {
  transactionRepository: TransactionRepository;
  accountRepository: AccountRepository;
  csvParserFactory: CSVParserFactory;
  logger: Logger;
}

export class GenerateImportPreviewUseCase {
  constructor(private readonly deps: GenerateImportPreviewUseCaseDependencies) {}

  async execute(command: GenerateImportPreviewCommand): Promise<Result<ImportPreview, DomainError>> {
    this.deps.logger.info('Generating import preview', { 
      fileName: command.fileName, 
      accountId: command.accountId 
    });

    try {
      // 1. Validate command
      const validationResult = this.validateCommand(command);
      if (validationResult.isFailure()) {
        return failure(validationResult.error);
      }

      // 2. Verify account exists
      const accountId = new AccountId(command.accountId);
      const account = await this.deps.accountRepository.findById(accountId);
      
      if (!account) {
        return failure(new DomainError(`Account with ID ${command.accountId} not found`));
      }

      // 3. Parse CSV content
      const parser = this.deps.csvParserFactory.createParser(command.fileName);
      const parseResult = await parser.parseWithDetails(command.csvContent);
      
      this.deps.logger.info(`Parsed ${parseResult.transactions.length} transactions from CSV`);

      // 4. Process transactions and create preview transactions
      const previewTransactions: ImportPreviewTransaction[] = [];
      
      // Process successfully parsed transactions
      for (let i = 0; i < parseResult.transactions.length; i++) {
        const parsedTx = parseResult.transactions[i];
        
        try {
          const previewTx = await this.createPreviewTransaction(parsedTx, i);
          previewTransactions.push(previewTx);
        } catch (error) {
          const errorTx = this.createErrorTransaction(parsedTx, i, error);
          previewTransactions.push(errorTx);
        }
      }

      // Process parsing errors as error transactions
      for (const parseError of parseResult.errors) {
        const errorTx = this.createParseErrorTransaction(parseError);
        previewTransactions.push(errorTx);
      }

      // 5. Create import preview entity
      const previewResult = ImportPreview.create({
        fileName: command.fileName,
        accountId: command.accountId,
        transactions: previewTransactions
      });

      if (previewResult.isFailure()) {
        return failure(previewResult.error);
      }

      const preview = previewResult.data;
      
      this.deps.logger.info('Import preview generated successfully', {
        totalTransactions: preview.summary.totalTransactions,
        newTransactions: preview.summary.newTransactions,
        duplicates: preview.summary.duplicates,
        errors: preview.summary.errors
      });

      return success(preview);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.deps.logger.error('Failed to generate import preview', error);
      return failure(new DomainError(`Failed to generate import preview: ${errorMessage}`));
    }
  }

  private validateCommand(command: GenerateImportPreviewCommand): Result<void, DomainError> {
    if (!command.csvContent || command.csvContent.trim() === '') {
      return failure(new DomainError('CSV content is required'));
    }

    if (!command.fileName || command.fileName.trim() === '') {
      return failure(new DomainError('File name is required'));
    }

    if (!command.accountId || command.accountId.trim() === '') {
      return failure(new DomainError('Account ID is required'));
    }

    // Validate file extension
    if (!command.fileName.toLowerCase().endsWith('.csv')) {
      return failure(new DomainError('File must be a CSV file'));
    }

    return success(undefined);
  }

  private async createPreviewTransaction(
    parsedTx: any, 
    index: number
  ): Promise<ImportPreviewTransaction> {
    const tempId = `preview-${index}-${Date.now()}`;
    
    // Check for duplicates
    let isDuplicate = false;
    let duplicateOf: string | undefined;
    
    try {
      const hash = await this.generateTransactionHash(parsedTx);
      const existing = await this.deps.transactionRepository.findByHash(hash);
      
      if (existing) {
        isDuplicate = true;
        duplicateOf = existing.id;
      }
    } catch (error) {
      this.deps.logger.warn('Error checking for duplicates', error);
    }

    return {
      id: tempId,
      date: parsedTx.transactionDate,
      description: parsedTx.description,
      amount: parsedTx.amount,
      paymentReference: parsedTx.paymentReference,
      counterparty: parsedTx.counterparty,
      status: isDuplicate ? ImportTransactionStatus.DUPLICATE : ImportTransactionStatus.NEW,
      isDuplicate: isDuplicate,
      duplicateOf: duplicateOf,
      selected: !isDuplicate, // Don't select duplicates by default
      willBeHidden: false,
      isEdited: false,
      originalData: parsedTx.rawData || {}
    };
  }

  private createErrorTransaction(
    parsedTx: any, 
    index: number, 
    error: unknown
  ): ImportPreviewTransaction {
    const tempId = `error-${index}-${Date.now()}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

    return {
      id: tempId,
      date: new TransactionDate(new Date()),
      description: 'Error processing transaction',
      amount: new Money(0, 'EUR'),
      status: ImportTransactionStatus.ERROR,
      isDuplicate: false,
      selected: false,
      willBeHidden: false,
      isEdited: false,
      error: errorMessage,
      originalData: parsedTx.rawData || {}
    };
  }

  private createParseErrorTransaction(parseError: any): ImportPreviewTransaction {
    const tempId = `parse-error-${parseError.row}-${Date.now()}`;

    return {
      id: tempId,
      date: new TransactionDate(new Date()),
      description: `Row ${parseError.row}: Parse error`,
      amount: new Money(0, 'EUR'),
      status: ImportTransactionStatus.ERROR,
      isDuplicate: false,
      selected: false,
      willBeHidden: false,
      isEdited: false,
      error: parseError.message,
      originalData: parseError.data || {}
    };
  }

  private async generateTransactionHash(transaction: any): Promise<string> {
    const crypto = await import('crypto');
    const hashData = `${transaction.transactionDate.value.getTime()}-${transaction.description}-${transaction.amount.amount}`;
    return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 8);
  }
}