import { Request, Response } from 'express';
import { z } from 'zod';
import { TransactionId } from '@domain/value-objects/TransactionId';
import { TransactionDate } from '@domain/value-objects/TransactionDate';
import { Money } from '@domain/value-objects/Money';
import { Merchant } from '@domain/value-objects/Merchant';
import { TransactionType } from '@domain/entities/TransactionType';
import { Transaction } from '@domain/entities/Transaction';
import { CreateTransactionCommand } from '@application/commands/CreateTransactionCommand';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { GetDashboardDataUseCase } from '@application/use-cases/GetDashboardDataUseCase';
import { DashboardQuery } from '@application/queries/DashboardQuery';
import { TransactionListQuery } from '@application/queries/TransactionListQuery';

const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().min(1).max(200),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']),
  description: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional()
});

const UpdateTransactionSchema = CreateTransactionSchema.partial();

const TransactionFiltersSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']).optional(),
  categoryId: z.string().uuid().optional(),
  merchantName: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  currency: z.string().min(3).max(3).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

const DashboardQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().min(3).max(3).default('EUR')
});

export class TransactionController {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly getDashboardDataUseCase: GetDashboardDataUseCase
  ) {}

  async createTransaction(req: Request, res: Response) {
    try {
      const validationResult = CreateTransactionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.errors
        });
      }

      const data = validationResult.data;

      // Create value objects
      const moneyResult = Money.create(data.amount, data.currency);
      if (moneyResult.isFailure()) {
        return res.status(400).json({ error: moneyResult.getError() });
      }

      const dateResult = TransactionDate.fromString(data.date);
      if (dateResult.isFailure()) {
        return res.status(400).json({ error: dateResult.getError() });
      }

      const merchantResult = Merchant.create(data.merchant);
      if (merchantResult.isFailure()) {
        return res.status(400).json({ error: merchantResult.getError() });
      }

      // Create transaction
      const transactionResult = Transaction.create(
        moneyResult.getValue(),
        dateResult.getValue(),
        merchantResult.getValue(),
        data.type as TransactionType,
        data.description || ''
      );

      if (transactionResult.isFailure()) {
        return res.status(400).json({ error: transactionResult.getError() });
      }

      const transaction = transactionResult.getValue();

      // Save transaction
      const saveResult = await this.transactionRepository.save(transaction);
      if (saveResult.isFailure()) {
        return res.status(500).json({ error: saveResult.getError() });
      }

      res.status(201).json({
        success: true,
        data: transaction.toSnapshot()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const validationResult = TransactionFiltersSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.errors
        });
      }

      const filters = validationResult.data;
      const { page, limit, ...transactionFilters } = filters;

      // Build filters object
      const domainFilters: any = {};

      if (transactionFilters.startDate) {
        const dateResult = TransactionDate.fromString(transactionFilters.startDate);
        if (dateResult.isSuccess()) {
          domainFilters.startDate = dateResult.getValue();
        }
      }

      if (transactionFilters.endDate) {
        const dateResult = TransactionDate.fromString(transactionFilters.endDate);
        if (dateResult.isSuccess()) {
          domainFilters.endDate = dateResult.getValue();
        }
      }

      if (transactionFilters.type) {
        domainFilters.type = transactionFilters.type;
      }

      if (transactionFilters.categoryId) {
        domainFilters.categoryId = transactionFilters.categoryId;
      }

      if (transactionFilters.merchantName) {
        domainFilters.merchantName = transactionFilters.merchantName;
      }

      if (transactionFilters.minAmount !== undefined) {
        domainFilters.minAmount = transactionFilters.minAmount;
      }

      if (transactionFilters.maxAmount !== undefined) {
        domainFilters.maxAmount = transactionFilters.maxAmount;
      }

      if (transactionFilters.currency) {
        domainFilters.currency = transactionFilters.currency;
      }

      const pagination = {
        offset: (page - 1) * limit,
        limit
      };

      const result = await this.transactionRepository.findWithFilters(domainFilters, pagination);
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      const { transactions, totalCount } = result.getValue();

      res.json({
        success: true,
        data: {
          transactions: transactions.map(t => t.toSnapshot()),
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transactionIdResult = TransactionId.create(id);
      if (transactionIdResult.isFailure()) {
        return res.status(400).json({ error: transactionIdResult.getError() });
      }

      const result = await this.transactionRepository.findById(transactionIdResult.getValue());
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      const transaction = result.getValue();
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        success: true,
        data: transaction.toSnapshot()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transactionIdResult = TransactionId.create(id);
      if (transactionIdResult.isFailure()) {
        return res.status(400).json({ error: transactionIdResult.getError() });
      }

      const validationResult = UpdateTransactionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.errors
        });
      }

      // Find existing transaction
      const existingResult = await this.transactionRepository.findById(transactionIdResult.getValue());
      if (existingResult.isFailure()) {
        return res.status(500).json({ error: existingResult.getError() });
      }

      const existingTransaction = existingResult.getValue();
      if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const data = validationResult.data;

      // Update description if provided
      if (data.description !== undefined) {
        const updateResult = existingTransaction.updateDescription(data.description);
        if (updateResult.isFailure()) {
          return res.status(400).json({ error: updateResult.getError() });
        }
      }

      // TODO: Add support for updating other fields if needed
      // For now, we only support updating description as other fields
      // would require recreating the transaction due to immutable value objects

      const saveResult = await this.transactionRepository.update(existingTransaction);
      if (saveResult.isFailure()) {
        return res.status(500).json({ error: saveResult.getError() });
      }

      res.json({
        success: true,
        data: existingTransaction.toSnapshot()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transactionIdResult = TransactionId.create(id);
      if (transactionIdResult.isFailure()) {
        return res.status(400).json({ error: transactionIdResult.getError() });
      }

      const result = await this.transactionRepository.delete(transactionIdResult.getValue());
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDashboard(req: Request, res: Response) {
    try {
      const validationResult = DashboardQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.errors
        });
      }

      const { startDate, endDate, currency } = validationResult.data;

      const startDateResult = TransactionDate.fromString(startDate);
      if (startDateResult.isFailure()) {
        return res.status(400).json({ error: startDateResult.getError() });
      }

      const endDateResult = TransactionDate.fromString(endDate);
      if (endDateResult.isFailure()) {
        return res.status(400).json({ error: endDateResult.getError() });
      }

      const query = new DashboardQuery(
        startDateResult.getValue(),
        endDateResult.getValue(),
        currency
      );

      const result = await this.getDashboardDataUseCase.execute(query);
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      res.json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const { startDate, endDate, currency = 'EUR' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const startDateResult = TransactionDate.fromString(startDate as string);
      if (startDateResult.isFailure()) {
        return res.status(400).json({ error: startDateResult.getError() });
      }

      const endDateResult = TransactionDate.fromString(endDate as string);
      if (endDateResult.isFailure()) {
        return res.status(400).json({ error: endDateResult.getError() });
      }

      const result = await this.transactionRepository.getStatistics(
        startDateResult.getValue(),
        endDateResult.getValue(),
        currency as string
      );

      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      res.json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteAll(req: Request, res: Response) {
    try {
      // Clear all transactions from the repository
      const result = await this.transactionRepository.clear();

      if (result.isFailure()) {
        return res.status(500).json({
          error: 'Failed to delete all transactions',
          message: result.getError()
        });
      }

      res.json({
        success: true,
        message: 'All transactions deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete all transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}