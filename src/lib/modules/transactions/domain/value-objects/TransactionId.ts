import { Result } from "../shared/Result";

/**
 * Transaction ID value object
 * Ensures strong typing and validation for transaction identifiers
 */
export class TransactionId {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<TransactionId> {
    if (!value || value.trim().length === 0) {
      return Result.failWithMessage("Transaction ID cannot be empty");
    }

    if (value.length < 3 || value.length > 50) {
      return Result.failWithMessage(
        "Transaction ID must be between 3 and 50 characters",
      );
    }

    // Basic format validation - alphanumeric with hyphens
    const validFormat = /^[a-zA-Z0-9\-_]+$/.test(value);
    if (!validFormat) {
      return Result.failWithMessage(
        "Transaction ID contains invalid characters",
      );
    }

    return Result.ok(new TransactionId(value.trim()));
  }

  static generate(): TransactionId {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const id = `tx-${timestamp}-${random}`;

    // This should never fail given our controlled generation
    const result = TransactionId.create(id);
    if (result.isFailure()) {
      throw new Error("Failed to generate valid transaction ID");
    }

    return result.getValue();
  }

  get value(): string {
    return this._value;
  }

  equals(other: TransactionId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
