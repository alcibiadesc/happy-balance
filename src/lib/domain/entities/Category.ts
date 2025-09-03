import { CategoryId } from '../value-objects/CategoryId.js';
import type { Rule } from './Rule.js';
import type { Transaction } from './Transaction.js';

export enum CategoryType {
  INCOME = 'INCOME',
  ESSENTIAL_EXPENSE = 'ESSENTIAL_EXPENSE', 
  DISCRETIONARY_EXPENSE = 'DISCRETIONARY_EXPENSE',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT'
}

export class Category {
  constructor(
    public readonly id: CategoryId,
    public readonly name: string,
    public readonly type: CategoryType,
    public readonly color: string = '#3B82F6',
    public readonly icon: string = 'BarChart',
    public readonly parent: Category | null = null,
    private _rules: Rule[] = [],
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  get rules(): ReadonlyArray<Rule> {
    return this._rules;
  }

  addRule(rule: Rule): void {
    this._rules.push(rule);
    this._rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): void {
    this._rules = this._rules.filter(rule => rule.id.value !== ruleId);
  }

  matches(transaction: Transaction): { matches: boolean; confidence: number } {
    if (!this.isActive) {
      return { matches: false, confidence: 0 };
    }

    let maxConfidence = 0;
    let matches = false;

    for (const rule of this._rules) {
      if (rule.evaluate(transaction)) {
        matches = true;
        maxConfidence = Math.max(maxConfidence, rule.confidence);
      }
    }

    return { matches, confidence: maxConfidence };
  }

  isChildOf(category: Category): boolean {
    let current = this.parent;
    while (current) {
      if (current.id.equals(category.id)) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  getPath(): string[] {
    const path: string[] = [];
    let current: Category | null = this;
    
    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }
    
    return path;
  }

  // Predefined categories factory
  static createEssentialCategories(): Category[] {
    return [
      // Income
      new Category(
        CategoryId.generate(),
        'Salario',
        CategoryType.INCOME,
        '#10b981',
        '💰'
      ),
      new Category(
        CategoryId.generate(),
        'Freelance',
        CategoryType.INCOME,
        '#10b981',
        '💻'
      ),
      
      // Essential Expenses
      new Category(
        CategoryId.generate(),
        'Alquiler',
        CategoryType.ESSENTIAL_EXPENSE,
        '#ef4444',
        '🏠'
      ),
      new Category(
        CategoryId.generate(),
        'Supermercado',
        CategoryType.ESSENTIAL_EXPENSE,
        '#ef4444',
        '🛒'
      ),
      new Category(
        CategoryId.generate(),
        'Móvil e Internet',
        CategoryType.ESSENTIAL_EXPENSE,
        '#ef4444',
        '📱'
      ),
      new Category(
        CategoryId.generate(),
        'Transporte',
        CategoryType.ESSENTIAL_EXPENSE,
        '#ef4444',
        '🚗'
      ),
      
      // Discretionary Expenses
      new Category(
        CategoryId.generate(),
        'Restaurantes',
        CategoryType.DISCRETIONARY_EXPENSE,
        '#f59e0b',
        '🍽️'
      ),
      new Category(
        CategoryId.generate(),
        'Entretenimiento',
        CategoryType.DISCRETIONARY_EXPENSE,
        '#f59e0b',
        '🎬'
      ),
      new Category(
        CategoryId.generate(),
        'Compras',
        CategoryType.DISCRETIONARY_EXPENSE,
        '#f59e0b',
        '🛍️'
      ),
      
      // Savings
      new Category(
        CategoryId.generate(),
        'Ahorro Emergencia',
        CategoryType.SAVINGS,
        '#3b82f6',
        '🏦'
      ),
      
      // Investments
      new Category(
        CategoryId.generate(),
        'Plan de Pensiones',
        CategoryType.INVESTMENT,
        '#8b5cf6',
        '📈'
      ),
      new Category(
        CategoryId.generate(),
        'Bolsa',
        CategoryType.INVESTMENT,
        '#8b5cf6',
        '📊'
      )
    ];
  }
}