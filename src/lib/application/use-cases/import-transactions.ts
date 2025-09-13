import type { ImportableTransaction, ImportPreview, ImportResult } from '../../shared/types/transaction';
import { CSVParser } from '../../infrastructure/parsers/csv-parser';
import { DuplicateDetector } from '../../domain/services/duplicate-detector';

export interface ImportTransactionsConfig {
  enablePreview?: boolean;
  detectDuplicates?: boolean;
  autoSkipDuplicates?: boolean;
  validateData?: boolean;
}

export class ImportTransactionsUseCase {
  private csvParser: CSVParser;
  private duplicateDetector: DuplicateDetector;
  private config: Required<ImportTransactionsConfig>;

  constructor(
    csvParser?: CSVParser,
    duplicateDetector?: DuplicateDetector,
    config: ImportTransactionsConfig = {}
  ) {
    this.csvParser = csvParser || new CSVParser();
    this.duplicateDetector = duplicateDetector || new DuplicateDetector();
    this.config = {
      enablePreview: true,
      detectDuplicates: true,
      autoSkipDuplicates: true,
      validateData: true,
      ...config
    };
  }

  async generatePreview(file: File): Promise<ImportPreview> {
    try {
      // Parse CSV file
      const { transactions, errors } = await this.csvParser.parseFile(file);
      
      if (errors.length > 0 && transactions.length === 0) {
        return {
          transactions: [],
          totalCount: 0,
          duplicatesCount: 0,
          validCount: 0,
          errors
        };
      }

      // Detect duplicates if enabled
      let processedTransactions = transactions;
      if (this.config.detectDuplicates) {
        processedTransactions = this.duplicateDetector.detectDuplicates(transactions);
      }

      // Calculate metrics
      const duplicatesCount = processedTransactions.filter(t => t.isDuplicate).length;
      const validCount = processedTransactions.filter(t => !t.isDuplicate && t.isSelected).length;

      return {
        transactions: processedTransactions,
        totalCount: processedTransactions.length,
        duplicatesCount,
        validCount,
        errors
      };
    } catch (error) {
      throw new Error(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importTransactions(transactions: ImportableTransaction[]): Promise<ImportResult> {
    try {
      const selectedTransactions = transactions.filter(t => t.isSelected && !t.isDuplicate);
      const skippedCount = transactions.length - selectedTransactions.length;
      const duplicatesCount = transactions.filter(t => t.isDuplicate).length;
      
      // Here we would normally save to database
      // For now, we'll simulate the import
      const importedCount = selectedTransactions.length;
      
      console.log(`Importing ${importedCount} transactions...`, selectedTransactions);
      
      return {
        imported: importedCount,
        skipped: skippedCount,
        duplicates: duplicatesCount,
        errors: []
      };
    } catch (error) {
      throw new Error(`Failed to import transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateTransactionSelection(transactions: ImportableTransaction[], updates: Record<string, boolean>): ImportableTransaction[] {
    return transactions.map(transaction => {
      if (updates.hasOwnProperty(transaction.id)) {
        return {
          ...transaction,
          isSelected: updates[transaction.id]
        };
      }
      return transaction;
    });
  }

  toggleDuplicateVisibility(transactions: ImportableTransaction[], showDuplicates: boolean): ImportableTransaction[] {
    if (showDuplicates) {
      return transactions;
    }
    return transactions.filter(t => !t.isDuplicate);
  }
}
