import type { TransactionData, ImportError, ImportableTransaction } from '../../shared/types/transaction';

export interface CSVParserConfig {
  delimiter?: string;
  encoding?: string;
  skipEmptyLines?: boolean;
  skipLinesWithError?: boolean;
}

export class CSVParser {
  private config: Required<CSVParserConfig>;

  constructor(config: CSVParserConfig = {}) {
    this.config = {
      delimiter: ',',
      encoding: 'utf-8',
      skipEmptyLines: true,
      skipLinesWithError: false,
      ...config
    };
  }

  async parseFile(file: File): Promise<{ transactions: ImportableTransaction[], errors: ImportError[] }> {
    const content = await this.readFileContent(file);
    return this.parseContent(content);
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Error reading file'));
      reader.readAsText(file, this.config.encoding);
    });
  }

  private parseContent(content: string): { transactions: ImportableTransaction[], errors: ImportError[] } {
    const lines = content.split('\n').filter(line => 
      this.config.skipEmptyLines ? line.trim() !== '' : true
    );

    if (lines.length === 0) {
      return { transactions: [], errors: [{ row: 0, message: 'File is empty' }] };
    }

    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);
    const fieldMapping = this.detectFieldMapping(headers);
    
    const transactions: ImportableTransaction[] = [];
    const errors: ImportError[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === 0 && this.config.skipEmptyLines) continue;

        const transaction = this.mapToTransaction(values, fieldMapping, i + 1);
        if (transaction) {
          transactions.push({
            ...transaction,
            id: `temp-${i}-${Date.now()}`,
            isSelected: true,
            isDuplicate: false
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
        errors.push({
          row: i + 1,
          message: errorMessage,
          data: lines[i]
        });
        
        if (!this.config.skipLinesWithError) {
          break;
        }
      }
    }

    return { transactions, errors };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === this.config.delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private detectFieldMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    // N26 CSV field mappings based on the example
    const fieldPatterns = {
      bookingDate: /booking\s*date|fecha\s*reserva/i,
      valueDate: /value\s*date|fecha\s*valor/i,
      partnerName: /partner\s*name|nombre\s*socio|beneficiario/i,
      partnerIban: /partner\s*iban|iban\s*socio/i,
      type: /type|tipo/i,
      paymentReference: /payment\s*reference|referencia\s*pago|concepto/i,
      accountName: /account\s*name|nombre\s*cuenta/i,
      amountEur: /amount.*eur|importe.*eur|cantidad/i,
      originalAmount: /original\s*amount|importe\s*original/i,
      originalCurrency: /original\s*currency|moneda\s*original/i,
      exchangeRate: /exchange\s*rate|tipo\s*cambio/i
    };

    headers.forEach((header, index) => {
      Object.entries(fieldPatterns).forEach(([field, pattern]) => {
        if (pattern.test(header)) {
          mapping[field] = index;
        }
      });
    });

    return mapping;
  }

  private mapToTransaction(values: string[], mapping: Record<string, number>, rowNumber: number): TransactionData | null {
    try {
      const bookingDate = this.parseDate(values[mapping.bookingDate] || '');
      const valueDate = this.parseDate(values[mapping.valueDate] || '');
      const amountStr = values[mapping.amountEur] || '0';
      const amount = this.parseAmount(amountStr);

      if (!bookingDate || !valueDate || isNaN(amount)) {
        throw new Error(`Invalid data in required fields (row ${rowNumber})`);
      }

      return {
        bookingDate,
        valueDate,
        partnerName: values[mapping.partnerName] || '',
        partnerIban: values[mapping.partnerIban] || undefined,
        type: values[mapping.type] || '',
        paymentReference: values[mapping.paymentReference] || '',
        accountName: values[mapping.accountName] || '',
        amountEur: amount,
        originalAmount: mapping.originalAmount ? this.parseAmount(values[mapping.originalAmount]) : undefined,
        originalCurrency: values[mapping.originalCurrency] || undefined,
        exchangeRate: mapping.exchangeRate ? parseFloat(values[mapping.exchangeRate]) : undefined
      };
    } catch (error) {
      throw new Error(`Error processing row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Try different date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }
      }
    }

    // Try direct parsing as fallback
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remove any non-numeric characters except . , - and +
    const cleaned = amountStr.replace(/[^\d.,-+]/g, '');
    
    // Handle different decimal separators
    const normalized = cleaned.replace(/,/g, '.');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
}
