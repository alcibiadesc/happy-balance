import { Rule, RuleCondition, RuleField, RuleOperator } from '../entities/Rule.js';
import { RuleId } from '../value-objects/RuleId.js';
import type { Transaction } from '../entities/Transaction.js';
import type { Category } from '../entities/Category.js';

export interface UserAction {
  transactionId: string;
  action: 'categorize' | 'omit';
  categoryId?: string;
  timestamp: Date;
  transaction: Transaction;
}

export interface RuleSuggestion {
  rule: Rule;
  confidence: number;
  affectedTransactions: Transaction[];
  categoryId?: string;
  action: 'categorize' | 'omit';
  description: string;
}

export class AutoIntelligenceService {
  private static readonly MIN_PATTERN_OCCURRENCES = 2;
  private static readonly MIN_CONFIDENCE = 0.6;
  private static readonly LEARNING_THRESHOLD = 3;

  /**
   * Analyzes user actions to suggest automatic rules
   */
  static suggestRulesFromActions(
    userActions: UserAction[],
    allTransactions: Transaction[]
  ): RuleSuggestion[] {
    const suggestions: RuleSuggestion[] = [];
    
    // Group actions by pattern
    const patterns = this.identifyPatterns(userActions);
    
    for (const pattern of patterns) {
      const ruleSuggestion = this.createRuleSuggestion(pattern, allTransactions);
      if (ruleSuggestion && ruleSuggestion.confidence >= this.MIN_CONFIDENCE) {
        suggestions.push(ruleSuggestion);
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Automatically applies learned rules to new transactions
   */
  static applySuggestedCategories(
    transaction: Transaction,
    rules: Rule[],
    categories: Category[]
  ): { categoryId?: string; action?: 'omit'; confidence: number } | null {
    let bestMatch: { categoryId?: string; action?: 'omit'; confidence: number } | null = null;
    
    for (const rule of rules.filter(r => r.isActive)) {
      if (rule.evaluate(transaction)) {
        if (!bestMatch || rule.confidence > bestMatch.confidence) {
          // For now, we'll need to store category/action info with rules
          // This would need to be extended in the Rule entity
          bestMatch = {
            confidence: rule.confidence
          };
        }
      }
    }
    
    return bestMatch;
  }

  private static identifyPatterns(actions: UserAction[]): UserActionPattern[] {
    const patterns: Map<string, UserActionPattern> = new Map();
    
    for (const action of actions) {
      // Create patterns based on partner name
      this.addPartnerNamePattern(patterns, action);
      
      // Create patterns based on amount ranges
      this.addAmountRangePattern(patterns, action);
      
      // Create patterns based on payment reference
      this.addPaymentReferencePattern(patterns, action);
    }
    
    // Filter patterns that occur frequently enough
    return Array.from(patterns.values()).filter(
      pattern => pattern.actions.length >= this.MIN_PATTERN_OCCURRENCES
    );
  }

  private static addPartnerNamePattern(patterns: Map<string, UserActionPattern>, action: UserAction) {
    const partnerName = action.transaction.partnerName.toLowerCase();
    const patternKey = `partner:${partnerName}:${action.action}:${action.categoryId || 'omit'}`;
    
    if (!patterns.has(patternKey)) {
      patterns.set(patternKey, {
        type: 'partner_name',
        value: partnerName,
        action: action.action,
        categoryId: action.categoryId,
        actions: [],
        confidence: 0
      });
    }
    
    patterns.get(patternKey)!.actions.push(action);
  }

  private static addAmountRangePattern(patterns: Map<string, UserActionPattern>, action: UserAction) {
    const amount = Math.abs(action.transaction.amount.amount);
    const roundedAmount = Math.round(amount / 10) * 10; // Round to nearest 10
    const patternKey = `amount:${roundedAmount}:${action.action}:${action.categoryId || 'omit'}`;
    
    if (!patterns.has(patternKey)) {
      patterns.set(patternKey, {
        type: 'amount_range',
        value: roundedAmount.toString(),
        action: action.action,
        categoryId: action.categoryId,
        actions: [],
        confidence: 0
      });
    }
    
    patterns.get(patternKey)!.actions.push(action);
  }

  private static addPaymentReferencePattern(patterns: Map<string, UserActionPattern>, action: UserAction) {
    const reference = action.transaction.paymentReference?.toLowerCase();
    if (!reference) return;
    
    // Extract keywords from payment reference
    const keywords = this.extractKeywords(reference);
    
    for (const keyword of keywords) {
      const patternKey = `reference:${keyword}:${action.action}:${action.categoryId || 'omit'}`;
      
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, {
          type: 'payment_reference',
          value: keyword,
          action: action.action,
          categoryId: action.categoryId,
          actions: [],
          confidence: 0
        });
      }
      
      patterns.get(patternKey)!.actions.push(action);
    }
  }

  private static extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3 && !commonWords.includes(word));
    
    return [...new Set(words)]; // Remove duplicates
  }

  private static createRuleSuggestion(
    pattern: UserActionPattern,
    allTransactions: Transaction[]
  ): RuleSuggestion | null {
    const rule = this.createRuleFromPattern(pattern);
    if (!rule) return null;
    
    // Calculate confidence based on consistency and frequency
    const confidence = this.calculateConfidence(pattern);
    
    // Find affected transactions
    const affectedTransactions = allTransactions.filter(t => rule.evaluate(t));
    
    // Create description
    const description = this.createRuleDescription(pattern);
    
    return {
      rule,
      confidence,
      affectedTransactions,
      categoryId: pattern.categoryId,
      action: pattern.action,
      description
    };
  }

  private static createRuleFromPattern(pattern: UserActionPattern): Rule | null {
    let condition: RuleCondition;
    
    switch (pattern.type) {
      case 'partner_name':
        condition = new RuleCondition(
          RuleField.PARTNER_NAME,
          RuleOperator.CONTAINS,
          pattern.value
        );
        break;
        
      case 'amount_range':
        const amount = parseFloat(pattern.value);
        const range = amount * 0.1; // 10% range
        condition = new RuleCondition(
          RuleField.AMOUNT,
          RuleOperator.BETWEEN,
          `${amount - range},${amount + range}`
        );
        break;
        
      case 'payment_reference':
        condition = new RuleCondition(
          RuleField.PAYMENT_REFERENCE,
          RuleOperator.CONTAINS,
          pattern.value
        );
        break;
        
      default:
        return null;
    }
    
    return new Rule(
      RuleId.generate(),
      condition,
      pattern.confidence,
      true,
      1 // Default priority
    );
  }

  private static calculateConfidence(pattern: UserActionPattern): number {
    const baseConfidence = Math.min(pattern.actions.length / this.LEARNING_THRESHOLD, 1);
    const consistencyBonus = this.calculateConsistency(pattern);
    const frequencyBonus = Math.min(pattern.actions.length * 0.1, 0.2);
    
    return Math.min(baseConfidence + consistencyBonus + frequencyBonus, 0.95);
  }

  private static calculateConsistency(pattern: UserActionPattern): number {
    // All actions in a pattern should be the same by definition
    // But we can check temporal consistency (recent actions are more relevant)
    const now = new Date().getTime();
    const recentActions = pattern.actions.filter(
      action => now - action.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
    );
    
    return recentActions.length / pattern.actions.length * 0.2;
  }

  private static createRuleDescription(pattern: UserActionPattern): string {
    const actionText = pattern.action === 'omit' ? 'omitir' : 'categorizar';
    
    switch (pattern.type) {
      case 'partner_name':
        return `${actionText} transacciones que contengan "${pattern.value}" en el nombre del comercio`;
      case 'amount_range':
        return `${actionText} transacciones de aproximadamente €${pattern.value}`;
      case 'payment_reference':
        return `${actionText} transacciones que contengan "${pattern.value}" en la referencia`;
      default:
        return `Regla automática para ${actionText}`;
    }
  }
}

interface UserActionPattern {
  type: 'partner_name' | 'amount_range' | 'payment_reference';
  value: string;
  action: 'categorize' | 'omit';
  categoryId?: string;
  actions: UserAction[];
  confidence: number;
}