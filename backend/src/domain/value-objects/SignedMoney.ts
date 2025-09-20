import { Result } from "../shared/Result";
import { Money } from "./Money";

/**
 * SignedMoney value object that allows negative amounts for balance calculations
 * Extends Money to handle financial scenarios where balances can be negative
 */
export class SignedMoney {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {}

  static create(amount: number, currency: string): Result<SignedMoney> {
    if (!Number.isFinite(amount)) {
      return Result.failWithMessage("Amount must be a finite number");
    }

    if (!currency || currency.length !== 3) {
      return Result.failWithMessage("Currency must be a 3-letter ISO code");
    }

    const supportedCurrencies = ["EUR", "USD", "JPY", "GBP"];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      return Result.failWithMessage(`Unsupported currency: ${currency}`);
    }

    return Result.ok(new SignedMoney(amount, currency.toUpperCase()));
  }

  static fromMoney(money: Money): SignedMoney {
    return new SignedMoney(money.amount, money.currency);
  }

  static zero(currency: string): Result<SignedMoney> {
    return SignedMoney.create(0, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get isNegative(): boolean {
    return this._amount < 0;
  }

  get isPositive(): boolean {
    return this._amount > 0;
  }

  get isZero(): boolean {
    return this._amount === 0;
  }

  add(other: Money | SignedMoney): Result<SignedMoney> {
    const otherAmount = other instanceof SignedMoney ? other._amount : other.amount;
    const otherCurrency = other instanceof SignedMoney ? other._currency : other.currency;

    if (this._currency !== otherCurrency) {
      return Result.failWithMessage("Cannot add different currencies");
    }

    return SignedMoney.create(this._amount + otherAmount, this._currency);
  }

  subtract(other: Money | SignedMoney): Result<SignedMoney> {
    const otherAmount = other instanceof SignedMoney ? other._amount : other.amount;
    const otherCurrency = other instanceof SignedMoney ? other._currency : other.currency;

    if (this._currency !== otherCurrency) {
      return Result.failWithMessage("Cannot subtract different currencies");
    }

    return SignedMoney.create(this._amount - otherAmount, this._currency);
  }

  multiply(factor: number): Result<SignedMoney> {
    if (!Number.isFinite(factor)) {
      return Result.failWithMessage("Multiplier must be a finite number");
    }

    return SignedMoney.create(this._amount * factor, this._currency);
  }

  isGreaterThan(other: Money | SignedMoney): boolean {
    this.ensureSameCurrency(other);
    const otherAmount = other instanceof SignedMoney ? other._amount : other.amount;
    return this._amount > otherAmount;
  }

  isLessThan(other: Money | SignedMoney): boolean {
    this.ensureSameCurrency(other);
    const otherAmount = other instanceof SignedMoney ? other._amount : other.amount;
    return this._amount < otherAmount;
  }

  equals(other: Money | SignedMoney): boolean {
    const otherAmount = other instanceof SignedMoney ? other._amount : other.amount;
    const otherCurrency = other instanceof SignedMoney ? other._currency : other.currency;
    return this._amount === otherAmount && this._currency === otherCurrency;
  }

  toPositiveMoney(): Result<Money> {
    if (this._amount < 0) {
      return Result.failWithMessage("Cannot convert negative SignedMoney to Money");
    }
    return Money.create(this._amount, this._currency);
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

  private ensureSameCurrency(other: Money | SignedMoney): void {
    const otherCurrency = other instanceof SignedMoney ? other._currency : other.currency;
    if (this._currency !== otherCurrency) {
      throw new Error(
        `Cannot compare different currencies: ${this._currency} vs ${otherCurrency}`,
      );
    }
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }
}