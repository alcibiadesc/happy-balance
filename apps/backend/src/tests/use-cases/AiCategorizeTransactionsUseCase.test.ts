import { describe, it, expect, beforeEach } from 'vitest';
import { AiCategorizeTransactionsUseCase } from '@application/use-cases/AiCategorizeTransactionsUseCase';
import {
  AiCategorizationCandidate,
  AiCategorizationChoice,
  AiCategorizationResult,
  AiCategoryOption,
  IAiCategorizationProvider,
} from '@domain/services/AiCategorizationPort';
import { Transaction } from '@domain/entities/Transaction';
import { Category, CategoryId } from '@domain/entities/Category';
import { Money } from '@domain/value-objects/Money';
import { Merchant } from '@domain/value-objects/Merchant';
import { TransactionDate } from '@domain/value-objects/TransactionDate';
import { TransactionId } from '@domain/value-objects/TransactionId';
import { CategoryType } from '@domain/entities/CategoryType';
import { TransactionType } from '@domain/entities/TransactionType';
import { Result } from '@domain/shared/Result';

function makeTransaction(
  id: string,
  type: TransactionType,
  merchant = 'SUPABASE',
  amount = 21.71
): Transaction {
  return Transaction.create(
    Money.create(amount, 'EUR').getValue(),
    TransactionDate.create(new Date('2026-09-11')).getValue(),
    Merchant.create(merchant).getValue(),
    type,
    '',
    TransactionId.create(id).getValue()
  ).getValue();
}

function makeCategory(id: string, name: string, type: CategoryType): Category {
  return Category.create(name, '#000000', '💰', type, CategoryId.create(id).getValue()).getValue();
}

class StubProvider implements IAiCategorizationProvider {
  readonly name = 'stub';
  readonly model = 'stub-model';
  lastCandidates: AiCategorizationCandidate[] = [];
  lastOptions: AiCategoryOption[] = [];

  constructor(
    private readonly choices: Record<string, AiCategorizationChoice>,
    private readonly configured = true
  ) {}

  isConfigured(): boolean {
    return this.configured;
  }

  async classify(
    candidates: AiCategorizationCandidate[],
    options: AiCategoryOption[]
  ): Promise<AiCategorizationResult> {
    this.lastCandidates = candidates;
    this.lastOptions = options;
    return {
      choices: new Map(Object.entries(this.choices)),
      usage: { inputTokens: 10, outputTokens: 5, batches: 1 },
      warnings: [],
    };
  }
}

function makeRepos(transactions: Transaction[], categories: Category[]) {
  const updated: Transaction[] = [];

  const transactionRepository = {
    findWithFilters: async (filters: any) => {
      // `categoryId: null` is how the caller asks for the uncategorized set.
      const matching =
        filters?.categoryId === null ? transactions.filter((t) => !t.categoryId) : transactions;
      return Result.ok({ transactions: matching, totalCount: matching.length });
    },
    findById: async (id: any) =>
      Result.ok(transactions.find((t) => t.id.value === id.value) ?? null),
    update: async (t: Transaction) => {
      updated.push(t);
      return Result.ok(undefined);
    },
  } as any;

  const categoryRepository = {
    findActive: async () => Result.ok(categories),
  } as any;

  return { transactionRepository, categoryRepository, updated };
}

describe('AiCategorizeTransactionsUseCase', () => {
  let essential: Category;
  let income: Category;
  let transfer: Category;

  beforeEach(() => {
    essential = makeCategory('cat-infra', 'Archivo Abisal - Infra', CategoryType.DISCRETIONARY);
    income = makeCategory('cat-abisal', 'Archivo Abisal', CategoryType.INCOME);
    transfer = makeCategory('cat-transfer', 'Movimiento entre cuentas', CategoryType.NO_COMPUTE);
  });

  it('reports not configured and writes nothing when there is no API key', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE);
    const { transactionRepository, categoryRepository, updated } = makeRepos([tx], [essential]);

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({}, false)
    ).execute({ userId: 'u1', apply: true });

    expect(result.configured).toBe(false);
    expect(result.proposals).toHaveLength(0);
    expect(updated).toHaveLength(0);
    expect(result.warnings[0]).toContain('ANTHROPIC_API_KEY');
  });

  it('proposes without writing when apply is false', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE);
    const { transactionRepository, categoryRepository, updated } = makeRepos([tx], [essential]);

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({
        'tx-1': { categoryId: 'cat-infra', confidence: 0.95, reason: 'infra de la SL' },
      })
    ).execute({ userId: 'u1', apply: false });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].applied).toBe(false);
    expect(result.appliedCount).toBe(0);
    expect(updated).toHaveLength(0);
    expect(tx.categoryId).toBeUndefined();
  });

  it('writes a confident proposal when apply is true', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE);
    const { transactionRepository, categoryRepository, updated } = makeRepos([tx], [essential]);

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({
        'tx-1': { categoryId: 'cat-infra', confidence: 0.95, reason: 'infra de la SL' },
      })
    ).execute({ userId: 'u1', apply: true });

    expect(result.appliedCount).toBe(1);
    expect(updated).toHaveLength(1);
    expect(tx.categoryId?.value).toBe('cat-infra');
  });

  it('proposes but does not write below the confidence threshold', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE);
    const { transactionRepository, categoryRepository, updated } = makeRepos([tx], [essential]);

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({
        'tx-1': { categoryId: 'cat-infra', confidence: 0.4, reason: 'no está claro' },
      })
    ).execute({ userId: 'u1', apply: true, minConfidence: 0.75 });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].applied).toBe(false);
    expect(result.appliedCount).toBe(0);
    expect(updated).toHaveLength(0);
  });

  it('rejects an income category proposed for an expense', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE);
    const { transactionRepository, categoryRepository, updated } = makeRepos(
      [tx],
      [essential, income]
    );

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({
        'tx-1': { categoryId: 'cat-abisal', confidence: 0.99, reason: 'ventas' },
      })
    ).execute({ userId: 'u1', apply: true });

    expect(result.proposals).toHaveLength(0);
    expect(result.appliedCount).toBe(0);
    expect(updated).toHaveLength(0);
    expect(result.rejected[0].reason).toContain('no es compatible');
  });

  it('accepts a no_compute category for either direction', async () => {
    const expense = makeTransaction('tx-1', TransactionType.EXPENSE, 'Cuenta Principal', 1000);
    const incomeTx = makeTransaction('tx-2', TransactionType.INCOME, 'Cuenta de Ahorro', 1000);
    const { transactionRepository, categoryRepository } = makeRepos(
      [expense, incomeTx],
      [essential, transfer]
    );

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({
        'tx-1': { categoryId: 'cat-transfer', confidence: 0.98, reason: 'traspaso' },
        'tx-2': { categoryId: 'cat-transfer', confidence: 0.98, reason: 'traspaso' },
      })
    ).execute({ userId: 'u1', apply: true });

    expect(result.appliedCount).toBe(2);
    expect(expense.categoryId?.value).toBe('cat-transfer');
    expect(incomeTx.categoryId?.value).toBe('cat-transfer');
  });

  it('rejects a category id that is not in the active catalog', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE);
    const { transactionRepository, categoryRepository, updated } = makeRepos([tx], [essential]);

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({
        'tx-1': { categoryId: 'cat-inventada', confidence: 0.99, reason: 'me la he inventado' },
      })
    ).execute({ userId: 'u1', apply: true });

    expect(result.proposals).toHaveLength(0);
    expect(updated).toHaveLength(0);
    expect(result.rejected[0].reason).toContain('inexistente');
  });

  it('counts transactions the model declined as undecided', async () => {
    const tx = makeTransaction('tx-1', TransactionType.EXPENSE, 'COMERCIO RARO SL');
    const { transactionRepository, categoryRepository } = makeRepos([tx], [essential]);

    const result = await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      new StubProvider({})
    ).execute({ userId: 'u1', apply: true });

    expect(result.examined).toBe(1);
    expect(result.undecided).toBe(1);
    expect(result.proposals).toHaveLength(0);
  });

  it('gives the model the user’s own merchants as evidence per category', async () => {
    const categorized = makeTransaction('tx-old', TransactionType.EXPENSE, 'BACKBLAZE INC', 6.76);
    categorized.setCategoryId('cat-infra');
    const pending = makeTransaction('tx-1', TransactionType.EXPENSE, 'TYPESAFE AI, INC.', 43.65);

    const { transactionRepository, categoryRepository } = makeRepos(
      [categorized, pending],
      [essential]
    );
    const provider = new StubProvider({});

    await new AiCategorizeTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      provider
    ).execute({ userId: 'u1' });

    expect(provider.lastCandidates.map((c) => c.id)).toEqual(['tx-1']);
    const infra = provider.lastOptions.find((o) => o.id === 'cat-infra');
    expect(infra?.examples).toContain('BACKBLAZE INC');
  });
});
