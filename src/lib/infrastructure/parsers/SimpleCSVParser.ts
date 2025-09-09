import { ParsedTransaction } from '$lib/shared/types/ParsedTransaction.js';
import { CSVParser } from './CSVParserFactory.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';

export class SimpleCSVParser implements CSVParser {
  async parse(csvContent: string): Promise<ParsedTransaction[]> {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV must contain at least headers and one data row');
    }

    const headers = this.parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
    const transactions: ParsedTransaction[] = [];

    // Find column indices
    const dateIndex = this.findColumnIndex(headers, ['booking date', 'date', 'fecha', 'transaction date']);
    const amountIndex = this.findColumnIndex(headers, ['amount (eur)', 'amount', 'importe', 'valor']);
    const descriptionIndex = this.findColumnIndex(headers, ['partner name', 'description', 'concepto', 'descripción']);
    const referenceIndex = this.findColumnIndex(headers, ['payment reference', 'reference', 'referencia', 'ref']);

    if (dateIndex === -1 || amountIndex === -1 || descriptionIndex === -1) {
      throw new Error('Missing required columns: date, amount, and description are required');
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i]);
      
      if (row.length === 0 || row.every(cell => !cell.trim())) {
        continue; // Skip empty rows
      }

      try {
        const dateStr = row[dateIndex]?.trim();
        const amountStr = row[amountIndex]?.trim();
        const description = row[descriptionIndex]?.trim();
        const reference = referenceIndex !== -1 ? row[referenceIndex]?.trim() : '';

        if (!dateStr || !amountStr || !description) {
          console.warn(`Skipping row ${i + 1}: missing required data`);
          continue;
        }

        // Parse date
        const transactionDate = new TransactionDate(this.parseDate(dateStr));
        
        // Parse amount
        const amount = new Money(this.parseAmount(amountStr), 'EUR');

        const transaction: ParsedTransaction = {
          transactionDate,
          amount,
          description,
          paymentReference: reference || undefined,
          counterparty: description, // Use description as counterparty for now
          rawData: {
            date: dateStr,
            amount: amountStr,
            description: description,
            reference: reference || ''
          }
        };

        transactions.push(transaction);
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}:`, error);
        // Continue with next row instead of failing completely
      }
    }

    return transactions;
  }

  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name.toLowerCase()));
      if (index !== -1) return index;
    }
    return -1;
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"' && (i === 0 || row[i-1] === ',' || row[i-1] === '\t')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === row.length - 1 || row[i+1] === ',' || row[i+1] === '\t')) {
        inQuotes = false;
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private parseDate(dateStr: string): Date {
    // Try different date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) { // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else { // DD/MM/YYYY or DD-MM-YYYY
          return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }
      }
    }

    // Fallback to Date constructor
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return date;
  }

  private parseAmount(amountStr: string): number {
    // Remove currency symbols and spaces
    const cleaned = amountStr.replace(/[€$£¥\s]/g, '').replace(/,(\d{3})/g, '$1');
    
    // Handle different decimal separators
    const normalized = cleaned.replace(/,(\d{1,2})$/, '.$1'); // Replace comma with dot for decimals
    
    const amount = parseFloat(normalized);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount format: ${amountStr}`);
    }
    return amount;
  }
}