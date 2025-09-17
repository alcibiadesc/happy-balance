import { Request, Response } from "express";
import { z } from "zod";
import { TransactionId } from "@domain/value-objects/TransactionId";
import { TransactionDate } from "@domain/value-objects/TransactionDate";
import { Money } from "@domain/value-objects/Money";
import { Merchant } from "@domain/value-objects/Merchant";
import { TransactionType } from "@domain/entities/TransactionType";
import { Transaction } from "@domain/entities/Transaction";
import { CreateTransactionCommand } from "@application/commands/CreateTransactionCommand";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { GetDashboardDataUseCase } from "@application/use-cases/GetDashboardDataUseCase";
import { DashboardQuery } from "@application/queries/DashboardQuery";
import { TransactionListQuery } from "@application/queries/TransactionListQuery";
import { SmartCategorizeTransactionUseCase } from "@application/use-cases/SmartCategorizeTransactionUseCase";

const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().min(1).max(200),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT"]),
  description: z.string().max(200).optional(),
  categoryId: z.string().optional(),
});

const UpdateTransactionSchema = z.object({
  description: z.string().max(200).optional(),
  categoryId: z.string().nullable().optional(),
  hidden: z.boolean().optional(),
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
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT"]).optional(),
  categoryId: z.string().optional(),
  merchantName: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  currency: z.string().min(3).max(3).optional(),
  includeHidden: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const DashboardQuerySchema = z.object({
  period: z
    .enum(["week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  currency: z.string().min(3).max(3).optional().default("EUR"),
  includeInvestments: z.coerce.boolean().optional().default(true),
});

const SmartCategorizeSchema = z.object({
  categoryId: z.string(),
  applyToAll: z.boolean().default(false),
  applyToFuture: z.boolean().default(true),
  createPattern: z.boolean().default(true)
});

export class TransactionController {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly getDashboardDataUseCase: GetDashboardDataUseCase,
    private readonly smartCategorizeUseCase?: SmartCategorizeTransactionUseCase,
  ) {}

  async createTransaction(req: Request, res: Response) {
    try {
      const validationResult = CreateTransactionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: validationResult.error.errors,
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
        data.description || "",
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

      // Include hidden field in the response (new transactions are not hidden)
      const responseData = {
        ...transaction.toSnapshot(),
        hidden: false,
      };

      res.status(201).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const validationResult = TransactionFiltersSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: validationResult.error.errors,
        });
      }

      const filters = validationResult.data;
      const { page, limit, ...transactionFilters } = filters;

      // Build filters object
      const domainFilters: any = {};

      if (transactionFilters.startDate) {
        const dateResult = TransactionDate.fromString(
          transactionFilters.startDate,
        );
        if (dateResult.isSuccess()) {
          domainFilters.startDate = dateResult.getValue();
        }
      }

      if (transactionFilters.endDate) {
        const dateResult = TransactionDate.fromString(
          transactionFilters.endDate,
        );
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

      // By default, exclude hidden transactions unless explicitly requested
      domainFilters.includeHidden = filters.includeHidden;

      const pagination = {
        offset: (page - 1) * limit,
        limit,
      };

      const result = await this.transactionRepository.findWithFilters(
        domainFilters,
        pagination,
      );
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      const { transactions, totalCount } = result.getValue();

      res.json({
        success: true,
        data: {
          transactions: transactions.map((t) => ({
            ...t.toSnapshot(),
            hidden: (t as any).hidden || false,
          })),
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
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

      const result = await this.transactionRepository.findById(
        transactionIdResult.getValue(),
      );
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      const transaction = result.getValue();
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Include hidden field in the response
      const responseData = {
        ...transaction.toSnapshot(),
        hidden: (transaction as any).hidden || false,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
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
          error: "Validation error",
          details: validationResult.error.errors,
        });
      }

      // Find existing transaction
      const existingResult = await this.transactionRepository.findById(
        transactionIdResult.getValue(),
      );
      if (existingResult.isFailure()) {
        return res.status(500).json({ error: existingResult.getError() });
      }

      const existingTransaction = existingResult.getValue();
      if (!existingTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const data = validationResult.data;

      // Update description if provided
      if (data.description !== undefined) {
        const updateResult = existingTransaction.updateDescription(
          data.description,
        );
        if (updateResult.isFailure()) {
          return res.status(400).json({ error: updateResult.getError() });
        }
      }

      // Update hidden status if provided
      if (data.hidden !== undefined) {
        // For now, we'll handle this directly in the repository
        // as it's not a domain concern
        (existingTransaction as any).hidden = data.hidden;
      }

      // Update categoryId if provided
      if (data.categoryId !== undefined) {
        existingTransaction.setCategoryId(data.categoryId);
      }

      // TODO: Add support for updating other fields if needed
      // For now, we only support updating description, hidden, and categoryId

      const saveResult =
        await this.transactionRepository.update(existingTransaction);
      if (saveResult.isFailure()) {
        return res.status(500).json({ error: saveResult.getError() });
      }

      // Include hidden field in the response
      const responseData = {
        ...existingTransaction.toSnapshot(),
        hidden: (existingTransaction as any).hidden || false,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
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

      const result = await this.transactionRepository.delete(
        transactionIdResult.getValue(),
      );
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      res.json({
        success: true,
        message: "Transaction deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getDashboard(req: Request, res: Response) {
    try {
      // Parse with defaults
      const queryData = {
        period: req.query.period || "month",
        currency: req.query.currency || "EUR",
        includeInvestments:
          req.query.includeInvestments === "false" ? false : true,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const validationResult = DashboardQuerySchema.safeParse(queryData);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: validationResult.error.errors,
        });
      }

      const { period, startDate, endDate, currency, includeInvestments } =
        validationResult.data;

      const query = new DashboardQuery(
        currency,
        period,
        startDate,
        endDate,
        includeInvestments,
      );

      const result = await this.getDashboardDataUseCase.execute(query);
      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      res.json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const { startDate, endDate, currency = "EUR" } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
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
        currency as string,
      );

      if (result.isFailure()) {
        return res.status(500).json({ error: result.getError() });
      }

      res.json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteAll(req: Request, res: Response) {
    try {
      // Clear all transactions from the repository
      const result = await this.transactionRepository.clear();

      if (result.isFailure()) {
        return res.status(500).json({
          error: "Failed to delete all transactions",
          message: result.getError(),
        });
      }

      res.json({
        success: true,
        message: "All transactions deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to delete all transactions",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async smartCategorizeTransaction(req: Request, res: Response) {
    try {
      if (!this.smartCategorizeUseCase) {
        return res.status(501).json({
          error: 'Smart categorization is not configured'
        });
      }

      const { id } = req.params;
      const validationResult = SmartCategorizeSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.errors
        });
      }

      const data = validationResult.data;
      const result = await this.smartCategorizeUseCase.execute({
        transactionId: id,
        categoryId: data.categoryId,
        applyToAll: data.applyToAll,
        applyToFuture: data.applyToFuture,
        createPattern: data.createPattern
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.message || 'Failed to categorize transaction'
        });
      }

      res.json({
        success: true,
        categorizedCount: result.categorizedCount,
        patternCreated: result.patternCreated,
        affectedTransactionIds: result.affectedTransactionIds,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
