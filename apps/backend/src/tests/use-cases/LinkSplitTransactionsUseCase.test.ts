import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkSplitTransactionsUseCase } from '@application/use-cases/LinkSplitTransactionsUseCase';
import { Result } from '@domain/shared/Result';
import { Transaction } from '@domain/entities/Transaction';
import { TransactionType } from '@domain/entities/TransactionType';
import { TransactionId } from '@domain/value-objects/TransactionId';
import { Money } from '@domain/value-objects/Money';
import { TransactionDate } from '@domain/value-objects/TransactionDate';
import { Merchant } from '@domain/value-objects/Merchant';

function createTransaction(
  amount: number,
  type: TransactionType,
  id: string,
  merchant = 'Test'
): Transaction {
  const money = Money.create(amount, 'EUR').getValue();
  const date = TransactionDate.create(new Date()).getValue();
  const merchantObj = Merchant.create(merchant).getValue();
  const txId = TransactionId.create(id).getValue();
  return Transaction.create(money, date, merchantObj, type, '', txId).getValue();
}

describe('LinkSplitTransactionsUseCase', () => {
  let useCase: LinkSplitTransactionsUseCase;
  let mockTransactionRepository: any;

  beforeEach(() => {
    mockTransactionRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    useCase = new LinkSplitTransactionsUseCase(mockTransactionRepository);
  });

  describe('split percentage validation', () => {
    it('fails and does not call save when splitPercentage < 0', async () => {
      const result = await useCase.execute({
        sourceTransactionId: 'expense-001',
        targetTransactionId: 'income-001',
        splitPercentage: -1,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Split percentage must be between 0 and 100');
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionRepository.findById).not.toHaveBeenCalled();
    });

    it('fails and does not call save when splitPercentage > 100', async () => {
      const result = await useCase.execute({
        sourceTransactionId: 'expense-001',
        targetTransactionId: 'income-001',
        splitPercentage: 101,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Split percentage must be between 0 and 100');
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('source=EXPENSE / target=INCOME', () => {
    it('sets split on expense and marks income as reimbursement, saving both', async () => {
      const expense = createTransaction(100, TransactionType.EXPENSE, 'expense-001');
      const income = createTransaction(50, TransactionType.INCOME, 'income-001');

      const expenseSetSplit = vi.spyOn(expense, 'setSplitPercentage');
      const expenseLink = vi.spyOn(expense, 'linkToTransaction');
      const incomeMark = vi.spyOn(income, 'markAsReimbursement');
      const incomeLink = vi.spyOn(income, 'linkToTransaction');

      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'expense-001') return Promise.resolve(Result.ok(expense));
        if (id.value === 'income-001') return Promise.resolve(Result.ok(income));
        return Promise.resolve(Result.ok(null));
      });
      mockTransactionRepository.save.mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({
        sourceTransactionId: 'expense-001',
        targetTransactionId: 'income-001',
        splitPercentage: 50,
      });

      expect(result.isSuccess()).toBe(true);

      // Expense got split percentage + link to income
      expect(expenseSetSplit).toHaveBeenCalledWith(50);
      expect(expenseLink).toHaveBeenCalledWith(income.id);

      // Income marked as reimbursement + linked back to expense
      expect(incomeMark).toHaveBeenCalledTimes(1);
      expect(incomeLink).toHaveBeenCalledWith(expense.id);

      // Both persisted
      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(2);
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(expense);
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(income);

      // End state
      expect(expense.splitPercentage).toBe(50);
      expect(expense.linkedTransactionId?.value).toBe('income-001');
      expect(income.isReimbursement).toBe(true);
      expect(income.linkedTransactionId?.value).toBe('expense-001');
    });
  });

  describe('source=INCOME / target=EXPENSE (roles swapped)', () => {
    it('produces the same end state regardless of argument order', async () => {
      const income = createTransaction(50, TransactionType.INCOME, 'income-002');
      const expense = createTransaction(100, TransactionType.EXPENSE, 'expense-002');

      const expenseSetSplit = vi.spyOn(expense, 'setSplitPercentage');
      const expenseLink = vi.spyOn(expense, 'linkToTransaction');
      const incomeMark = vi.spyOn(income, 'markAsReimbursement');
      const incomeLink = vi.spyOn(income, 'linkToTransaction');

      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'income-002') return Promise.resolve(Result.ok(income));
        if (id.value === 'expense-002') return Promise.resolve(Result.ok(expense));
        return Promise.resolve(Result.ok(null));
      });
      mockTransactionRepository.save.mockResolvedValue(Result.ok(undefined));

      // source is the INCOME, target is the EXPENSE
      const result = await useCase.execute({
        sourceTransactionId: 'income-002',
        targetTransactionId: 'expense-002',
        splitPercentage: 40,
      });

      expect(result.isSuccess()).toBe(true);

      // Expense still receives the split + link, even though it was the target
      expect(expenseSetSplit).toHaveBeenCalledWith(40);
      expect(expenseLink).toHaveBeenCalledWith(income.id);

      // Income still gets marked + linked, even though it was the source
      expect(incomeMark).toHaveBeenCalledTimes(1);
      expect(incomeLink).toHaveBeenCalledWith(expense.id);

      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(2);

      expect(expense.splitPercentage).toBe(40);
      expect(expense.linkedTransactionId?.value).toBe('income-002');
      expect(income.isReimbursement).toBe(true);
      expect(income.linkedTransactionId?.value).toBe('expense-002');
    });
  });

  describe('invalid type combinations', () => {
    it('fails when both transactions are EXPENSE', async () => {
      const a = createTransaction(100, TransactionType.EXPENSE, 'expense-aaa');
      const b = createTransaction(80, TransactionType.EXPENSE, 'expense-bbb');

      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'expense-aaa') return Promise.resolve(Result.ok(a));
        if (id.value === 'expense-bbb') return Promise.resolve(Result.ok(b));
        return Promise.resolve(Result.ok(null));
      });
      mockTransactionRepository.save.mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({
        sourceTransactionId: 'expense-aaa',
        targetTransactionId: 'expense-bbb',
        splitPercentage: 50,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Transactions must be one EXPENSE and one INCOME');
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('fails when both transactions are INCOME', async () => {
      const a = createTransaction(100, TransactionType.INCOME, 'income-aaa');
      const b = createTransaction(80, TransactionType.INCOME, 'income-bbb');

      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'income-aaa') return Promise.resolve(Result.ok(a));
        if (id.value === 'income-bbb') return Promise.resolve(Result.ok(b));
        return Promise.resolve(Result.ok(null));
      });
      mockTransactionRepository.save.mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({
        sourceTransactionId: 'income-aaa',
        targetTransactionId: 'income-bbb',
        splitPercentage: 50,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Transactions must be one EXPENSE and one INCOME');
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('missing transactions', () => {
    it("fails with 'Source transaction not found' when source is null", async () => {
      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'missing-src') return Promise.resolve(Result.ok(null));
        return Promise.resolve(Result.ok(null));
      });

      const result = await useCase.execute({
        sourceTransactionId: 'missing-src',
        targetTransactionId: 'income-001',
        splitPercentage: 50,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Source transaction not found');
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });

    it("fails with 'Target transaction not found' when target is null", async () => {
      const expense = createTransaction(100, TransactionType.EXPENSE, 'expense-001');

      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'expense-001') return Promise.resolve(Result.ok(expense));
        return Promise.resolve(Result.ok(null));
      });

      const result = await useCase.execute({
        sourceTransactionId: 'expense-001',
        targetTransactionId: 'missing-tgt',
        splitPercentage: 50,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Target transaction not found');
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('repository save failure', () => {
    it('propagates a failing save as a failure result', async () => {
      const expense = createTransaction(100, TransactionType.EXPENSE, 'expense-001');
      const income = createTransaction(50, TransactionType.INCOME, 'income-001');

      mockTransactionRepository.findById.mockImplementation((id: TransactionId) => {
        if (id.value === 'expense-001') return Promise.resolve(Result.ok(expense));
        if (id.value === 'income-001') return Promise.resolve(Result.ok(income));
        return Promise.resolve(Result.ok(null));
      });
      mockTransactionRepository.save.mockResolvedValue(Result.failWithMessage('DB write failed'));

      const result = await useCase.execute({
        sourceTransactionId: 'expense-001',
        targetTransactionId: 'income-001',
        splitPercentage: 50,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('DB write failed');
    });
  });
});
