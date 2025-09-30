import { Result } from "../shared/Result";
import { TransactionId } from "../value-objects/TransactionId";
import { Money } from "../value-objects/Money";
import { TransactionDate } from "../value-objects/TransactionDate";
import { Merchant } from "../value-objects/Merchant";
import { Category, CategoryId } from "./Category";
import { TransactionType } from "./TransactionType";

/**
 * Transaction entity - Rich domain model
 * Encapsulates transaction business rules and behavior
 */
export class Transaction {
  private _categoryId?: CategoryId;
  private _description: string;
  private _isSelected: boolean = true;

  private constructor(
    private readonly _id: TransactionId,
    private readonly _amount: Money,
    private readonly _date: TransactionDate,
    private readonly _merchant: Merchant,
    private readonly _type: TransactionType,
    description: string,
    private readonly _createdAt: Date = new Date(),
  ) {
    this._description = description;
  }

  static create(
    amount: Money,
    date: TransactionDate,
    merchant: Merchant,
    type: TransactionType,
    description: string,
    id?: TransactionId,
  ): Result<Transaction> {
    // Business rule: Income transactions should have non-negative amounts
    if (type === TransactionType.INCOME && amount.getValue() < 0) {
      return Result.failWithMessage(
        "Income transactions cannot have negative amounts",
      );
    }

    // Business rule: Expense transactions should have non-negative amounts
    if (type === TransactionType.EXPENSE && amount.getValue() < 0) {
      return Result.failWithMessage(
        "Expense transactions cannot have negative amounts",
      );
    }

    // Business rule: Investment transactions should have non-negative amounts
    if (type === TransactionType.INVESTMENT && amount.getValue() < 0) {
      return Result.failWithMessage(
        "Investment transactions cannot have negative amounts",
      );
    }

    // Validate description
    if (description && description.length > 200) {
      return Result.failWithMessage("Description cannot exceed 200 characters");
    }

    const transactionId = id || TransactionId.generate();

    return Result.ok(
      new Transaction(
        transactionId,
        amount,
        date,
        merchant,
        type,
        description || "",
      ),
    );
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

  // Business methods
  categorize(category: Category): Result<void> {
    // Business rule: Category type must match transaction type
    if (category.type !== this._type) {
      return Result.failWithMessage(
        `Category type ${category.type} does not match transaction type ${this._type}`,
      );
    }

    // Business rule: Cannot categorize inactive categories
    if (!category.isActive) {
      return Result.failWithMessage("Cannot categorize with inactive category");
    }

    this._categoryId = category.id;
    return Result.ok(undefined);
  }

  removeCategory(): void {
    this._categoryId = undefined;
  }

  updateDescription(newDescription: string): Result<void> {
    if (newDescription && newDescription.length > 200) {
      return Result.failWithMessage("Description cannot exceed 200 characters");
    }

    this._description = newDescription || "";
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
   * Based on date, merchant, and amount
   */
  isDuplicateOf(other: Transaction, toleranceHours = 24): boolean {
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
      this._date.getDate().getTime() - other._date.getDate().getTime(),
    );
    const toleranceMs = toleranceHours * 60 * 60 * 1000;

    return timeDiffMs <= toleranceMs;
  }

  /**
   * Generate a hash for duplicate detection
   */
  getHash(): string {
    const data = `${this._date.toString()}_${this._merchant.normalizedName}_${this._amount.getValue()}`;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
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
      return this._amount.multiply(-1);
    }
    return this._amount;
  }

  /**
   * Check if transaction matches search criteria
   */
  matches(searchTerm: string): boolean {
    const term = searchTerm.toLowerCase();

    return (
      this._merchant.name.toLowerCase().includes(term) ||
      this._description.toLowerCase().includes(term) ||
      this._amount.getValue().toString().toLowerCase().includes(term)
    );
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
      amount: this._amount.getValue(),
      currency: "EUR", // Currency is managed separately in the app
      date: this._date.toString(),
      merchant: this._merchant.name,
      type: this._type,
      description: this._description,
      categoryId: this._categoryId?.value,
      isSelected: this._isSelected,
      createdAt: this._createdAt.toISOString(),
    };
  }

  static fromSnapshot(snapshot: TransactionSnapshot): Result<Transaction> {
    try {
      // Reconstruct value objects
      const idResult = TransactionId.create(snapshot.id);
      if (idResult.isFailure()) {
        return Result.fail(idResult.getError());
      }

      const amount = Money.create(snapshot.amount);
      const date = TransactionDate.create(snapshot.date);

      const merchantResult = Merchant.create(snapshot.merchant);
      if (merchantResult.isFailure()) {
        return Result.fail(merchantResult.getError());
      }

      // Create transaction
      const transaction = new Transaction(
        idResult.getValue(),
        amount,
        date,
        merchantResult.getValue(),
        snapshot.type,
        snapshot.description,
        new Date(snapshot.createdAt),
      );

      // Set optional fields
      if (snapshot.categoryId) {
        const categoryIdResult = CategoryId.create(snapshot.categoryId);
        if (categoryIdResult.isSuccess()) {
          transaction._categoryId = categoryIdResult.getValue();
        }
      }

      transaction._isSelected = snapshot.isSelected ?? true;

      return Result.ok(transaction);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to create transaction from snapshot: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
  createdAt: string;
  tags?: string[];
}
