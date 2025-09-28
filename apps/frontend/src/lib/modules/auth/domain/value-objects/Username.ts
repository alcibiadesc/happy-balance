/**
 * Username Value Object
 * Ensures valid usernames with business rules
 */

export class Username {
  private constructor(private readonly _value: string) {}

  static create(value: string): Username {
    const trimmed = value.trim().toLowerCase();

    if (trimmed.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (trimmed.length > 50) {
      throw new Error('Username cannot exceed 50 characters');
    }

    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      throw new Error('Username can only contain letters, numbers, hyphens and underscores');
    }

    return new Username(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Username): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}