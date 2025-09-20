import { Result } from "@domain/shared/Result";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { SeedController } from "@infrastructure/controllers/SeedController";

/**
 * Service to handle initial setup of the application
 * Detects if the database is empty and performs initial seeding
 */
export class InitialSetupService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly seedController: SeedController,
  ) {}

  /**
   * Checks if the database is empty (no categories and no transactions)
   */
  async isDatabaseEmpty(): Promise<Result<boolean>> {
    try {
      const categoryCountResult = await this.categoryRepository.count();
      if (categoryCountResult.isFailure()) {
        return Result.fail(categoryCountResult.getError());
      }

      const transactionCountResult = await this.transactionRepository.count();
      if (transactionCountResult.isFailure()) {
        return Result.fail(transactionCountResult.getError());
      }

      const isEmpty =
        categoryCountResult.getValue() === 0 &&
        transactionCountResult.getValue() === 0;

      return Result.ok(isEmpty);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check if database is empty: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Performs initial setup if database is empty
   * Uses the existing seed/reset functionality
   */
  async performInitialSetupIfNeeded(): Promise<Result<boolean>> {
    try {
      const isEmptyResult = await this.isDatabaseEmpty();
      if (isEmptyResult.isFailure()) {
        return Result.fail(isEmptyResult.getError());
      }

      if (!isEmptyResult.getValue()) {
        // Database is not empty, no setup needed
        return Result.ok(false);
      }

      // Database is empty, perform initial seeding
      console.log("🚀 Database is empty, performing initial setup...");
      const seedResult = await this.seedDefaults();
      if (seedResult.isFailure()) {
        return Result.fail(seedResult.getError());
      }

      console.log("✅ Initial setup completed successfully");
      return Result.ok(true);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to perform initial setup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Seeds default data using the existing SeedController logic
   */
  private async seedDefaults(): Promise<Result<void>> {
    try {
      await this.seedController.performReset();
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to seed defaults: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
