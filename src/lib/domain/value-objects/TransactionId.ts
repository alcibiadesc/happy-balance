import { v4 as uuidv4 } from '$lib/utils/uuid.js';

export class TransactionId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TransactionId cannot be empty');
    }
  }

  equals(other: TransactionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  static generate(): TransactionId {
    return new TransactionId(uuidv4());
  }

  static fromString(value: string): TransactionId {
    return new TransactionId(value);
  }
}