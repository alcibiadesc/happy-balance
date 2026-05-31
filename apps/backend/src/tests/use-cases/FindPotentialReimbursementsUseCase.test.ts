import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindPotentialReimbursementsUseCase } from '@application/use-cases/FindPotentialReimbursementsUseCase';
import { Result } from '@domain/shared/Result';
import { Transaction } from '@domain/entities/Transaction';
import { TransactionType } from '@domain/entities/TransactionType';

/**
 * Characterization tests for FindPotentialReimbursementsUseCase.
 *
 * These assert the ACTUAL current behavior of the implementation, including
 * the concrete scoring numbers in calculateMatchScore:
 *   - diff <= 0.01 (cent-exact)      -> +99
 *   - percent 50 or 100 (in tol)     -> +50
 *   - other percents (33/25/75)      -> +30
 *   - date proximity:  <=1 day  -> +20
 *                      <=7 days -> +10
 *                      <=14 days-> +5
 *   - merchant substring match       -> +15
 *   - description substring match    -> +20
 *   - final score capped at 100
 *   - only matches with score > 30 are kept
 *   - sorted descending, capped at top 10
 */

const SOURCE_ID = 'source-tx-1';

/**
 * Build a Transaction via fromSnapshot so we can fully control id, date,
 * currency and linkedTransactionId.
 */
function buildTransaction(opts: {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  currency?: string;
  merchant?: string;
  description?: string;
  linkedTransactionId?: string;
}): Transaction {
  const result = Transaction.fromSnapshot({
    id: opts.id,
    amount: opts.amount,
    currency: opts.currency ?? 'EUR',
    date: opts.date,
    merchant: opts.merchant ?? 'Some Merchant',
    type: opts.type,
    description: opts.description ?? '',
    createdAt: new Date('2026-01-01').toISOString(),
    linkedTransactionId: opts.linkedTransactionId,
  });
  if (result.isFailure()) {
    throw new Error('Failed to build transaction: ' + result.getError().message);
  }
  return result.getValue();
}

describe('FindPotentialReimbursementsUseCase', () => {
  let useCase: FindPotentialReimbursementsUseCase;
  let mockTransactionRepository: any;

  beforeEach(() => {
    mockTransactionRepository = {
      findById: vi.fn(),
      findWithFilters: vi.fn(),
    };
    useCase = new FindPotentialReimbursementsUseCase(mockTransactionRepository);
  });

  /**
   * Configure the repo: findById returns `source`, findWithFilters returns
   * `candidates` (plus the source itself, which the use case should skip).
   */
  function setupRepo(source: Transaction, candidates: Transaction[]) {
    mockTransactionRepository.findById.mockResolvedValue(Result.ok(source));
    mockTransactionRepository.findWithFilters.mockResolvedValue(
      Result.ok({ transactions: [source, ...candidates], total: candidates.length + 1 })
    );
  }

  it('finds INCOME matching 50% of an EXPENSE with cent-exact amount on same day -> high score (99+20=100) and mentions 50%', async () => {
    // Expense 100, income 50 exactly, same day.
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 100,
      type: TransactionType.EXPENSE,
      date: '2026-03-10',
    });
    const candidate = buildTransaction({
      id: 'income-50-exact',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-10',
    });
    setupRepo(source, [candidate]);

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isSuccess()).toBe(true);
    const matches = result.getValue();
    expect(matches).toHaveLength(1);
    // 99 (cent-exact) + 20 (same day) = 119, capped at 100
    expect(matches[0].matchScore).toBe(100);
    expect(matches[0].transaction.id.value).toBe('income-50-exact');
    expect(matches[0].matchReasons.some((r) => r.includes('50%'))).toBe(true);
    expect(matches[0].matchReasons.some((r) => r.includes('Mismo día'))).toBe(true);
  });

  it('a 50% match with amount diff > 1 cent (within tolerance) scores lower than the cent-exact case', async () => {
    // Distinct, non-substring merchant names to avoid the +15 merchant bonus.
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 100,
      type: TransactionType.EXPENSE,
      date: '2026-03-10',
      merchant: 'Alpha Store',
    });
    // 50.50 -> target is 50, diff 0.50 > 0.01 but within 5% tolerance (2.5)
    // percent === 50 branch -> +50, same day +20 = 70
    const candidate = buildTransaction({
      id: 'income-50-approx',
      amount: 50.5,
      type: TransactionType.INCOME,
      date: '2026-03-10',
      merchant: 'Bravo Friend',
    });
    setupRepo(source, [candidate]);

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isSuccess()).toBe(true);
    const matches = result.getValue();
    expect(matches).toHaveLength(1);
    expect(matches[0].matchScore).toBe(70);
    // The approx (50) reason, not the "exactamente" one
    expect(matches[0].matchReasons.some((r) => r.includes('50%'))).toBe(true);
    expect(matches[0].matchReasons.some((r) => r.includes('exactamente'))).toBe(false);
  });

  it('date proximity tiers add documented bonuses (same-day +20, same-week +10, ~2-weeks +5)', async () => {
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 100,
      type: TransactionType.EXPENSE,
      date: '2026-03-15',
    });
    // All cent-exact 50% matches (base 99), differing only by date distance.
    const sameDay = buildTransaction({
      id: 'cand-same-day',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-15',
    });
    const sameWeek = buildTransaction({
      id: 'cand-same-week',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-20', // 5 days
    });
    const twoWeeks = buildTransaction({
      id: 'cand-two-weeks',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-27', // 12 days
    });
    setupRepo(source, [sameDay, sameWeek, twoWeeks]);

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isSuccess()).toBe(true);
    const matches = result.getValue();
    const byId = Object.fromEntries(matches.map((m) => [m.transaction.id.value, m.matchScore]));
    // 99 + 20 = 119 -> capped 100
    expect(byId['cand-same-day']).toBe(100);
    // 99 + 10 = 109 -> capped 100
    expect(byId['cand-same-week']).toBe(100);
    // 99 + 5 = 104 -> capped 100
    expect(byId['cand-two-weeks']).toBe(100);
  });

  it('date bonus tiers are visible when base score is low enough not to cap (33% match: +30 base)', async () => {
    // Use 33.33% match (+30 base) so date bonuses are observable below the cap.
    // Distinct, non-substring merchant names to avoid the +15 merchant bonus.
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 300,
      type: TransactionType.EXPENSE,
      date: '2026-03-15',
      merchant: 'Alpha Store',
    });
    // 33.33% of 300 = 99.99; use 99.99 -> diff ~0 but percent 33.33 -> NOT
    // cent-exact? diff = |99.99 - 99.99| = 0 <= 0.01 -> would be +99.
    // To stay in the +30 branch we need diff > 0.01 yet within tolerance.
    // target = 100, use 102 -> diff 2 (<= 5% tol = 5), percent 33.33 -> +30.
    const sameDay = buildTransaction({
      id: 'p33-same-day',
      amount: 102,
      merchant: 'Bravo Friend',
      type: TransactionType.INCOME,
      date: '2026-03-15',
    });
    const sameWeek = buildTransaction({
      id: 'p33-same-week',
      amount: 102,
      merchant: 'Bravo Friend',
      type: TransactionType.INCOME,
      date: '2026-03-20', // 5 days -> +10
    });
    const twoWeeks = buildTransaction({
      id: 'p33-two-weeks',
      amount: 102,
      merchant: 'Bravo Friend',
      type: TransactionType.INCOME,
      date: '2026-03-27', // 12 days -> +5
    });
    setupRepo(source, [sameDay, sameWeek, twoWeeks]);

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isSuccess()).toBe(true);
    const matches = result.getValue();
    const byId = Object.fromEntries(matches.map((m) => [m.transaction.id.value, m.matchScore]));
    expect(byId['p33-same-day']).toBe(50); // 30 + 20
    expect(byId['p33-same-week']).toBe(40); // 30 + 10
    expect(byId['p33-two-weeks']).toBe(35); // 30 + 5
  });

  it('excludes currency-mismatch, already-linked, wrong-type, and the source itself', async () => {
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 100,
      type: TransactionType.EXPENSE,
      date: '2026-03-10',
      currency: 'EUR',
    });
    // good match (kept)
    const good = buildTransaction({
      id: 'good-income',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-10',
    });
    // currency mismatch -> excluded
    const wrongCurrency = buildTransaction({
      id: 'wrong-currency',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-10',
      currency: 'USD',
    });
    // already linked -> excluded
    const alreadyLinked = buildTransaction({
      id: 'already-linked',
      amount: 50,
      type: TransactionType.INCOME,
      date: '2026-03-10',
      linkedTransactionId: 'some-other-tx',
    });
    // wrong type (expense, not target income) -> excluded
    const wrongType = buildTransaction({
      id: 'wrong-type',
      amount: 50,
      type: TransactionType.EXPENSE,
      date: '2026-03-10',
    });
    setupRepo(source, [good, wrongCurrency, alreadyLinked, wrongType]);

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isSuccess()).toBe(true);
    const matches = result.getValue();
    expect(matches).toHaveLength(1);
    expect(matches[0].transaction.id.value).toBe('good-income');
  });

  it('sorts results descending and caps at 10', async () => {
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 300,
      type: TransactionType.EXPENSE,
      date: '2026-03-15',
    });
    // Build 15 candidates with varying scores by mixing percent matches and
    // date distances so they get distinct, > 30 scores.
    const candidates: Transaction[] = [];
    for (let i = 0; i < 15; i++) {
      // 50% of 300 = 150 cent-exact -> base 99; vary date so score varies a bit.
      // Use far-out dates (within 30-day tolerance window) to keep scores high but distinct.
      const dayOffset = i; // 0..14 days after
      const d = new Date(Date.UTC(2026, 2, 15 + dayOffset));
      const dateStr = d.toISOString().split('T')[0];
      candidates.push(
        buildTransaction({
          id: `cand-${i}`,
          amount: 150,
          type: TransactionType.INCOME,
          date: dateStr,
        })
      );
    }
    setupRepo(source, candidates);

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isSuccess()).toBe(true);
    const matches = result.getValue();
    // capped at 10
    expect(matches.length).toBe(10);
    // sorted descending
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore);
    }
  });

  it('returns failure for INVESTMENT source transaction', async () => {
    const source = buildTransaction({
      id: SOURCE_ID,
      amount: 100,
      type: TransactionType.INVESTMENT,
      date: '2026-03-10',
    });
    mockTransactionRepository.findById.mockResolvedValue(Result.ok(source));

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe(
      'Can only find matches for expense or income transactions'
    );
  });

  it('returns failure when source transaction is not found', async () => {
    mockTransactionRepository.findById.mockResolvedValue(Result.ok(null));

    const result = await useCase.execute({ transactionId: SOURCE_ID });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Source transaction not found');
  });
});
