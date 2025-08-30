import type { Category } from './Category.js';
import type { Account } from './Account.js';
import { Money } from '../value-objects/Money.js';
import { TransactionId } from '../value-objects/TransactionId.js';
import { createHash } from 'crypto';

export class Transaction {
  constructor(
    public readonly id: TransactionId,
    public readonly bookingDate: Date,
    public readonly valueDate: Date,
    public readonly partnerName: string,
    public readonly partnerIban: string | null,
    public readonly type: string,
    public readonly paymentReference: string | null,
    public readonly amount: Money,
    public readonly originalAmount: Money | null,
    public readonly originalCurrency: string | null,
    public readonly exchangeRate: number | null,
    public readonly account: Account,
    private _category: Category | null = null,
    public readonly isRecurring: boolean = false,
    public readonly confidence: number | null = null,
    public readonly notes: string | null = null,
    public readonly hash: string = '',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    if (!this.hash) {
      this.generateHash();
    }
  }

  get category(): Category | null {
    return this._category;
  }

  categorize(category: Category, confidence: number = 1.0): void {
    this._category = category;
    // In a real implementation, we would update confidence and trigger domain events
  }

  clearCategory(): void {
    this._category = null;
  }

  isIncome(): boolean {
    return this.amount.isPositive();
  }

  isExpense(): boolean {
    return this.amount.isNegative();
  }

  matchesPattern(pattern: string): boolean {
    const searchText = `${this.partnerName} ${this.paymentReference || ''}`.toLowerCase();
    return searchText.includes(pattern.toLowerCase());
  }

  private generateHash(): void {
    const hashString = `${this.bookingDate.getTime()}-${this.partnerName}-${this.amount.amount}-${this.type}`;
    // @ts-ignore - We'll set this in a real implementation
    this.hash = createHash('sha256').update(hashString).digest('hex');
  }

  isSimilarTo(other: Transaction): boolean {
    return (
      this.partnerName === other.partnerName &&
      Math.abs(this.amount.amount - other.amount.amount) < 0.01 &&
      Math.abs(this.bookingDate.getTime() - other.bookingDate.getTime()) < 86400000 // 24 hours
    );
  }

  // Factory methods
  static fromN26CSV(csvRow: any, account: Account): Transaction {
    const amount = new Money(parseFloat(csvRow['Amount (EUR)']), 'EUR');
    const originalAmount = csvRow['Original Amount'] 
      ? new Money(parseFloat(csvRow['Original Amount']), csvRow['Original Currency'])
      : null;

    return new Transaction(
      TransactionId.generate(),
      new Date(csvRow['Booking Date']),
      new Date(csvRow['Value Date']),
      csvRow['Partner Name'],
      csvRow['Partner Iban'] || null,
      csvRow['Type'],
      csvRow['Payment Reference'] || null,
      amount,
      originalAmount,
      csvRow['Original Currency'] || null,
      csvRow['Exchange Rate'] ? parseFloat(csvRow['Exchange Rate']) : null,
      account
    );
  }
}