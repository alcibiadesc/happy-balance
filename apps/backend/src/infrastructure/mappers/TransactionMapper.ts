import type { TransactionDTO, CategorySummaryDTO } from '@happy-balance/shared-types';
import { Transaction } from '@domain/entities/Transaction';
import { Category } from '@domain/entities/Category';

/**
 * Maps domain Transaction to API TransactionDTO.
 *
 * IMPORTANT: Amount is ALWAYS positive in the DTO.
 * The `type` field (INCOME/EXPENSE/INVESTMENT) determines sign semantics.
 * Sign conversion for display happens in the frontend mapper layer.
 */
export function mapTransactionToDTO(
  transaction: Transaction,
  category?: Category | null
): TransactionDTO {
  const snapshot = transaction.toSnapshot();

  return {
    id: snapshot.id,
    merchant: snapshot.merchant,
    description: snapshot.description,
    amount: Math.abs(snapshot.amount),
    type: snapshot.type,
    date: snapshot.date,
    categoryId: snapshot.categoryId ?? null,
    category: category ? mapCategorySummary(category) : undefined,
    hash: snapshot.hash,
    observations: snapshot.observations,
    splitPercentage: snapshot.splitPercentage,
    linkedTransactionId: snapshot.linkedTransactionId,
    isReimbursement: snapshot.isReimbursement ?? false,
    hidden: (transaction as any).hidden ?? false,
    tags: (transaction as any).tags,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.createdAt, // Transaction entity doesn't track updatedAt separately
  };
}

/**
 * Maps domain Category to minimal CategorySummaryDTO for embedding in transactions.
 */
export function mapCategorySummary(category: Category): CategorySummaryDTO {
  const snapshot = category.toSnapshot();
  return {
    id: snapshot.id,
    name: snapshot.name,
    color: snapshot.color,
    icon: snapshot.icon,
  };
}

/**
 * Maps an array of transactions to DTOs.
 */
export function mapTransactionsToDTO(transactions: Transaction[]): TransactionDTO[] {
  return transactions.map((t) => mapTransactionToDTO(t));
}
