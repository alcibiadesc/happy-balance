import { AccountId } from '../value-objects/AccountId.js';
import { Money } from '../value-objects/Money.js';
import { Result } from '$lib/shared/utils/result.js';
import { DomainError, ValidationError, InvariantViolationError } from '$lib/shared/errors/DomainError.js';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT',
  CREDIT = 'CREDIT'
}

export interface CreateAccountProps {
  id?: AccountId;
  name: string;
  type: AccountType;
  initialBalance?: Money;
  isActive?: boolean;
  currency?: string;
}

export class Account {
  private constructor(
    private readonly _id: AccountId,
    private _name: string,
    private readonly _type: AccountType,
    private _balance: Money,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    Object.freeze(this);
  }

  static create(props: CreateAccountProps): Result<Account, DomainError> {
    const { name, type, initialBalance, isActive = true, currency = 'EUR' } = props;

    // Validation
    if (!name || name.trim().length === 0) {
      return Result.failure(new ValidationError('Account name is required'));
    }

    if (name.trim().length > 100) {
      return Result.failure(new ValidationError('Account name cannot exceed 100 characters'));
    }

    if (!Object.values(AccountType).includes(type)) {
      return Result.failure(new ValidationError('Invalid account type'));
    }

    // Create or use provided ID
    const id = props.id || AccountId.generate();

    // Create initial balance
    const balanceResult = initialBalance || Money.zero(currency);
    if (balanceResult instanceof Result && balanceResult.isFailure()) {
      return Result.failure(balanceResult.error);
    }

    const balance = balanceResult instanceof Money ? balanceResult : balanceResult.value;
    const now = new Date();

    return Result.success(new Account(
      id,
      name.trim(),
      type,
      balance,
      isActive,
      now,
      now
    ));
  }

  static createN26Account(): Result<Account, DomainError> {
    return Account.create({
      name: 'N26 - Main Account',
      type: AccountType.CHECKING,
      currency: 'EUR'
    });
  }

  get id(): AccountId {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get type(): AccountType {
    return this._type;
  }

  get balance(): Money {
    return this._balance;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get currency(): string {
    return this._balance.currency.code;
  }

  updateName(newName: string): Result<void, ValidationError> {
    if (!newName || newName.trim().length === 0) {
      return Result.failure(new ValidationError('Account name is required'));
    }

    if (newName.trim().length > 100) {
      return Result.failure(new ValidationError('Account name cannot exceed 100 characters'));
    }

    this._name = newName.trim();
    this._updatedAt = new Date();
    return Result.success(undefined);
  }

  credit(amount: Money): Result<void, DomainError> {
    if (!amount.isPositive) {
      return Result.failure(new ValidationError('Credit amount must be positive'));
    }

    const newBalanceResult = this._balance.add(amount);
    if (newBalanceResult.isFailure()) {
      return Result.failure(newBalanceResult.error);
    }

    this._balance = newBalanceResult.value;
    this._updatedAt = new Date();
    return Result.success(undefined);
  }

  debit(amount: Money): Result<void, DomainError> {
    if (!amount.isPositive) {
      return Result.failure(new ValidationError('Debit amount must be positive'));
    }

    if (!this.canDebit(amount)) {
      return Result.failure(new InvariantViolationError('Insufficient funds'));
    }

    const newBalanceResult = this._balance.subtract(amount);
    if (newBalanceResult.isFailure()) {
      return Result.failure(newBalanceResult.error);
    }

    this._balance = newBalanceResult.value;
    this._updatedAt = new Date();
    return Result.success(undefined);
  }

  canDebit(amount: Money): boolean {
    if (this._type === AccountType.CREDIT) {
      return true; // Credit accounts allow overdrafts
    }

    try {
      const resultBalance = this._balance.subtract(amount);
      return resultBalance.isSuccess() && !resultBalance.value.isNegative;
    } catch {
      return false;
    }
  }

  setBalance(newBalance: Money): Result<void, DomainError> {
    if (newBalance.currency.code !== this._balance.currency.code) {
      return Result.failure(
        new ValidationError(`Currency mismatch: expected ${this._balance.currency.code}, got ${newBalance.currency.code}`)
      );
    }

    this._balance = newBalance;
    this._updatedAt = new Date();
    return Result.success(undefined);
  }

  activate(): Result<void, DomainError> {
    if (this._isActive) {
      return Result.failure(new InvariantViolationError('Account is already active'));
    }

    this._isActive = true;
    this._updatedAt = new Date();
    return Result.success(undefined);
  }

  deactivate(): Result<void, DomainError> {
    if (!this._isActive) {
      return Result.failure(new InvariantViolationError('Account is already inactive'));
    }

    this._isActive = false;
    this._updatedAt = new Date();
    return Result.success(undefined);
  }

  isType(type: AccountType): boolean {
    return this._type === type;
  }

  isChecking(): boolean {
    return this._type === AccountType.CHECKING;
  }

  isSavings(): boolean {
    return this._type === AccountType.SAVINGS;
  }

  isInvestment(): boolean {
    return this._type === AccountType.INVESTMENT;
  }

  isCredit(): boolean {
    return this._type === AccountType.CREDIT;
  }

  equals(other: Account): boolean {
    return this._id.equals(other._id);
  }

  toJSON(): {
    id: string;
    name: string;
    type: AccountType;
    balance: { amount: number; currency: string };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this._id.value,
      name: this._name,
      type: this._type,
      balance: this._balance.toJSON(),
      isActive: this._isActive,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}