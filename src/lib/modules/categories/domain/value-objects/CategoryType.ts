/**
 * Value Object for Category Type
 * Represents the type/classification of a category
 */
export type CategoryTypeValue = 'income' | 'essential' | 'discretionary' | 'investment' | 'debt_payment' | 'no_compute';

export class CategoryType {
  private constructor(private readonly value: CategoryTypeValue) {}

  static create(type: CategoryTypeValue): CategoryType {
    if (!this.isValid(type)) {
      throw new Error(`Invalid category type: ${type}`);
    }
    return new CategoryType(type);
  }

  static income(): CategoryType {
    return new CategoryType('income');
  }

  static essential(): CategoryType {
    return new CategoryType('essential');
  }

  static discretionary(): CategoryType {
    return new CategoryType('discretionary');
  }

  static investment(): CategoryType {
    return new CategoryType('investment');
  }

  static debtPayment(): CategoryType {
    return new CategoryType('debt_payment');
  }

  static noCompute(): CategoryType {
    return new CategoryType('no_compute');
  }

  getValue(): CategoryTypeValue {
    return this.value;
  }

  isIncome(): boolean {
    return this.value === 'income';
  }

  isExpense(): boolean {
    return this.value !== 'income';
  }

  isComputable(): boolean {
    return this.value !== 'no_compute';
  }

  getIconClass(): string {
    const iconClasses: Record<CategoryTypeValue, string> = {
      income: 'income',
      essential: 'essential',
      discretionary: 'discretionary',
      investment: 'investment',
      debt_payment: 'debt',
      no_compute: 'no-compute'
    };
    return iconClasses[this.value];
  }

  getTitleKey(): string {
    return `categories.types.${this.value}`;
  }

  getDescriptionKey(): string {
    return `categories.descriptions.${this.value}`;
  }

  // Legacy methods for backwards compatibility
  getTitle(): string {
    const titles: Record<CategoryTypeValue, string> = {
      income: 'Ingresos',
      essential: 'Esenciales',
      discretionary: 'Discrecionales',
      investment: 'Inversiones',
      debt_payment: 'Pagos de Deuda',
      no_compute: 'Sin Computar'
    };
    return titles[this.value];
  }

  getDescription(): string {
    const descriptions: Record<CategoryTypeValue, string> = {
      income: 'Categorías de ingresos y entradas de dinero',
      essential: 'Gastos necesarios para vivir',
      discretionary: 'Gastos opcionales y deseos',
      investment: 'Ahorros e inversiones',
      debt_payment: 'Pagos de deudas y obligaciones financieras',
      no_compute: 'Categorías que no afectan el balance'
    };
    return descriptions[this.value];
  }

  equals(other: CategoryType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static isValid(type: any): type is CategoryTypeValue {
    return ['income', 'essential', 'discretionary', 'investment', 'debt_payment', 'no_compute'].includes(type);
  }
}