import type { TransactionTypeValue } from '../value-objects/TransactionType';
import { TransactionType } from '../value-objects/TransactionType';
import { Money } from '../value-objects/Money';
import { TransactionDate } from '../value-objects/TransactionDate';

export interface TransactionData {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string | null;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  categoryType?: string;
  accountId?: string;
  hidden?: boolean;
  observations?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export class TransactionEntity {
  private constructor(
    private readonly id: string,
    private readonly description: string,
    private readonly amount: Money,
    private readonly date: TransactionDate,
    private readonly categoryId: string | null,
    private readonly categoryInfo: {
      name?: string;
      icon?: string;
      color?: string;
      type?: string;
    },
    private readonly accountId: string | undefined,
    private readonly hidden: boolean,
    private readonly observations: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  static create(data: TransactionData): TransactionEntity {
    return new TransactionEntity(
      data.id,
      data.description,
      Money.create(data.amount),
      TransactionDate.create(data.date),
      data.categoryId ?? null,
      {
        name: data.categoryName,
        icon: data.categoryIcon,
        color: data.categoryColor,
        type: data.categoryType
      },
      data.accountId,
      data.hidden ?? false,
      data.observations ?? null,
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date()
    );
  }

  static createNew(
    description: string,
    amount: number,
    date: string,
    categoryId?: string,
    accountId?: string,
    observations?: string
  ): TransactionEntity {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new TransactionEntity(
      id,
      description,
      Money.create(amount),
      TransactionDate.create(date),
      categoryId ?? null,
      {},
      accountId,
      false,
      observations ?? null,
      new Date(),
      new Date()
    );
  }

  getId(): string {
    return this.id;
  }

  getDescription(): string {
    return this.description;
  }

  getAmount(): Money {
    return this.amount;
  }

  getAmountValue(): number {
    return this.amount.getValue();
  }

  getDate(): TransactionDate {
    return this.date;
  }

  getDateString(): string {
    return this.date.toString();
  }

  getCategoryId(): string | null {
    return this.categoryId;
  }

  getCategoryName(): string | undefined {
    return this.categoryInfo.name;
  }

  getCategoryIcon(): string | undefined {
    return this.categoryInfo.icon;
  }

  getCategoryColor(): string | undefined {
    return this.categoryInfo.color;
  }

  getCategoryType(): string | undefined {
    return this.categoryInfo.type;
  }

  getAccountId(): string | undefined {
    return this.accountId;
  }

  isHidden(): boolean {
    return this.hidden;
  }

  getObservations(): string | null {
    return this.observations;
  }

  isIncome(): boolean {
    return this.amount.isPositive();
  }

  isExpense(): boolean {
    return this.amount.isNegative();
  }

  hasCategory(): boolean {
    return this.categoryId !== null;
  }

  isEssential(): boolean {
    return this.categoryInfo.type === 'essential';
  }

  isDiscretionary(): boolean {
    return this.categoryInfo.type === 'discretionary';
  }

  isInvestment(): boolean {
    return this.categoryInfo.type === 'investment';
  }

  isNoCompute(): boolean {
    return this.categoryInfo.type === 'no_compute';
  }

  shouldCompute(): boolean {
    return !this.isNoCompute();
  }

  // Immutable update methods
  updateDescription(description: string): TransactionEntity {
    return new TransactionEntity(
      this.id,
      description,
      this.amount,
      this.date,
      this.categoryId,
      this.categoryInfo,
      this.accountId,
      this.hidden,
      this.observations,
      this.createdAt,
      new Date()
    );
  }

  updateAmount(amount: number): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.description,
      Money.create(amount),
      this.date,
      this.categoryId,
      this.categoryInfo,
      this.accountId,
      this.hidden,
      this.observations,
      this.createdAt,
      new Date()
    );
  }

  updateDate(date: string): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.description,
      this.amount,
      TransactionDate.create(date),
      this.categoryId,
      this.categoryInfo,
      this.accountId,
      this.hidden,
      this.observations,
      this.createdAt,
      new Date()
    );
  }

  updateCategory(categoryId: string | null, categoryInfo?: Partial<TransactionEntity['categoryInfo']>): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.description,
      this.amount,
      this.date,
      categoryId,
      { ...this.categoryInfo, ...categoryInfo },
      this.accountId,
      this.hidden,
      this.observations,
      this.createdAt,
      new Date()
    );
  }

  updateObservations(observations: string | null): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.description,
      this.amount,
      this.date,
      this.categoryId,
      this.categoryInfo,
      this.accountId,
      this.hidden,
      observations,
      this.createdAt,
      new Date()
    );
  }

  toggleHidden(): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.description,
      this.amount,
      this.date,
      this.categoryId,
      this.categoryInfo,
      this.accountId,
      !this.hidden,
      this.observations,
      this.createdAt,
      new Date()
    );
  }

  update(updates: Partial<TransactionData>): TransactionEntity {
    return new TransactionEntity(
      this.id,
      updates.description ?? this.description,
      updates.amount !== undefined ? Money.create(updates.amount) : this.amount,
      updates.date ? TransactionDate.create(updates.date) : this.date,
      updates.categoryId !== undefined ? updates.categoryId : this.categoryId,
      {
        name: updates.categoryName ?? this.categoryInfo.name,
        icon: updates.categoryIcon ?? this.categoryInfo.icon,
        color: updates.categoryColor ?? this.categoryInfo.color,
        type: updates.categoryType ?? this.categoryInfo.type
      },
      updates.accountId ?? this.accountId,
      updates.hidden ?? this.hidden,
      updates.observations !== undefined ? updates.observations : this.observations,
      this.createdAt,
      new Date()
    );
  }

  toJSON(): TransactionData {
    return {
      id: this.id,
      description: this.description,
      amount: this.amount.getValue(),
      date: this.date.toString(),
      categoryId: this.categoryId,
      categoryName: this.categoryInfo.name,
      categoryIcon: this.categoryInfo.icon,
      categoryColor: this.categoryInfo.color,
      categoryType: this.categoryInfo.type,
      accountId: this.accountId,
      hidden: this.hidden,
      observations: this.observations,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  equals(other: TransactionEntity): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `Transaction(${this.description}, ${this.amount.format('EUR')} on ${this.date.toString()})`;
  }
}