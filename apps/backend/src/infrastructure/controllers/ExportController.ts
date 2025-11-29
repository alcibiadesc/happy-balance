import { Request, Response } from "express";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import { IInvestmentRepository } from "@domain/repositories/IInvestmentRepository";

export interface ExportData {
  exportDate: string;
  version: string;
  user: {
    id: string;
    exportedAt: string;
  };
  data: {
    transactions: any[];
    categories: any[];
    investments: any[];
    investmentHistory: any[];
    summary: {
      totalTransactions: number;
      totalCategories: number;
      totalInvestments: number;
      totalHistoryEntries: number;
      dateRange: {
        from: string | null;
        to: string | null;
      };
    };
  };
}

export class ExportController {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly investmentRepository: IInvestmentRepository,
    private readonly userId: string,
  ) {}

  /**
   * Export all user data as JSON
   */
  async exportAll(req: Request, res: Response): Promise<void> {
    try {
      // Get all transactions
      const transactionsResult = await this.transactionRepository.findWithFilters(
        { includeHidden: true },
        { offset: 0, limit: 100000 },
      );

      if (transactionsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: transactionsResult.getError(),
        });
        return;
      }

      const { transactions } = transactionsResult.getValue();

      // Get all categories
      const categoriesResult = await this.categoryRepository.findAll();

      if (categoriesResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: categoriesResult.getError(),
        });
        return;
      }

      const categories = categoriesResult.getValue();

      // Get all investments with history
      const investmentsResult = await this.investmentRepository.getInvestmentsWithMetrics();

      if (investmentsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: investmentsResult.getError(),
        });
        return;
      }

      const investments = investmentsResult.getValue();

      // Collect all history entries
      const allHistory: any[] = [];
      for (const inv of investments) {
        if (inv.history && Array.isArray(inv.history)) {
          allHistory.push(...inv.history);
        }
      }

      // Calculate date range
      const transactionDates = transactions.map(t => new Date(t.toSnapshot().date).getTime());
      const dateFrom = transactionDates.length > 0
        ? new Date(Math.min(...transactionDates)).toISOString().split('T')[0]
        : null;
      const dateTo = transactionDates.length > 0
        ? new Date(Math.max(...transactionDates)).toISOString().split('T')[0]
        : null;

      // Build export data
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        user: {
          id: this.userId,
          exportedAt: new Date().toISOString(),
        },
        data: {
          transactions: transactions.map(t => t.toSnapshot()),
          categories: categories.map(c => c.toSnapshot()),
          investments: investments.map(inv => ({
            ...inv,
            history: undefined, // Remove history from investment objects (it's in separate array)
          })),
          investmentHistory: allHistory,
          summary: {
            totalTransactions: transactions.length,
            totalCategories: categories.length,
            totalInvestments: investments.length,
            totalHistoryEntries: allHistory.length,
            dateRange: {
              from: dateFrom,
              to: dateTo,
            },
          },
        },
      };

      // Set headers for file download
      const filename = `happy-balance-export-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export data",
      });
    }
  }

  /**
   * Export only transactions
   */
  async exportTransactions(req: Request, res: Response): Promise<void> {
    try {
      const transactionsResult = await this.transactionRepository.findWithFilters(
        { includeHidden: true },
        { offset: 0, limit: 100000 },
      );

      if (transactionsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: transactionsResult.getError(),
        });
        return;
      }

      const { transactions } = transactionsResult.getValue();

      res.json({
        success: true,
        data: {
          exportDate: new Date().toISOString(),
          transactions: transactions.map(t => t.toSnapshot()),
          count: transactions.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to export transactions",
      });
    }
  }

  /**
   * Export only investments with history
   */
  async exportInvestments(req: Request, res: Response): Promise<void> {
    try {
      const investmentsResult = await this.investmentRepository.getInvestmentsWithMetrics();

      if (investmentsResult.isFailure()) {
        res.status(500).json({
          success: false,
          error: investmentsResult.getError(),
        });
        return;
      }

      const investments = investmentsResult.getValue();

      // Get portfolio summary
      const summaryResult = await this.investmentRepository.getPortfolioSummary();
      const summary = summaryResult.isSuccess() ? summaryResult.getValue() : null;

      res.json({
        success: true,
        data: {
          exportDate: new Date().toISOString(),
          investments: investments,
          summary: summary,
          count: investments.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to export investments",
      });
    }
  }
}
