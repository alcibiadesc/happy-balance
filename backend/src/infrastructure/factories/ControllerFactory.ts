import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { TransactionController } from '../controllers/TransactionController';
import { CategoryController } from '../controllers/CategoryController';
import { DashboardController } from '../controllers/DashboardController';
import { MetricsController } from '../controllers/MetricsController';
import { ImportController } from '../controllers/ImportController';
import { UserPreferencesController } from '../controllers/UserPreferencesController';
import { PrismaTransactionRepository } from '../repositories/PrismaTransactionRepository';
import { PrismaCategoryRepository } from '../repositories/PrismaCategoryRepository';
import { PrismaDashboardRepository } from '../repositories/PrismaDashboardRepository';
import { PrismaUserPreferencesRepository } from '../repositories/PrismaUserPreferencesRepository';
import { CategoryPatternRepository } from '../repositories/CategoryPatternRepository';
import { GetDashboardDataUseCase } from '@application/use-cases/GetDashboardDataUseCase';
import { ImportTransactionsUseCase } from '@application/use-cases/ImportTransactionsUseCase';
import { CheckDuplicateHashesUseCase } from '@application/use-cases/CheckDuplicateHashesUseCase';
import { ImportSelectedTransactionsUseCase } from '@application/use-cases/ImportSelectedTransactionsUseCase';
import { SmartCategorizeTransactionUseCase } from '@application/use-cases/SmartCategorizeTransactionUseCase';
import { FindSimilarTransactionsUseCase } from '@application/use-cases/FindSimilarTransactionsUseCase';
import { GetDashboardMetricsUseCase } from '@application/use-cases/GetDashboardMetricsUseCase';
import { DuplicateDetectionService } from '@domain/services/DuplicateDetectionService';
import { CategorizationService } from '@domain/services/CategorizationService';
import { FinancialCalculationService } from '@domain/services/FinancialCalculationService';
import { SmartCategorizationService } from '@domain/services/SmartCategorizationService';
import { TransactionFactory } from '@domain/factories/TransactionFactory';

/**
 * Factory that creates controller instances with user-specific repositories
 */
export class ControllerFactory {
  private prisma: PrismaClient;
  private categoryPatternRepository: CategoryPatternRepository;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.categoryPatternRepository = new CategoryPatternRepository(prisma);
  }

  /**
   * Creates a TransactionController with user-specific repositories
   */
  createTransactionController(userId: string): TransactionController {
    // Create repositories with userId
    const transactionRepository = new PrismaTransactionRepository(this.prisma, userId);
    const categoryRepository = new PrismaCategoryRepository(this.prisma, userId);

    // Domain services
    const financialCalculationService = new FinancialCalculationService();
    const smartCategorizationService = new SmartCategorizationService(
      this.categoryPatternRepository,
      transactionRepository as any,
    );

    // Use cases
    const getDashboardDataUseCase = new GetDashboardDataUseCase(
      transactionRepository,
      categoryRepository,
      financialCalculationService,
    );

    const smartCategorizeUseCase = new SmartCategorizeTransactionUseCase(
      {
        getTransaction: async (id) => {
          const result = await transactionRepository.findById({
            value: id,
          } as any);
          return result.isSuccess() ? result.getValue() : null;
        },
        getCategory: async (id) => {
          const result = await categoryRepository.findById({
            value: id,
          } as any);
          return result.isSuccess() ? result.getValue() : null;
        },
        saveTransaction: async (t) => {
          await transactionRepository.update(t);
        },
        saveTransactions: async (ts) => {
          for (const t of ts) {
            await transactionRepository.update(t);
          }
        },
      },
      smartCategorizationService,
    );

    const findSimilarTransactionsUseCase = new FindSimilarTransactionsUseCase(
      transactionRepository,
    );

    const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      transactionRepository,
      categoryRepository,
    );

    return new TransactionController(
      transactionRepository,
      getDashboardDataUseCase,
      smartCategorizeUseCase,
      findSimilarTransactionsUseCase,
      getDashboardMetricsUseCase,
    );
  }

  /**
   * Creates a CategoryController with user-specific repositories
   */
  createCategoryController(userId: string): CategoryController {
    const categoryRepository = new PrismaCategoryRepository(this.prisma, userId);
    const transactionRepository = new PrismaTransactionRepository(this.prisma, userId);

    return new CategoryController(categoryRepository);
  }

  /**
   * Creates a DashboardController with user-specific repositories
   */
  createDashboardController(userId: string): DashboardController {
    const dashboardRepository = new PrismaDashboardRepository(this.prisma, userId);
    const categoryRepository = new PrismaCategoryRepository(this.prisma, userId);
    const transactionRepository = new PrismaTransactionRepository(this.prisma, userId);

    // Create GetDashboardMetricsUseCase for the controller
    const financialCalculationService = new FinancialCalculationService();
    const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      transactionRepository,
      categoryRepository,
    );

    return new DashboardController(
      getDashboardMetricsUseCase,
      dashboardRepository,
    );
  }

  /**
   * Creates a MetricsController with user-specific repositories
   */
  createMetricsController(userId: string): MetricsController {
    const transactionRepository = new PrismaTransactionRepository(this.prisma, userId);
    const categoryRepository = new PrismaCategoryRepository(this.prisma, userId);

    const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      transactionRepository,
      categoryRepository,
    );

    return new MetricsController(getDashboardMetricsUseCase);
  }

  /**
   * Creates an ImportController with user-specific repositories
   */
  createImportController(userId: string): ImportController {
    const transactionRepository = new PrismaTransactionRepository(this.prisma, userId);
    const categoryRepository = new PrismaCategoryRepository(this.prisma, userId);

    // Domain services
    const duplicateDetectionService = new DuplicateDetectionService();
    const categorizationService = new CategorizationService();
    const transactionFactory = new TransactionFactory();

    // Use cases
    const importTransactionsUseCase = new ImportTransactionsUseCase(
      transactionRepository,
      categoryRepository,
      duplicateDetectionService,
      categorizationService,
    );

    const checkDuplicateHashesUseCase = new CheckDuplicateHashesUseCase(
      transactionRepository,
      duplicateDetectionService,
    );

    const importSelectedTransactionsUseCase = new ImportSelectedTransactionsUseCase(
      transactionRepository,
      duplicateDetectionService,
      transactionFactory,
    );

    return new ImportController(
      importTransactionsUseCase,
      checkDuplicateHashesUseCase,
      importSelectedTransactionsUseCase,
    );
  }

  /**
   * Creates a UserPreferencesController
   */
  createUserPreferencesController(): UserPreferencesController {
    const userPreferencesRepository = new PrismaUserPreferencesRepository(this.prisma);
    return new UserPreferencesController(userPreferencesRepository);
  }
}