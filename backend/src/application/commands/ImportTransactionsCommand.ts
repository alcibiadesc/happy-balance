/**
 * Command for importing transactions from CSV data
 * Following CQRS pattern - Commands modify state
 */
export class ImportTransactionsCommand {
  constructor(
    public readonly csvContent: string,
    public readonly currency: string = 'EUR',
    public readonly autoCategorizationEnabled: boolean = true,
    public readonly duplicateDetectionEnabled: boolean = true,
    public readonly skipDuplicates: boolean = true
  ) {}

  /**
   * Validate command data
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.csvContent || this.csvContent.trim().length === 0) {
      errors.push('CSV content cannot be empty');
    }

    if (!this.currency || this.currency.length !== 3) {
      errors.push('Currency must be a 3-letter ISO code');
    }

    const supportedCurrencies = ['EUR', 'USD', 'JPY', 'GBP'];
    if (!supportedCurrencies.includes(this.currency.toUpperCase())) {
      errors.push(`Unsupported currency: ${this.currency}`);
    }

    if (this.csvContent.length > 10 * 1024 * 1024) { // 10MB limit
      errors.push('CSV content exceeds maximum size of 10MB');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}