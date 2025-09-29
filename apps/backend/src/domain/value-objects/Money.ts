import { Result } from "../shared/Result";

/**
 * Money value object that encapsulates currency and amount
 * Prevents primitive obsession and handles currency operations safely
 */
export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {}

  static create(amount: number, currency: string): Result<Money> {
    if (!Number.isFinite(amount)) {
      return Result.failWithMessage("Amount must be a finite number");
    }

    if (amount < 0) {
      return Result.failWithMessage("Amount cannot be negative");
    }

    if (!currency || currency.length !== 3) {
      return Result.failWithMessage("Currency must be a 3-letter ISO code");
    }

    const supportedCurrencies = ["EUR", "USD", "JPY", "GBP"];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      return Result.failWithMessage(`Unsupported currency: ${currency}`);
    }

    return Result.ok(new Money(amount, currency.toUpperCase()));
  }

  static zero(currency: string): Result<Money> {
    return Money.create(0, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Result<Money> {
    if (this._currency !== other._currency) {
      return Result.failWithMessage("Cannot add different currencies");
    }

    return Money.create(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Result<Money> {
    if (this._currency !== other._currency) {
      return Result.failWithMessage("Cannot subtract different currencies");
    }

    const newAmount = this._amount - other._amount;
    if (newAmount < 0) {
      return Result.failWithMessage(
        "Subtraction would result in negative amount",
      );
    }

    return Money.create(newAmount, this._currency);
  }

  multiply(factor: number): Result<Money> {
    if (!Number.isFinite(factor) || factor < 0) {
      return Result.failWithMessage(
        "Multiplier must be a positive finite number",
      );
    }

    return Money.create(this._amount * factor, this._currency);
  }

  divide(divisor: number): Result<Money> {
    if (!Number.isFinite(divisor) || divisor <= 0) {
      return Result.failWithMessage(
        "Divisor must be a positive finite number",
      );
    }

    return Money.create(this._amount / divisor, this._currency);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  format(locale = "en-US"): string {
    const currencyLocales: Record<string, string> = {
      EUR: "de-DE",
      USD: "en-US",
      JPY: "ja-JP",
      GBP: "en-GB",
    };

    const targetLocale = currencyLocales[this._currency] || locale;

    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: this._currency,
      minimumFractionDigits: this._currency === "JPY" ? 0 : 2,
      maximumFractionDigits: this._currency === "JPY" ? 0 : 2,
    }).format(this._amount);
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Cannot compare different currencies: ${this._currency} vs ${other._currency}`,
      );
    }
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }
}
