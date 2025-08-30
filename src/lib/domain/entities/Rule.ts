import { RuleId } from '../value-objects/RuleId.js';
import type { Transaction } from './Transaction.js';

export enum RuleOperator {
  EQUALS = 'EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  REGEX = 'REGEX',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  BETWEEN = 'BETWEEN'
}

export enum RuleField {
  PARTNER_NAME = 'partnerName',
  PAYMENT_REFERENCE = 'paymentReference',
  AMOUNT = 'amount',
  TYPE = 'type',
  PARTNER_IBAN = 'partnerIban'
}

export class RuleCondition {
  constructor(
    public readonly field: RuleField,
    public readonly operator: RuleOperator,
    public readonly value: string,
    public readonly caseSensitive: boolean = false
  ) {}

  evaluate(transaction: Transaction): boolean {
    const fieldValue = this.getFieldValue(transaction);
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    const compareValue = this.caseSensitive ? this.value : this.value.toLowerCase();
    const targetValue = this.caseSensitive ? fieldValue.toString() : fieldValue.toString().toLowerCase();

    switch (this.operator) {
      case RuleOperator.EQUALS:
        return targetValue === compareValue;
      
      case RuleOperator.CONTAINS:
        return targetValue.includes(compareValue);
      
      case RuleOperator.STARTS_WITH:
        return targetValue.startsWith(compareValue);
      
      case RuleOperator.ENDS_WITH:
        return targetValue.endsWith(compareValue);
      
      case RuleOperator.REGEX:
        try {
          const regex = new RegExp(this.value, this.caseSensitive ? 'g' : 'gi');
          return regex.test(targetValue);
        } catch {
          return false;
        }
      
      case RuleOperator.GREATER_THAN:
        return this.compareNumbers(fieldValue, this.value, (a, b) => a > b);
      
      case RuleOperator.LESS_THAN:
        return this.compareNumbers(fieldValue, this.value, (a, b) => a < b);
      
      case RuleOperator.BETWEEN:
        const [min, max] = this.value.split(',').map(v => parseFloat(v.trim()));
        return this.compareNumbers(fieldValue, min, (a, b) => a >= b) &&
               this.compareNumbers(fieldValue, max, (a, b) => a <= b);
      
      default:
        return false;
    }
  }

  private getFieldValue(transaction: Transaction): any {
    switch (this.field) {
      case RuleField.PARTNER_NAME:
        return transaction.partnerName;
      case RuleField.PAYMENT_REFERENCE:
        return transaction.paymentReference;
      case RuleField.AMOUNT:
        return transaction.amount.amount;
      case RuleField.TYPE:
        return transaction.type;
      case RuleField.PARTNER_IBAN:
        return transaction.partnerIban;
      default:
        return null;
    }
  }

  private compareNumbers(fieldValue: any, compareValue: any, compareFn: (a: number, b: number) => boolean): boolean {
    const numFieldValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue);
    const numCompareValue = typeof compareValue === 'number' ? compareValue : parseFloat(compareValue);
    
    if (isNaN(numFieldValue) || isNaN(numCompareValue)) {
      return false;
    }
    
    return compareFn(numFieldValue, numCompareValue);
  }
}

export class Rule {
  constructor(
    public readonly id: RuleId,
    public readonly condition: RuleCondition,
    public readonly confidence: number = 0.8,
    public readonly isActive: boolean = true,
    public readonly priority: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
  }

  evaluate(transaction: Transaction): boolean {
    return this.isActive && this.condition.evaluate(transaction);
  }

  // Factory methods for common rules
  static createPartnerNameContains(partnerName: string, confidence: number = 0.8): Rule {
    return new Rule(
      RuleId.generate(),
      new RuleCondition(RuleField.PARTNER_NAME, RuleOperator.CONTAINS, partnerName),
      confidence
    );
  }

  static createAmountRange(min: number, max: number, confidence: number = 0.6): Rule {
    return new Rule(
      RuleId.generate(),
      new RuleCondition(RuleField.AMOUNT, RuleOperator.BETWEEN, `${min},${max}`),
      confidence
    );
  }

  static createTypeEquals(type: string, confidence: number = 0.7): Rule {
    return new Rule(
      RuleId.generate(),
      new RuleCondition(RuleField.TYPE, RuleOperator.EQUALS, type),
      confidence
    );
  }
}