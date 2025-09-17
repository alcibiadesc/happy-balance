import { Result } from '../shared/Result';
import { CategoryId } from './Category';

export enum PatternType {
  MERCHANT = 'merchant',
  DESCRIPTION = 'description',
  COMBINED = 'combined'
}

export class CategoryPatternId {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<CategoryPatternId> {
    if (!value || value.trim().length === 0) {
      return Result.failWithMessage('CategoryPattern ID cannot be empty');
    }
    return Result.ok(new CategoryPatternId(value.trim()));
  }

  static generate(): CategoryPatternId {
    const id = `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return CategoryPatternId.create(id).getValue();
  }

  get value(): string {
    return this._value;
  }

  equals(other: CategoryPatternId): boolean {
    return this._value === other._value;
  }
}

export class CategoryPattern {
  private _matchCount: number = 0;

  private constructor(
    private readonly _id: CategoryPatternId,
    private readonly _categoryId: CategoryId,
    private _pattern: string,
    private _patternType: PatternType,
    private _isActive: boolean = true,
    private _applyToFuture: boolean = true,
    private _priority: number = 0,
    private readonly _createdAt: Date = new Date()
  ) {}

  static create(
    categoryId: CategoryId,
    pattern: string,
    patternType: PatternType,
    applyToFuture: boolean = true,
    priority: number = 0,
    id?: CategoryPatternId
  ): Result<CategoryPattern> {
    if (!pattern || pattern.trim().length === 0) {
      return Result.failWithMessage('Pattern cannot be empty');
    }

    if (pattern.length > 200) {
      return Result.failWithMessage('Pattern cannot exceed 200 characters');
    }

    const normalizedPattern = pattern.trim().toLowerCase();
    const patternId = id || CategoryPatternId.generate();

    return Result.ok(new CategoryPattern(
      patternId,
      categoryId,
      normalizedPattern,
      patternType,
      true,
      applyToFuture,
      priority
    ));
  }

  // Getters
  get id(): CategoryPatternId {
    return this._id;
  }

  get categoryId(): CategoryId {
    return this._categoryId;
  }

  get pattern(): string {
    return this._pattern;
  }

  get patternType(): PatternType {
    return this._patternType;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get applyToFuture(): boolean {
    return this._applyToFuture;
  }

  get priority(): number {
    return this._priority;
  }

  get matchCount(): number {
    return this._matchCount;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  // Business methods
  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  incrementMatchCount(): void {
    this._matchCount++;
  }

  updatePriority(newPriority: number): Result<void> {
    if (newPriority < 0) {
      return Result.failWithMessage('Priority cannot be negative');
    }
    this._priority = newPriority;
    return Result.ok(undefined);
  }

  matches(merchant: string, description?: string): boolean {
    const normalizedMerchant = merchant.toLowerCase();
    const normalizedDescription = (description || '').toLowerCase();

    switch (this._patternType) {
      case PatternType.MERCHANT:
        return normalizedMerchant.includes(this._pattern);

      case PatternType.DESCRIPTION:
        return normalizedDescription.includes(this._pattern);

      case PatternType.COMBINED:
        return normalizedMerchant.includes(this._pattern) ||
               normalizedDescription.includes(this._pattern);

      default:
        return false;
    }
  }

  toSnapshot(): CategoryPatternSnapshot {
    return {
      id: this._id.value,
      categoryId: this._categoryId.value,
      pattern: this._pattern,
      patternType: this._patternType,
      isActive: this._isActive,
      applyToFuture: this._applyToFuture,
      priority: this._priority,
      matchCount: this._matchCount,
      createdAt: this._createdAt.toISOString()
    };
  }

  static fromSnapshot(snapshot: CategoryPatternSnapshot): Result<CategoryPattern> {
    const idResult = CategoryPatternId.create(snapshot.id);
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    const categoryIdResult = CategoryId.create(snapshot.categoryId);
    if (categoryIdResult.isFailure()) {
      return Result.fail(categoryIdResult.getError());
    }

    const pattern = new CategoryPattern(
      idResult.getValue(),
      categoryIdResult.getValue(),
      snapshot.pattern,
      snapshot.patternType as PatternType,
      snapshot.isActive,
      snapshot.applyToFuture,
      snapshot.priority,
      new Date(snapshot.createdAt)
    );

    pattern._matchCount = snapshot.matchCount;

    return Result.ok(pattern);
  }
}

export interface CategoryPatternSnapshot {
  id: string;
  categoryId: string;
  pattern: string;
  patternType: PatternType;
  isActive: boolean;
  applyToFuture: boolean;
  priority: number;
  matchCount: number;
  createdAt: string;
}