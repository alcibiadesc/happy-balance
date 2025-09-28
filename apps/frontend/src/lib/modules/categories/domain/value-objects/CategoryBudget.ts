/**
 * Value Object for Category Budget
 * Represents the annual budget allocated to a category
 */
export class CategoryBudget {
  private constructor(private readonly amount: number) {}

  static create(amount: number): CategoryBudget {
    if (amount < 0) {
      throw new Error('Budget amount cannot be negative');
    }
    return new CategoryBudget(amount);
  }

  static zero(): CategoryBudget {
    return new CategoryBudget(0);
  }

  getValue(): number {
    return this.amount;
  }

  getMonthlyBudget(): number {
    return this.amount / 12;
  }

  getWeeklyBudget(): number {
    return this.amount / 52;
  }

  getDailyBudget(): number {
    return this.amount / 365;
  }

  hasBudget(): boolean {
    return this.amount > 0;
  }

  add(other: CategoryBudget): CategoryBudget {
    return new CategoryBudget(this.amount + other.amount);
  }

  subtract(other: CategoryBudget): CategoryBudget {
    const result = this.amount - other.amount;
    return new CategoryBudget(Math.max(0, result));
  }

  multiply(factor: number): CategoryBudget {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    return new CategoryBudget(this.amount * factor);
  }

  equals(other: CategoryBudget): boolean {
    return this.amount === other.amount;
  }

  isGreaterThan(other: CategoryBudget): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: CategoryBudget): boolean {
    return this.amount < other.amount;
  }

  format(currency: string): string {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return formatter.format(this.amount);
  }

  toString(): string {
    return this.amount.toString();
  }
}