import { SavingsAccountId } from '../value-objects/SavingsAccountId.js';
import { Money } from '../value-objects/Money.js';

export enum SavingsAccountType {
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  INVESTMENT_ACCOUNT = 'INVESTMENT_ACCOUNT',
  RETIREMENT_ACCOUNT = 'RETIREMENT_ACCOUNT',
  HIGH_YIELD_SAVINGS = 'HIGH_YIELD_SAVINGS',
  OTHER = 'OTHER'
}

export interface SavingsAccountData {
  id: SavingsAccountId;
  name: string;
  type: SavingsAccountType;
  balance: Money;
  goalAmount?: Money;
  currency: string;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SavingsAccount {
  private data: SavingsAccountData;

  constructor(data: SavingsAccountData) {
    this.data = { ...data };
  }

  get id(): SavingsAccountId {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get type(): SavingsAccountType {
    return this.data.type;
  }

  get balance(): Money {
    return this.data.balance;
  }

  get goalAmount(): Money | undefined {
    return this.data.goalAmount;
  }

  get currency(): string {
    return this.data.currency;
  }

  get isActive(): boolean {
    return this.data.isActive;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  // Business methods
  updateBalance(newBalance: Money): SavingsAccount {
    if (newBalance.currency !== this.data.currency) {
      throw new Error('Currency mismatch when updating balance');
    }

    return new SavingsAccount({
      ...this.data,
      balance: newBalance,
      updatedAt: new Date()
    });
  }

  setGoal(goalAmount: Money): SavingsAccount {
    if (goalAmount.currency !== this.data.currency) {
      throw new Error('Currency mismatch when setting goal');
    }

    return new SavingsAccount({
      ...this.data,
      goalAmount,
      updatedAt: new Date()
    });
  }

  deactivate(): SavingsAccount {
    return new SavingsAccount({
      ...this.data,
      isActive: false,
      updatedAt: new Date()
    });
  }

  activate(): SavingsAccount {
    return new SavingsAccount({
      ...this.data,
      isActive: true,
      updatedAt: new Date()
    });
  }

  // Calculate progress toward goal (0-1 ratio)
  getGoalProgress(): number {
    if (!this.data.goalAmount || this.data.goalAmount.amount <= 0) {
      return 0;
    }

    const progress = this.data.balance.amount / this.data.goalAmount.amount;
    return Math.max(0, Math.min(1, progress));
  }

  // Get remaining amount to reach goal
  getRemainingToGoal(): Money | null {
    if (!this.data.goalAmount) {
      return null;
    }

    const remaining = this.data.goalAmount.amount - this.data.balance.amount;
    return new Money(Math.max(0, remaining), this.data.currency);
  }

  // Check if goal has been reached
  isGoalReached(): boolean {
    if (!this.data.goalAmount) {
      return false;
    }

    return this.data.balance.amount >= this.data.goalAmount.amount;
  }

  // Get type display name
  getTypeDisplayName(): string {
    const typeNames = {
      [SavingsAccountType.EMERGENCY_FUND]: 'Fondo de Emergencia',
      [SavingsAccountType.INVESTMENT_ACCOUNT]: 'Cuenta de Inversión',
      [SavingsAccountType.RETIREMENT_ACCOUNT]: 'Cuenta de Jubilación',
      [SavingsAccountType.HIGH_YIELD_SAVINGS]: 'Ahorro de Alto Rendimiento',
      [SavingsAccountType.OTHER]: 'Otros Ahorros'
    };

    return typeNames[this.data.type] || this.data.type;
  }

  // Calculate financial freedom contribution
  // Returns the amount this savings account contributes to financial freedom
  getFinancialFreedomContribution(annualExpenses: number): number {
    // Using the 4% rule: savings * 0.04 = annual withdrawal capacity
    return this.data.balance.amount * 0.04;
  }

  // Get monthly equivalent contribution to financial freedom
  getMonthlyFinancialFreedomContribution(annualExpenses: number): number {
    return this.getFinancialFreedomContribution(annualExpenses) / 12;
  }

  // Convert to plain object for serialization
  toPlainObject(): any {
    return {
      id: this.data.id.value,
      name: this.data.name,
      type: this.data.type,
      balance: this.data.balance.amount,
      goalAmount: this.data.goalAmount?.amount,
      currency: this.data.currency,
      isActive: this.data.isActive,
      description: this.data.description,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
      goalProgress: this.getGoalProgress(),
      remainingToGoal: this.getRemainingToGoal()?.amount,
      isGoalReached: this.isGoalReached(),
      typeDisplayName: this.getTypeDisplayName()
    };
  }
}