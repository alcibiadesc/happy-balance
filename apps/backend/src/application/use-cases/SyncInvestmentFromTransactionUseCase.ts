import { IInvestmentRepository } from '@domain/repositories/IInvestmentRepository';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { Investment, InvestmentHistory } from '@domain/entities/Investment';
import { InvestmentHistoryType } from '@domain/entities/InvestmentHistoryType';
import { Result } from '@domain/shared/Result';

export interface SyncFromTransactionCommand {
  transactionId: string;
  amount: number;
  date: Date;
  categoryId: string;
  categoryName: string;
  userId: string;
  transactionDescription?: string;
  transactionCounterparty?: string;
}

/**
 * Use case that syncs investment portfolio when an investment-type transaction is created/updated
 * Creates a new investment or adds a contribution to existing one
 */
export class SyncInvestmentFromTransactionUseCase {
  constructor(
    private readonly investmentRepository: IInvestmentRepository,
    _categoryRepository?: ICategoryRepository
  ) {}

  async execute(command: SyncFromTransactionCommand): Promise<Result<Investment>> {
    try {
      // Path A: Check if there's already a history entry linked to this transaction
      const existingHistoryResult = await this.investmentRepository.findHistoryByTransactionId(
        command.transactionId
      );

      if (existingHistoryResult.isFailure()) {
        return Result.failWithMessage(
          `Failed to look up existing history for transaction ${command.transactionId}: ${existingHistoryResult.getError()}`
        );
      }

      const existingHistory = existingHistoryResult.getValue();

      if (existingHistory) {
        // Update existing history entry amount
        const updateAmountResult = existingHistory.updateAmount(command.amount);
        if (updateAmountResult.isFailure()) {
          return Result.failWithMessage(
            `Failed to update history entry amount for transaction ${command.transactionId}: ${updateAmountResult.getError()}`
          );
        }

        const updateHistoryResult =
          await this.investmentRepository.updateHistoryEntry(existingHistory);
        if (updateHistoryResult.isFailure()) {
          return Result.failWithMessage(
            `Failed to persist updated history entry for transaction ${command.transactionId}: ${updateHistoryResult.getError()}`
          );
        }

        // Get the investment
        const investmentResult = await this.investmentRepository.findByIdWithHistory(
          existingHistory.investmentId
        );
        if (investmentResult.isFailure()) {
          return Result.failWithMessage(
            `History updated but failed to fetch investment ${existingHistory.investmentId}: ${investmentResult.getError()}`
          );
        }
        if (!investmentResult.getValue()) {
          return Result.failWithMessage(
            `History updated but investment ${existingHistory.investmentId} not found`
          );
        }
        return Result.ok(investmentResult.getValue()!);
      }

      // Path B: Check if investment exists for this category
      const existingInvestmentsResult = await this.investmentRepository.findByCategoryId(
        command.categoryId
      );

      if (existingInvestmentsResult.isFailure()) {
        return Result.failWithMessage(
          `Failed to look up investments for category ${command.categoryId}: ${existingInvestmentsResult.getError()}`
        );
      }

      const existingInvestments = existingInvestmentsResult.getValue();

      if (existingInvestments.length > 0) {
        // Add contribution to existing investment
        const investment = existingInvestments[0];

        // Build detailed notes from transaction info
        const notesParts: string[] = [];
        if (command.transactionCounterparty) {
          notesParts.push(command.transactionCounterparty);
        }
        if (command.transactionDescription) {
          notesParts.push(command.transactionDescription);
        }
        const notes =
          notesParts.length > 0 ? `📝 ${notesParts.join(' - ')}` : `Aportación desde transacción`;

        const historyResult = InvestmentHistory.create(
          investment.id,
          command.amount,
          InvestmentHistoryType.CONTRIBUTION,
          command.date,
          notes,
          command.transactionId
        );

        if (historyResult.isFailure()) {
          return Result.failWithMessage(
            `Failed to create history entry for investment ${investment.id} (transaction ${command.transactionId}): ${historyResult.getError()}`
          );
        }

        const historyEntry = historyResult.getValue();
        const addResult = await this.investmentRepository.addHistoryEntry(historyEntry);
        if (addResult.isFailure()) {
          return Result.failWithMessage(
            `Failed to persist history entry for investment ${investment.id}: ${addResult.getError()}`
          );
        }

        // Update investment current value
        const updateValueResult = investment.updateCurrentValue(
          investment.currentValue + command.amount
        );
        if (updateValueResult.isFailure()) {
          return Result.failWithMessage(
            `Failed to update current value for investment ${investment.id}: ${updateValueResult.getError()}`
          );
        }

        const updateResult = await this.investmentRepository.update(investment);
        if (updateResult.isFailure()) {
          return Result.failWithMessage(
            `Failed to persist updated investment ${investment.id}: ${updateResult.getError()}`
          );
        }

        // Return updated investment with history
        const updatedResult = await this.investmentRepository.findByIdWithHistory(investment.id);
        if (updatedResult.isFailure()) {
          return Result.failWithMessage(
            `Investment updated but failed to fetch with history ${investment.id}: ${updatedResult.getError()}`
          );
        }
        if (!updatedResult.getValue()) {
          return Result.failWithMessage(
            `Investment updated but not found when re-fetching ${investment.id}`
          );
        }
        return Result.ok(updatedResult.getValue()!);
      }

      // Path C: Create new investment for this category
      const investmentResult = Investment.create(
        command.categoryName,
        command.amount,
        'EUR', // Default currency, could be from user preferences
        command.userId,
        {
          categoryId: command.categoryId,
        }
      );

      if (investmentResult.isFailure()) {
        return Result.failWithMessage(
          `Failed to create investment for category "${command.categoryName}" (${command.categoryId}): ${investmentResult.getError()}`
        );
      }

      const investment = investmentResult.getValue();
      const saveResult = await this.investmentRepository.save(investment);
      if (saveResult.isFailure()) {
        return Result.failWithMessage(
          `Failed to persist new investment for category "${command.categoryName}": ${saveResult.getError()}`
        );
      }

      // Build detailed notes from transaction info for initial contribution
      const initialNotesParts: string[] = [];
      if (command.transactionCounterparty) {
        initialNotesParts.push(command.transactionCounterparty);
      }
      if (command.transactionDescription) {
        initialNotesParts.push(command.transactionDescription);
      }
      const initialNotes =
        initialNotesParts.length > 0
          ? `📝 Primera aportación - ${initialNotesParts.join(' - ')}`
          : `Primera aportación desde transacción`;

      // Add initial contribution
      const historyResult = InvestmentHistory.create(
        investment.id,
        command.amount,
        InvestmentHistoryType.CONTRIBUTION,
        command.date,
        initialNotes,
        command.transactionId
      );

      if (historyResult.isFailure()) {
        return Result.failWithMessage(
          `Investment created but failed to create initial history entry: ${historyResult.getError()}`
        );
      }

      const addHistoryResult = await this.investmentRepository.addHistoryEntry(
        historyResult.getValue()
      );
      if (addHistoryResult.isFailure()) {
        return Result.failWithMessage(
          `Investment created but failed to persist initial history entry: ${addHistoryResult.getError()}`
        );
      }

      // Return with history
      const finalResult = await this.investmentRepository.findByIdWithHistory(investment.id);
      if (finalResult.isFailure()) {
        return Result.failWithMessage(
          `Investment created but failed to fetch with history: ${finalResult.getError()}`
        );
      }
      if (!finalResult.getValue()) {
        return Result.failWithMessage(
          `Investment created but not found when re-fetching ${investment.id}`
        );
      }
      return Result.ok(finalResult.getValue()!);
    } catch (error) {
      return Result.failWithMessage(
        `Unexpected error syncing investment from transaction ${command.transactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
