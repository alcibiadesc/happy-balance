import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { prisma } from "@infrastructure/database/prisma";
import { PrismaTransactionRepository } from "@infrastructure/repositories/PrismaTransactionRepository";
import { PrismaUserPreferencesRepository } from "@infrastructure/repositories/PrismaUserPreferencesRepository";
import { PrismaCategoryRepository } from "@infrastructure/repositories/PrismaCategoryRepository";
import { TransactionController } from "@infrastructure/controllers/TransactionController";
import { ImportController } from "@infrastructure/controllers/ImportController";
import { UserPreferencesController } from "@infrastructure/controllers/UserPreferencesController";
import { SeedController } from "@infrastructure/controllers/SeedController";
import { CategoryController } from "@infrastructure/controllers/CategoryController";
import { MetricsController } from "@infrastructure/controllers/MetricsController";
import { createTransactionRoutes } from "@infrastructure/routes/transactionRoutes";
import { createImportRoutes } from "@infrastructure/routes/importRoutes";
import { createUserPreferencesRoutes } from "@infrastructure/routes/userPreferencesRoutes";
import { createSeedRoutes } from "@infrastructure/routes/seedRoutes";
import { createCategoryRoutes } from "@infrastructure/routes/categoryRoutes";
import { createMetricsRoutes } from "@infrastructure/routes/metricsRoutes";
import { errorHandler } from "@infrastructure/middleware/errorHandler";
import {
  apiLimiter,
  uploadLimiter,
  dashboardLimiter,
  createTransactionLimiter,
} from "@infrastructure/middleware/rateLimiter";

// Import use cases and services
import { GetDashboardDataUseCase } from "@application/use-cases/GetDashboardDataUseCase";
import { ImportTransactionsUseCase } from "@application/use-cases/ImportTransactionsUseCase";
import { CheckDuplicateHashesUseCase } from "@application/use-cases/CheckDuplicateHashesUseCase";
import { ImportSelectedTransactionsUseCase } from "@application/use-cases/ImportSelectedTransactionsUseCase";
import { SmartCategorizeTransactionUseCase } from "@application/use-cases/SmartCategorizeTransactionUseCase";
import { FindSimilarTransactionsUseCase } from "@application/use-cases/FindSimilarTransactionsUseCase";
import { GetDashboardMetricsUseCase } from "@application/use-cases/GetDashboardMetricsUseCase";
import { DuplicateDetectionService } from "@domain/services/DuplicateDetectionService";
import { CategorizationService } from "@domain/services/CategorizationService";
import { FinancialCalculationService } from "@domain/services/FinancialCalculationService";
import { SmartCategorizationService } from "@domain/services/SmartCategorizationService";
import { InitialSetupService } from "@domain/services/InitialSetupService";
import { TransactionFactory } from "./domain/factories/TransactionFactory";
import { CategoryPatternRepository } from "@infrastructure/repositories/CategoryPatternRepository";

class App {
  private app: express.Application;
  private transactionRepository: PrismaTransactionRepository;
  private categoryRepository: PrismaCategoryRepository;
  private userPreferencesRepository: PrismaUserPreferencesRepository;
  private categoryPatternRepository: CategoryPatternRepository;
  private transactionController!: TransactionController;
  private importController!: ImportController;
  private userPreferencesController!: UserPreferencesController;
  private seedController!: SeedController;
  private categoryController!: CategoryController;
  private metricsController!: MetricsController;
  private initialSetupService!: InitialSetupService;

  constructor() {
    this.app = express();
    this.transactionRepository = new PrismaTransactionRepository(prisma);
    this.categoryRepository = new PrismaCategoryRepository(prisma);
    this.userPreferencesRepository = new PrismaUserPreferencesRepository(
      prisma,
    );
    this.categoryPatternRepository = new CategoryPatternRepository(prisma);
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
    const smartCategorizationService = new SmartCategorizationService(
      this.categoryPatternRepository,
      this.transactionRepository as any,
    );

    // Application services / Use cases
    const getDashboardDataUseCase = new GetDashboardDataUseCase(
      this.transactionRepository,
      this.categoryRepository,
      financialCalculationService,
    );

    const importTransactionsUseCase = new ImportTransactionsUseCase(
      this.transactionRepository,
      this.categoryRepository,
      duplicateDetectionService,
      categorizationService,
    );

    const checkDuplicateHashesUseCase = new CheckDuplicateHashesUseCase(
      this.transactionRepository,
      duplicateDetectionService,
    );

    const importSelectedTransactionsUseCase =
      new ImportSelectedTransactionsUseCase(
        this.transactionRepository,
        duplicateDetectionService,
        transactionFactory,
      );

    // Smart categorization use case
    const smartCategorizeUseCase = new SmartCategorizeTransactionUseCase(
      {
        getTransaction: async (id) => {
          const result = await this.transactionRepository.findById({
            value: id,
          } as any);
          return result.isSuccess() ? result.getValue() : null;
        },
        getCategory: async (id) => {
          const result = await this.categoryRepository.findById({
            value: id,
          } as any);
          return result.isSuccess() ? result.getValue() : null;
        },
        saveTransaction: async (t) => {
          await this.transactionRepository.update(t);
        },
        saveTransactions: async (ts) => {
          for (const t of ts) {
            await this.transactionRepository.update(t);
          }
        },
      },
      smartCategorizationService,
    );

    // Find similar transactions use case
    const findSimilarTransactionsUseCase = new FindSimilarTransactionsUseCase(
      this.transactionRepository,
    );

    // Dashboard metrics use case
    const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      this.transactionRepository,
      this.categoryRepository,
    );

    // Controllers
    this.transactionController = new TransactionController(
      this.transactionRepository,
      getDashboardDataUseCase,
      smartCategorizeUseCase,
      findSimilarTransactionsUseCase,
      getDashboardMetricsUseCase,
    );

    this.importController = new ImportController(
      importTransactionsUseCase,
      checkDuplicateHashesUseCase,
      importSelectedTransactionsUseCase,
    );
    this.userPreferencesController = new UserPreferencesController(
      this.userPreferencesRepository,
    );

    this.seedController = new SeedController(
      this.categoryRepository,
      this.userPreferencesRepository,
    );

    this.categoryController = new CategoryController(this.categoryRepository);

    this.metricsController = new MetricsController(
      getDashboardMetricsUseCase,
    );

    // Initialize setup service
    this.initialSetupService = new InitialSetupService(
      this.categoryRepository,
      this.transactionRepository,
      this.seedController,
    );
  }

  private initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());

    // Rate limiting
    this.app.use("/api/", apiLimiter);

    // CORS configuration
    const allowedOrigins = [
      "http://localhost:5173",
      "http://192.168.1.139:5173",
      "http://100.100.8.83:5173",
    ];

    // Add CORS_ORIGIN from environment if set
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) return callback(null, true);

          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          // For development, also allow any localhost origin
          if (
            process.env.NODE_ENV === "development" &&
            origin.includes("localhost")
          ) {
            return callback(null, true);
          }

          callback(new Error("CORS policy violation"), false);
        },
        credentials: true,
      }),
    );

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  }

  private initializeRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API routes with specific rate limiters
    this.app.use("/api/transactions/dashboard", dashboardLimiter);
    this.app.post("/api/transactions", createTransactionLimiter);
    this.app.use("/api/import", uploadLimiter);

    // API routes
    this.app.use(
      "/api/transactions",
      createTransactionRoutes(this.transactionController),
    );
    this.app.use("/api/import", createImportRoutes(this.importController));
    this.app.use(
      "/api/preferences",
      createUserPreferencesRoutes(this.userPreferencesController),
    );
    this.app.use("/api/seed", createSeedRoutes(this.seedController));
    this.app.use(
      "/api/categories",
      createCategoryRoutes(this.categoryController),
    );
    this.app.use(
      "/api/metrics",
      createMetricsRoutes(this.metricsController),
    );

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  public async start() {
    const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    try {
      // Test database connection
      await prisma.$connect();

      // Perform initial setup if database is empty
      const setupResult =
        await this.initialSetupService.performInitialSetupIfNeeded();
      if (setupResult.isFailure()) {
        console.error("❌ Initial setup failed:", setupResult.getError());
        process.exit(1);
      }

      // Start server with automatic port detection
      const server = this.app.listen(preferredPort, () => {
        const actualPort = (server.address() as any)?.port || preferredPort;
        console.log("✅ Server is running!");
        console.log(`📍 Port: ${actualPort}`);
        console.log(`🔗 Health check: http://localhost:${actualPort}/health`);
        console.log(`🚀 API Base: http://localhost:${actualPort}/api`);
      });

      server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          console.log(`⚠️ Port ${preferredPort} is in use, finding another...`);
          // Let Node.js find an available port
          const fallbackServer = this.app.listen(0, () => {
            const actualPort = (fallbackServer.address() as any)?.port;
            console.log("✅ Server is running on fallback port!");
            console.log(`📍 Port: ${actualPort}`);
            console.log(
              `🔗 Health check: http://localhost:${actualPort}/health`,
            );
            console.log(`🚀 API Base: http://localhost:${actualPort}/api`);
          });
        } else {
          throw error;
        }
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
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
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
app.start();

export default app;
