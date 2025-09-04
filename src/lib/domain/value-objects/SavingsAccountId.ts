import { v4 as uuidv4 } from 'uuid';

export class SavingsAccountId {
  private _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new Error('SavingsAccountId must be a non-empty string');
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('SavingsAccountId must be a valid UUID');
    }
    
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  static generate(): SavingsAccountId {
    return new SavingsAccountId(uuidv4());
  }

  static fromString(value: string): SavingsAccountId {
    return new SavingsAccountId(value);
  }

  equals(other: SavingsAccountId): boolean {
    if (!(other instanceof SavingsAccountId)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}