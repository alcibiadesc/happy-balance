import { parse } from 'csv-parse/sync';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';
import { ParsedTransaction } from '$lib/shared/types/ParsedTransaction.js';
import { CSVParser } from './CSVParserFactory.js';

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: ParseError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    duplicateRows: number;
  };
}

export interface ParseError {
  row: number;
  field?: string;
  message: string;
  data: any;
}

// Generic CSV row interface - can handle various column names
interface CSVRow {
  [key: string]: string;
}

// Supported column mappings for different CSV formats
interface ColumnMappings {
  date: string[];
  amount: string[];
  description: string[];
  reference: string[];
}

export class UniversalCSVParser implements CSVParser {
  private readonly columnMappings: ColumnMappings = {
    date: [
      // N26 format
      'Booking Date', 'booking date',
      // Generic formats
      'Date', 'date', 'fecha', 'Transaction Date', 'transaction date'
    ],
    amount: [
      // N26 format
      'Amount (EUR)', 'amount (eur)',
      // Generic formats
      'Amount', 'amount', 'importe', 'valor'
    ],
    description: [
      // N26 format
      'Partner Name', 'partner name',
      // Generic formats
      'Description', 'description', 'concepto', 'descripción'
    ],
    reference: [
      // N26 format
      'Payment Reference', 'payment reference',
      // Generic formats
      'Reference', 'reference', 'referencia', 'ref'
    ]
  };

  constructor() {}

  // CSVParser interface method
  async parse(csvContent: string): Promise<ParsedTransaction[]> {
    const result = await this.parseWithDetails(csvContent);
    return result.transactions;
  }

  async parseWithDetails(csvContent: string): Promise<ParseResult> {
    const errors: ParseError[] = [];
    const transactions: ParsedTransaction[] = [];
    let totalRows = 0;
    let validRows = 0;
    let errorRows = 0;

    try {
      // Detect delimiter (tab or comma)
      const delimiter = this.detectDelimiter(csvContent);
      
      // Parse CSV with flexible options
      const records: CSVRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter,
        trim: true,
        bom: true,
        quote: '"',
        escape: '"',
        relaxColumnCount: true,
        relaxQuotes: true
      });

      if (records.length === 0) {
        throw new Error('CSV file contains no data rows');
      }

      // Detect column mapping from first record
      const columnMapping = this.detectColumnMapping(records[0]);
      if (!columnMapping) {
        throw new Error('Could not identify required columns. Expected columns for date, amount, and description.');
      }

      totalRows = records.length;

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        
        try {
          const transaction = this.parseRow(row, columnMapping, i + 2);
          transactions.push(transaction);
          validRows++;
        } catch (error) {
          errors.push({
            row: i + 2,
            field: error instanceof Error && error.message.includes('field') ? 
              error.message.split("'")[1] : undefined,
            message: error instanceof Error ? error.message : 'Unknown error',
            data: row
          });
          errorRows++;
        }
      }

    } catch (error) {
      errors.push({
        row: 0,
        message: `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      });
      errorRows = 1;
    }

    const duplicateRows = 0; // We'll handle duplicates at the backend level

    return {
      transactions,
      errors,
      summary: {
        totalRows,
        validRows,
        errorRows,
        duplicateRows
      }
    };
  }

  private detectDelimiter(csvContent: string): string {
    const firstLine = csvContent.split('\n')[0];
    
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    return tabCount > commaCount ? '\t' : ',';
  }

  private detectColumnMapping(firstRow: CSVRow): { date: string; amount: string; description: string; reference?: string } | null {
    const headers = Object.keys(firstRow).map(h => h.trim());
    
    const findColumn = (mappings: string[]): string | undefined => {
      for (const header of headers) {
        if (mappings.some(mapping => 
          mapping.toLowerCase() === header.toLowerCase()
        )) {
          return header;
        }
      }
      return undefined;
    };

    const dateColumn = findColumn(this.columnMappings.date);
    const amountColumn = findColumn(this.columnMappings.amount);
    const descriptionColumn = findColumn(this.columnMappings.description);
    const referenceColumn = findColumn(this.columnMappings.reference);

    if (!dateColumn || !amountColumn || !descriptionColumn) {
      return null;
    }

    return {
      date: dateColumn,
      amount: amountColumn,
      description: descriptionColumn,
      reference: referenceColumn
    };
  }

  private parseRow(row: CSVRow, mapping: { date: string; amount: string; description: string; reference?: string }, rowNumber: number): ParsedTransaction {
    // Extract values using detected column mapping
    const dateStr = row[mapping.date]?.trim();
    const amountStr = row[mapping.amount]?.trim();
    const description = row[mapping.description]?.trim();
    const reference = mapping.reference ? row[mapping.reference]?.trim() : '';

    // Validate required fields
    if (!dateStr) {
      throw new Error(`Missing date in row ${rowNumber}`);
    }
    if (!amountStr) {
      throw new Error(`Missing amount in row ${rowNumber}`);
    }
    if (!description) {
      throw new Error(`Missing description in row ${rowNumber}`);
    }

    // Parse date - support multiple formats
    const bookingDate = this.parseDate(dateStr, rowNumber);
    
    // Parse amount - handle both positive and negative values
    const amount = this.parseAmount(amountStr, rowNumber);

    // Create ParsedTransaction
    const transaction: ParsedTransaction = {
      transactionDate: new TransactionDate(bookingDate),
      amount: new Money(amount, 'EUR'),
      description: description,
      paymentReference: reference || undefined,
      counterparty: description, // Use description as counterparty
      rawData: {
        date: dateStr,
        amount: amountStr,
        description: description,
        reference: reference || ''
      }
    };

    return transaction;
  }

  private parseDate(dateStr: string, rowNumber: number): Date {
    // Try common date formats
    const formats = [
      // ISO format: 2023-12-01
      /^\d{4}-\d{2}-\d{2}$/,
      // European format: 01.12.2023 or 01/12/2023
      /^\d{1,2}[.\/]\d{1,2}\.\d{4}$/,
      // US format: 12/01/2023
      /^\d{1,2}\/\d{1,2}\/\d{4}$/
    ];

    let date: Date;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // ISO format
      date = new Date(dateStr);
    } else if (/^\d{1,2}[.\/]\d{1,2}[.\/]\d{4}$/.test(dateStr)) {
      // European or US format
      const parts = dateStr.split(/[.\/]/);
      if (parts.length === 3) {
        // Assume DD.MM.YYYY or DD/MM/YYYY format (European)
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        throw new Error(`Invalid date format in row ${rowNumber}: ${dateStr}`);
      }
    } else {
      // Try parsing as-is
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format in row ${rowNumber}: ${dateStr}`);
    }

    return date;
  }

  private parseAmount(amountStr: string, rowNumber: number): number {
    // Remove currency symbols and spaces
    const cleanAmount = amountStr.replace(/[€$£¥\s]/g, '');
    
    // Handle negative amounts in parentheses: (10.50) -> -10.50
    const isNegativeParens = /^\(.*\)$/.test(cleanAmount);
    let numericStr = isNegativeParens ? cleanAmount.slice(1, -1) : cleanAmount;
    
    // Replace comma with dot for European format
    numericStr = numericStr.replace(',', '.');
    
    const amount = parseFloat(numericStr);
    
    if (isNaN(amount)) {
      throw new Error(`Invalid amount format in row ${rowNumber}: ${amountStr}`);
    }
    
    return isNegativeParens ? -amount : amount;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static validateCSVFormat(csvContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!csvContent || csvContent.trim().length === 0) {
      errors.push('CSV content is empty');
      return { isValid: false, errors };
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      errors.push('CSV must contain at least a header row and one data row');
      return { isValid: false, errors };
    }

    // Basic format validation - just check that we have some content
    const firstLine = lines[0];
    if (!firstLine || firstLine.trim().length === 0) {
      errors.push('CSV header row is empty');
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }
}