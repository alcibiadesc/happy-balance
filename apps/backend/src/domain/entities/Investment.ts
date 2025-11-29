import { Result } from "../shared/Result";
import { InvestmentHistoryType } from "./InvestmentHistoryType";

/**
 * Investment ID value object
 */
export class InvestmentId {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<InvestmentId> {
    if (!value || value.trim().length === 0) {
      return Result.failWithMessage("Investment ID cannot be empty");
    }
    return Result.ok(new InvestmentId(value.trim()));
  }

  static generate(): InvestmentId {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return InvestmentId.create(id).getValue();
  }

  get value(): string {
    return this._value;
  }

  equals(other: InvestmentId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Investment History Entry ID value object
 */
export class InvestmentHistoryId {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<InvestmentHistoryId> {
    if (!value || value.trim().length === 0) {
      return Result.failWithMessage("Investment History ID cannot be empty");
    }
    return Result.ok(new InvestmentHistoryId(value.trim()));
  }

  static generate(): InvestmentHistoryId {
    const id = `invh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return InvestmentHistoryId.create(id).getValue();
  }

  get value(): string {
    return this._value;
  }

  equals(other: InvestmentHistoryId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Investment History Entry - tracks contributions and value changes
 */
export class InvestmentHistory {
  private constructor(
    private readonly _id: InvestmentHistoryId,
    private readonly _investmentId: InvestmentId,
    private _amount: number,
    private _type: InvestmentHistoryType,
    private _date: Date,
    private _notes: string | null,
    private _transactionId: string | null,
    private readonly _createdAt: Date,
  ) {}

  static create(
    investmentId: InvestmentId,
    amount: number,
    type: InvestmentHistoryType,
    date: Date,
    notes?: string,
    transactionId?: string,
    id?: InvestmentHistoryId,
  ): Result<InvestmentHistory> {
    if (amount <= 0 && type !== InvestmentHistoryType.VALUE_UPDATE) {
      return Result.failWithMessage("Amount must be positive for contributions and withdrawals");
    }

    const historyId = id || InvestmentHistoryId.generate();

    return Result.ok(
      new InvestmentHistory(
        historyId,
        investmentId,
        amount,
        type,
        date,
        notes || null,
        transactionId || null,
        new Date(),
      ),
    );
  }

  // Getters
  get id(): InvestmentHistoryId {
    return this._id;
  }

  get investmentId(): InvestmentId {
    return this._investmentId;
  }

  get amount(): number {
    return this._amount;
  }

  get type(): InvestmentHistoryType {
    return this._type;
  }

  get date(): Date {
    return new Date(this._date.getTime());
  }

  get notes(): string | null {
    return this._notes;
  }

  get transactionId(): string | null {
    return this._transactionId;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  // Business methods
  updateAmount(newAmount: number): Result<void> {
    if (newAmount <= 0 && this._type !== InvestmentHistoryType.VALUE_UPDATE) {
      return Result.failWithMessage("Amount must be positive");
    }
    this._amount = newAmount;
    return Result.ok(undefined);
  }

  updateNotes(newNotes: string | null): void {
    this._notes = newNotes;
  }

  updateDate(newDate: Date): void {
    this._date = new Date(newDate.getTime());
  }

  updateType(newType: InvestmentHistoryType): void {
    this._type = newType;
  }

  linkToTransaction(transactionId: string): void {
    this._transactionId = transactionId;
  }

  unlinkFromTransaction(): void {
    this._transactionId = null;
  }

  toSnapshot(): InvestmentHistorySnapshot {
    return {
      id: this._id.value,
      investmentId: this._investmentId.value,
      amount: this._amount,
      type: this._type,
      date: this._date.toISOString(),
      notes: this._notes,
      transactionId: this._transactionId,
      createdAt: this._createdAt.toISOString(),
    };
  }

  static fromSnapshot(snapshot: InvestmentHistorySnapshot): Result<InvestmentHistory> {
    const idResult = InvestmentHistoryId.create(snapshot.id);
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    const investmentIdResult = InvestmentId.create(snapshot.investmentId);
    if (investmentIdResult.isFailure()) {
      return Result.fail(investmentIdResult.getError());
    }

    return Result.ok(
      new InvestmentHistory(
        idResult.getValue(),
        investmentIdResult.getValue(),
        snapshot.amount,
        snapshot.type as InvestmentHistoryType,
        new Date(snapshot.date),
        snapshot.notes,
        snapshot.transactionId,
        new Date(snapshot.createdAt),
      ),
    );
  }
}

/**
 * Investment entity - represents a portfolio holding
 */
export class Investment {
  private constructor(
    private readonly _id: InvestmentId,
    private _name: string,
    private _symbol: string | null,
    private _currentValue: number,
    private _currency: string,
    private _categoryId: string | null,
    private _highlight: boolean,
    private _color: string,
    private _icon: string,
    private _notes: string | null,
    private _isActive: boolean,
    private _sortOrder: number,
    private readonly _userId: string,
    private readonly _createdAt: Date,
    private _history: InvestmentHistory[],
  ) {}

  static create(
    name: string,
    currentValue: number,
    currency: string,
    userId: string,
    options?: {
      id?: InvestmentId;
      symbol?: string;
      categoryId?: string;
      highlight?: boolean;
      color?: string;
      icon?: string;
      notes?: string;
      sortOrder?: number;
    },
  ): Result<Investment> {
    // Validate name
    if (!name || name.trim().length === 0) {
      return Result.failWithMessage("Investment name cannot be empty");
    }

    if (name.length > 100) {
      return Result.failWithMessage("Investment name cannot exceed 100 characters");
    }

    // Validate current value
    if (currentValue < 0) {
      return Result.failWithMessage("Current value cannot be negative");
    }

    // Validate currency
    if (!currency || currency.length !== 3) {
      return Result.failWithMessage("Currency must be a valid 3-letter code");
    }

    // Validate color if provided
    const color = options?.color || "#10B981";
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      return Result.failWithMessage("Color must be a valid hex color code");
    }

    const investmentId = options?.id || InvestmentId.generate();

    return Result.ok(
      new Investment(
        investmentId,
        name.trim(),
        options?.symbol || null,
        currentValue,
        currency.toUpperCase(),
        options?.categoryId || null,
        options?.highlight || false,
        color.toLowerCase(),
        options?.icon || "📈",
        options?.notes || null,
        true,
        options?.sortOrder || 0,
        userId,
        new Date(),
        [],
      ),
    );
  }

  // Getters
  get id(): InvestmentId {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get symbol(): string | null {
    return this._symbol;
  }

  get currentValue(): number {
    return this._currentValue;
  }

  get currency(): string {
    return this._currency;
  }

  get categoryId(): string | null {
    return this._categoryId;
  }

  get highlight(): boolean {
    return this._highlight;
  }

  get color(): string {
    return this._color;
  }

  get icon(): string {
    return this._icon;
  }

  get notes(): string | null {
    return this._notes;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get userId(): string {
    return this._userId;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  get history(): InvestmentHistory[] {
    return [...this._history];
  }

  // Calculated properties
  get totalContributions(): number {
    return this._history
      .filter((h) => h.type === InvestmentHistoryType.CONTRIBUTION)
      .reduce((sum, h) => sum + h.amount, 0);
  }

  get totalWithdrawals(): number {
    return this._history
      .filter((h) => h.type === InvestmentHistoryType.WITHDRAWAL)
      .reduce((sum, h) => sum + h.amount, 0);
  }

  get netContributions(): number {
    return this.totalContributions - this.totalWithdrawals;
  }

  get profit(): number {
    return this._currentValue - this.netContributions;
  }

  get profitPercentage(): number {
    if (this.netContributions === 0) return 0;
    return (this.profit / this.netContributions) * 100;
  }

  // Business methods
  changeName(newName: string): Result<void> {
    if (!newName || newName.trim().length === 0) {
      return Result.failWithMessage("Investment name cannot be empty");
    }
    if (newName.length > 100) {
      return Result.failWithMessage("Investment name cannot exceed 100 characters");
    }
    this._name = newName.trim();
    return Result.ok(undefined);
  }

  changeSymbol(newSymbol: string | null): void {
    this._symbol = newSymbol;
  }

  updateCurrentValue(newValue: number): Result<void> {
    if (newValue < 0) {
      return Result.failWithMessage("Current value cannot be negative");
    }
    this._currentValue = newValue;
    return Result.ok(undefined);
  }

  changeColor(newColor: string): Result<void> {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(newColor)) {
      return Result.failWithMessage("Color must be a valid hex color code");
    }
    this._color = newColor.toLowerCase();
    return Result.ok(undefined);
  }

  changeIcon(newIcon: string): Result<void> {
    if (!newIcon || newIcon.trim().length === 0) {
      return Result.failWithMessage("Investment icon cannot be empty");
    }
    this._icon = newIcon.trim();
    return Result.ok(undefined);
  }

  linkToCategory(categoryId: string | null): void {
    this._categoryId = categoryId;
  }

  toggleHighlight(): void {
    this._highlight = !this._highlight;
  }

  setHighlight(highlight: boolean): void {
    this._highlight = highlight;
  }

  updateNotes(notes: string | null): void {
    this._notes = notes;
  }

  changeSortOrder(order: number): void {
    this._sortOrder = order;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  // History management
  addHistory(entry: InvestmentHistory): void {
    this._history.push(entry);
    // Update current value based on history type
    if (entry.type === InvestmentHistoryType.VALUE_UPDATE) {
      this._currentValue = entry.amount;
    }
  }

  setHistory(history: InvestmentHistory[]): void {
    this._history = history;
  }

  addContribution(amount: number, date: Date, notes?: string, transactionId?: string): Result<InvestmentHistory> {
    const entryResult = InvestmentHistory.create(
      this._id,
      amount,
      InvestmentHistoryType.CONTRIBUTION,
      date,
      notes,
      transactionId,
    );

    if (entryResult.isFailure()) {
      return entryResult;
    }

    const entry = entryResult.getValue();
    this._history.push(entry);
    return Result.ok(entry);
  }

  addWithdrawal(amount: number, date: Date, notes?: string, transactionId?: string): Result<InvestmentHistory> {
    const entryResult = InvestmentHistory.create(
      this._id,
      amount,
      InvestmentHistoryType.WITHDRAWAL,
      date,
      notes,
      transactionId,
    );

    if (entryResult.isFailure()) {
      return entryResult;
    }

    const entry = entryResult.getValue();
    this._history.push(entry);
    return Result.ok(entry);
  }

  updateValue(newValue: number, date: Date, notes?: string): Result<InvestmentHistory> {
    const updateResult = this.updateCurrentValue(newValue);
    if (updateResult.isFailure()) {
      return Result.fail(updateResult.getError());
    }

    const entryResult = InvestmentHistory.create(
      this._id,
      newValue,
      InvestmentHistoryType.VALUE_UPDATE,
      date,
      notes,
    );

    if (entryResult.isFailure()) {
      return entryResult;
    }

    const entry = entryResult.getValue();
    this._history.push(entry);
    return Result.ok(entry);
  }

  removeHistoryEntry(entryId: InvestmentHistoryId): boolean {
    const index = this._history.findIndex((h) => h.id.equals(entryId));
    if (index === -1) return false;
    this._history.splice(index, 1);
    return true;
  }

  equals(other: Investment): boolean {
    return this._id.equals(other._id);
  }

  toSnapshot(): InvestmentSnapshot {
    return {
      id: this._id.value,
      name: this._name,
      symbol: this._symbol,
      currentValue: this._currentValue,
      currency: this._currency,
      categoryId: this._categoryId,
      highlight: this._highlight,
      color: this._color,
      icon: this._icon,
      notes: this._notes,
      isActive: this._isActive,
      sortOrder: this._sortOrder,
      userId: this._userId,
      createdAt: this._createdAt.toISOString(),
      history: this._history.map((h) => h.toSnapshot()),
      // Calculated fields
      totalContributions: this.totalContributions,
      totalWithdrawals: this.totalWithdrawals,
      netContributions: this.netContributions,
      profit: this.profit,
      profitPercentage: this.profitPercentage,
    };
  }

  static fromSnapshot(snapshot: InvestmentSnapshot): Result<Investment> {
    const idResult = InvestmentId.create(snapshot.id);
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    const history: InvestmentHistory[] = [];
    if (snapshot.history) {
      for (const h of snapshot.history) {
        const historyResult = InvestmentHistory.fromSnapshot(h);
        if (historyResult.isFailure()) {
          return Result.fail(historyResult.getError());
        }
        history.push(historyResult.getValue());
      }
    }

    const investment = new Investment(
      idResult.getValue(),
      snapshot.name,
      snapshot.symbol,
      snapshot.currentValue,
      snapshot.currency,
      snapshot.categoryId,
      snapshot.highlight,
      snapshot.color,
      snapshot.icon,
      snapshot.notes,
      snapshot.isActive,
      snapshot.sortOrder,
      snapshot.userId,
      new Date(snapshot.createdAt),
      history,
    );

    return Result.ok(investment);
  }
}

export interface InvestmentHistorySnapshot {
  id: string;
  investmentId: string;
  amount: number;
  type: string;
  date: string;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
}

export interface InvestmentSnapshot {
  id: string;
  name: string;
  symbol: string | null;
  currentValue: number;
  currency: string;
  categoryId: string | null;
  highlight: boolean;
  color: string;
  icon: string;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
  userId: string;
  createdAt: string;
  history?: InvestmentHistorySnapshot[];
  // Calculated fields
  totalContributions: number;
  totalWithdrawals: number;
  netContributions: number;
  profit: number;
  profitPercentage: number;
}
