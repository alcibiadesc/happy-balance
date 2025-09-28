import { TransactionType } from "../../domain/entities/TransactionType";

/**
 * Command for creating a new transaction
 */
export class CreateTransactionCommand {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
    public readonly date: string,
    public readonly merchantName: string,
    public readonly type: TransactionType,
    public readonly description: string = "",
    public readonly categoryId?: string,
  ) {}

  /**
   * Validate command data
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      errors.push("Amount must be a positive finite number");
    }

    if (!this.currency || this.currency.length !== 3) {
      errors.push("Currency must be a 3-letter ISO code");
    }

    if (!this.date || isNaN(Date.parse(this.date))) {
      errors.push("Date must be a valid date string");
    }

    if (!this.merchantName || this.merchantName.trim().length === 0) {
      errors.push("Merchant name cannot be empty");
    }

    if (this.merchantName.length > 100) {
      errors.push("Merchant name cannot exceed 100 characters");
    }

    if (!Object.values(TransactionType).includes(this.type)) {
      errors.push("Invalid transaction type");
    }

    if (this.description && this.description.length > 200) {
      errors.push("Description cannot exceed 200 characters");
    }

    const futureDate = new Date();
    futureDate.setHours(23, 59, 59, 999); // End of today
    if (new Date(this.date) > futureDate) {
      errors.push("Transaction date cannot be in the future");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
