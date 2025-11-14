import { Result } from "@domain/shared/Result";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { Transaction } from "@domain/entities/Transaction";
import { TransactionType } from "@domain/entities/TransactionType";

export interface PotentialReimbursementQuery {
  transactionId: string; // The transaction to find matches for (expense -> income OR income -> expense)
  toleranceDays?: number; // Days to search before/after the transaction (default: 30)
  amountTolerancePercent?: number; // % tolerance for matching amounts (default: 5)
}

export interface PotentialReimbursementResult {
  transaction: Transaction;
  matchScore: number; // 0-100, higher is better match
  matchReasons: string[];
}

/**
 * Use case to find potential matching transactions for split expenses/reimbursements
 * Works bidirectionally:
 * - For EXPENSE: finds INCOME transactions (reimbursements)
 * - For INCOME: finds EXPENSE transactions (shared expenses)
 */
export class FindPotentialReimbursementsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(
    query: PotentialReimbursementQuery,
  ): Promise<Result<PotentialReimbursementResult[]>> {
    try {
      const { transactionId, toleranceDays = 30, amountTolerancePercent = 5 } = query;

      // Get the source transaction
      const sourceTransactionResult = await this.transactionRepository.findById({
        value: transactionId,
      } as any);

      if (sourceTransactionResult.isFailure()) {
        return Result.fail(sourceTransactionResult.getError());
      }

      const sourceTransaction = sourceTransactionResult.getValue();
      if (!sourceTransaction) {
        return Result.failWithMessage("Source transaction not found");
      }

      // Determine search direction
      const isExpense = sourceTransaction.type === TransactionType.EXPENSE;
      const isIncome = sourceTransaction.type === TransactionType.INCOME;

      if (!isExpense && !isIncome) {
        return Result.failWithMessage("Can only find matches for expense or income transactions");
      }

      const targetType = isExpense ? TransactionType.INCOME : TransactionType.EXPENSE;

      // Get all transactions within the date range
      const sourceDate = sourceTransaction.date.value;
      const startDate = new Date(sourceDate);
      startDate.setDate(startDate.getDate() - toleranceDays);
      const endDate = new Date(sourceDate);
      endDate.setDate(endDate.getDate() + toleranceDays);

      const allTransactionsResult = await this.transactionRepository.findWithFilters(
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          includeHidden: false,
        },
        { offset: 0, limit: 10000 },
      );

      if (allTransactionsResult.isFailure()) {
        return Result.fail(allTransactionsResult.getError());
      }

      const { transactions } = allTransactionsResult.getValue();
      const potentialReimbursements: PotentialReimbursementResult[] = [];

      for (const transaction of transactions) {
        // Skip the source transaction itself
        if (transaction.id.value === transactionId) {
          continue;
        }

        // Only consider transactions of target type
        if (transaction.type !== targetType) {
          continue;
        }

        // Skip transactions already linked
        if (transaction.linkedTransactionId) {
          continue;
        }

        // Check currency match
        if (transaction.amount.currency !== sourceTransaction.amount.currency) {
          continue;
        }

        const matchScore = isExpense
          ? this.calculateMatchScore(sourceTransaction, transaction, amountTolerancePercent, 'expense-to-income')
          : this.calculateMatchScore(transaction, sourceTransaction, amountTolerancePercent, 'income-to-expense');

        // Only include matches with score > 30
        if (matchScore.score > 30) {
          potentialReimbursements.push({
            transaction,
            matchScore: matchScore.score,
            matchReasons: matchScore.reasons,
          });
        }
      }

      // Sort by match score (highest first)
      potentialReimbursements.sort((a, b) => b.matchScore - a.matchScore);

      // Return top 10 matches
      return Result.ok(potentialReimbursements.slice(0, 10));
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find potential reimbursements: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private calculateMatchScore(
    expenseTransaction: Transaction,
    incomeTransaction: Transaction,
    amountTolerancePercent: number,
    direction: 'expense-to-income' | 'income-to-expense' = 'expense-to-income',
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const expenseAmount = expenseTransaction.amount.amount;
    const incomeAmount = incomeTransaction.amount.amount;

    // Swap labels if searching from income to expense
    const sourceLabel = direction === 'expense-to-income' ? 'gasto' : 'reembolso';
    const targetLabel = direction === 'expense-to-income' ? 'reembolso' : 'gasto';

    // Check common percentages and their differences
    const percentageChecks = [
      { percent: 50, label: '50%' },
      { percent: 100, label: '100%' },
      { percent: 33.33, label: '33%' },
      { percent: 25, label: '25%' },
      { percent: 75, label: '75%' },
    ];

    let bestMatch: { diff: number; percent: number; label: string } | null = null;

    for (const check of percentageChecks) {
      const targetAmount = expenseAmount * (check.percent / 100);
      const diff = Math.abs(incomeAmount - targetAmount);
      const tolerance = targetAmount * (amountTolerancePercent / 100);

      if (diff <= tolerance) {
        if (!bestMatch || diff < bestMatch.diff) {
          bestMatch = { diff, percent: check.percent, label: check.label };
        }
      }
    }

    if (bestMatch) {
      // If difference is 1 cent or less, give 99% score
      if (bestMatch.diff <= 0.01) {
        score += 99;
        reasons.push(`Coincide exactamente con el ${bestMatch.label} del ${sourceLabel} (diferencia: ${bestMatch.diff.toFixed(2)}€)`);
      } else if (bestMatch.percent === 50 || bestMatch.percent === 100) {
        score += 50;
        const targetAmount = expenseAmount * (bestMatch.percent / 100);
        reasons.push(`Coincide con el ${bestMatch.label} del ${sourceLabel} (${incomeAmount.toFixed(2)}€ ≈ ${targetAmount.toFixed(2)}€)`);
      } else {
        score += 30;
        reasons.push(`Coincide con el ${bestMatch.label} del ${sourceLabel}`);
      }
    }

    // Date proximity bonus (closer dates = higher score)
    const daysDiff = Math.abs(
      (incomeTransaction.date.value.getTime() - expenseTransaction.date.value.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 1) {
      score += 20;
      reasons.push("Mismo día o día siguiente");
    } else if (daysDiff <= 7) {
      score += 10;
      reasons.push("Dentro de la misma semana");
    } else if (daysDiff <= 14) {
      score += 5;
      reasons.push("Dentro de las 2 semanas");
    }

    // Merchant name similarity bonus
    const expenseMerchant = expenseTransaction.merchant.name.toLowerCase();
    const incomeMerchant = incomeTransaction.merchant.name.toLowerCase();

    // Check if income merchant description contains expense merchant name
    if (
      incomeMerchant.includes(expenseMerchant) ||
      expenseMerchant.includes(incomeMerchant)
    ) {
      score += 15;
      reasons.push("Comerciante similar");
    }

    // Check description similarity (more important for identification)
    const expenseDesc = (expenseTransaction.description || '').toLowerCase();
    const incomeDesc = (incomeTransaction.description || '').toLowerCase();

    if (incomeDesc && expenseDesc && (
      incomeDesc.includes(expenseDesc) ||
      expenseDesc.includes(incomeDesc)
    )) {
      score += 20;
      reasons.push("Descripción relacionada");
    }

    return { score: Math.min(score, 100), reasons };
  }
}
