import type { Transaction, Category } from '$lib/types/transaction';
import type { TransactionDTO, CategoryDTO } from '@happy-balance/shared-types';

/**
 * Map API transaction DTO (wire format) to frontend Transaction ViewModel.
 *
 * Key transformation: Backend sends positive amounts with type field.
 * Frontend uses signed amounts (negative for EXPENSE) for display.
 *
 * Traceability: TransactionDTO (@happy-balance/shared-types) → Transaction ($lib/types)
 */
export function mapApiToTransaction(apiTransaction: TransactionDTO): Transaction {
  return {
    id: apiTransaction.id,
    date: apiTransaction.date,
    time: new Date(apiTransaction.createdAt).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    merchant: apiTransaction.merchant,
    description: apiTransaction.description || '',
    amount: apiTransaction.type === 'EXPENSE' ? -apiTransaction.amount : apiTransaction.amount,
    type: apiTransaction.type, // Preserve original transaction type
    categoryId: apiTransaction.categoryId,
    category: undefined,
    status: 'completed' as const,
    tags: [],
    patternHash: undefined,
    hash: apiTransaction.hash,
    createdAt: new Date(apiTransaction.createdAt),
    updatedAt: new Date(apiTransaction.updatedAt || apiTransaction.createdAt),
    hidden: apiTransaction.hidden || false,
    observations: apiTransaction.observations || undefined,
    splitPercentage: apiTransaction.splitPercentage,
    linkedTransactionId: apiTransaction.linkedTransactionId,
    isReimbursement: apiTransaction.isReimbursement || false,
  };
}

/**
 * Map API category DTO (wire format) to frontend Category ViewModel.
 *
 * Traceability: CategoryDTO (@happy-balance/shared-types) → Category ($lib/types)
 */
export function mapApiToCategory(apiCategory: CategoryDTO): Category {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    type: apiCategory.type,
    color: apiCategory.color || '#3B82F6',
    icon: apiCategory.icon || '💰',
    annualBudget: apiCategory.annualBudget || 0,
  };
}

/**
 * Prepare transaction payload for API update
 */
export function prepareTransactionUpdatePayload(
  updates: Partial<Transaction>
): Record<string, any> {
  const payload: Record<string, any> = {};

  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.hidden !== undefined) payload.hidden = updates.hidden;
  if ('categoryId' in updates) payload.categoryId = updates.categoryId;
  if (updates.observations !== undefined) payload.observations = updates.observations;
  if (updates.splitPercentage !== undefined) payload.splitPercentage = updates.splitPercentage;

  if (updates.amount !== undefined) {
    payload.amount = Math.abs(updates.amount);
    payload.type = updates.amount < 0 ? 'EXPENSE' : 'INCOME';
  }

  return payload;
}
