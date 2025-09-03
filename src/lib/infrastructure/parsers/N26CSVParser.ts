import { parse } from 'csv-parse/sync';
import { Transaction } from '$lib/domain/entities/Transaction.js';
import { Account } from '$lib/domain/entities/Account.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';

export interface N26CSVRow {
  'Booking Date': string;
  'Value Date': string;
  'Partner Name': string;
  'Partner Iban': string;
  'Type': string;
  'Payment Reference': string;
  'Account Name': string;
  'Amount (EUR)': string;
  'Original Amount': string;
  'Original Currency': string;
  'Exchange Rate': string;
}

export interface ParseResult {
  transactions: Transaction[];
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

export class N26CSVParser {
  constructor(private readonly defaultAccount: Account) {}

  async parse(csvContent: string): Promise<ParseResult> {
    const errors: ParseError[] = [];
    const transactions: Transaction[] = [];
    let totalRows = 0;
    let validRows = 0;
    let errorRows = 0;

    try {
      // Detect delimiter (tab or comma)
      const delimiter = this.detectDelimiter(csvContent);
      
      // Parse CSV with proper options for N26 format
      const records: N26CSVRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter,
        trim: true,
        bom: true, // Handle BOM if present
        quote: '"',
        escape: '"',
        relaxColumnCount: true, // Allow varying column counts
        relaxQuotes: true
      });

      totalRows = records.length;

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        
        try {
          const transaction = this.parseRow(row, i + 2); // +2 for header and 0-index
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
        message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      });
    }

    // Detect duplicates
    const duplicateRows = this.detectDuplicates(transactions);

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
    
    // Count tabs vs commas in the header
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    // N26 typically uses tabs, but some exports might use commas
    return tabCount > commaCount ? '\t' : ',';
  }

  private parseRow(row: N26CSVRow, rowNumber: number): Transaction {
    // Validate required fields
    this.validateRequiredFields(row, rowNumber);

    // Parse dates
    const bookingDate = this.parseDate(row['Booking Date'], 'Booking Date', rowNumber);
    const valueDate = this.parseDate(row['Value Date'], 'Value Date', rowNumber);

    // Parse amount
    const amount = this.parseAmount(row['Amount (EUR)'], 'Amount (EUR)', rowNumber);
    
    // Parse original amount and currency (optional)
    let originalAmount: Money | null = null;
    if (row['Original Amount'] && row['Original Currency']) {
      const origAmount = this.parseAmount(row['Original Amount'], 'Original Amount', rowNumber);
      originalAmount = new Money(origAmount, row['Original Currency']);
    }

    // Parse exchange rate (optional)
    let exchangeRate: number | null = null;
    if (row['Exchange Rate'] && row['Exchange Rate'].trim() !== '') {
      exchangeRate = parseFloat(row['Exchange Rate']);
      if (isNaN(exchangeRate)) {
        throw new Error(`Invalid exchange rate: ${row['Exchange Rate']}`);
      }
    }

    // Create transaction
    const transaction = new Transaction(
      TransactionId.generate(),
      bookingDate,
      valueDate,
      row['Partner Name'].trim(),
      row['Partner Iban']?.trim() || null,
      row['Type'].trim(),
      row['Payment Reference']?.trim() || null,
      new Money(amount, 'EUR'),
      originalAmount,
      row['Original Currency']?.trim() || null,
      exchangeRate,
      this.defaultAccount
    );

    return transaction;
  }

  private validateRequiredFields(row: N26CSVRow, rowNumber: number): void {
    const requiredFields: (keyof N26CSVRow)[] = [
      'Booking Date',
      'Value Date', 
      'Partner Name',
      'Type',
      'Account Name',
      'Amount (EUR)'
    ];

    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        throw new Error(`Missing required field '${field}' in row ${rowNumber}`);
      }
    }
  }

  private parseDate(dateStr: string, fieldName: string, rowNumber: number): Date {
    if (!dateStr || dateStr.trim() === '') {
      throw new Error(`Empty date in field '${fieldName}' (row ${rowNumber})`);
    }

    // Try multiple date formats that N26 might use
    const cleanDateStr = dateStr.trim();
    let date: Date;

    // Format 1: YYYY-MM-DD (ISO format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)) {
      date = new Date(cleanDateStr + 'T00:00:00.000Z');
    }
    // Format 2: DD.MM.YYYY (German format)
    else if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleanDateStr)) {
      const [day, month, year] = cleanDateStr.split('.');
      date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
    // Format 3: DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDateStr)) {
      const [day, month, year] = cleanDateStr.split('/');
      date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
    // Format 4: MM/DD/YYYY (US format)
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDateStr)) {
      const [month, day, year] = cleanDateStr.split('/');
      date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
    // Fallback: let Date constructor handle it
    else {
      date = new Date(cleanDateStr);
    }
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format in field '${fieldName}' (row ${rowNumber}): ${dateStr}`);
    }
    
    return date;
  }

  private parseAmount(amountStr: string, fieldName: string, rowNumber: number): number {
    if (!amountStr || amountStr.trim() === '') {
      throw new Error(`Empty amount in field '${fieldName}' (row ${rowNumber})`);
    }

    let cleanAmount = amountStr.trim();
    
    // Handle different decimal separators and thousand separators
    // Common formats: -1,234.56, -1.234,56, -1234.56, -1234,56
    
    // Remove currency symbols and spaces
    cleanAmount = cleanAmount.replace(/[€$£¥\s]/g, '');
    
    // Handle European format (1.234,56) - comma as decimal separator
    if (/^\-?\d{1,3}(\.\d{3})*,\d{2}$/.test(cleanAmount)) {
      cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    }
    // Handle US format (1,234.56) - period as decimal separator
    else if (/^\-?\d{1,3}(,\d{3})*\.\d{2}$/.test(cleanAmount)) {
      cleanAmount = cleanAmount.replace(/,/g, '');
    }
    // Handle simple formats without thousand separators
    else if (/^\-?\d+[,.]\d{2}$/.test(cleanAmount)) {
      cleanAmount = cleanAmount.replace(',', '.');
    }
    // Handle integer amounts
    else if (/^\-?\d+$/.test(cleanAmount)) {
      // Already clean
    }
    // Final cleanup - remove any remaining non-numeric chars except . and -
    else {
      cleanAmount = cleanAmount.replace(/[^\d.-]/g, '');
    }
    
    const amount = parseFloat(cleanAmount);
    
    if (isNaN(amount)) {
      throw new Error(`Invalid amount format in field '${fieldName}' (row ${rowNumber}): ${amountStr}`);
    }
    
    return amount;
  }

  private detectDuplicates(transactions: Transaction[]): number {
    const hashes = new Set<string>();
    let duplicates = 0;

    for (const transaction of transactions) {
      if (hashes.has(transaction.hash)) {
        duplicates++;
      } else {
        hashes.add(transaction.hash);
      }
    }

    return duplicates;
  }

  // Validation helpers
  static validateCSVFormat(csvContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!csvContent || csvContent.trim().length === 0) {
      errors.push('The CSV file is empty');
      return { isValid: false, errors };
    }

    // Check if it looks like N26 format
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      errors.push('The CSV file must have at least one data row');
      return { isValid: false, errors };
    }

    const header = lines[0].toLowerCase();
    
    // Essential columns that must be present
    const requiredColumns = [
      'booking date',
      'partner name',
      'amount'
    ];

    // Check for required columns (case insensitive and flexible matching)
    const missingRequired = requiredColumns.filter(col => {
      return !header.includes(col) && 
             !header.includes(col.replace(' ', '')) && 
             !header.includes(col.replace(' ', '_'));
    });

    if (missingRequired.length > 0) {
      errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    // Check for common N26 patterns
    const hasN26Pattern = header.includes('amount (eur)') || 
                         header.includes('partner name') ||
                         header.includes('value date');

    if (!hasN26Pattern && errors.length === 0) {
      errors.push('This does not appear to be a standard N26 CSV export format');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Sample data generator for testing
  static generateSampleCSV(): string {
    const header = 'Booking Date\tValue Date\tPartner Name\tPartner Iban\tType\tPayment Reference\tAccount Name\tAmount (EUR)\tOriginal Amount\tOriginal Currency\tExchange Rate';
    const rows = [
      '2025-08-01\t2025-08-01\tMercadona\t\tDebit Transfer\tCompra supermercado\tCuenta Principal\t-45.67\t\t\t',
      '2025-08-01\t2025-08-01\tEmpresa XYZ\tES1234567890123456789012\tCredit Transfer\tNómina Agosto\tCuenta Principal\t2500.00\t\t\t',
      '2025-08-02\t2025-08-02\tNetflix\t\tDebit Transfer\tSuscripción mensual\tCuenta Principal\t-15.99\t\t\t',
      '2025-08-02\t2025-08-02\tUber\t\tDebit Transfer\tViaje al aeropuerto\tCuenta Principal\t-23.45\t25.00\tUSD\t0.9380'
    ];
    
    return [header, ...rows].join('\n');
  }
}