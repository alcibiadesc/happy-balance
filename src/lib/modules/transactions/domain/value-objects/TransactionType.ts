export type TransactionTypeValue = 'income' | 'expense';

export class TransactionType {
  private constructor(private readonly type: TransactionTypeValue) {}

  static income(): TransactionType {
    return new TransactionType('income');
  }

  static expense(): TransactionType {
    return new TransactionType('expense');
  }

  static create(type: TransactionTypeValue): TransactionType {
    if (type !== 'income' && type !== 'expense') {
      throw new Error(`Invalid transaction type: ${type}`);
    }
    return new TransactionType(type);
  }

  static fromAmount(amount: number): TransactionType {
    return amount >= 0 ? TransactionType.income() : TransactionType.expense();
  }

  getValue(): TransactionTypeValue {
    return this.type;
  }

  isIncome(): boolean {
    return this.type === 'income';
  }

  isExpense(): boolean {
    return this.type === 'expense';
  }

  getLabel(): string {
    return this.type === 'income' ? 'Ingreso' : 'Gasto';
  }

  getIcon(): string {
    return this.type === 'income' ? '↑' : '↓';
  }

  getColor(): string {
    return this.type === 'income' ? '#7abaa5' : '#f5796c';
  }

  equals(other: TransactionType): boolean {
    return this.type === other.type;
  }

  toString(): string {
    return this.type;
  }
}