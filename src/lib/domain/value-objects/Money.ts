export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'EUR'
  ) {
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a valid 3-character code');
    }
  }

  add(other: Money): Money {
    this.validateSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.validateSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.amount / divisor, this.currency);
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isZero(): boolean {
    return Math.abs(this.amount) < 0.01; // Consider floating point precision
  }

  abs(): Money {
    return new Money(Math.abs(this.amount), this.currency);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && 
           Math.abs(this.amount - other.amount) < 0.01;
  }

  toString(): string {
    return `${this.formatAmount()} ${this.currency}`;
  }

  formatAmount(): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.amount);
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }

  private validateSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot operate on different currencies: ${this.currency} and ${other.currency}`);
    }
  }

  // Static factory methods
  static zero(currency: string = 'EUR'): Money {
    return new Money(0, currency);
  }

  static fromCents(cents: number, currency: string = 'EUR'): Money {
    return new Money(cents / 100, currency);
  }

  static parse(value: string, currency: string = 'EUR'): Money {
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const amount = parseFloat(cleanValue);
    
    if (isNaN(amount)) {
      throw new Error(`Cannot parse amount: ${value}`);
    }
    
    return new Money(amount, currency);
  }
}