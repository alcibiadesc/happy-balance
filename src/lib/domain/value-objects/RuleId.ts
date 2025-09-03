import { v4 as uuidv4 } from '$lib/utils/uuid.js';

export class RuleId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('RuleId cannot be empty');
    }
  }

  equals(other: RuleId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  static generate(): RuleId {
    return new RuleId(uuidv4());
  }

  static fromString(value: string): RuleId {
    return new RuleId(value);
  }
}