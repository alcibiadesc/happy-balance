/**
 * Category Type enumeration
 * Represents the different types of categories for financial planning
 */
export enum CategoryType {
  INCOME = "income",
  ESSENTIAL = "essential",
  DISCRETIONARY = "discretionary",
  INVESTMENT = "investment",
  DEBT_PAYMENT = "debt_payment",
  NO_COMPUTE = "no_compute",
}

export class CategoryTypeHelper {
  static fromString(value: string): CategoryType | null {
    const normalized = value.toLowerCase();
    return (
      Object.values(CategoryType).find((type) => type === normalized) || null
    );
  }

  static toString(type: CategoryType): string {
    return type.toString();
  }

  static getDisplayName(type: CategoryType, locale = "en"): string {
    const names: Record<string, Record<CategoryType, string>> = {
      en: {
        [CategoryType.INCOME]: "Income",
        [CategoryType.ESSENTIAL]: "Essential",
        [CategoryType.DISCRETIONARY]: "Discretionary",
        [CategoryType.INVESTMENT]: "Investment",
        [CategoryType.DEBT_PAYMENT]: "Debt Payment",
        [CategoryType.NO_COMPUTE]: "No Compute",
      },
      es: {
        [CategoryType.INCOME]: "Ingreso",
        [CategoryType.ESSENTIAL]: "Esencial",
        [CategoryType.DISCRETIONARY]: "Discrecional",
        [CategoryType.INVESTMENT]: "Inversión",
        [CategoryType.DEBT_PAYMENT]: "Pago de Deudas",
        [CategoryType.NO_COMPUTE]: "No Computar",
      },
    };

    return names[locale]?.[type] || names.en[type];
  }

  static isValidType(value: string): boolean {
    return this.fromString(value) !== null;
  }

  static getAllTypes(): CategoryType[] {
    return Object.values(CategoryType);
  }
}
