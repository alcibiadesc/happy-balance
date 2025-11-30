import { IInvestmentRepository } from "@domain/repositories/IInvestmentRepository";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import { Investment, InvestmentHistory } from "@domain/entities/Investment";
import { InvestmentHistoryType } from "@domain/entities/InvestmentHistoryType";
import { Result } from "@domain/shared/Result";

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
      // First check if there's already a history entry linked to this transaction
      const existingHistoryResult = await this.investmentRepository.findHistoryByTransactionId(
        command.transactionId
      );

      if (existingHistoryResult.isFailure()) {
        return Result.fail(existingHistoryResult.getError());
      }

      const existingHistory = existingHistoryResult.getValue();

      if (existingHistory) {
        // Update existing history entry
        existingHistory.updateAmount(command.amount);
        await this.investmentRepository.updateHistoryEntry(existingHistory);

        // Get the investment
        const investmentResult = await this.investmentRepository.findByIdWithHistory(
          existingHistory.investmentId
        );
        if (investmentResult.isFailure()) {
          return Result.fail(investmentResult.getError());
        }
        return Result.ok(investmentResult.getValue()!);
      }

      // Check if investment exists for this category
      const existingInvestmentsResult = await this.investmentRepository.findByCategoryId(
        command.categoryId
      );

      if (existingInvestmentsResult.isFailure()) {
        return Result.fail(existingInvestmentsResult.getError());
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
        const notes = notesParts.length > 0
          ? `📝 ${notesParts.join(' - ')}`
          : `Aportación desde transacción`;

        const historyResult = InvestmentHistory.create(
          investment.id,
          command.amount,
          InvestmentHistoryType.CONTRIBUTION,
          command.date,
          notes,
          command.transactionId
        );

        if (historyResult.isFailure()) {
          return Result.fail(historyResult.getError());
        }

        const historyEntry = historyResult.getValue();
        await this.investmentRepository.addHistoryEntry(historyEntry);

        // Update investment current value
        investment.updateCurrentValue(investment.currentValue + command.amount);
        await this.investmentRepository.update(investment);

        // Return updated investment with history
        const updatedResult = await this.investmentRepository.findByIdWithHistory(investment.id);
        if (updatedResult.isFailure()) {
          return Result.fail(updatedResult.getError());
        }
        return Result.ok(updatedResult.getValue()!);
      }

      // Create new investment for this category
      const investmentResult = Investment.create(
        command.categoryName,
        command.amount,
        "EUR", // Default currency, could be from user preferences
        command.userId,
        {
          categoryId: command.categoryId,
        }
      );

      if (investmentResult.isFailure()) {
        return investmentResult;
      }

      const investment = investmentResult.getValue();
      await this.investmentRepository.save(investment);

      // Build detailed notes from transaction info for initial contribution
      const initialNotesParts: string[] = [];
      if (command.transactionCounterparty) {
        initialNotesParts.push(command.transactionCounterparty);
      }
      if (command.transactionDescription) {
        initialNotesParts.push(command.transactionDescription);
      }
      const initialNotes = initialNotesParts.length > 0
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
        return Result.fail(historyResult.getError());
      }

      await this.investmentRepository.addHistoryEntry(historyResult.getValue());

      // Return with history
      const finalResult = await this.investmentRepository.findByIdWithHistory(investment.id);
      if (finalResult.isFailure()) {
        return Result.fail(finalResult.getError());
      }
      return Result.ok(finalResult.getValue()!);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync investment from transaction: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
