import { Money } from '../value-objects/Money';

// Entity: Category
export class Category {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly amount: Money,
    private readonly percentage: number,
    private readonly color?: string,
    private readonly icon?: string,
    private readonly monthlyBudget?: number | null,
    private readonly quarterlyBudget?: number | null,
    private readonly budgetUsage?: number | null,
    private readonly annualBudget?: number | null
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

  static createWithPercentage(
    id: string,
    name: string,
    amount: Money,
    percentage: number,
    color?: string,
    icon?: string,
    monthlyBudget?: number | null,
    quarterlyBudget?: number | null,
    budgetUsage?: number | null,
    annualBudget?: number | null
  ): Category {
    return new Category(
      id,
      name,
      amount,
      percentage,
      color,
      icon,
      monthlyBudget,
      quarterlyBudget,
      budgetUsage,
      annualBudget
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

  getMonthlyBudget(): number | null | undefined {
    return this.monthlyBudget;
  }

  getQuarterlyBudget(): number | null | undefined {
    return this.quarterlyBudget;
  }

  getBudgetUsage(): number | null | undefined {
    return this.budgetUsage;
  }

  getAnnualBudget(): number | null | undefined {
    return this.annualBudget;
  }

  withColor(color: string): Category {
    return new Category(
      this.id,
      this.name,
      this.amount,
      this.percentage,
      color,
      this.icon,
      this.monthlyBudget,
      this.quarterlyBudget,
      this.budgetUsage,
      this.annualBudget
    );
  }

  withIcon(icon: string): Category {
    return new Category(
      this.id,
      this.name,
      this.amount,
      this.percentage,
      this.color,
      icon,
      this.monthlyBudget,
      this.quarterlyBudget,
      this.budgetUsage,
      this.annualBudget
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      amount: this.amount.getValue(),
      percentage: this.percentage,
      color: this.color,
      icon: this.icon,
      monthlyBudget: this.monthlyBudget,
      quarterlyBudget: this.quarterlyBudget,
      budgetUsage: this.budgetUsage,
      annualBudget: this.annualBudget
    };
  }
}