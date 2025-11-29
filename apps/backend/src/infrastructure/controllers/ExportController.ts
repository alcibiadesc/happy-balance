import { Request, Response } from "express";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import { IInvestmentRepository } from "@domain/repositories/IInvestmentRepository";
import { Transaction } from "@domain/entities/Transaction";
import { Category } from "@domain/entities/Category";
import { Investment, InvestmentId, InvestmentHistory, InvestmentHistoryId } from "@domain/entities/Investment";
import { InvestmentHistoryType } from "@domain/entities/InvestmentHistoryType";

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

  /**
   * Import all user data from JSON backup
   */
  async importAll(req: Request, res: Response): Promise<void> {
    try {
      const importData = req.body as ExportData;

      if (!importData.data) {
        res.status(400).json({
          success: false,
          error: "Invalid import data format",
        });
        return;
      }

      const results = {
        categories: { imported: 0, failed: 0 },
        transactions: { imported: 0, failed: 0 },
        investments: { imported: 0, failed: 0 },
        investmentHistory: { imported: 0, failed: 0 },
      };

      // 1. Import categories first (transactions depend on them)
      if (importData.data.categories && Array.isArray(importData.data.categories)) {
        for (const catSnapshot of importData.data.categories) {
          try {
            // Update userId to current user
            const categoryData = { ...catSnapshot, userId: this.userId };
            const categoryResult = Category.fromSnapshot(categoryData);

            if (categoryResult.isSuccess()) {
              const category = categoryResult.getValue();
              // Check if category already exists
              const existingResult = await this.categoryRepository.findById(category.id);

              if (existingResult.isSuccess() && existingResult.getValue()) {
                // Update existing
                await this.categoryRepository.update(category);
              } else {
                // Save new
                await this.categoryRepository.save(category);
              }
              results.categories.imported++;
            } else {
              console.warn("Failed to import category:", categoryResult.getError());
              results.categories.failed++;
            }
          } catch (error) {
            console.warn("Error importing category:", error);
            results.categories.failed++;
          }
        }
      }

      // 2. Import transactions
      if (importData.data.transactions && Array.isArray(importData.data.transactions)) {
        for (const txSnapshot of importData.data.transactions) {
          try {
            // Update userId to current user
            const transactionData = { ...txSnapshot, userId: this.userId };
            const transactionResult = Transaction.fromSnapshot(transactionData);

            if (transactionResult.isSuccess()) {
              const transaction = transactionResult.getValue();
              // Check if transaction already exists
              const existingResult = await this.transactionRepository.findById(transaction.id);

              if (existingResult.isSuccess() && existingResult.getValue()) {
                // Update existing
                await this.transactionRepository.update(transaction);
              } else {
                // Save new
                await this.transactionRepository.save(transaction);
              }
              results.transactions.imported++;
            } else {
              console.warn("Failed to import transaction:", transactionResult.getError());
              results.transactions.failed++;
            }
          } catch (error) {
            console.warn("Error importing transaction:", error);
            results.transactions.failed++;
          }
        }
      }

      // 3. Import investments
      if (importData.data.investments && Array.isArray(importData.data.investments)) {
        for (const invSnapshot of importData.data.investments) {
          try {
            // Update userId to current user
            const investmentData = { ...invSnapshot, userId: this.userId };
            const investmentResult = Investment.fromSnapshot(investmentData);

            if (investmentResult.isSuccess()) {
              const investment = investmentResult.getValue();
              // Check if investment already exists
              const existingResult = await this.investmentRepository.findById(investment.id);

              if (existingResult.isSuccess() && existingResult.getValue()) {
                // Update existing
                await this.investmentRepository.update(investment);
              } else {
                // Save new
                await this.investmentRepository.save(investment);
              }
              results.investments.imported++;
            } else {
              console.warn("Failed to import investment:", investmentResult.getError());
              results.investments.failed++;
            }
          } catch (error) {
            console.warn("Error importing investment:", error);
            results.investments.failed++;
          }
        }
      }

      // 4. Import investment history separately if provided
      if (importData.data.investmentHistory && Array.isArray(importData.data.investmentHistory)) {
        for (const histSnapshot of importData.data.investmentHistory) {
          try {
            const historyResult = InvestmentHistory.fromSnapshot(histSnapshot);

            if (historyResult.isSuccess()) {
              const history = historyResult.getValue();
              await this.investmentRepository.addHistoryEntry(history);
              results.investmentHistory.imported++;
            } else {
              console.warn("Failed to import history entry:", historyResult.getError());
              results.investmentHistory.failed++;
            }
          } catch (error) {
            console.warn("Error importing history entry:", error);
            results.investmentHistory.failed++;
          }
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Import complete: ${results.categories.imported} categories, ${results.transactions.imported} transactions, ${results.investments.imported} investments, ${results.investmentHistory.imported} history entries`,
      });
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to import data",
      });
    }
  }
}
