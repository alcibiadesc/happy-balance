import { Result } from "../shared/Result";
import { TransactionType, TransactionTypeHelper } from "./TransactionType";

/**
 * Category ID value object
 */
export class CategoryId {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<CategoryId> {
    if (!value || value.trim().length === 0) {
      return Result.failWithMessage("Category ID cannot be empty");
    }

    return Result.ok(new CategoryId(value.trim()));
  }

  static generate(): CategoryId {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return CategoryId.create(id).getValue();
  }

  get value(): string {
    return this._value;
  }

  equals(other: CategoryId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Category entity
 * Represents a transaction category with business rules
 */
export class Category {
  private constructor(
    private readonly _id: CategoryId,
    private _name: string,
    private _color: string,
    private _icon: string,
    private readonly _type: TransactionType,
    private _isActive: boolean = true,
    private readonly _createdAt: Date = new Date(),
  ) {}

  static create(
    name: string,
    color: string,
    icon: string,
    type: TransactionType,
    id?: CategoryId,
  ): Result<Category> {
    // Validate name
    if (!name || name.trim().length === 0) {
      return Result.failWithMessage("Category name cannot be empty");
    }

    if (name.length > 50) {
      return Result.failWithMessage(
        "Category name cannot exceed 50 characters",
      );
    }

    // Validate color (hex format)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      return Result.failWithMessage("Color must be a valid hex color code");
    }

    // Validate icon (basic validation)
    if (!icon || icon.trim().length === 0) {
      return Result.failWithMessage("Category icon cannot be empty");
    }

    const categoryId = id || CategoryId.generate();

    return Result.ok(
      new Category(
        categoryId,
        name.trim(),
        color.toLowerCase(),
        icon.trim(),
        type,
      ),
    );
  }

  // Getters
  get id(): CategoryId {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get color(): string {
    return this._color;
  }

  get icon(): string {
    return this._icon;
  }

  get type(): TransactionType {
    return this._type;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  // Business methods
  changeName(newName: string): Result<void> {
    if (!newName || newName.trim().length === 0) {
      return Result.failWithMessage("Category name cannot be empty");
    }

    if (newName.length > 50) {
      return Result.failWithMessage(
        "Category name cannot exceed 50 characters",
      );
    }

    this._name = newName.trim();
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
      return Result.failWithMessage("Category icon cannot be empty");
    }

    this._icon = newIcon.trim();
    return Result.ok(undefined);
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  /**
   * Check if this category matches a merchant name for auto-categorization
   */
  matchesMerchant(merchantName: string): boolean {
    const normalizedMerchant = merchantName.toLowerCase();
    const normalizedCategory = this._name.toLowerCase();

    // Exact match
    if (normalizedMerchant.includes(normalizedCategory)) {
      return true;
    }

    // Check for common patterns
    const keywords = this.getMatchingKeywords();
    return keywords.some((keyword) =>
      normalizedMerchant.includes(keyword.toLowerCase()),
    );
  }

  private getMatchingKeywords(): string[] {
    // Return category-specific keywords for matching
    const keywordMap: Record<string, string[]> = {
      food: ["restaurant", "cafe", "pizza", "burger", "kitchen", "bistro"],
      transport: ["taxi", "uber", "gas", "fuel", "parking", "bus"],
      shopping: ["store", "shop", "market", "amazon", "mall"],
      utilities: ["electric", "water", "internet", "phone"],
      health: ["pharmacy", "hospital", "clinic", "medical"],
      entertainment: ["cinema", "movie", "theater", "gym", "fitness"],
    };

    return keywordMap[this._name.toLowerCase()] || [];
  }

  equals(other: Category): boolean {
    return this._id.equals(other._id);
  }

  toSnapshot(): CategorySnapshot {
    return {
      id: this._id.value,
      name: this._name,
      color: this._color,
      icon: this._icon,
      type: this._type,
      isActive: this._isActive,
      createdAt: this._createdAt.toISOString(),
    };
  }

  static fromSnapshot(snapshot: CategorySnapshot): Result<Category> {
    const idResult = CategoryId.create(snapshot.id);
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    const typeResult = TransactionTypeHelper.fromString(snapshot.type);
    if (!typeResult) {
      return Result.failWithMessage(
        `Invalid transaction type: ${snapshot.type}`,
      );
    }

    const category = new Category(
      idResult.getValue(),
      snapshot.name,
      snapshot.color,
      snapshot.icon,
      typeResult,
      snapshot.isActive,
      new Date(snapshot.createdAt),
    );

    return Result.ok(category);
  }
}

export interface CategorySnapshot {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
  isActive: boolean;
  createdAt: string;
}
