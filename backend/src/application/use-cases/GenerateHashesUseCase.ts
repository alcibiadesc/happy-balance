import { HashGenerationService } from '@domain/services/HashGenerationService';
import { Result } from '@domain/shared/Result';

export interface GenerateHashesCommand {
  transactions: Array<{
    date: string;
    merchant: string;
    amount: number;
    currency?: string;
  }>;
}

export interface GenerateHashesResponse {
  hashes: Array<{
    index: number;
    hash: string;
  }>;
}

/**
 * Use case for generating transaction hashes
 * Provides centralized hash generation for frontend
 * Follows CQRS pattern and hexagonal architecture
 */
export class GenerateHashesUseCase {
  private readonly hashGenerationService: HashGenerationService;

  constructor() {
    this.hashGenerationService = new HashGenerationService();
  }

  async execute(command: GenerateHashesCommand): Promise<Result<GenerateHashesResponse>> {
    try {
      // Input validation
      if (!command.transactions || command.transactions.length === 0) {
        return Result.fail('No transactions provided');
      }

      // Validate each transaction
      for (let i = 0; i < command.transactions.length; i++) {
        const tx = command.transactions[i];
        if (!tx.date || !tx.merchant || tx.amount === undefined) {
          return Result.fail(`Invalid transaction data at index ${i}`);
        }
      }

      // Generate hashes for all transactions
      const hashes: Array<{ index: number; hash: string }> = [];

      for (let i = 0; i < command.transactions.length; i++) {
        const tx = command.transactions[i];
        const hash = this.hashGenerationService.generateTransactionHash({
          date: tx.date,
          merchant: tx.merchant,
          amount: tx.amount,
          currency: tx.currency || 'EUR'
        });

        hashes.push({ index: i, hash });
      }

      return Result.ok({ hashes });

    } catch (error) {
      return Result.fail(`Failed to generate hashes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}