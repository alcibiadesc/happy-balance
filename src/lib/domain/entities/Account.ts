import { AccountId } from '../value-objects/AccountId.js';
import { Money } from '../value-objects/Money.js';

export enum AccountType {
  MAIN = 'MAIN',
  SAVINGS = 'SAVINGS', 
  INVESTMENT = 'INVESTMENT'
}

export class Account {
  constructor(
    public readonly id: AccountId,
    public readonly name: string,
    public readonly type: AccountType,
    private _balance: Money = new Money(0, 'EUR'),
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  get balance(): Money {
    return this._balance;
  }

  updateBalance(newBalance: Money): void {
    this._balance = newBalance;
  }

  addFunds(amount: Money): void {
    this._balance = this._balance.add(amount);
  }

  withdrawFunds(amount: Money): void {
    this._balance = this._balance.subtract(amount);
  }

  canWithdraw(amount: Money): boolean {
    return this._balance.subtract(amount).amount >= 0;
  }

  isMainAccount(): boolean {
    return this.type === AccountType.MAIN;
  }

  isSavingsAccount(): boolean {
    return this.type === AccountType.SAVINGS;
  }

  isInvestmentAccount(): boolean {
    return this.type === AccountType.INVESTMENT;
  }

  // Factory method for N26 main account
  static createN26Account(): Account {
    return new Account(
      AccountId.generate(),
      'N26 - Cuenta Principal',
      AccountType.MAIN,
      new Money(0, 'EUR')
    );
  }
}