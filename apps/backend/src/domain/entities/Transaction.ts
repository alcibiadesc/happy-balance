import { Result } from '../shared/Result';
import { TransactionId } from '../value-objects/TransactionId';
import { Money } from '../value-objects/Money';
import { TransactionDate } from '../value-objects/TransactionDate';
import { Merchant } from '../value-objects/Merchant';
import { Category, CategoryId } from './Category';
import { TransactionType } from './TransactionType';
import { CategoryType } from './CategoryType';
import { HashGenerationService } from '../services/HashGenerationService';

/**
 * Transaction entity - Rich domain model
 * Encapsulates transaction business rules and behavior
 */
export class Transaction {
  private _categoryId?: CategoryId;
  private _description: string;
  private _observations?: string;
  private _isSelected: boolean = true;
  private _hash?: string;
  private _splitPercentage?: number; // % you pay (0-100, undefined = 100%)
  private _linkedTransactionId?: TransactionId; // ID of linked reimbursement
  private _isReimbursement: boolean = false; // This is a reimbursement (not real income)

  private constructor(
    private readonly _id: TransactionId,
    private readonly _amount: Money,
    private readonly _date: TransactionDate,
    private readonly _merchant: Merchant,
    private readonly _type: TransactionType,
    description: string,
    private readonly _createdAt: Date = new Date(),
    hash?: string,
    observations?: string,
    splitPercentage?: number,
    linkedTransactionId?: TransactionId,
    isReimbursement?: boolean
  ) {
    this._description = description;
    this._observations = observations;
    this._splitPercentage = splitPercentage;
    this._linkedTransactionId = linkedTransactionId;
    this._isReimbursement = isReimbursement ?? false;
    // Only generate hash if not provided (for new transactions)
    this._hash = hash || this.generateHash();
  }

  static create(
    amount: Money,
    date: TransactionDate,
    merchant: Merchant,
    type: TransactionType,
    description: string,
    id?: TransactionId
  ): Result<Transaction> {
    // Business rule: Income transactions should have non-negative amounts
    if (type === TransactionType.INCOME && amount.amount < 0) {
      return Result.failWithMessage('Income transactions cannot have negative amounts');
    }

    // Business rule: Expense transactions should have non-negative amounts
    if (type === TransactionType.EXPENSE && amount.amount < 0) {
      return Result.failWithMessage('Expense transactions cannot have negative amounts');
    }

    // Business rule: Investment transactions should have non-negative amounts
    if (type === TransactionType.INVESTMENT && amount.amount < 0) {
      return Result.failWithMessage('Investment transactions cannot have negative amounts');
    }

    // Validate description
    if (description && description.length > 200) {
      return Result.failWithMessage('Description cannot exceed 200 characters');
    }

    const transactionId = id || TransactionId.generate();

    return Result.ok(
      new Transaction(
        transactionId,
        amount,
        date,
        merchant,
        type,
        description || '',
        new Date(),
        undefined // Let constructor generate hash for new transactions
      )
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

  get observations(): string | undefined {
    return this._observations;
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

  get splitPercentage(): number | undefined {
    return this._splitPercentage;
  }

  get linkedTransactionId(): TransactionId | undefined {
    return this._linkedTransactionId;
  }

  get isReimbursement(): boolean {
    return this._isReimbursement;
  }

  // Business methods

  /**
   * Get effective amount for calculations considering split percentage
   * For expenses with split: amount * (splitPercentage / 100)
   * For reimbursements: 0 (they don't count as real income)
   * Returns absolute value Money (positive amounts)
   */
  getEffectiveSplitAmount(): Money {
    // Reimbursements don't count as real income
    if (this._isReimbursement) {
      return Money.create(0, this._amount.currency).getValue();
    }

    // If no split, use full amount
    if (this._splitPercentage === undefined) {
      return this._amount;
    }

    // Apply split percentage
    const splitMultiplier = this._splitPercentage / 100;
    return this._amount.multiply(splitMultiplier).getValue();
  }

  /**
   * Set split percentage (0-100)
   */
  setSplitPercentage(percentage: number | null | undefined): Result<void> {
    if (percentage === null || percentage === undefined) {
      this._splitPercentage = undefined;
      return Result.ok(undefined);
    }

    if (percentage < 0 || percentage > 100) {
      return Result.failWithMessage('Split percentage must be between 0 and 100');
    }

    this._splitPercentage = percentage;
    return Result.ok(undefined);
  }

  /**
   * Link this transaction to a reimbursement
   */
  linkToTransaction(transactionId: TransactionId): void {
    this._linkedTransactionId = transactionId;
  }

  /**
   * Unlink from reimbursement
   */
  unlinkTransaction(): void {
    this._linkedTransactionId = undefined;
  }

  /**
   * Mark as reimbursement
   */
  markAsReimbursement(): void {
    this._isReimbursement = true;
  }

  /**
   * Unmark as reimbursement
   */
  unmarkAsReimbursement(): void {
    this._isReimbursement = false;
  }

  // Business methods
  categorize(category: Category): Result<void> {
    // Business rule: Category type must be compatible with transaction type
    if (!this.isCategoryTypeCompatible(category.type, this._type)) {
      return Result.failWithMessage(
        `Category type ${category.type} is not compatible with transaction type ${this._type}`
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

  setCategoryId(categoryId: string | undefined | null): void {
    if (categoryId && categoryId !== '') {
      this._categoryId = { value: categoryId } as CategoryId;
    } else {
      // Clear the category when null, undefined, or empty string
      this._categoryId = undefined;
    }
  }

  updateDescription(newDescription: string): Result<void> {
    if (newDescription && newDescription.length > 200) {
      return Result.failWithMessage('Description cannot exceed 200 characters');
    }

    this._description = newDescription || '';
    return Result.ok(undefined);
  }

  updateObservations(newObservations: string): Result<void> {
    if (newObservations && newObservations.length > 500) {
      return Result.failWithMessage('Observations cannot exceed 500 characters');
    }

    this._observations = newObservations || undefined;
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
    const timeDiffMs = Math.abs(this._date.value.getTime() - other._date.value.getTime());
    const toleranceMs = toleranceHours * 60 * 60 * 1000;

    return timeDiffMs <= toleranceMs;
  }

  /**
   * Get the hash for this transaction
   */
  getHash(): string {
    return this._hash || this.generateHash();
  }

  /**
   * Generate a hash for duplicate detection using centralized service
   */
  private generateHash(): string {
    const hashService = new HashGenerationService();
    return hashService.generateTransactionHash({
      date: this._date.toDateString(),
      merchant: this._merchant.name, // Use raw name, service will normalize
      amount: this._amount.amount,
      currency: this._amount.currency,
    });
  }

  /**
   * Get effective amount for calculations
   * Expenses are negative, income and investments are positive
   */
  getEffectiveAmount(): Money {
    if (this._type === TransactionType.EXPENSE) {
      // Create negative money directly instead of using multiply(-1)
      // since multiply() doesn't accept negative multipliers
      return Money.create(-this._amount.amount, this._amount.currency).getValue();
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
      this._amount.format().toLowerCase().includes(term)
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

  /**
   * Check if a category type is compatible with a transaction type
   */
  private isCategoryTypeCompatible(
    categoryType: CategoryType,
    transactionType: TransactionType
  ): boolean {
    // NO_COMPUTE categories can be applied to any transaction type
    // as they represent internal transfers that don't affect financial metrics
    if (categoryType === CategoryType.NO_COMPUTE) {
      return true;
    }

    switch (transactionType) {
      case TransactionType.INCOME:
        return categoryType === CategoryType.INCOME;
      case TransactionType.EXPENSE:
        // INVESTMENT is allowed because buying investments is technically an expense
        return (
          categoryType === CategoryType.ESSENTIAL ||
          categoryType === CategoryType.DISCRETIONARY ||
          categoryType === CategoryType.DEBT_PAYMENT ||
          categoryType === CategoryType.INVESTMENT
        );
      case TransactionType.INVESTMENT:
        return categoryType === CategoryType.INVESTMENT;
      default:
        return false;
    }
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
      observations: this._observations,
      categoryId: this._categoryId?.value,
      isSelected: this._isSelected,
      hash: this._hash,
      createdAt: this._createdAt.toISOString(),
      splitPercentage: this._splitPercentage,
      linkedTransactionId: this._linkedTransactionId?.value,
      isReimbursement: this._isReimbursement,
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

    // Reconstruct linked transaction ID if present
    let linkedTransactionId: TransactionId | undefined;
    if (snapshot.linkedTransactionId) {
      const linkedIdResult = TransactionId.create(snapshot.linkedTransactionId);
      if (linkedIdResult.isSuccess()) {
        linkedTransactionId = linkedIdResult.getValue();
      }
    }

    // Create transaction with preserved hash
    const transaction = new Transaction(
      idResult.getValue(),
      amountResult.getValue(),
      dateResult.getValue(),
      merchantResult.getValue(),
      snapshot.type,
      snapshot.description,
      new Date(snapshot.createdAt),
      snapshot.hash, // Preserve the hash from snapshot
      snapshot.observations,
      snapshot.splitPercentage,
      linkedTransactionId,
      snapshot.isReimbursement
    );

    // Set optional fields
    if (snapshot.categoryId) {
      const categoryIdResult = CategoryId.create(snapshot.categoryId);
      if (categoryIdResult.isSuccess()) {
        transaction._categoryId = categoryIdResult.getValue();
      }
    }

    transaction._isSelected = snapshot.isSelected ?? true;
    // Hash is already set in constructor, no need to set it again

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
  observations?: string;
  categoryId?: string;
  isSelected?: boolean;
  hash?: string;
  createdAt: string;
  splitPercentage?: number;
  linkedTransactionId?: string;
  isReimbursement?: boolean;
}
