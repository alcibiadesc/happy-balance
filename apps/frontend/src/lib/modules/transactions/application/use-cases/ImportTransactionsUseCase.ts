import { Result } from "../../domain/shared/Result";
import { Transaction } from "../../domain/entities/Transaction";
import { Category } from "../../domain/entities/Category";
import { Money } from "../../domain/value-objects/Money";
import { TransactionDate } from "../../domain/value-objects/TransactionDate";
import { Merchant } from "../../domain/value-objects/Merchant";
import { TransactionType } from "../../domain/entities/TransactionType";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import { DuplicateDetectionService } from "../../domain/services/DuplicateDetectionService";
import { CategorizationService } from "../../domain/services/CategorizationService";
import { ImportTransactionsCommand } from "../commands/ImportTransactionsCommand";

export interface ImportResult {
  totalProcessed: number;
  imported: number;
  duplicatesSkipped: number;
  errors: number;
  categorized: number;
  processingErrors: string[];
}

export interface CsvParsingResult {
  transactions: Transaction[];
  errors: string[];
}

/**
 * Use Case for importing transactions from CSV
 * Orchestrates domain services and repositories
 */
export class ImportTransactionsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly categorizationService: CategorizationService,
  ) {}

  /**
   * Execute the import process
   */
  async execute(
    command: ImportTransactionsCommand,
  ): Promise<Result<ImportResult>> {
    // Validate command
    const validation = command.isValid();
    if (!validation.valid) {
      return Result.failWithMessage(
        `Invalid command: ${validation.errors.join(", ")}`,
      );
    }

    try {
      // Step 1: Parse CSV content
      const parseResult = await this.parseCSV(
        command.csvContent,
        command.currency,
      );
      if (parseResult.isFailure()) {
        return Result.fail(parseResult.getError());
      }

      const { transactions: parsedTransactions, errors: parseErrors } =
        parseResult.getValue();

      // Step 2: Detect duplicates if enabled
      let uniqueTransactions = parsedTransactions;
      let duplicatesSkipped = 0;

      if (command.duplicateDetectionEnabled) {
        const existingTransactionsResult =
          await this.transactionRepository.findAll();
        if (existingTransactionsResult.isFailure()) {
          return Result.fail(existingTransactionsResult.getError());
        }

        const duplicateResult =
          this.duplicateDetectionService.detectAgainstExisting(
            parsedTransactions,
            existingTransactionsResult.getValue(),
          );

        if (duplicateResult.isFailure()) {
          return Result.fail(duplicateResult.getError());
        }

        const { unique, duplicates } = duplicateResult.getValue();

        if (command.skipDuplicates) {
          uniqueTransactions = unique;
          duplicatesSkipped = duplicates.length;
        } else {
          // Include duplicates but mark them for user decision
          uniqueTransactions = [...unique, ...duplicates];
        }
      }

      // Step 3: Auto-categorize transactions if enabled
      let categorized = 0;
      if (command.autoCategorizationEnabled) {
        const categoriesResult = await this.categoryRepository.findActive();
        if (categoriesResult.isSuccess()) {
          const categories = categoriesResult.getValue();

          for (const transaction of uniqueTransactions) {
            const suggestionResult = this.categorizationService.suggestCategory(
              transaction,
              categories,
            );
            if (
              suggestionResult.isSuccess() &&
              suggestionResult.getValue().suggestedCategory
            ) {
              const { suggestedCategory } = suggestionResult.getValue();
              if (suggestedCategory) {
                const categorizeResult =
                  transaction.categorize(suggestedCategory);
                if (categorizeResult.isSuccess()) {
                  categorized++;
                }
              }
            }
          }
        }
      }

      // Step 4: Save transactions
      const saveResult =
        await this.transactionRepository.saveMany(uniqueTransactions);
      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      const imported = saveResult.getValue();

      // Return comprehensive result
      return Result.ok({
        totalProcessed: parsedTransactions.length,
        imported,
        duplicatesSkipped,
        errors: parseErrors.length,
        categorized,
        processingErrors: parseErrors,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Unexpected error during import: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Parse CSV content into Transaction entities
   */
  private async parseCSV(
    csvContent: string,
    currency: string,
  ): Promise<Result<CsvParsingResult>> {
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return Result.failWithMessage(
        "CSV must have header and at least one data row",
      );
    }

    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);
    const fieldMapping = this.detectFieldMapping(headers);

    const transactions: Transaction[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const transactionResult = this.mapToTransaction(
          values,
          fieldMapping,
          currency,
          i + 1,
        );
        if (transactionResult.isSuccess()) {
          transactions.push(transactionResult.getValue());
        } else {
          errors.push(`Row ${i + 1}: ${transactionResult.getError()}`);
        }
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown parsing error"}`,
        );
      }
    }

    return Result.ok({ transactions, errors });
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Detect field mapping from headers
   */
  private detectFieldMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};

    const fieldPatterns = {
      date: /booking\s*date|fecha\s*reserva|date|fecha/i,
      valueDate: /value\s*date|fecha\s*valor/i,
      merchant:
        /partner\s*name|nombre\s*socio|beneficiario|partner|merchant|comercio/i,
      iban: /partner\s*iban|iban\s*socio|iban/i,
      type: /type|tipo|transaction\s*type/i,
      description:
        /payment\s*reference|referencia\s*pago|concepto|description|descripci[oó]n/i,
      account: /account\s*name|nombre\s*cuenta|account/i,
      amount: /amount.*eur|importe.*eur|cantidad|amount|importe/i,
    };

    headers.forEach((header, index) => {
      Object.entries(fieldPatterns).forEach(([field, pattern]) => {
        if (pattern.test(header) && !mapping[field]) {
          mapping[field] = index;
        }
      });
    });

    return mapping;
  }

  /**
   * Map CSV row to Transaction entity
   */
  private mapToTransaction(
    values: string[],
    mapping: Record<string, number>,
    currency: string,
    rowNumber: number,
  ): Result<Transaction> {
    try {
      // Parse required fields
      const dateStr = values[mapping.date] || "";
      const merchantName = this.cleanString(values[mapping.merchant] || "");
      const amountStr = values[mapping.amount] || "0";
      const description = this.cleanString(values[mapping.description] || "");

      if (!dateStr) {
        return Result.failWithMessage("Missing required field: date");
      }

      // Create value objects
      const dateResult = TransactionDate.fromString(dateStr);
      if (dateResult.isFailure()) {
        return Result.fail(dateResult.getError());
      }

      const merchantResult = Merchant.create(merchantName);
      if (merchantResult.isFailure()) {
        return Result.fail(merchantResult.getError());
      }

      const amount = this.parseAmount(amountStr);
      const moneyResult = Money.create(Math.abs(amount), currency);
      if (moneyResult.isFailure()) {
        return Result.fail(moneyResult.getError());
      }

      // Determine transaction type based on amount sign
      const type =
        amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;

      // Create transaction
      const transactionResult = Transaction.create(
        moneyResult.getValue(),
        dateResult.getValue(),
        merchantResult.getValue(),
        type,
        description,
      );

      return transactionResult;
    } catch (error) {
      return Result.failWithMessage(
        `Error processing row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    const cleaned = amountStr.replace(/[^\d.,+\-]/g, "");
    const normalized = cleaned.replace(/,/g, ".");
    const parsed = parseFloat(normalized);

    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Clean string values
   */
  private cleanString(str: string): string {
    return str.replace(/^"|"$/g, "").trim();
  }
}
