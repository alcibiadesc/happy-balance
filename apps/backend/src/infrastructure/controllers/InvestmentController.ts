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

const UpdateSortOrderSchema = z.array(
  z.object({
    id: z.string(),
    sortOrder: z.number().int(),
  })
);

export class InvestmentController {
  private getPortfolioSummaryUseCase: GetPortfolioSummaryUseCase;
  private syncService: CategoryInvestmentSyncService | null = null;

  constructor(
    private readonly investmentRepository: IInvestmentRepository,
    private readonly categoryRepository?: ICategoryRepository,
    private readonly transactionRepository?: ITransactionRepository,
    private readonly userId?: string
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
    try {
      const parsedFilters = InvestmentFiltersSchema.parse(req.query);

      const filters: any = {
        ...parsedFilters,
        // Default to active investments only unless explicitly set
        isActive: parsedFilters.isActive !== undefined ? parsedFilters.isActive : true,
      };

      const result = await this.investmentRepository.findWithFilters(filters);

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      const investments = result.getValue();
      const snapshots = investments.map((inv) => inv.toSnapshot());

      res.json({
        success: true,
        data: snapshots,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        });
        return;
      }

      console.error('Error fetching investments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch investments',
      });
    }
  }

  async getInvestment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const investmentIdResult = InvestmentId.create(id);
      if (investmentIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: 'Invalid investment ID',
        });
        return;
      }

      const result = await this.investmentRepository.findByIdWithHistory(
        investmentIdResult.getValue()
      );

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      const investment = result.getValue();
      if (!investment) {
        res.status(404).json({
          success: false,
          error: 'Investment not found',
        });
        return;
      }

      res.json({
        success: true,
        data: investment.toSnapshot(),
      });
    } catch (error) {
      console.error('Error fetching investment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch investment',
      });
    }
  }

  async createInvestment(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateInvestmentSchema.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      // Check if investment with same name already exists
      const existsResult = await this.investmentRepository.existsByName(validatedData.name);

      if (existsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: existsResult.getError(),
        });
        return;
      }

      if (existsResult.getValue()) {
        res.status(409).json({
          success: false,
          error: 'Investment with this name already exists',
        });
        return;
      }

      // Create investment
      const investmentResult = Investment.create(
        validatedData.name,
        validatedData.currentValue,
        validatedData.currency,
        userId,
        {
          symbol: validatedData.symbol,
          categoryId: validatedData.categoryId,
          highlight: validatedData.highlight,
          color: validatedData.color,
          icon: validatedData.icon,
          notes: validatedData.notes,
          sortOrder: validatedData.sortOrder,
        }
      );

      if (investmentResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: investmentResult.getError(),
        });
        return;
      }

      const investment = investmentResult.getValue();
      const saveResult = await this.investmentRepository.save(investment);

      if (saveResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: saveResult.getError(),
        });
        return;
      }

      // If there's an initial value, add it as initial contribution
      if (validatedData.currentValue > 0) {
        const historyResult = InvestmentHistory.create(
          investment.id,
          validatedData.currentValue,
          InvestmentHistoryType.CONTRIBUTION,
          new Date(),
          'Initial contribution'
        );

        if (historyResult.isSuccess()) {
          await this.investmentRepository.addHistoryEntry(historyResult.getValue());
        }
      }

      // Auto-create Category if investment doesn't have one
      if (this.syncService && !validatedData.categoryId) {
        const syncResult = await this.syncService.onInvestmentCreated(investment);
        if (syncResult.isFailure()) {
          console.warn('Failed to sync category from investment:', syncResult.getError());
        }
      }

      // Get updated investment with potential categoryId
      const finalInvestmentResult = await this.investmentRepository.findById(investment.id);
      const finalInvestment = finalInvestmentResult.isSuccess()
        ? finalInvestmentResult.getValue()
        : investment;

      res.status(201).json({
        success: true,
        data: finalInvestment?.toSnapshot() || investment.toSnapshot(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      console.error('Error creating investment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create investment',
      });
    }
  }

  async updateInvestment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateInvestmentSchema.parse(req.body);

      const investmentIdResult = InvestmentId.create(id);
      if (investmentIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: 'Invalid investment ID',
        });
        return;
      }

      // Get existing investment
      const existingResult = await this.investmentRepository.findByIdWithHistory(
        investmentIdResult.getValue()
      );

      if (existingResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: existingResult.getError(),
        });
        return;
      }

      const existingInvestment = existingResult.getValue();
      if (!existingInvestment) {
        res.status(404).json({
          success: false,
          error: 'Investment not found',
        });
        return;
      }

      // Track if value is being updated for history record
      const oldValue = existingInvestment.currentValue;
      const valueChanged =
        validatedData.currentValue !== undefined && validatedData.currentValue !== oldValue;

      // Update fields
      if (validatedData.name !== undefined) {
        existingInvestment.changeName(validatedData.name);
      }
      if (validatedData.symbol !== undefined) {
        existingInvestment.changeSymbol(validatedData.symbol);
      }
      if (validatedData.currentValue !== undefined) {
        existingInvestment.updateCurrentValue(validatedData.currentValue);
      }
      if (validatedData.color !== undefined) {
        existingInvestment.changeColor(validatedData.color);
      }
      if (validatedData.icon !== undefined) {
        existingInvestment.changeIcon(validatedData.icon);
      }
      if (validatedData.categoryId !== undefined) {
        existingInvestment.linkToCategory(validatedData.categoryId);
      }
      if (validatedData.highlight !== undefined) {
        existingInvestment.setHighlight(validatedData.highlight);
      }
      if (validatedData.notes !== undefined) {
        existingInvestment.updateNotes(validatedData.notes);
      }
      if (validatedData.sortOrder !== undefined) {
        existingInvestment.changeSortOrder(validatedData.sortOrder);
      }
      if (validatedData.isActive === false) {
        existingInvestment.deactivate();
      } else if (validatedData.isActive === true) {
        existingInvestment.activate();
      }

      const updateResult = await this.investmentRepository.update(existingInvestment);

      if (updateResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: updateResult.getError(),
        });
        return;
      }

      // Record value change in history if value was manually updated
      if (valueChanged && validatedData.currentValue !== undefined) {
        const historyResult = InvestmentHistory.create(
          existingInvestment.id,
          validatedData.currentValue,
          InvestmentHistoryType.VALUE_UPDATE,
          new Date(),
          `Value updated from ${oldValue.toFixed(2)} to ${validatedData.currentValue.toFixed(2)}`
        );

        if (historyResult.isSuccess()) {
          await this.investmentRepository.addHistoryEntry(historyResult.getValue());
        }
      }

      // Sync updates to linked category
      if (this.syncService) {
        await this.syncService.onInvestmentUpdated(existingInvestment);
      }

      res.json({
        success: true,
        data: existingInvestment.toSnapshot(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      console.error('Error updating investment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update investment',
      });
    }
  }

  async deleteInvestment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const investmentIdResult = InvestmentId.create(id);
      if (investmentIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: 'Invalid investment ID',
        });
        return;
      }

      // Get investment before deleting for sync
      const investmentResult = await this.investmentRepository.findById(
        investmentIdResult.getValue()
      );

      if (investmentResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: investmentResult.getError(),
        });
        return;
      }

      const investment = investmentResult.getValue();
      if (!investment) {
        res.status(404).json({
          success: false,
          error: 'Investment not found',
        });
        return;
      }

      // Soft delete
      const deleteResult = await this.investmentRepository.delete(investmentIdResult.getValue());

      if (deleteResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: deleteResult.getError(),
        });
        return;
      }

      // Sync deletion to linked category
      if (this.syncService) {
        await this.syncService.onInvestmentDeleted(investment);
      }

      res.json({
        success: true,
        message: 'Investment deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting investment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete investment',
      });
    }
  }

  async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      const clearResult = await this.investmentRepository.clear();

      if (clearResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: clearResult.getError(),
        });
        return;
      }

      res.json({
        success: true,
        message: 'All investments deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting all investments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete all investments',
      });
    }
  }

  async getPortfolioSummary(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getPortfolioSummaryUseCase.execute();

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      res.json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio summary',
      });
    }
  }

  async addHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = AddHistoryEntrySchema.parse(req.body);

      const investmentIdResult = InvestmentId.create(id);
      if (investmentIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: 'Invalid investment ID',
        });
        return;
      }

      // Check if investment exists
      const investmentResult = await this.investmentRepository.findByIdWithHistory(
        investmentIdResult.getValue()
      );

      if (investmentResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: investmentResult.getError(),
        });
        return;
      }

      const investment = investmentResult.getValue();
      if (!investment) {
        res.status(404).json({
          success: false,
          error: 'Investment not found',
        });
        return;
      }

      // Create history entry
      const historyType = InvestmentHistoryTypeHelper.fromString(validatedData.type);
      if (!historyType) {
        res.status(400).json({
          success: false,
          error: 'Invalid history type',
        });
        return;
      }

      const historyResult = InvestmentHistory.create(
        investment.id,
        validatedData.amount,
        historyType,
        validatedData.date,
        validatedData.notes
      );

      if (historyResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: historyResult.getError(),
        });
        return;
      }

      const historyEntry = historyResult.getValue();
      await this.investmentRepository.addHistoryEntry(historyEntry);

      // Update investment current value based on type
      if (historyType === InvestmentHistoryType.CONTRIBUTION) {
        investment.updateCurrentValue(investment.currentValue + validatedData.amount);
      } else if (historyType === InvestmentHistoryType.WITHDRAWAL) {
        investment.updateCurrentValue(Math.max(0, investment.currentValue - validatedData.amount));
      } else if (historyType === InvestmentHistoryType.VALUE_UPDATE) {
        investment.updateCurrentValue(validatedData.amount);
      }

      await this.investmentRepository.update(investment);

      // Return updated investment
      const updatedResult = await this.investmentRepository.findByIdWithHistory(investment.id);

      res.status(201).json({
        success: true,
        data: updatedResult.getValue()?.toSnapshot(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      console.error('Error adding history entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add history entry',
      });
    }
  }

  async deleteHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id, historyId } = req.params;

      const investmentIdResult = InvestmentId.create(id);
      if (investmentIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: 'Invalid investment ID',
        });
        return;
      }

      const historyIdResult = InvestmentHistoryId.create(historyId);
      if (historyIdResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: 'Invalid history entry ID',
        });
        return;
      }

      // Get history entry to know the amount
      const historyResult = await this.investmentRepository.findHistoryById(
        historyIdResult.getValue()
      );

      if (historyResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: historyResult.getError(),
        });
        return;
      }

      const historyEntry = historyResult.getValue();
      if (!historyEntry) {
        res.status(404).json({
          success: false,
          error: 'History entry not found',
        });
        return;
      }

      // Delete the entry
      const deleteResult = await this.investmentRepository.deleteHistoryEntry(
        historyIdResult.getValue()
      );

      if (deleteResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: deleteResult.getError(),
        });
        return;
      }

      // Update investment value (reverse the operation)
      const investmentResult = await this.investmentRepository.findByIdWithHistory(
        investmentIdResult.getValue()
      );

      if (investmentResult.isSuccess() && investmentResult.getValue()) {
        const investment = investmentResult.getValue()!;

        if (historyEntry.type === InvestmentHistoryType.CONTRIBUTION) {
          investment.updateCurrentValue(Math.max(0, investment.currentValue - historyEntry.amount));
        } else if (historyEntry.type === InvestmentHistoryType.WITHDRAWAL) {
          investment.updateCurrentValue(investment.currentValue + historyEntry.amount);
        }

        await this.investmentRepository.update(investment);
      }

      // If history entry was linked to a transaction, remove the category from that transaction
      if (historyEntry.transactionId && this.transactionRepository) {
        try {
          const txIdResult = TransactionId.create(historyEntry.transactionId);
          if (txIdResult.isSuccess()) {
            const transactionResult = await this.transactionRepository.findById(
              txIdResult.getValue()
            );
            if (transactionResult.isSuccess() && transactionResult.getValue()) {
              const transaction = transactionResult.getValue()!;
              // Remove the category from the transaction
              transaction.setCategoryId(null);
              await this.transactionRepository.update(transaction);
            }
          }
        } catch (e) {
          console.warn(
            `Failed to remove category from linked transaction ${historyEntry.transactionId}:`,
            e
          );
          // Continue anyway, the history entry is already deleted
        }
      }

      res.json({
        success: true,
        message: 'History entry deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting history entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete history entry',
      });
    }
  }

  async getHistoryTimeline(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const result = await this.investmentRepository.getHistoryTimeline(period, dateFrom, dateTo);

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      res.json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('Error fetching history timeline:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch history timeline',
      });
    }
  }

  async updateSortOrder(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = UpdateSortOrderSchema.parse(req.body);

      const sortOrders = validatedData.map((item) => ({
        id: item.id,
        sortOrder: item.sortOrder,
      }));

      const result = await this.investmentRepository.updateSortOrder(sortOrders);

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      res.json({
        success: true,
        message: 'Sort order updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      console.error('Error updating sort order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update sort order',
      });
    }
  }

  async getInvestmentsWithMetrics(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.investmentRepository.getInvestmentsWithMetrics();

      if (result.isFailure()) {
        res.status(500).json({
          success: false,
          error: result.getError(),
        });
        return;
      }

      res.json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('Error fetching investments with metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch investments with metrics',
      });
    }
  }

  /**
   * Sync all existing investments with categories
   * Creates category for investments without categoryId
   */
  async syncWithCategories(req: Request, res: Response): Promise<void> {
    try {
      if (!this.syncService) {
        res.status(400).json({
          success: false,
          error: 'Sync service not available',
        });
        return;
      }

      // Use the optimized sync method
      const syncResult = await this.syncService.syncAllInvestmentsToCategories();

      if (syncResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: syncResult.getError(),
        });
        return;
      }

      const { created, linked } = syncResult.getValue();

      res.json({
        success: true,
        data: {
          created,
          linked,
          total: created + linked,
        },
        message: `Created ${created} new categories and linked ${linked} existing ones.`,
      });
    } catch (error) {
      console.error('Error syncing investments with categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync investments with categories',
      });
    }
  }

  /**
   * Import from Gofire backup format
   */
  async importFromGofire(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const { data } = req.body;
      if (!Array.isArray(data)) {
        res.status(400).json({ success: false, error: 'Invalid Gofire format' });
        return;
      }

      let imported = 0;
      let historyCount = 0;

      for (const item of data) {
        // Create investment
        const investmentResult = Investment.create(item.title, item.number || 0, 'EUR', userId, {
          highlight: item.hightlight || false,
          color: '#3B82F6',
          icon: '📈',
        });

        if (investmentResult.isFailure()) {
          console.warn(`Failed to create investment ${item.title}:`, investmentResult.getError());
          continue;
        }

        const investment = investmentResult.getValue();
        const saveResult = await this.investmentRepository.save(investment);

        if (saveResult.isFailure()) {
          console.warn(`Failed to save investment ${item.title}:`, saveResult.getError());
          continue;
        }

        imported++;

        // Import history (savings)
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
              `Imported from Gofire`
            );

            if (historyResult.isSuccess()) {
              await this.investmentRepository.addHistoryEntry(historyResult.getValue());
              historyCount++;
            }
          }
        }

        // Auto-create category if sync service available
        if (this.syncService) {
          await this.syncService.onInvestmentCreated(investment);
        }
      }

      res.json({
        success: true,
        data: { imported, historyCount },
        message: `Imported ${imported} investments with ${historyCount} history entries`,
      });
    } catch (error) {
      console.error('Error importing from Gofire:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import from Gofire',
      });
    }
  }

  /**
   * Export portfolio data
   */
  async exportPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const investmentsResult = await this.investmentRepository.findAll();
      if (investmentsResult.isFailure()) {
        res.status(500).json({ success: false, error: investmentsResult.getError() });
        return;
      }

      const investments = investmentsResult.getValue();
      const exportData = [];

      for (const inv of investments) {
        const withHistoryResult = await this.investmentRepository.findByIdWithHistory(inv.id);
        if (withHistoryResult.isSuccess() && withHistoryResult.getValue()) {
          const fullInv = withHistoryResult.getValue()!;
          exportData.push(fullInv.toSnapshot());
        }
      }

      res.json({
        success: true,
        data: {
          investments: exportData,
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (error) {
      console.error('Error exporting portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export portfolio',
      });
    }
  }

  /**
   * Update history entry
   */
  async updateHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id, historyId } = req.params;
      const { amount, date, notes, type } = req.body;

      const historyIdResult = InvestmentHistoryId.create(historyId);
      if (historyIdResult.isFailure()) {
        res.status(400).json({ success: false, error: 'Invalid history ID' });
        return;
      }

      const historyResult = await this.investmentRepository.findHistoryById(
        historyIdResult.getValue()
      );
      if (historyResult.isFailure()) {
        res.status(500).json({ success: false, error: historyResult.getError() });
        return;
      }

      const history = historyResult.getValue();
      if (!history) {
        res.status(404).json({ success: false, error: 'History entry not found' });
        return;
      }

      // Update fields
      if (amount !== undefined) {
        history.updateAmount(amount);
      }
      if (date !== undefined) {
        history.updateDate(new Date(date));
      }
      if (notes !== undefined) {
        history.updateNotes(notes);
      }
      if (type !== undefined) {
        const newType = InvestmentHistoryTypeHelper.fromString(type);
        if (newType) {
          history.updateType(newType);
        }
      }

      await this.investmentRepository.updateHistoryEntry(history);

      // Recalculate investment value
      const investmentIdResult = InvestmentId.create(id);
      if (investmentIdResult.isSuccess()) {
        const investmentResult = await this.investmentRepository.findByIdWithHistory(
          investmentIdResult.getValue()
        );
        if (investmentResult.isSuccess() && investmentResult.getValue()) {
          const investment = investmentResult.getValue()!;
          // Recalculate from history
          const historyEntries = investment.history || [];
          let value = 0;
          for (const h of historyEntries) {
            if (h.type === InvestmentHistoryType.CONTRIBUTION) {
              value += h.amount;
            } else if (h.type === InvestmentHistoryType.WITHDRAWAL) {
              value -= h.amount;
            } else if (h.type === InvestmentHistoryType.VALUE_UPDATE) {
              value = h.amount;
            }
          }
          investment.updateCurrentValue(Math.max(0, value));
          await this.investmentRepository.update(investment);
        }
      }

      res.json({
        success: true,
        data: history.toSnapshot(),
      });
    } catch (error) {
      console.error('Error updating history entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update history entry',
      });
    }
  }
}
