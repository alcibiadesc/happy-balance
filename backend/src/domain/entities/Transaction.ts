import { Result } from '../shared/Result';
import { TransactionId } from '../value-objects/TransactionId';
import { Money } from '../value-objects/Money';
import { TransactionDate } from '../value-objects/TransactionDate';
import { Merchant } from '../value-objects/Merchant';
import { Category, CategoryId } from './Category';
import { TransactionType } from './TransactionType';

/**
 * Transaction entity - Rich domain model
 * Encapsulates transaction business rules and behavior
 */
export class Transaction {
  private _categoryId?: CategoryId;
  private _description: string;
  private _isSelected: boolean = true;
  private _hash?: string;

  private constructor(
    private readonly _id: TransactionId,
    private readonly _amount: Money,
    private readonly _date: TransactionDate,
    private readonly _merchant: Merchant,
    private readonly _type: TransactionType,
    description: string,
    private readonly _createdAt: Date = new Date()
  ) {
    this._description = description;
    this._hash = this.getHash();
  }

  static create(
    amount: Money,
    date: TransactionDate,
    merchant: Merchant,
    type: TransactionType,
    description: string,
    id?: TransactionId
  ): Result<Transaction> {
    // Business rule: Income transactions should have positive amounts
    if (type === TransactionType.INCOME && amount.amount <= 0) {
      return Result.failWithMessage('Income transactions must have positive amounts');
    }

    // Business rule: Expense transactions should have positive amounts
    if (type === TransactionType.EXPENSE && amount.amount <= 0) {
      return Result.failWithMessage('Expense transactions must have positive amounts');
    }

    // Business rule: Investment transactions should have positive amounts
    if (type === TransactionType.INVESTMENT && amount.amount <= 0) {
      return Result.failWithMessage('Investment transactions must have positive amounts');
    }

    // Validate description
    if (description && description.length > 200) {
      return Result.failWithMessage('Description cannot exceed 200 characters');
    }

    const transactionId = id || TransactionId.generate();

    return Result.ok(new Transaction(
      transactionId,
      amount,
      date,
      merchant,
      type,
      description || ''
    ));
  }

  // Getters
  get id(): TransactionId {
    return this._id;
  }

  get amount(): Money {
    return this._amount;
  }

  get date(): TransactionDate {
    return this._date;
  }

  get merchant(): Merchant {
    return this._merchant;
  }

  get type(): TransactionType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get categoryId(): CategoryId | undefined {
    return this._categoryId;
  }

  get isSelected(): boolean {
    return this._isSelected;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  get hash(): string | undefined {
    return this._hash;
  }

  // Business methods
  categorize(category: Category): Result<void> {
    // Business rule: Category type must match transaction type
    if (category.type !== this._type) {
      return Result.failWithMessage(
        `Category type ${category.type} does not match transaction type ${this._type}`
      );
    }

    // Business rule: Cannot categorize inactive categories
    if (!category.isActive) {
      return Result.failWithMessage('Cannot categorize with inactive category');
    }

    this._categoryId = category.id;
    return Result.ok(undefined);
  }

  removeCategory(): void {
    this._categoryId = undefined;
  }

  updateDescription(newDescription: string): Result<void> {
    if (newDescription && newDescription.length > 200) {
      return Result.failWithMessage('Description cannot exceed 200 characters');
    }

    this._description = newDescription || '';
    return Result.ok(undefined);
  }

  select(): void {
    this._isSelected = true;
  }

  deselect(): void {
    this._isSelected = false;
  }

  /**
   * Check if this transaction is a duplicate of another
   * Based on hash first, then fallback to date, merchant, and amount comparison
   */
  isDuplicateOf(other: Transaction, toleranceHours = 24): boolean {
    // Primary check: If both transactions have hashes, use exact hash comparison
    if (this._hash && other._hash) {
      return this._hash === other._hash;
    }

    // Fallback to detailed comparison when hashes are not available
    // Same amount and currency
    if (!this._amount.equals(other._amount)) {
      return false;
    }

    // Similar merchant
    if (!this._merchant.isSimilarTo(other._merchant, 0.9)) {
      return false;
    }

    // Within tolerance time window
    const timeDiffMs = Math.abs(
      this._date.value.getTime() - other._date.value.getTime()
    );
    const toleranceMs = toleranceHours * 60 * 60 * 1000;

    return timeDiffMs <= toleranceMs;
  }

  /**
   * Generate a hash for duplicate detection
   */
  getHash(): string {
    const data = `${this._date.toDateString()}_${this._merchant.normalizedName}_${this._amount.amount}_${this._amount.currency}`;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Get effective amount for calculations
   * Expenses are negative, income and investments are positive
   */
  getEffectiveAmount(): Money {
    if (this._type === TransactionType.EXPENSE) {
      return this._amount.multiply(-1).getValue();
    }
    return this._amount;
  }

  /**
   * Check if transaction matches search criteria
   */
  matches(searchTerm: string): boolean {
    const term = searchTerm.toLowerCase();

    return this._merchant.name.toLowerCase().includes(term) ||
           this._description.toLowerCase().includes(term) ||
           this._amount.format().toLowerCase().includes(term);
  }

  /**
   * Check if transaction is in date range
   */
  isInDateRange(startDate: TransactionDate, endDate: TransactionDate): boolean {
    return !this._date.isBefore(startDate) && !this._date.isAfter(endDate);
  }

  equals(other: Transaction): boolean {
    return this._id.equals(other._id);
  }

  toSnapshot(): TransactionSnapshot {
    return {
      id: this._id.value,
      amount: this._amount.amount,
      currency: this._amount.currency,
      date: this._date.toDateString(),
      merchant: this._merchant.name,
      type: this._type,
      description: this._description,
      categoryId: this._categoryId?.value,
      isSelected: this._isSelected,
      hash: this._hash,
      createdAt: this._createdAt.toISOString()
    };
  }

  static fromSnapshot(snapshot: TransactionSnapshot): Result<Transaction> {
    // Reconstruct value objects
    const idResult = TransactionId.create(snapshot.id);
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    const amountResult = Money.create(snapshot.amount, snapshot.currency);
    if (amountResult.isFailure()) {
      return Result.fail(amountResult.getError());
    }

    const dateResult = TransactionDate.fromString(snapshot.date);
    if (dateResult.isFailure()) {
      return Result.fail(dateResult.getError());
    }

    const merchantResult = Merchant.create(snapshot.merchant);
    if (merchantResult.isFailure()) {
      return Result.fail(merchantResult.getError());
    }

    // Create transaction
    const transaction = new Transaction(
      idResult.getValue(),
      amountResult.getValue(),
      dateResult.getValue(),
      merchantResult.getValue(),
      snapshot.type,
      snapshot.description,
      new Date(snapshot.createdAt)
    );

    // Set optional fields
    if (snapshot.categoryId) {
      const categoryIdResult = CategoryId.create(snapshot.categoryId);
      if (categoryIdResult.isSuccess()) {
        transaction._categoryId = categoryIdResult.getValue();
      }
    }

    transaction._isSelected = snapshot.isSelected ?? true;
    transaction._hash = snapshot.hash;

    return Result.ok(transaction);
  }
}

export interface TransactionSnapshot {
  id: string;
  amount: number;
  currency: string;
  date: string;
  merchant: string;
  type: TransactionType;
  description: string;
  categoryId?: string;
  isSelected?: boolean;
  hash?: string;
  createdAt: string;
}