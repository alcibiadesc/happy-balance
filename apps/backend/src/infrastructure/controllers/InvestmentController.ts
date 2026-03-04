import { Request, Response } from 'express';
import { z } from 'zod';
import { IInvestmentRepository } from '@domain/repositories/IInvestmentRepository';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { TransactionId } from '@domain/value-objects/TransactionId';
import {
  Investment,
  InvestmentId,
  InvestmentHistory,
  InvestmentHistoryId,
} from '@domain/entities/Investment';
import {
  InvestmentHistoryType,
  InvestmentHistoryTypeHelper,
} from '@domain/entities/InvestmentHistoryType';
import { GetPortfolioSummaryUseCase } from '@application/use-cases/GetPortfolioSummaryUseCase';
import { CategoryInvestmentSyncService } from '@domain/services/CategoryInvestmentSyncService';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  validateBody,
  handleResult,
  handleFindResult,
  successResponse,
  createdResponse,
} from '@infrastructure/errors';

// Validation Schemas
const CreateInvestmentSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().max(20).optional(),
  currentValue: z.number().min(0),
  currency: z.string().length(3).default('EUR'),
  categoryId: z.string().optional(),
  highlight: z.boolean().default(false),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateInvestmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().max(20).nullable().optional(),
  currentValue: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  categoryId: z.string().nullable().optional(),
  highlight: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(10).optional(),
  notes: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const InvestmentFiltersSchema = z.object({
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  categoryId: z.string().optional(),
  highlight: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  searchTerm: z.string().optional(),
});

const AddHistoryEntrySchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['CONTRIBUTION', 'WITHDRAWAL', 'VALUE_UPDATE']),
  date: z.string().transform((val) => new Date(val)),
  notes: z.string().max(200).optional(),
});

const UpdateHistorySchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(['CONTRIBUTION', 'WITHDRAWAL', 'VALUE_UPDATE']).optional(),
  date: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  notes: z.string().max(200).optional(),
});

const UpdateSortOrderSchema = z.array(z.object({ id: z.string(), sortOrder: z.number().int() }));

export class InvestmentController {
  private getPortfolioSummaryUseCase: GetPortfolioSummaryUseCase;
  private syncService: CategoryInvestmentSyncService | null = null;

  constructor(
    private readonly investmentRepository: IInvestmentRepository,
    categoryRepository?: ICategoryRepository,
    private readonly transactionRepository?: ITransactionRepository,
    userId?: string
  ) {
    this.getPortfolioSummaryUseCase = new GetPortfolioSummaryUseCase(investmentRepository);
    if (categoryRepository && userId) {
      this.syncService = new CategoryInvestmentSyncService(
        investmentRepository,
        categoryRepository,
        userId
      );
    }
  }

  async getInvestments(req: Request, res: Response): Promise<void> {
    const parsed = InvestmentFiltersSchema.parse(req.query);
    const filters = { ...parsed, isActive: parsed.isActive ?? true };

    const result = await this.investmentRepository.findWithFilters(filters);
    const investments = handleResult(result, 'Failed to fetch investments');

    successResponse(
      res,
      investments.map((inv) => inv.toSnapshot())
    );
  }

  async getInvestment(req: Request, res: Response): Promise<void> {
    const investmentId = handleResult(InvestmentId.create(req.params.id), 'Invalid investment ID');
    const result = await this.investmentRepository.findByIdWithHistory(investmentId);
    const investment = handleFindResult(result, 'Investment');

    successResponse(res, investment.toSnapshot());
  }

  async createInvestment(req: Request, res: Response): Promise<void> {
    const data = validateBody(CreateInvestmentSchema, req);
    const userId = req.user?.userId;

    if (!userId) throw new UnauthorizedError('User not authenticated');

    const existsResult = await this.investmentRepository.existsByName(data.name);
    if (handleResult(existsResult, 'Failed to check investment existence')) {
      throw new ConflictError('Investment with this name already exists');
    }

    const investment = handleResult(
      Investment.create(data.name, data.currentValue ?? 0, data.currency ?? 'EUR', userId, {
        symbol: data.symbol,
        categoryId: data.categoryId,
        highlight: data.highlight ?? false,
        color: data.color,
        icon: data.icon,
        notes: data.notes,
        sortOrder: data.sortOrder,
      }),
      'Failed to create investment'
    );

    handleResult(await this.investmentRepository.save(investment), 'Failed to save investment');

    // Add initial contribution if value > 0
    if ((data.currentValue ?? 0) > 0) {
      const historyResult = InvestmentHistory.create(
        investment.id,
        data.currentValue ?? 0,
        InvestmentHistoryType.CONTRIBUTION,
        new Date(),
        'Initial contribution'
      );
      if (historyResult.isSuccess())
        await this.investmentRepository.addHistoryEntry(historyResult.getValue());
    }

    // Auto-create Category if needed
    if (this.syncService && !data.categoryId) {
      const syncResult = await this.syncService.onInvestmentCreated(investment);
      if (syncResult.isFailure()) console.warn('Failed to sync category:', syncResult.getError());
    }

    const finalResult = await this.investmentRepository.findById(investment.id);
    const finalInvestment = finalResult.isSuccess() ? finalResult.getValue() : investment;

    createdResponse(res, finalInvestment?.toSnapshot() || investment.toSnapshot());
  }

  async updateInvestment(req: Request, res: Response): Promise<void> {
    const investmentId = handleResult(InvestmentId.create(req.params.id), 'Invalid investment ID');
    const data = validateBody(UpdateInvestmentSchema, req);

    const existingResult = await this.investmentRepository.findByIdWithHistory(investmentId);
    const investment = handleFindResult(existingResult, 'Investment');

    const oldValue = investment.currentValue;
    const valueChanged = data.currentValue !== undefined && data.currentValue !== oldValue;

    // Apply updates
    if (data.name !== undefined) investment.changeName(data.name);
    if (data.symbol !== undefined) investment.changeSymbol(data.symbol);
    if (data.currentValue !== undefined) investment.updateCurrentValue(data.currentValue);
    if (data.color !== undefined) investment.changeColor(data.color);
    if (data.icon !== undefined) investment.changeIcon(data.icon);
    if (data.categoryId !== undefined) investment.linkToCategory(data.categoryId);
    if (data.highlight !== undefined) investment.setHighlight(data.highlight);
    if (data.notes !== undefined) investment.updateNotes(data.notes);
    if (data.sortOrder !== undefined) investment.changeSortOrder(data.sortOrder);
    if (data.isActive === false) investment.deactivate();
    else if (data.isActive === true) investment.activate();

    handleResult(await this.investmentRepository.update(investment), 'Failed to update investment');

    // Record value change in history
    if (valueChanged && data.currentValue !== undefined) {
      const historyResult = InvestmentHistory.create(
        investment.id,
        data.currentValue,
        InvestmentHistoryType.VALUE_UPDATE,
        new Date(),
        `Value updated from ${oldValue.toFixed(2)} to ${data.currentValue.toFixed(2)}`
      );
      if (historyResult.isSuccess())
        await this.investmentRepository.addHistoryEntry(historyResult.getValue());
    }

    if (this.syncService) await this.syncService.onInvestmentUpdated(investment);

    successResponse(res, investment.toSnapshot());
  }

  async deleteInvestment(req: Request, res: Response): Promise<void> {
    const investmentId = handleResult(InvestmentId.create(req.params.id), 'Invalid investment ID');

    const investmentResult = await this.investmentRepository.findById(investmentId);
    const investment = handleFindResult(investmentResult, 'Investment');

    handleResult(
      await this.investmentRepository.delete(investmentId),
      'Failed to delete investment'
    );

    if (this.syncService) await this.syncService.onInvestmentDeleted(investment);

    successResponse(res, { message: 'Investment deleted successfully' });
  }

  async deleteAll(_req: Request, res: Response): Promise<void> {
    handleResult(await this.investmentRepository.clear(), 'Failed to delete all investments');
    successResponse(res, { message: 'All investments deleted successfully' });
  }

  async getPortfolioSummary(_req: Request, res: Response): Promise<void> {
    const result = await this.getPortfolioSummaryUseCase.execute();
    successResponse(res, handleResult(result, 'Failed to fetch portfolio summary'));
  }

  async addHistoryEntry(req: Request, res: Response): Promise<void> {
    const investmentId = handleResult(InvestmentId.create(req.params.id), 'Invalid investment ID');
    const data = AddHistoryEntrySchema.parse(req.body);

    const investmentResult = await this.investmentRepository.findByIdWithHistory(investmentId);
    const investment = handleFindResult(investmentResult, 'Investment');

    const historyType = InvestmentHistoryTypeHelper.fromString(data.type);
    if (!historyType) throw new BadRequestError('Invalid history type');

    const historyEntry = handleResult(
      InvestmentHistory.create(investment.id, data.amount, historyType, data.date, data.notes),
      'Failed to create history entry'
    );

    const addResult = await this.investmentRepository.addHistoryEntry(historyEntry);
    handleResult(addResult, 'Failed to save history entry');

    // Update investment value
    if (historyType === InvestmentHistoryType.CONTRIBUTION) {
      investment.updateCurrentValue(investment.currentValue + data.amount);
    } else if (historyType === InvestmentHistoryType.WITHDRAWAL) {
      investment.updateCurrentValue(Math.max(0, investment.currentValue - data.amount));
    } else if (historyType === InvestmentHistoryType.VALUE_UPDATE) {
      investment.updateCurrentValue(data.amount);
    }

    const updateResult = await this.investmentRepository.update(investment);
    handleResult(updateResult, 'Failed to update investment value');

    const updatedResult = await this.investmentRepository.findByIdWithHistory(investment.id);
    const updated = handleFindResult(updatedResult, 'Investment');
    createdResponse(res, updated.toSnapshot());
  }

  async deleteHistoryEntry(req: Request, res: Response): Promise<void> {
    const investmentId = handleResult(InvestmentId.create(req.params.id), 'Invalid investment ID');
    const historyId = handleResult(
      InvestmentHistoryId.create(req.params.historyId),
      'Invalid history entry ID'
    );

    const historyResult = await this.investmentRepository.findHistoryById(historyId);
    const historyEntry = handleFindResult(historyResult, 'History entry');

    handleResult(
      await this.investmentRepository.deleteHistoryEntry(historyId),
      'Failed to delete history entry'
    );

    // Update investment value (reverse the operation)
    const investmentResult = await this.investmentRepository.findByIdWithHistory(investmentId);
    if (investmentResult.isSuccess() && investmentResult.getValue()) {
      const investment = investmentResult.getValue()!;
      if (historyEntry.type === InvestmentHistoryType.CONTRIBUTION) {
        investment.updateCurrentValue(Math.max(0, investment.currentValue - historyEntry.amount));
      } else if (historyEntry.type === InvestmentHistoryType.WITHDRAWAL) {
        investment.updateCurrentValue(investment.currentValue + historyEntry.amount);
      }
      await this.investmentRepository.update(investment);
    }

    // Remove category from linked transaction if exists
    if (historyEntry.transactionId && this.transactionRepository) {
      try {
        const txIdResult = TransactionId.create(historyEntry.transactionId);
        if (txIdResult.isSuccess()) {
          const txResult = await this.transactionRepository.findById(txIdResult.getValue());
          if (txResult.isSuccess() && txResult.getValue()) {
            txResult.getValue()!.setCategoryId(null);
            await this.transactionRepository.update(txResult.getValue()!);
          }
        }
      } catch (e) {
        console.warn(`Failed to unlink transaction ${historyEntry.transactionId}:`, e);
      }
    }

    successResponse(res, { message: 'History entry deleted successfully' });
  }

  async updateHistoryEntry(req: Request, res: Response): Promise<void> {
    const investmentId = handleResult(InvestmentId.create(req.params.id), 'Invalid investment ID');
    const historyId = handleResult(
      InvestmentHistoryId.create(req.params.historyId),
      'Invalid history ID'
    );
    const data = UpdateHistorySchema.parse(req.body);

    const historyResult = await this.investmentRepository.findHistoryById(historyId);
    const history = handleFindResult(historyResult, 'History entry');

    if (data.amount !== undefined) history.updateAmount(data.amount);
    if (data.date !== undefined) history.updateDate(data.date);
    if (data.notes !== undefined) history.updateNotes(data.notes);
    if (data.type !== undefined) {
      const newType = InvestmentHistoryTypeHelper.fromString(data.type);
      if (newType) history.updateType(newType);
    }

    await this.investmentRepository.updateHistoryEntry(history);

    // Recalculate investment value
    const investmentResult = await this.investmentRepository.findByIdWithHistory(investmentId);
    if (investmentResult.isSuccess() && investmentResult.getValue()) {
      const investment = investmentResult.getValue()!;
      let value = 0;
      for (const h of investment.history || []) {
        if (h.type === InvestmentHistoryType.CONTRIBUTION) value += h.amount;
        else if (h.type === InvestmentHistoryType.WITHDRAWAL) value -= h.amount;
        else if (h.type === InvestmentHistoryType.VALUE_UPDATE) value = h.amount;
      }
      investment.updateCurrentValue(Math.max(0, value));
      await this.investmentRepository.update(investment);
    }

    successResponse(res, history.toSnapshot());
  }

  async getHistoryTimeline(req: Request, res: Response): Promise<void> {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const result = await this.investmentRepository.getHistoryTimeline(period, dateFrom, dateTo);
    successResponse(res, handleResult(result, 'Failed to fetch history timeline'));
  }

  async updateSortOrder(req: Request, res: Response): Promise<void> {
    const data = validateBody(UpdateSortOrderSchema, req);
    handleResult(
      await this.investmentRepository.updateSortOrder(data),
      'Failed to update sort order'
    );
    successResponse(res, { message: 'Sort order updated successfully' });
  }

  async getInvestmentsWithMetrics(_req: Request, res: Response): Promise<void> {
    const result = await this.investmentRepository.getInvestmentsWithMetrics();
    successResponse(res, handleResult(result, 'Failed to fetch investments with metrics'));
  }

  async syncWithCategories(_req: Request, res: Response): Promise<void> {
    if (!this.syncService) throw new BadRequestError('Sync service not available');

    const syncResult = await this.syncService.fullSync();
    const result = handleResult(syncResult, 'Failed to sync');

    const totalChanges =
      result.categoriesCreated +
      result.categoriesLinked +
      result.investmentsCreated +
      result.investmentsLinked +
      result.namesUpdated;

    successResponse(res, {
      ...result,
      total: totalChanges,
      message: this.buildSyncMessage(result),
    });
  }

  private buildSyncMessage(result: {
    categoriesCreated: number;
    categoriesLinked: number;
    categoriesReactivated: number;
    investmentsCreated: number;
    investmentsLinked: number;
    investmentsReactivated: number;
    namesUpdated: number;
    colorsUpdated: number;
    iconsUpdated: number;
  }): string {
    const parts: string[] = [];

    if (result.categoriesCreated > 0) {
      parts.push(`${result.categoriesCreated} categorías creadas`);
    }
    if (result.investmentsCreated > 0) {
      parts.push(`${result.investmentsCreated} inversiones creadas`);
    }
    if (result.categoriesLinked + result.investmentsLinked > 0) {
      parts.push(`${result.categoriesLinked + result.investmentsLinked} vinculaciones`);
    }
    if (result.namesUpdated > 0) {
      parts.push(`${result.namesUpdated} nombres actualizados`);
    }
    if (result.colorsUpdated + result.iconsUpdated > 0) {
      parts.push(`${result.colorsUpdated + result.iconsUpdated} estilos sincronizados`);
    }

    if (parts.length === 0) {
      return 'Todo sincronizado, sin cambios necesarios.';
    }

    return parts.join(', ') + '.';
  }

  async importFromGofire(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('User not authenticated');

    const { data } = req.body;
    if (!Array.isArray(data)) throw new BadRequestError('Invalid Gofire format');

    let imported = 0,
      historyCount = 0;

    for (const item of data) {
      const investmentResult = Investment.create(item.title, item.number || 0, 'EUR', userId, {
        highlight: item.hightlight || false,
        color: '#3B82F6',
        icon: '📈',
      });

      if (investmentResult.isFailure()) continue;

      const investment = investmentResult.getValue();
      const saveResult = await this.investmentRepository.save(investment);
      if (saveResult.isFailure()) continue;

      imported++;

      if (Array.isArray(item.saving)) {
        for (const saving of item.saving) {
          const historyType =
            saving.amount < 0
              ? InvestmentHistoryType.WITHDRAWAL
              : InvestmentHistoryType.CONTRIBUTION;
          const historyResult = InvestmentHistory.create(
            investment.id,
            Math.abs(saving.amount),
            historyType,
            new Date(saving.today),
            'Imported from Gofire'
          );
          if (historyResult.isSuccess()) {
            await this.investmentRepository.addHistoryEntry(historyResult.getValue());
            historyCount++;
          }
        }
      }

      if (this.syncService) await this.syncService.onInvestmentCreated(investment);
    }

    successResponse(res, {
      imported,
      historyCount,
      message: `Imported ${imported} investments with ${historyCount} history entries`,
    });
  }

  async exportPortfolio(_req: Request, res: Response): Promise<void> {
    const investmentsResult = await this.investmentRepository.findAll();
    const investments = handleResult(investmentsResult, 'Failed to fetch investments');

    const exportData = [];
    for (const inv of investments) {
      const withHistoryResult = await this.investmentRepository.findByIdWithHistory(inv.id);
      if (withHistoryResult.isSuccess() && withHistoryResult.getValue()) {
        exportData.push(withHistoryResult.getValue()!.toSnapshot());
      }
    }

    successResponse(res, {
      investments: exportData,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    });
  }
}
