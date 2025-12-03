import { Transaction } from '../../domain/entities/Transaction';
import {
  SmartCategorizationService,
  ApplyPatternsResult,
} from '../../domain/services/SmartCategorizationService';

export interface AutoCategorizeRequest {
  userId?: string;
}

export interface AutoCategorizeResponse {
  success: boolean;
  categorizedCount: number;
  patternsApplied: number;
  normalizedMatches: number;
  message: string;
}

export interface IAutoCategorizeRepositories {
  getUncategorizedTransactions(): Promise<Transaction[]>;
  saveTransactions(transactions: Transaction[]): Promise<void>;
}

export class AutoCategorizeTransactionsUseCase {
  constructor(
    private readonly repositories: IAutoCategorizeRepositories,
    private readonly smartCategorizationService: SmartCategorizationService
  ) {}

  async execute(request: AutoCategorizeRequest): Promise<AutoCategorizeResponse> {
    try {
      // Fetch all uncategorized transactions
      const uncategorizedTransactions = await this.repositories.getUncategorizedTransactions();

      if (uncategorizedTransactions.length === 0) {
        return {
          success: true,
          categorizedCount: 0,
          patternsApplied: 0,
          normalizedMatches: 0,
          message: 'No uncategorized transactions found',
        };
      }

      // Apply patterns to uncategorized transactions
      const result = await this.smartCategorizationService.applyPatternsToTransactions(
        uncategorizedTransactions,
        request.userId
      );

      // Save all transactions that were categorized
      const categorizedTransactions = uncategorizedTransactions.filter(
        (t) => t.categoryId !== null && t.categoryId !== undefined
      );

      if (categorizedTransactions.length > 0) {
        await this.repositories.saveTransactions(categorizedTransactions);
      }

      return {
        success: true,
        categorizedCount: result.categorizedCount,
        patternsApplied: result.patternsApplied.size,
        normalizedMatches: result.normalizedMatches,
        message: this.buildSuccessMessage(result, uncategorizedTransactions.length),
      };
    } catch (error) {
      console.error('AutoCategorizeTransactionsUseCase error:', error);
      return {
        success: false,
        categorizedCount: 0,
        patternsApplied: 0,
        normalizedMatches: 0,
        message: 'An error occurred while auto-categorizing transactions',
      };
    }
  }

  private buildSuccessMessage(result: ApplyPatternsResult, totalUncategorized: number): string {
    if (result.categorizedCount === 0) {
      return `No matches found for ${totalUncategorized} uncategorized transactions. Create patterns by categorizing transactions first.`;
    }

    const remaining = totalUncategorized - result.categorizedCount;
    let message = `Auto-categorized ${result.categorizedCount} transaction(s)`;

    if (result.normalizedMatches > 0) {
      message += ` (${result.normalizedMatches} via intelligent matching)`;
    }

    if (remaining > 0) {
      message += `. ${remaining} transaction(s) still need manual categorization.`;
    }

    return message;
  }
}
