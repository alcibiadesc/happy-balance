import { CategoryType, type CategoryTypeValue } from '../value-objects/CategoryType';
import { CategoryBudget } from '../value-objects/CategoryBudget';

/**
 * Category Entity
 * Represents a transaction category with its properties and behavior
 */
export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryTypeValue;
  annualBudget?: number;
}

export class CategoryEntity {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly icon: string,
    private readonly color: string,
    private readonly type: CategoryType,
    private readonly budget: CategoryBudget
  ) {}

  static create(data: CategoryData): CategoryEntity {
    return new CategoryEntity(
      data.id,
      data.name,
      data.icon,
      data.color,
      CategoryType.create(data.type),
      CategoryBudget.create(data.annualBudget || 0)
    );
  }

  static createNew(
    name: string,
    icon: string,
    color: string,
    type: CategoryTypeValue,
    annualBudget: number = 0
  ): CategoryEntity {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new CategoryEntity(
      id,
      name,
      icon,
      color,
      CategoryType.create(type),
      CategoryBudget.create(annualBudget)
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getIcon(): string {
    return this.icon;
  }

  getColor(): string {
    return this.color;
  }

  getType(): CategoryType {
    return this.type;
  }

  getBudget(): CategoryBudget {
    return this.budget;
  }

  getTypeValue(): CategoryTypeValue {
    return this.type.getValue();
  }

  getAnnualBudget(): number {
    return this.budget.getValue();
  }

  getMonthlyBudget(): number {
    return this.budget.getMonthlyBudget();
  }

  isIncome(): boolean {
    return this.type.isIncome();
  }

  isExpense(): boolean {
    return this.type.isExpense();
  }

  hasBudget(): boolean {
    return this.budget.hasBudget();
  }

  // Immutable update methods
  updateName(name: string): CategoryEntity {
    return new CategoryEntity(
      this.id,
      name,
      this.icon,
      this.color,
      this.type,
      this.budget
    );
  }

  updateIcon(icon: string): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      icon,
      this.color,
      this.type,
      this.budget
    );
  }

  updateColor(color: string): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      this.icon,
      color,
      this.type,
      this.budget
    );
  }

  updateBudget(annualBudget: number): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      this.icon,
      this.color,
      this.type,
      CategoryBudget.create(annualBudget)
    );
  }

  updateType(type: CategoryTypeValue): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      this.icon,
      this.color,
      CategoryType.create(type),
      this.budget
    );
  }

  update(updates: Partial<Omit<CategoryData, 'id'>>): CategoryEntity {
    return new CategoryEntity(
      this.id,
      updates.name ?? this.name,
      updates.icon ?? this.icon,
      updates.color ?? this.color,
      updates.type ? CategoryType.create(updates.type) : this.type,
      updates.annualBudget !== undefined ? CategoryBudget.create(updates.annualBudget) : this.budget
    );
  }

  toJSON(): CategoryData {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      color: this.color,
      type: this.type.getValue(),
      annualBudget: this.budget.getValue()
    };
  }

  equals(other: CategoryEntity): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `Category(${this.name}, ${this.type.getValue()})`;
  }
}