/**
 * Transaction Type enumeration
 * Represents the different types of financial transactions
 */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT'
}

export class TransactionTypeHelper {
  static fromString(value: string): TransactionType | null {
    const normalized = value.toUpperCase();
    return Object.values(TransactionType).find(type => type === normalized) || null;
  }

  static toString(type: TransactionType): string {
    return type.toString();
  }

  static getDisplayName(type: TransactionType, locale = 'en'): string {
    const names: Record<string, Record<TransactionType, string>> = {
      en: {
        [TransactionType.INCOME]: 'Income',
        [TransactionType.EXPENSE]: 'Expense',
        [TransactionType.INVESTMENT]: 'Investment'
      },
      es: {
        [TransactionType.INCOME]: 'Ingreso',
        [TransactionType.EXPENSE]: 'Gasto',
        [TransactionType.INVESTMENT]: 'Inversión'
      }
    };

    return names[locale]?.[type] || names.en[type];
  }

  static isValidType(value: string): boolean {
    return this.fromString(value) !== null;
  }
}