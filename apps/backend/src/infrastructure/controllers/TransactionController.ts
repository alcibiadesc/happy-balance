import { Request, Response } from 'express';
import { z } from 'zod';
import { TransactionId } from '@domain/value-objects/TransactionId';
import { TransactionDate } from '@domain/value-objects/TransactionDate';
import { Money } from '@domain/value-objects/Money';
import { Merchant } from '@domain/value-objects/Merchant';
import { TransactionType } from '@domain/entities/TransactionType';
import { Transaction } from '@domain/entities/Transaction';
import { CategoryId } from '@domain/entities/Category';
import { CategoryType } from '@domain/entities/CategoryType';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { GetDashboardDataUseCase } from '@application/use-cases/GetDashboardDataUseCase';
import { DashboardQuery } from '@application/queries/DashboardQuery';
import { SmartCategorizeTransactionUseCase } from '@application/use-cases/SmartCategorizeTransactionUseCase';
import { FindSimilarTransactionsUseCase } from '@application/use-cases/FindSimilarTransactionsUseCase';
import { GetDashboardMetricsUseCase } from '@application/use-cases/GetDashboardMetricsUseCase';
import { FindPotentialReimbursementsUseCase } from '@application/use-cases/FindPotentialReimbursementsUseCase';
import { LinkSplitTransactionsUseCase } from '@application/use-cases/LinkSplitTransactionsUseCase';
import { UnlinkSplitTransactionsUseCase } from '@application/use-cases/UnlinkSplitTransactionsUseCase';
import { SyncInvestmentFromTransactionUseCase } from '@application/use-cases/SyncInvestmentFromTransactionUseCase';
import { UnsyncInvestmentFromTransactionUseCase } from '@application/use-cases/UnsyncInvestmentFromTransactionUseCase';
import { AutoCategorizeTransactionsUseCase } from '@application/use-cases/AutoCategorizeTransactionsUseCase';
import { GetCategorySuggestionsUseCase } from '@application/use-cases/GetCategorySuggestionsUseCase';
import {
  BadRequestError,
  validateBody,
  validateQuery,
  handleResult,
  handleFindResult,
  successResponse,
  createdResponse,
} from '@infrastructure/errors';
import { mapTransactionToDTO } from '@infrastructure/mappers/TransactionMapper';

// Validation Schemas
const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().min(1).max(200),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']),
  description: z.string().max(200).optional(),
  categoryId: z.string().optional(),
});

const UpdateTransactionSchema = z.object({
  description: z.string().max(200).optional(),
  observations: z.string().max(500).optional(),
  categoryId: z.string().nullable().optional(),
  hidden: z.boolean().optional(),
  splitPercentage: z.number().min(0).max(100).optional(),
});

const TransactionFiltersSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']).optional(),
  categoryId: z.string().optional(),
  merchantName: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  currency: z.string().min(3).max(3).optional(),
  includeHidden: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50000).default(50000),
});

const DashboardQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  currency: z.string().min(3).max(3).optional().default('EUR'),
  includeInvestments: z.coerce.boolean().optional().default(true),
  periodOffset: z.coerce.number().min(0).optional().default(0),
});

const SmartCategorizeSchema = z.object({
  categoryId: z.string(),
  applyToAll: z.boolean().default(false),
  applyToFuture: z.boolean().default(true),
  createPattern: z.boolean().default(true),
  selectedTransactionIds: z.array(z.string()).optional(),
});

const MetricsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year', 'custom']).optional().default('month'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  currency: z.string().min(3).max(3).optional().default('EUR'),
  includeInvestments: z.coerce.boolean().optional().default(true),
  periodOffset: z.coerce.number().min(0).optional().default(0),
});

const FindReimbursementsSchema = z.object({
  toleranceDays: z.coerce.number().min(1).max(90).optional().default(30),
  amountTolerancePercent: z.coerce.number().min(0).max(50).optional().default(5),
});

const LinkSplitTransactionsSchema = z.object({
  targetTransactionId: z.string(),
  splitPercentage: z.number().min(0).max(100),
});

const TinderSuggestionsSchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

const PaginatedTransactionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
  sortBy: z.enum(['date', 'amount', 'merchant']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  searchTerm: z.string().max(100).optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']).optional(),
  categoryId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  currency: z.string().min(3).max(3).optional().default('EUR'),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  includeHidden: z.coerce.boolean().optional().default(true),
});

export class TransactionController {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly getDashboardDataUseCase: GetDashboardDataUseCase,
    private readonly smartCategorizeUseCase?: SmartCategorizeTransactionUseCase,
    private readonly findSimilarTransactionsUseCase?: FindSimilarTransactionsUseCase,
    private readonly getDashboardMetricsUseCase?: GetDashboardMetricsUseCase,
    private readonly findPotentialReimbursementsUseCase?: FindPotentialReimbursementsUseCase,
    private readonly linkSplitTransactionsUseCase?: LinkSplitTransactionsUseCase,
    private readonly unlinkSplitTransactionsUseCase?: UnlinkSplitTransactionsUseCase,
    private readonly syncInvestmentUseCase?: SyncInvestmentFromTransactionUseCase,
    private readonly unsyncInvestmentUseCase?: UnsyncInvestmentFromTransactionUseCase,
    private readonly autoCategorizeUseCase?: AutoCategorizeTransactionsUseCase,
    private readonly getCategorySuggestionsUseCase?: GetCategorySuggestionsUseCase,
    private readonly categoryRepository?: ICategoryRepository,
    private readonly userId?: string
  ) {}

  /**
   * Sync investment portfolio when transaction is categorized with investment category
   */
  private async syncInvestmentIfNeeded(
    transaction: Transaction,
    categoryId: string | undefined
  ): Promise<void> {
    if (!this.syncInvestmentUseCase || !this.categoryRepository || !categoryId || !this.userId) {
      if (!categoryId) return; // No category to sync - expected, not an error
      console.warn('[InvestmentSync] Skipped: missing dependencies', {
        hasSyncUseCase: !!this.syncInvestmentUseCase,
        hasCategoryRepo: !!this.categoryRepository,
        hasUserId: !!this.userId,
        categoryId,
      });
      return;
    }

    try {
      const categoryIdVO = CategoryId.create(categoryId);
      if (categoryIdVO.isFailure()) {
        console.error('[InvestmentSync] Invalid categoryId:', categoryId, categoryIdVO.getError());
        return;
      }

      const categoryResult = await this.categoryRepository.findById(categoryIdVO.getValue());
      if (categoryResult.isFailure()) {
        console.error(
          '[InvestmentSync] Failed to fetch category:',
          categoryId,
          categoryResult.getError()
        );
        return;
      }

      const category = categoryResult.getValue();
      if (!category) {
        console.warn('[InvestmentSync] Category not found:', categoryId);
        return;
      }

      if (category.type !== CategoryType.INVESTMENT) {
        return; // Not an investment category - normal flow, no log needed
      }

      const snapshot = transaction.toSnapshot();
      console.log('[InvestmentSync] Syncing transaction to portfolio:', {
        transactionId: snapshot.id,
        categoryId,
        categoryName: category.name,
        amount: snapshot.amount,
      });

      const syncResult = await this.syncInvestmentUseCase.execute({
        transactionId: snapshot.id,
        amount: snapshot.amount,
        date: new Date(snapshot.date),
        categoryId: categoryId,
        categoryName: category.name,
        userId: this.userId,
        transactionDescription: snapshot.description || undefined,
        transactionCounterparty: snapshot.merchant || undefined,
      });

      if (syncResult.isFailure()) {
        console.error('[InvestmentSync] Use case failed:', {
          transactionId: snapshot.id,
          categoryId,
          error: syncResult.getError(),
        });
      } else {
        console.log('[InvestmentSync] Success for transaction:', snapshot.id);
      }
    } catch (error) {
      console.error('[InvestmentSync] Unexpected error:', {
        transactionId: transaction.toSnapshot().id,
        categoryId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Build domain filters from validated query params
   */
  private buildDomainFilters(filters: any): any {
    const domainFilters: any = {};

    if (filters.startDate) {
      const dateResult = TransactionDate.fromString(filters.startDate);
      if (dateResult.isSuccess()) {
        domainFilters.startDate = dateResult.getValue();
      }
    }

    if (filters.endDate) {
      const dateResult = TransactionDate.fromString(filters.endDate);
      if (dateResult.isSuccess()) {
        domainFilters.endDate = dateResult.getValue();
      }
    }

    if (filters.type) domainFilters.type = filters.type;
    if (filters.categoryId) domainFilters.categoryId = filters.categoryId;
    if (filters.merchantName) domainFilters.merchantName = filters.merchantName;
    if (filters.minAmount !== undefined) domainFilters.minAmount = filters.minAmount;
    if (filters.maxAmount !== undefined) domainFilters.maxAmount = filters.maxAmount;
    if (filters.currency) domainFilters.currency = filters.currency;
    if (filters.includeHidden !== undefined) domainFilters.includeHidden = filters.includeHidden;

    return domainFilters;
  }

  /**
   * Format transaction response using shared TransactionDTO type.
   * Amount is ALWAYS positive; `type` determines sign semantics.
   */
  private formatTransactionResponse(transaction: Transaction) {
    return mapTransactionToDTO(transaction);
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    const data = validateBody(CreateTransactionSchema, req);

    const money = handleResult(Money.create(data.amount, data.currency), 'Invalid amount');
    const date = handleResult(TransactionDate.fromString(data.date), 'Invalid date');
    const merchant = handleResult(Merchant.create(data.merchant), 'Invalid merchant');

    const transaction = handleResult(
      Transaction.create(
        money,
        date,
        merchant,
        data.type as TransactionType,
        data.description || ''
      ),
      'Failed to create transaction'
    );

    if (data.categoryId) {
      transaction.setCategoryId(data.categoryId);
    }

    const saveResult = await this.transactionRepository.save(transaction);
    handleResult(saveResult, 'Failed to save transaction');

    if (data.categoryId) {
      await this.syncInvestmentIfNeeded(transaction, data.categoryId);
    }

    createdResponse(res, { ...transaction.toSnapshot(), hidden: false });
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    const filters = validateQuery(TransactionFiltersSchema, req);
    const pageNum = filters.page ?? 1;
    const limitNum = filters.limit ?? 50000;
    const { page, limit, ...transactionFilters } = filters;

    const domainFilters = this.buildDomainFilters(transactionFilters);
    const pagination = { offset: (pageNum - 1) * limitNum, limit: limitNum };

    const result = await this.transactionRepository.findWithFilters(domainFilters, pagination);
    const { transactions, totalCount } = handleResult(result, 'Failed to fetch transactions');

    successResponse(res, {
      transactions: transactions.map((t) => this.formatTransactionResponse(t)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  }

  async getPaginatedTransactions(req: Request, res: Response): Promise<void> {
    const params = validateQuery(PaginatedTransactionSchema, req);
    const pageNum = params.page ?? 1;
    const limitNum = params.limit ?? 50;
    const { page, limit, sortBy, sortOrder, searchTerm, ...filters } = params;

    const domainFilters = this.buildDomainFilters(filters);

    // Handle search term
    if (searchTerm) {
      const numericValue = parseFloat(searchTerm);
      const isNumeric =
        !isNaN(numericValue) &&
        isFinite(numericValue) &&
        searchTerm.trim() === numericValue.toString();

      if (isNumeric && filters.minAmount === undefined && filters.maxAmount === undefined) {
        const tolerance = 0.01;
        domainFilters.minAmount = Math.max(0, numericValue - tolerance);
        domainFilters.maxAmount = numericValue + tolerance;
      } else {
        domainFilters.merchantName = searchTerm;
      }
    }

    const pagination = { offset: (pageNum - 1) * limitNum, limit: limitNum };
    const result = await this.transactionRepository.findWithFilters(domainFilters, pagination);
    const { transactions, totalCount } = handleResult(result, 'Failed to fetch transactions');

    const totalPages = Math.ceil(totalCount / limitNum);

    successResponse(res, {
      transactions: transactions.map((t) => this.formatTransactionResponse(t)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      meta: { sortBy, sortOrder, searchTerm, filters },
    });
  }

  async getTransaction(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const transactionId = handleResult(TransactionId.create(id), 'Invalid transaction ID');

    const result = await this.transactionRepository.findById(transactionId);
    const transaction = handleFindResult(result, 'Transaction');

    successResponse(res, this.formatTransactionResponse(transaction));
  }

  async updateTransaction(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const transactionId = handleResult(TransactionId.create(id), 'Invalid transaction ID');
    const data = validateBody(UpdateTransactionSchema, req);

    const existingResult = await this.transactionRepository.findById(transactionId);
    const transaction = handleFindResult(existingResult, 'Transaction');

    if (data.description !== undefined) {
      handleResult(transaction.updateDescription(data.description), 'Invalid description');
    }

    if (data.observations !== undefined) {
      handleResult(transaction.updateObservations(data.observations), 'Invalid observations');
    }

    if (data.hidden !== undefined) {
      (transaction as any).hidden = data.hidden;
    }

    if (data.categoryId !== undefined) {
      transaction.setCategoryId(data.categoryId);
    }

    if (data.splitPercentage !== undefined) {
      (transaction as any).splitPercentage = data.splitPercentage;
    }

    const saveResult = await this.transactionRepository.update(transaction);
    handleResult(saveResult, 'Failed to update transaction');

    if (data.categoryId !== undefined && data.categoryId !== null) {
      await this.syncInvestmentIfNeeded(transaction, data.categoryId);
    }

    successResponse(res, this.formatTransactionResponse(transaction));
  }

  async deleteTransaction(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const transactionId = handleResult(TransactionId.create(id), 'Invalid transaction ID');

    if (this.unsyncInvestmentUseCase) {
      const unsyncResult = await this.unsyncInvestmentUseCase.execute(id);
      if (unsyncResult.isFailure()) {
        console.warn(`Failed to unsync investment for transaction ${id}:`, unsyncResult.getError());
      }
    }

    const result = await this.transactionRepository.delete(transactionId);
    handleResult(result, 'Failed to delete transaction');

    successResponse(res, { message: 'Transaction deleted successfully' });
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    const queryData = {
      period: req.query.period || 'month',
      currency: req.query.currency || 'EUR',
      includeInvestments: req.query.includeInvestments === 'false' ? false : true,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      periodOffset: req.query.periodOffset ? parseInt(req.query.periodOffset as string, 10) : 0,
    };

    const params = validateQuery(DashboardQuerySchema, { query: queryData } as any);
    const query = new DashboardQuery(
      params.currency,
      params.period,
      params.startDate,
      params.endDate,
      params.includeInvestments,
      params.periodOffset
    );

    const result = await this.getDashboardDataUseCase.execute(query);
    const data = handleResult(result, 'Failed to get dashboard data');

    successResponse(res, data);
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, currency = 'EUR' } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required');
    }

    const start = handleResult(
      TransactionDate.fromString(startDate as string),
      'Invalid start date'
    );
    const end = handleResult(TransactionDate.fromString(endDate as string), 'Invalid end date');

    const result = await this.transactionRepository.getStatistics(start, end, currency as string);
    const stats = handleResult(result, 'Failed to get statistics');

    successResponse(res, stats);
  }

  async deleteAll(_req: Request, res: Response): Promise<void> {
    const result = await this.transactionRepository.clear();
    handleResult(result, 'Failed to delete all transactions');

    successResponse(res, { message: 'All transactions deleted successfully' });
  }

  async smartCategorizeTransaction(req: Request, res: Response): Promise<void> {
    if (!this.smartCategorizeUseCase) {
      throw new BadRequestError('Smart categorization is not configured');
    }

    const { id } = req.params;
    const data = validateBody(SmartCategorizeSchema, req);

    console.log('[SmartCategorize] Request:', {
      transactionId: id,
      categoryId: data.categoryId,
      applyToAll: data.applyToAll,
      applyToFuture: data.applyToFuture,
      createPattern: data.createPattern,
      selectedTransactionIds: data.selectedTransactionIds?.length ?? 0,
      userId: this.userId,
    });

    const result = await this.smartCategorizeUseCase.execute({
      transactionId: id,
      categoryId: data.categoryId,
      applyToAll: data.applyToAll ?? false,
      applyToFuture: data.applyToFuture ?? true,
      createPattern: data.createPattern ?? true,
      selectedTransactionIds: data.selectedTransactionIds,
    });

    if (!result.success) {
      console.error('[SmartCategorize] Failed:', {
        transactionId: id,
        categoryId: data.categoryId,
        message: result.message,
        userId: this.userId,
      });
      throw new BadRequestError(result.message || 'Failed to categorize transaction');
    }

    // Sync investment for all affected transactions categorized with investment category
    if (
      result.affectedTransactionIds?.length > 0 &&
      this.syncInvestmentUseCase &&
      this.categoryRepository
    ) {
      let syncSuccessCount = 0;
      let syncFailCount = 0;
      for (const affectedId of result.affectedTransactionIds) {
        try {
          const txId = TransactionId.create(affectedId);
          if (txId.isFailure()) {
            console.warn('[SmartCategorize] Invalid transaction ID for sync:', affectedId);
            syncFailCount++;
            continue;
          }
          const txResult = await this.transactionRepository.findById(txId.getValue());
          if (txResult.isFailure()) {
            console.warn(
              '[SmartCategorize] Failed to fetch transaction for sync:',
              affectedId,
              txResult.getError()
            );
            syncFailCount++;
            continue;
          }
          const tx = txResult.getValue();
          if (!tx) {
            console.warn('[SmartCategorize] Transaction not found for sync:', affectedId);
            syncFailCount++;
            continue;
          }
          await this.syncInvestmentIfNeeded(tx, data.categoryId);
          syncSuccessCount++;
        } catch (error) {
          syncFailCount++;
          console.error(
            `[SmartCategorize] Failed to sync investment for transaction ${affectedId}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
      if (syncFailCount > 0) {
        console.warn(
          `[SmartCategorize] Investment sync: ${syncSuccessCount} succeeded, ${syncFailCount} failed out of ${result.affectedTransactionIds.length}`
        );
      }
    }

    successResponse(res, {
      categorizedCount: result.categorizedCount,
      patternCreated: result.patternCreated,
      affectedTransactionIds: result.affectedTransactionIds,
      message: result.message,
    });
  }

  async findSimilarTransactions(req: Request, res: Response): Promise<void> {
    if (!this.findSimilarTransactionsUseCase) {
      throw new BadRequestError('Find similar transactions feature is not configured');
    }

    const { id } = req.params;
    const { maxResults = 50, includeHidden = false } = req.query;

    const transactionId = handleResult(TransactionId.create(id), 'Invalid transaction ID');
    const txResult = await this.transactionRepository.findById(transactionId);
    const transaction = handleFindResult(txResult, 'Transaction');

    const snapshot = transaction.toSnapshot();
    const similarResult = await this.findSimilarTransactionsUseCase.execute({
      transactionId: id,
      merchantName: snapshot.merchant,
      description: snapshot.description,
      maxResults: Number(maxResults),
      includeHidden: Boolean(includeHidden),
      transactionType: snapshot.type,
    });

    const similarTransactions = handleResult(similarResult, 'Failed to find similar transactions');

    successResponse(res, {
      sourceTransaction: this.formatTransactionResponse(transaction),
      similarTransactions: similarTransactions.map((item) => ({
        transaction: this.formatTransactionResponse(item.transaction),
        similarity: item.similarity,
      })),
      totalFound: similarTransactions.length,
    });
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    if (!this.getDashboardMetricsUseCase) {
      throw new BadRequestError('Dashboard metrics feature is not configured');
    }

    const query = validateQuery(MetricsQuerySchema, req);
    const result = await this.getDashboardMetricsUseCase.execute({
      currency: query.currency || 'EUR',
      period: query.period || 'month',
      startDate: query.startDate,
      endDate: query.endDate,
      includeInvestments: query.includeInvestments ?? true,
      periodOffset: query.periodOffset ?? 0,
    });

    const metrics = handleResult(result, 'Failed to get metrics');
    successResponse(res, metrics);
  }

  async findPotentialReimbursements(req: Request, res: Response): Promise<void> {
    if (!this.findPotentialReimbursementsUseCase) {
      throw new BadRequestError('Feature not implemented');
    }

    const { id } = req.params;
    const query = validateQuery(FindReimbursementsSchema, req);

    const result = await this.findPotentialReimbursementsUseCase.execute({
      transactionId: id,
      toleranceDays: query.toleranceDays,
      amountTolerancePercent: query.amountTolerancePercent,
    });

    const reimbursements = handleResult(result, 'Failed to find reimbursements');

    successResponse(
      res,
      reimbursements.map((r) => ({
        transaction: r.transaction.toSnapshot(),
        matchScore: r.matchScore,
        matchReasons: r.matchReasons,
      }))
    );
  }

  async linkSplitTransactions(req: Request, res: Response): Promise<void> {
    if (!this.linkSplitTransactionsUseCase) {
      throw new BadRequestError('Feature not implemented');
    }

    const { id } = req.params;
    const data = validateBody(LinkSplitTransactionsSchema, req);

    const result = await this.linkSplitTransactionsUseCase.execute({
      sourceTransactionId: id,
      targetTransactionId: data.targetTransactionId,
      splitPercentage: data.splitPercentage,
    });

    handleResult(result, 'Failed to link transactions');
    successResponse(res, { message: 'Transactions linked successfully' });
  }

  async unlinkSplitTransactions(req: Request, res: Response): Promise<void> {
    if (!this.unlinkSplitTransactionsUseCase) {
      throw new BadRequestError('Feature not implemented');
    }

    const { id } = req.params;
    const result = await this.unlinkSplitTransactionsUseCase.execute({ transactionId: id });
    handleResult(result, 'Failed to unlink transactions');

    successResponse(res, { message: 'Transactions unlinked successfully' });
  }

  async getSuggestionsForTinderMode(req: Request, res: Response): Promise<void> {
    if (!this.getCategorySuggestionsUseCase) {
      throw new BadRequestError('Category suggestions feature is not configured');
    }

    const query = validateQuery(TinderSuggestionsSchema, req);

    const result = await this.getCategorySuggestionsUseCase.execute({
      userId: this.userId || 'default',
      limit: query.limit,
    });

    successResponse(res, result);
  }

  async autoCategorizeTransactions(_req: Request, res: Response): Promise<void> {
    if (!this.autoCategorizeUseCase) {
      throw new BadRequestError('Auto-categorization is not configured');
    }

    const result = await this.autoCategorizeUseCase.execute({ userId: this.userId });

    successResponse(res, {
      categorizedCount: result.categorizedCount,
      patternsApplied: result.patternsApplied,
      normalizedMatches: result.normalizedMatches,
      message: result.message,
    });
  }
}
