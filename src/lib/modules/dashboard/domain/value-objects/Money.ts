// Value Object: Money
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    Object.freeze(this);
  }

  static create(amount: number, currency: string): Money {
    if (amount < 0 && !['expense', 'debtPayment'].includes(currency)) {
      throw new Error('Amount cannot be negative for this currency type');
    }
    return new Money(amount, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  getValue(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  percentage(percent: number): Money {
    return new Money((this.amount * percent) / 100, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  format(formatter: (amount: number, currency: string) => string): string {
    return formatter(this.amount, this.currency);
  }
}