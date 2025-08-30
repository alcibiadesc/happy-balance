import type { Transaction } from '../entities/Transaction.js';
import type { Category } from '../entities/Category.js';
import type { CategoryRepository } from '../repositories/CategoryRepository.js';

export interface CategorizationResult {
  category: Category;
  confidence: number;
  reason: string;
}

export class CategorizationEngine {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async categorize(transaction: Transaction): Promise<CategorizationResult | null> {
    const categories = await this.categoryRepository.findActive();
    
    let bestMatch: CategorizationResult | null = null;
    let highestConfidence = 0;

    for (const category of categories) {
      const { matches, confidence } = category.matches(transaction);
      
      if (matches && confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          category,
          confidence,
          reason: this.generateReason(category, transaction)
        };
      }
    }

    // Apply machine learning logic here in the future
    const mlResult = await this.applyMachineLearning(transaction);
    if (mlResult && mlResult.confidence > highestConfidence) {
      bestMatch = mlResult;
    }

    return bestMatch;
  }

  async categorizeMany(transactions: Transaction[]): Promise<Map<string, CategorizationResult | null>> {
    const results = new Map<string, CategorizationResult | null>();
    
    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchPromises = batch.map(async (transaction) => {
        const result = await this.categorize(transaction);
        return { transactionId: transaction.id.value, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ transactionId, result }) => {
        results.set(transactionId, result);
      });
    }

    return results;
  }

  async learnFromCorrection(transaction: Transaction, correctCategory: Category): Promise<void> {
    // Update rules based on user corrections
    await this.updateRulesFromCorrection(transaction, correctCategory);
    
    // Train ML model with the correction
    await this.trainMachineLearning(transaction, correctCategory);
  }

  private generateReason(category: Category, transaction: Transaction): string {
    const matchingRules = category.rules.filter(rule => rule.evaluate(transaction));
    if (matchingRules.length === 0) {
      return 'Coincidencia por patrón general';
    }

    const highestConfidenceRule = matchingRules.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );

    return `Coincide con regla: ${this.describeRule(highestConfidenceRule.condition)}`;
  }

  private describeRule(condition: any): string {
    // Simplified rule description
    return `${condition.field} ${condition.operator.toLowerCase()} "${condition.value}"`;
  }

  private async applyMachineLearning(transaction: Transaction): Promise<CategorizationResult | null> {
    // Placeholder for ML implementation
    // In a real implementation, this would use a trained model
    // to predict categories based on transaction features
    return null;
  }

  private async updateRulesFromCorrection(transaction: Transaction, correctCategory: Category): Promise<void> {
    // Analyze the transaction and create new rules or adjust existing ones
    // This could involve analyzing partner names, amounts, patterns, etc.
    
    // Example: If partner name doesn't have a rule, create one
    const partnerNameRule = correctCategory.rules.find(rule => 
      rule.condition.field === 'partnerName' && 
      rule.condition.value === transaction.partnerName
    );

    if (!partnerNameRule) {
      // Create a new rule based on this correction
      // This would be implemented with proper rule creation logic
    }
  }

  private async trainMachineLearning(transaction: Transaction, correctCategory: Category): Promise<void> {
    // Store training data for ML model
    // This would feed into a ML pipeline for continuous learning
  }

  // Helper methods for common categorization patterns
  async categorizeBulkTransactions(transactions: Transaction[]): Promise<void> {
    const categorizationResults = await this.categorizeMany(transactions);
    
    for (const [transactionId, result] of categorizationResults) {
      const transaction = transactions.find(t => t.id.value === transactionId);
      if (transaction && result) {
        transaction.categorize(result.category, result.confidence);
      }
    }
  }

  async getCategorizationStats(): Promise<{
    totalRules: number;
    categoriesWithRules: number;
    averageConfidence: number;
  }> {
    const categories = await this.categoryRepository.findActive();
    const totalRules = categories.reduce((sum, cat) => sum + cat.rules.length, 0);
    const categoriesWithRules = categories.filter(cat => cat.rules.length > 0).length;
    
    // Calculate average confidence (simplified)
    const allRules = categories.flatMap(cat => cat.rules);
    const averageConfidence = allRules.length > 0 
      ? allRules.reduce((sum, rule) => sum + rule.confidence, 0) / allRules.length
      : 0;

    return {
      totalRules,
      categoriesWithRules,
      averageConfidence
    };
  }
}