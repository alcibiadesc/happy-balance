import { v4 as uuidv4 } from '$lib/utils/uuid.js';

export class AccountId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('AccountId cannot be empty');
    }
  }

  equals(other: AccountId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  static generate(): AccountId {
    return new AccountId(uuidv4());
  }

  static fromString(value: string): AccountId {
    return new AccountId(value);
  }
}