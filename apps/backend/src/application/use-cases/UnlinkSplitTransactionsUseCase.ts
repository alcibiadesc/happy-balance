import { Result } from "@domain/shared/Result";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";

export interface UnlinkSplitTransactionsRequest {
  transactionId: string; // Either the expense or reimbursement transaction
}

/**
 * Use case to unlink a split transaction from its reimbursement
 * Removes split percentage and reimbursement markers
 */
export class UnlinkSplitTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(request: UnlinkSplitTransactionsRequest): Promise<Result<void>> {
    try {
      const { transactionId } = request;

      // Get the source transaction
      const sourceResult = await this.transactionRepository.findById({
        value: transactionId,
      } as any);

      if (sourceResult.isFailure()) {
        return Result.fail(sourceResult.getError());
      }

      const sourceTransaction = sourceResult.getValue();
      if (!sourceTransaction) {
        return Result.failWithMessage("Transaction not found");
      }

      // Get linked transaction if it exists
      let linkedTransaction = null;
      if (sourceTransaction.linkedTransactionId) {
        const linkedResult = await this.transactionRepository.findById(
          sourceTransaction.linkedTransactionId,
        );

        if (linkedResult.isSuccess()) {
          linkedTransaction = linkedResult.getValue();
        }
      }

      // Unlink source transaction
      sourceTransaction.unlinkTransaction();
      sourceTransaction.setSplitPercentage(null);
      sourceTransaction.unmarkAsReimbursement();

      // Unlink the linked transaction if it exists
      if (linkedTransaction) {
        linkedTransaction.unlinkTransaction();
        linkedTransaction.setSplitPercentage(null);
        linkedTransaction.unmarkAsReimbursement();

        const saveLinkedResult = await this.transactionRepository.save(linkedTransaction);
        if (saveLinkedResult.isFailure()) {
          return Result.fail(saveLinkedResult.getError());
        }
      }

      // Save source transaction
      const saveSourceResult = await this.transactionRepository.save(sourceTransaction);
      if (saveSourceResult.isFailure()) {
        return Result.fail(saveSourceResult.getError());
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to unlink split transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
