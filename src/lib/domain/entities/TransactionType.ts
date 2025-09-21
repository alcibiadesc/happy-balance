import { getTranslationForLang } from "../../utils/i18n-utils";

/**
 * Transaction Type enumeration
 * Represents the different types of financial transactions
 */
export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  INVESTMENT = "INVESTMENT",
}

export class TransactionTypeHelper {
  static fromString(value: string): TransactionType | null {
    const normalized = value.toUpperCase();
    return (
      Object.values(TransactionType).find((type) => type === normalized) || null
    );
  }

  static toString(type: TransactionType): string {
    return type.toString();
  }

  static getDisplayName(type: TransactionType, locale = "en"): string {
    const keyMap: Record<TransactionType, string> = {
      [TransactionType.INCOME]: "transactions.type.income",
      [TransactionType.EXPENSE]: "transactions.type.expense",
      [TransactionType.INVESTMENT]: "transactions.type.investment",
    };

    return getTranslationForLang(keyMap[type], locale);
  }

  static isValidType(value: string): boolean {
    return this.fromString(value) !== null;
  }
}
