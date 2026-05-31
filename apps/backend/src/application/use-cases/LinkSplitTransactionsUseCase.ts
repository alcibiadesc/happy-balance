import { Result } from '@domain/shared/Result';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { TransactionType } from '@domain/entities/TransactionType';
import { TransactionId } from '@domain/value-objects/TransactionId';

export interface LinkSplitTransactionsRequest {
  sourceTransactionId: string; // Can be expense or income
  targetTransactionId: string; // The transaction to link with
  splitPercentage: number; // 0-100, what % the expense represents (or what % the income covers)
}

/**
 * Use case to link split transactions (expense <-> income)
 * Works bidirectionally:
 * - Expense + Income: marks income as reimbursement, sets split % on expense
 * - Income + Expense: marks income as reimbursement, sets split % on expense
 * The result is always: expense has splitPercentage, income has isReimbursement=true
 */
export class LinkSplitTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(request: LinkSplitTransactionsRequest): Promise<Result<void>> {
    try {
      const { sourceTransactionId, targetTransactionId, splitPercentage } = request;

      // Validate split percentage
      if (splitPercentage < 0 || splitPercentage > 100) {
        return Result.failWithMessage('Split percentage must be between 0 and 100');
      }

      // Get both transactions
      const sourceIdResult = TransactionId.create(sourceTransactionId);
      if (sourceIdResult.isFailure()) {
        return Result.fail(sourceIdResult.getError());
      }

      const sourceResult = await this.transactionRepository.findById(sourceIdResult.getValue());

      if (sourceResult.isFailure()) {
        return Result.fail(sourceResult.getError());
      }

      const sourceTransaction = sourceResult.getValue();
      if (!sourceTransaction) {
        return Result.failWithMessage('Source transaction not found');
      }

      const targetIdResult = TransactionId.create(targetTransactionId);
      if (targetIdResult.isFailure()) {
        return Result.fail(targetIdResult.getError());
      }

      const targetResult = await this.transactionRepository.findById(targetIdResult.getValue());

      if (targetResult.isFailure()) {
        return Result.fail(targetResult.getError());
      }

      const targetTransaction = targetResult.getValue();
      if (!targetTransaction) {
        return Result.failWithMessage('Target transaction not found');
      }

      // Determine which is expense and which is income
      let expenseTransaction, reimbursementTransaction;

      if (
        sourceTransaction.type === TransactionType.EXPENSE &&
        targetTransaction.type === TransactionType.INCOME
      ) {
        expenseTransaction = sourceTransaction;
        reimbursementTransaction = targetTransaction;
      } else if (
        sourceTransaction.type === TransactionType.INCOME &&
        targetTransaction.type === TransactionType.EXPENSE
      ) {
        expenseTransaction = targetTransaction;
        reimbursementTransaction = sourceTransaction;
      } else {
        return Result.failWithMessage('Transactions must be one EXPENSE and one INCOME');
      }

      // Set split percentage on expense
      const setSplitResult = expenseTransaction.setSplitPercentage(splitPercentage);
      if (setSplitResult.isFailure()) {
        return Result.fail(setSplitResult.getError());
      }

      // Link expense to reimbursement
      expenseTransaction.linkToTransaction(reimbursementTransaction.id);

      // Mark income as reimbursement and link back to expense
      reimbursementTransaction.markAsReimbursement();
      reimbursementTransaction.linkToTransaction(expenseTransaction.id);

      // Save both transactions
      const saveExpenseResult = await this.transactionRepository.save(expenseTransaction);
      if (saveExpenseResult.isFailure()) {
        return Result.fail(saveExpenseResult.getError());
      }

      const saveReimbursementResult =
        await this.transactionRepository.save(reimbursementTransaction);
      if (saveReimbursementResult.isFailure()) {
        return Result.fail(saveReimbursementResult.getError());
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to link split transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
