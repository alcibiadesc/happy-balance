import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { prisma } from '@infrastructure/database/prisma';
import { PrismaTransactionRepository } from '@infrastructure/repositories/PrismaTransactionRepository';
import { PrismaUserPreferencesRepository } from '@infrastructure/repositories/PrismaUserPreferencesRepository';
import { TransactionController } from '@infrastructure/controllers/TransactionController';
import { ImportController } from '@infrastructure/controllers/ImportController';
import { UserPreferencesController } from '@infrastructure/controllers/UserPreferencesController';
import { createTransactionRoutes } from '@infrastructure/routes/transactionRoutes';
import { createImportRoutes } from '@infrastructure/routes/importRoutes';
import { createUserPreferencesRoutes } from '@infrastructure/routes/userPreferencesRoutes';
import { errorHandler } from '@infrastructure/middleware/errorHandler';

// Import use cases and services
import { GetDashboardDataUseCase } from '@application/use-cases/GetDashboardDataUseCase';
import { ImportTransactionsUseCase } from '@application/use-cases/ImportTransactionsUseCase';
import { CheckDuplicateHashesUseCase } from '@application/use-cases/CheckDuplicateHashesUseCase';
import { ImportSelectedTransactionsUseCase } from '@application/use-cases/ImportSelectedTransactionsUseCase';
import { DuplicateDetectionService } from '@domain/services/DuplicateDetectionService';
import { CategorizationService } from '@domain/services/CategorizationService';
import { FinancialCalculationService } from '@domain/services/FinancialCalculationService';
import { TransactionFactory } from './domain/factories/TransactionFactory';

class App {
  private app: express.Application;
  private transactionRepository: PrismaTransactionRepository;
  private userPreferencesRepository: PrismaUserPreferencesRepository;
  private transactionController: TransactionController;
  private importController: ImportController;
  private userPreferencesController: UserPreferencesController;

  constructor() {
    this.app = express();
    this.transactionRepository = new PrismaTransactionRepository(prisma);
    this.userPreferencesRepository = new PrismaUserPreferencesRepository(prisma);
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices() {
    // Domain services
    const duplicateDetectionService = new DuplicateDetectionService();
    const categorizationService = new CategorizationService();
    const financialCalculationService = new FinancialCalculationService();
    const transactionFactory = new TransactionFactory();

    // Application services / Use cases
    const getDashboardDataUseCase = new GetDashboardDataUseCase(
      this.transactionRepository,
      financialCalculationService
    );

    // TODO: Create proper category repository
    const mockCategoryRepository = {
      findActive: async () => ({ isSuccess: () => true, getValue: () => [] })
    } as any;

    const importTransactionsUseCase = new ImportTransactionsUseCase(
      this.transactionRepository,
      mockCategoryRepository,
      duplicateDetectionService,
      categorizationService
    );

    const checkDuplicateHashesUseCase = new CheckDuplicateHashesUseCase(
      this.transactionRepository,
      duplicateDetectionService
    );

    const importSelectedTransactionsUseCase = new ImportSelectedTransactionsUseCase(
      this.transactionRepository,
      duplicateDetectionService,
      transactionFactory
    );

    // Controllers
    this.transactionController = new TransactionController(
      this.transactionRepository,
      getDashboardDataUseCase
    );

    this.importController = new ImportController(
      importTransactionsUseCase,
      checkDuplicateHashesUseCase,
      importSelectedTransactionsUseCase
    );
    this.userPreferencesController = new UserPreferencesController(this.userPreferencesRepository);
  }

  private initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    const allowedOrigins = [
      'http://localhost:5173',
      'http://192.168.1.139:5173',
      'http://100.100.8.83:5173'
    ];

    // Add CORS_ORIGIN from environment if set
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }

    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // For development, also allow any localhost origin
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }

        callback(new Error('CORS policy violation'), false);
      },
      credentials: true
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/transactions', createTransactionRoutes(this.transactionController));
    this.app.use('/api/import', createImportRoutes(this.importController));
    this.app.use('/api/preferences', createUserPreferencesRoutes(this.userPreferencesController));

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`
      });
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  public async start() {
    const port = process.env.PORT || 3000;

    try {
      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connected successfully');

      // Start server
      this.app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${port}/api`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp() {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
app.start();

export default app;