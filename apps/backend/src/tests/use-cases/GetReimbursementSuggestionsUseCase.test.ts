import { describe, it, expect, vi } from 'vitest';
import { GetReimbursementSuggestionsUseCase } from '@application/use-cases/GetReimbursementSuggestionsUseCase';
import { FindPotentialReimbursementsUseCase } from '@application/use-cases/FindPotentialReimbursementsUseCase';
import { Result } from '@domain/shared/Result';
import { Transaction } from '@domain/entities/Transaction';
import { TransactionType } from '@domain/entities/TransactionType';

/**
 * Reproduces the real "Isa" shared-expense pattern observed in production:
 * an INCOME "Lo que me debes de <Merchant>" that is exactly 50% of an EXPENSE
 * with a matching merchant a day or two earlier. Uses the REAL
 * FindPotentialReimbursementsUseCase (only the repository is mocked).
 */
function buildTransaction(opts: {
  id: string;
  amount: number;
  type: TransactionType;
  date: string;
  merchant?: string;
  description?: string;
  linkedTransactionId?: string;
  isReimbursement?: boolean;
}): Transaction {
  const result = Transaction.fromSnapshot({
    id: opts.id,
    amount: opts.amount,
    currency: 'EUR',
    date: opts.date,
    merchant: opts.merchant ?? 'Some Merchant',
    type: opts.type,
    description: opts.description ?? '',
    createdAt: new Date('2026-01-01').toISOString(),
    linkedTransactionId: opts.linkedTransactionId,
    isReimbursement: opts.isReimbursement,
  } as any);
  if (result.isFailure()) {
    throw new Error('Failed to build transaction: ' + result.getError().message);
  }
  return result.getValue();
}

describe('GetReimbursementSuggestionsUseCase', () => {
  let useCase: GetReimbursementSuggestionsUseCase;
  let repo: any;

  function setup(incomes: Transaction[], allInRange: Transaction[]) {
    repo = {
      findById: vi.fn(async (id: any) => {
        const found = [...incomes, ...allInRange].find((t) => t.id.value === id.value);
        return Result.ok(found ?? null);
      }),
      findWithFilters: vi.fn(async (filters: any) => {
        // Our scan call passes type=INCOME; FindPotentialReimbursements passes a date range.
        if (filters.type === TransactionType.INCOME) {
          return Result.ok({ transactions: incomes, totalCount: incomes.length });
        }
        return Result.ok({ transactions: allInRange, totalCount: allInRange.length });
      }),
    };
    const find = new FindPotentialReimbursementsUseCase(repo);
    useCase = new GetReimbursementSuggestionsUseCase(repo, find);
  }

  it('surfaces an Isa-style income with its matching expense at 50% split', async () => {
    const income = buildTransaction({
      id: 'inc-1',
      amount: 72.25,
      type: TransactionType.INCOME,
      date: '2026-05-28',
      merchant: 'Isabel González Matos',
      description: 'Lo que me debes de Mercadona',
    });
    const expense = buildTransaction({
      id: 'exp-1',
      amount: 144.51,
      type: TransactionType.EXPENSE,
      date: '2026-05-27',
      merchant: 'MERCADONA SANTIDAD',
    });
    const decoy = buildTransaction({
      id: 'exp-2',
      amount: 30,
      type: TransactionType.EXPENSE,
      date: '2026-05-27',
      merchant: 'Some Bar',
    });

    setup([income], [income, expense, decoy]);

    const result = await useCase.execute();
    expect(result.isSuccess()).toBe(true);
    const { suggestions, totalScanned } = result.getValue();

    expect(totalScanned).toBe(1);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].income.id).toBe('inc-1');
    expect(suggestions[0].expense.id).toBe('exp-1');
    expect(suggestions[0].suggestedSplitPercentage).toBe(50);
    expect(suggestions[0].matchScore).toBeGreaterThanOrEqual(50);
  });

  it('skips income that is already linked or marked as reimbursement', async () => {
    const linked = buildTransaction({
      id: 'inc-linked',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-05-28',
      description: 'Lo que me debes de ZooPlus',
      linkedTransactionId: 'exp-9',
    });
    const reimb = buildTransaction({
      id: 'inc-reimb',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-05-28',
      isReimbursement: true,
    });

    setup([linked, reimb], [linked, reimb]);

    const result = await useCase.execute();
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().totalScanned).toBe(0);
    expect(result.getValue().suggestions).toHaveLength(0);
  });

  it('respects minScore: a weak match below threshold is dropped', async () => {
    const income = buildTransaction({
      id: 'inc-3',
      amount: 10,
      type: TransactionType.INCOME,
      date: '2026-05-28',
      merchant: 'Alpha',
    });
    // 10 is not a common split % of 999, and merchants/dates won't push it over 50.
    const expense = buildTransaction({
      id: 'exp-3',
      amount: 999,
      type: TransactionType.EXPENSE,
      date: '2026-05-10',
      merchant: 'Bravo',
    });

    setup([income], [income, expense]);

    const result = await useCase.execute({ minScore: 50 });
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().suggestions).toHaveLength(0);
  });
});
