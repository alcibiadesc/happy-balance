import { Transaction } from "../../domain/entities/Transaction";
import { Category, CategoryId } from "../../domain/entities/Category";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import {
  SmartCategorizationService,
  type SmartCategorizationSuggestion,
} from "../../domain/services/SmartCategorizationService";
import {
  CategorizeTransactionCommand,
  TagTransactionCommand,
} from "../commands/CategorizeTransactionCommand";
import { TransactionId } from "../../domain/value-objects/TransactionId";
import { Result } from "../../domain/shared/Result";

export interface SmartCategorizationResult {
  transaction: Transaction;
  appliedToCount: number;
  suggestions: SmartCategorizationSuggestion[];
  createdRule?: {
    id: string;
    pattern: string;
    categoryId: string;
  };
}

export interface TagApplicationResult {
  transaction: Transaction;
  appliedToCount: number;
  affectedTransactionIds: string[];
}

/**
 * Use case for smart categorization with pattern matching
 */
export class SmartCategorizeTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly smartService: SmartCategorizationService,
  ) {}

  /**
   * Categorize transaction with smart pattern matching
   */
  async execute(
    command: CategorizeTransactionCommand,
  ): Promise<Result<SmartCategorizationResult>> {
    // Validate command
    const validation = command.isValid();
    if (!validation.valid) {
      return Result.failWithMessage(validation.errors.join(", "));
    }

    try {
      // Get the transaction
      const transactionIdResult = TransactionId.create(command.transactionId);
      if (transactionIdResult.isFailure()) {
        return Result.fail(transactionIdResult.getError());
      }

      const transactionResult = await this.transactionRepository.findById(
        transactionIdResult.getValue(),
      );
      if (transactionResult.isFailure()) {
        return Result.fail(transactionResult.getError());
      }

      const transaction = transactionResult.getValue();
      if (!transaction) {
        return Result.failWithMessage("Transaction not found");
      }

      // Get the category
      const categoryIdResult = CategoryId.create(command.categoryId);
      if (categoryIdResult.isFailure()) {
        return Result.fail(categoryIdResult.getError());
      }

      const categoryResult = await this.categoryRepository.findById(
        categoryIdResult.getValue(),
      );
      if (categoryResult.isFailure()) {
        return Result.fail(categoryResult.getError());
      }

      const category = categoryResult.getValue();
      if (!category) {
        return Result.failWithMessage("Category not found");
      }

      // Categorize the main transaction
      const categorizeResult = transaction.categorize(category);
      if (categorizeResult.isFailure()) {
        return Result.fail(categorizeResult.getError());
      }

      await this.transactionRepository.save(transaction);

      let appliedToCount = 1;
      let createdRule = undefined;

      // Handle pattern-based categorization
      if (command.scope === "pattern" || command.scope === "all") {
        const allTransactionsResult =
          await this.transactionRepository.findAll();
        if (allTransactionsResult.isFailure()) {
          return Result.fail(allTransactionsResult.getError());
        }

        const allTransactions = allTransactionsResult.getValue();
        const patterns = this.smartService.extractPatterns(transaction);

        const matchingTransactions = this.smartService.findMatchingTransactions(
          patterns,
          allTransactions,
          transaction.id.value,
        );

        // Apply category to matching transactions
        for (const matchingTransaction of matchingTransactions) {
          // Only categorize if compatible type
          if (matchingTransaction.type === transaction.type) {
            const result = matchingTransaction.categorize(category);
            if (result.isSuccess()) {
              await this.transactionRepository.save(matchingTransaction);
              appliedToCount++;
            }
          }
        }

        // Create a categorization rule for future transactions if requested
        if (command.applyToFuture && patterns.length > 0) {
          const primaryPattern = patterns[0];
          createdRule = {
            id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            pattern: primaryPattern.pattern,
            categoryId: command.categoryId,
          };

          // Store rule in a rules repository or configuration
          // This would be implementation-specific
        }
      }

      // Get suggestions for future use
      const allTransactionsForSuggestions =
        await this.transactionRepository.findAll();
      if (allTransactionsForSuggestions.isFailure()) {
        // If we can't get suggestions, continue with empty array
        const suggestions: SmartCategorizationSuggestion[] = [];
        return Result.ok({
          transaction,
          appliedToCount,
          suggestions,
          createdRule,
        });
      }

      const suggestions = this.smartService.suggestCategorizationScope(
        transaction,
        allTransactionsForSuggestions.getValue(),
      );

      return Result.ok({
        transaction,
        appliedToCount,
        suggestions,
        createdRule,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to categorize transaction: ${error}`,
      );
    }
  }

  /**
   * Get categorization suggestions for a transaction
   */
  async getSuggestions(
    transactionId: string,
  ): Promise<Result<SmartCategorizationSuggestion[]>> {
    try {
      const transactionIdObj = TransactionId.create(transactionId);
      if (transactionIdObj.isFailure()) {
        return Result.fail(transactionIdObj.getError());
      }

      const transactionResult = await this.transactionRepository.findById(
        transactionIdObj.getValue(),
      );
      if (transactionResult.isFailure()) {
        return Result.fail(transactionResult.getError());
      }

      const transaction = transactionResult.getValue();
      if (!transaction) {
        return Result.failWithMessage("Transaction not found");
      }

      const allTransactionsResult = await this.transactionRepository.findAll();
      if (allTransactionsResult.isFailure()) {
        return Result.fail(allTransactionsResult.getError());
      }

      const suggestions = this.smartService.suggestCategorizationScope(
        transaction,
        allTransactionsResult.getValue(),
      );

      return Result.ok(suggestions);
    } catch (error) {
      return Result.failWithMessage(`Failed to get suggestions: ${error}`);
    }
  }
}

/**
 * Use case for applying tags with pattern matching
 */
export class SmartTagTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly smartService: SmartCategorizationService,
  ) {}

  /**
   * Apply tags with smart pattern matching
   */
  async execute(
    command: TagTransactionCommand,
  ): Promise<Result<TagApplicationResult>> {
    // Validate command
    const validation = command.isValid();
    if (!validation.valid) {
      return Result.failWithMessage(validation.errors.join(", "));
    }

    try {
      // Get the transaction
      const transactionIdResult = TransactionId.create(command.transactionId);
      if (transactionIdResult.isFailure()) {
        return Result.fail(transactionIdResult.getError());
      }

      const transactionResult = await this.transactionRepository.findById(
        transactionIdResult.getValue(),
      );
      if (transactionResult.isFailure()) {
        return Result.fail(transactionResult.getError());
      }

      const transaction = transactionResult.getValue();
      if (!transaction) {
        return Result.failWithMessage("Transaction not found");
      }

      // Add tag to the main transaction
      const currentTags: string[] = []; // Note: Need to add tags support to Transaction entity
      if (!currentTags.includes(command.tag)) {
        const updateResult = await this.transactionRepository.updateTags(
          transaction.id,
          [...currentTags, command.tag],
        );
        if (updateResult.isFailure()) {
          return Result.fail(updateResult.getError());
        }
      }

      const affectedTransactionIds = [transaction.id.value];

      // Handle pattern-based tagging
      if (command.scope === "pattern" || command.scope === "all") {
        const allTransactionsResult =
          await this.transactionRepository.findAll();
        if (allTransactionsResult.isFailure()) {
          return Result.fail(allTransactionsResult.getError());
        }

        const allTransactions = allTransactionsResult.getValue();
        const patterns = this.smartService.extractPatterns(transaction);

        const matchingTransactions = this.smartService.findMatchingTransactions(
          patterns,
          allTransactions,
          transaction.id.value,
        );

        // Apply tag to matching transactions
        for (const matchingTransaction of matchingTransactions) {
          const currentTags = matchingTransaction.toSnapshot().tags || [];
          if (!currentTags.includes(command.tag)) {
            await this.transactionRepository.updateTags(
              matchingTransaction.id,
              [...currentTags, command.tag],
            );
            affectedTransactionIds.push(matchingTransaction.id.value);
          }
        }
      }

      return Result.ok({
        transaction,
        appliedToCount: affectedTransactionIds.length,
        affectedTransactionIds,
      });
    } catch (error) {
      return Result.failWithMessage(`Failed to apply tags: ${error}`);
    }
  }
}
