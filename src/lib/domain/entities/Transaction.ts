import type { Category } from './Category.js';
import type { Account } from './Account.js';
import { Money } from '../value-objects/Money.js';
import { TransactionId } from '../value-objects/TransactionId.js';
import { AccountId } from '../value-objects/AccountId.js';
import { TransactionDate } from '../value-objects/TransactionDate.js';
import { Result, success, failure } from '$lib/shared/utils/result.js';
import { DomainError } from '$lib/shared/errors/DomainError.js';

export class Transaction {
  public readonly hash: string;
  private _accountId: string;
  
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
    hash: string = '',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    if (!account) {
      throw new Error('Transaction constructor: account cannot be undefined');
    }
    if (!account.id) {
      throw new Error('Transaction constructor: account.id cannot be undefined');
    }
    this._accountId = account.id.value;
    this.hash = hash || this.generateHash();
  }

  get category(): Category | null {
    return this._category;
  }

  get accountId(): string {
    return this._accountId;
  }

  get categoryId(): string | null {
    return this._category?.id.value || null;
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

  private generateHash(): string {
    const hashString = `${this.bookingDate.getTime()}-${this.partnerName}-${this.amount.amount}-${this.type}`;
    // Browser-compatible hash generation using Web Crypto API
    return this.simpleHash(hashString);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
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

  static create(params: {
    amount: Money;
    description: string;
    accountId: AccountId;
    transactionDate: TransactionDate;
    paymentReference?: string;
    counterparty?: string;
  }, account: Account): Result<Transaction, DomainError> {
    try {
      if (!params.amount) {
        return failure(new DomainError('Amount is required'));
      }
      if (!params.description || params.description.trim().length === 0) {
        return failure(new DomainError('Description is required'));
      }
      if (!params.transactionDate) {
        return failure(new DomainError('Transaction date is required'));
      }

      const transaction = new Transaction(
        TransactionId.generate(),
        params.transactionDate.value, // booking date
        params.transactionDate.value, // value date (same as booking for now)
        params.counterparty || params.description, // partner name
        null, // partner IBAN
        params.amount.value < 0 ? 'Debit Transfer' : 'Credit Transfer', // type
        params.paymentReference || null,
        params.amount,
        null, // original amount
        null, // original currency
        null, // exchange rate
        account
      );

      return success(transaction);
    } catch (error) {
      return failure(new DomainError(error instanceof Error ? error.message : 'Failed to create transaction'));
    }
  }
}