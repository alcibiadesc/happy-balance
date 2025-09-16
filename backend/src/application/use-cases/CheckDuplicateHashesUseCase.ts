import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import {
  DuplicateDetectionService,
  DuplicateCheckResult,
} from "@domain/services/DuplicateDetectionService";
import { Result } from "@domain/shared/Result";

export interface CheckDuplicateHashesCommand {
  hashes: string[];
}

export interface CheckDuplicateHashesResponse {
  results: DuplicateCheckResult[];
  summary: {
    total: number;
    duplicates: number;
    unique: number;
  };
}

/**
 * Use case for checking if transaction hashes are duplicates
 * Follows CQRS pattern and hexagonal architecture
 */
export class CheckDuplicateHashesUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly duplicateDetectionService: DuplicateDetectionService,
  ) {}

  async execute(
    command: CheckDuplicateHashesCommand,
  ): Promise<Result<CheckDuplicateHashesResponse>> {
    try {
      // Input validation
      if (!command.hashes || command.hashes.length === 0) {
        return Result.failWithMessage("No hashes provided");
      }

      // Get all existing transactions for comparison
      const existingTransactionsResult =
        await this.transactionRepository.findAll();
      if (existingTransactionsResult.isFailure()) {
        return Result.failWithMessage(
          `Failed to fetch existing transactions: ${existingTransactionsResult.getError()}`,
        );
      }

      const existingTransactions = existingTransactionsResult.getValue();

      // Use domain service to check duplicates
      const checkResult = this.duplicateDetectionService.checkHashesDuplicates(
        command.hashes,
        existingTransactions,
      );

      if (checkResult.isFailure()) {
        return Result.fail(checkResult.getError());
      }

      const results = checkResult.getValue();

      // Calculate summary
      const duplicateCount = results.filter((r) => r.isDuplicate).length;
      const summary = {
        total: results.length,
        duplicates: duplicateCount,
        unique: results.length - duplicateCount,
      };

      return Result.ok({
        results,
        summary,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
