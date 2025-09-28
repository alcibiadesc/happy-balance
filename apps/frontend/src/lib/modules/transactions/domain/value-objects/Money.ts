export class Money {
  private constructor(private readonly amount: number) {}

  static create(amount: number): Money {
    if (!isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  getValue(): number {
    return this.amount;
  }

  getAbsolute(): Money {
    return new Money(Math.abs(this.amount));
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.amount / divisor);
  }

  negate(): Money {
    return new Money(-this.amount);
  }

  equals(other: Money): boolean {
    return Math.abs(this.amount - other.amount) < 0.01;
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  format(currency: string): string {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(this.amount);
  }

  toString(): string {
    return this.amount.toFixed(2);
  }
}