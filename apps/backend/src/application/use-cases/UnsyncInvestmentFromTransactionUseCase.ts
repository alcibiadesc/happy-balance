import { IInvestmentRepository } from "@domain/repositories/IInvestmentRepository";
import { InvestmentHistoryType } from "@domain/entities/InvestmentHistoryType";
import { Result } from "@domain/shared/Result";

/**
 * Use case that removes the investment history entry when a transaction is deleted
 * Reverses the investment value change and removes the linked history entry
 */
export class UnsyncInvestmentFromTransactionUseCase {
  constructor(
    private readonly investmentRepository: IInvestmentRepository
  ) {}

  async execute(transactionId: string): Promise<Result<void>> {
    try {
      // Find the history entry linked to this transaction
      const historyResult = await this.investmentRepository.findHistoryByTransactionId(
        transactionId
      );

      if (historyResult.isFailure()) {
        return Result.fail(historyResult.getError());
      }

      const historyEntry = historyResult.getValue();

      if (!historyEntry) {
        // No linked history entry, nothing to do
        return Result.ok(undefined);
      }

      // Get the investment to update its value
      const investmentResult = await this.investmentRepository.findByIdWithHistory(
        historyEntry.investmentId
      );

      if (investmentResult.isFailure()) {
        return Result.fail(investmentResult.getError());
      }

      const investment = investmentResult.getValue();
      if (!investment) {
        // Investment doesn't exist anymore, just delete the orphan history entry
        await this.investmentRepository.deleteHistoryEntry(historyEntry.id);
        return Result.ok(undefined);
      }

      // Reverse the value change
      if (historyEntry.type === InvestmentHistoryType.CONTRIBUTION) {
        investment.updateCurrentValue(
          Math.max(0, investment.currentValue - historyEntry.amount)
        );
      } else if (historyEntry.type === InvestmentHistoryType.WITHDRAWAL) {
        investment.updateCurrentValue(investment.currentValue + historyEntry.amount);
      }
      // VALUE_UPDATE doesn't affect the value calculation

      // Delete the history entry
      const deleteResult = await this.investmentRepository.deleteHistoryEntry(historyEntry.id);
      if (deleteResult.isFailure()) {
        return Result.fail(deleteResult.getError());
      }

      // Update the investment
      await this.investmentRepository.update(investment);

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to unsync investment from transaction: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
