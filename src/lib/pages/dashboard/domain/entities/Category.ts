import { Money } from '../value-objects/Money';

// Entity: Category
export class Category {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly amount: Money,
    private readonly percentage: number,
    private readonly color?: string,
    private readonly icon?: string
  ) {}

  static create(
    id: string,
    name: string,
    amount: Money,
    totalExpenses: Money
  ): Category {
    const percentage = totalExpenses.getValue() > 0
      ? (amount.getValue() / totalExpenses.getValue()) * 100
      : 0;

    return new Category(
      id,
      name,
      amount,
      percentage
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getAmount(): Money {
    return this.amount;
  }

  getPercentage(): number {
    return this.percentage;
  }

  getColor(): string | undefined {
    return this.color;
  }

  getIcon(): string | undefined {
    return this.icon;
  }

  withColor(color: string): Category {
    return new Category(
      this.id,
      this.name,
      this.amount,
      this.percentage,
      color,
      this.icon
    );
  }

  withIcon(icon: string): Category {
    return new Category(
      this.id,
      this.name,
      this.amount,
      this.percentage,
      this.color,
      icon
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      amount: this.amount.getValue(),
      percentage: this.percentage,
      color: this.color,
      icon: this.icon
    };
  }
}