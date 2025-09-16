/**
 * Command for categorizing a transaction
 */
export class CategorizeTransactionCommand {
  constructor(
    public readonly transactionId: string,
    public readonly categoryId: string,
  ) {}

  /**
   * Validate command data
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.transactionId || this.transactionId.trim().length === 0) {
      errors.push("Transaction ID cannot be empty");
    }

    if (!this.categoryId || this.categoryId.trim().length === 0) {
      errors.push("Category ID cannot be empty");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
