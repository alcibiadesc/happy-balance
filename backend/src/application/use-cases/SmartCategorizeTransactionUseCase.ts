import { Transaction } from '../../domain/entities/Transaction';
import { Category } from '../../domain/entities/Category';
import { Result } from '../../domain/shared/Result';
import {
  SmartCategorizationService,
  CategorizationOptions,
  CategorizationResult
} from '../../domain/services/SmartCategorizationService';

export interface SmartCategorizeRequest {
  transactionId: string;
  categoryId: string;
  applyToAll: boolean;
  applyToFuture: boolean;
  createPattern: boolean;
}

export interface SmartCategorizeResponse {
  success: boolean;
  categorizedCount: number;
  patternCreated: boolean;
  affectedTransactionIds: string[];
  message?: string;
}

export interface ISmartCategorizeRepositories {
  getTransaction(id: string): Promise<Transaction | null>;
  getCategory(id: string): Promise<Category | null>;
  saveTransaction(transaction: Transaction): Promise<void>;
  saveTransactions(transactions: Transaction[]): Promise<void>;
}

export class SmartCategorizeTransactionUseCase {
  constructor(
    private readonly repositories: ISmartCategorizeRepositories,
    private readonly smartCategorizationService: SmartCategorizationService
  ) {}

  async execute(request: SmartCategorizeRequest): Promise<SmartCategorizeResponse> {
    try {
      // Fetch the transaction
      const transaction = await this.repositories.getTransaction(request.transactionId);
      if (!transaction) {
        return {
          success: false,
          categorizedCount: 0,
          patternCreated: false,
          affectedTransactionIds: [],
          message: 'Transaction not found'
        };
      }

      // Fetch the category
      const category = await this.repositories.getCategory(request.categoryId);
      if (!category) {
        return {
          success: false,
          categorizedCount: 0,
          patternCreated: false,
          affectedTransactionIds: [],
          message: 'Category not found'
        };
      }

      // Prepare categorization options
      const options: CategorizationOptions = {
        applyToAll: request.applyToAll,
        applyToFuture: request.applyToFuture,
        createPattern: request.createPattern || request.applyToAll
      };

      // Perform smart categorization
      const result = await this.smartCategorizationService.categorizeTransaction(
        transaction,
        category,
        options
      );

      if (result.isFailure()) {
        return {
          success: false,
          categorizedCount: 0,
          patternCreated: false,
          affectedTransactionIds: [],
          message: result.getError()?.message || 'Failed to categorize'
        };
      }

      const categorizationResult = result.getValue();

      // Save the updated transaction(s)
      await this.repositories.saveTransaction(transaction);

      return {
        success: true,
        categorizedCount: categorizationResult.categorizedCount,
        patternCreated: categorizationResult.patternCreated,
        affectedTransactionIds: categorizationResult.affectedTransactionIds,
        message: this.buildSuccessMessage(categorizationResult)
      };
    } catch (error) {
      console.error('SmartCategorizeTransactionUseCase error:', error);
      return {
        success: false,
        categorizedCount: 0,
        patternCreated: false,
        affectedTransactionIds: [],
        message: 'An error occurred while categorizing the transaction'
      };
    }
  }

  private buildSuccessMessage(result: CategorizationResult): string {
    let message = `Successfully categorized ${result.categorizedCount} transaction(s)`;

    if (result.patternCreated) {
      message += ' and created a pattern for future transactions';
    }

    return message;
  }
}