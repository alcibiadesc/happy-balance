export type CategorizationScope = 'single' | 'pattern' | 'all';

/**
 * Command for categorizing a transaction with smart pattern matching
 */
export class CategorizeTransactionCommand {
  constructor(
    public readonly transactionId: string,
    public readonly categoryId: string,
    public readonly scope: CategorizationScope = 'single',
    public readonly applyToFuture: boolean = false,
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

    const validScopes: CategorizationScope[] = ['single', 'pattern', 'all'];
    if (!validScopes.includes(this.scope)) {
      errors.push("Invalid categorization scope");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Command for applying tags to transactions with pattern matching
 */
export class TagTransactionCommand {
  constructor(
    public readonly transactionId: string,
    public readonly tag: string,
    public readonly scope: CategorizationScope = 'single',
  ) {}

  /**
   * Validate command data
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.transactionId || this.transactionId.trim().length === 0) {
      errors.push("Transaction ID cannot be empty");
    }

    if (!this.tag || this.tag.trim().length === 0) {
      errors.push("Tag cannot be empty");
    }

    const validScopes: CategorizationScope[] = ['single', 'pattern', 'all'];
    if (!validScopes.includes(this.scope)) {
      errors.push("Invalid categorization scope");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
