import { v4 as uuidv4 } from 'uuid';

export class CategoryId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CategoryId cannot be empty');
    }
  }

  equals(other: CategoryId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  static generate(): CategoryId {
    return new CategoryId(uuidv4());
  }

  static fromString(value: string): CategoryId {
    return new CategoryId(value);
  }
}