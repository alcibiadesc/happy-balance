import { TransactionType } from "../../domain/entities/TransactionType";
import { getTranslation } from "../../utils/i18n-utils";

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

    if (!Number.isFinite(this.amount) || this.amount < 0) {
      errors.push(getTranslation("validation.amount_invalid"));
    }

    if (!this.currency || this.currency.length !== 3) {
      errors.push(getTranslation("validation.currency_invalid"));
    }

    if (!this.date || isNaN(Date.parse(this.date))) {
      errors.push(getTranslation("validation.date_invalid"));
    }

    if (!this.merchantName || this.merchantName.trim().length === 0) {
      errors.push(getTranslation("validation.merchant_empty"));
    }

    if (this.merchantName.length > 100) {
      errors.push(getTranslation("validation.merchant_too_long"));
    }

    if (!Object.values(TransactionType).includes(this.type)) {
      errors.push(getTranslation("validation.transaction_type_invalid"));
    }

    if (this.description && this.description.length > 200) {
      errors.push(getTranslation("validation.description_too_long"));
    }

    const futureDate = new Date();
    futureDate.setHours(23, 59, 59, 999); // End of today
    if (new Date(this.date) > futureDate) {
      errors.push(getTranslation("validation.future_date"));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
