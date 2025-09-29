import { Result } from "../shared/Result";

/**
 * Currency value object that ensures valid ISO currency codes
 */
export class Currency {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Currency> {
    if (!value || typeof value !== 'string') {
      return Result.failWithMessage("Currency code is required");
    }

    const cleanValue = value.trim().toUpperCase();

    if (cleanValue.length !== 3) {
      return Result.failWithMessage("Currency must be a 3-letter ISO code");
    }

    const supportedCurrencies = ["EUR", "USD", "JPY", "GBP"];
    if (!supportedCurrencies.includes(cleanValue)) {
      return Result.failWithMessage(`Unsupported currency: ${cleanValue}`);
    }

    return Result.ok(new Currency(cleanValue));
  }

  static fromString(value: string): Result<Currency> {
    return Currency.create(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Currency): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  // Helper methods for common currencies
  static EUR(): Result<Currency> {
    return Currency.create("EUR");
  }

  static USD(): Result<Currency> {
    return Currency.create("USD");
  }

  static JPY(): Result<Currency> {
    return Currency.create("JPY");
  }

  static GBP(): Result<Currency> {
    return Currency.create("GBP");
  }
}