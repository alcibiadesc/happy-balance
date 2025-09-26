/**
 * UserId Value Object
 * Ensures valid user IDs following DDD principles
 */

export class UserId {
  private constructor(private readonly _value: string) {}

  static create(value: string): UserId {
    if (!value || value.trim() === '') {
      throw new Error('UserId cannot be empty');
    }
    return new UserId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}