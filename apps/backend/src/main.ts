import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { prisma } from "@infrastructure/database/prisma";
import { PrismaUserRepository } from "@infrastructure/repositories/PrismaUserRepository";
import { AuthController } from "@infrastructure/controllers/AuthController";
import { UserManagementController } from "@infrastructure/controllers/UserManagementController";
import { createTransactionRoutesV2 } from "@infrastructure/routes/transactionRoutesV2";
import { createCategoryRoutesV2 } from "@infrastructure/routes/categoryRoutesV2";
import { createDashboardRoutesV2 } from "@infrastructure/routes/dashboardRoutesV2";
import { createImportRoutesV2 } from "@infrastructure/routes/importRoutesV2";
import { createMetricsRoutesV2 } from "@infrastructure/routes/metricsRoutesV2";
import { createUserPreferencesRoutesV2 } from "@infrastructure/routes/userPreferencesRoutesV2";
import { createSeedRoutesV2 } from "@infrastructure/routes/seedRoutesV2";
import { ControllerFactory } from "@infrastructure/factories/ControllerFactory";
import { createAuthRoutes } from "@infrastructure/routes/authRoutes";
import { createUserManagementRoutes } from "@infrastructure/routes/userManagementRoutes";
import { errorHandler } from "@infrastructure/middleware/errorHandler";
import { swaggerSpec } from "@infrastructure/config/swagger";
import "@infrastructure/routes/swaggerDocs"; // Import for JSDoc annotations
import {
  apiLimiter,
  uploadLimiter,
  dashboardLimiter,
  createTransactionLimiter,
} from "@infrastructure/middleware/rateLimiter";


class App {
  private app: express.Application;
  // Shared repositories (don't need userId)
  private userRepository: PrismaUserRepository;
  private controllerFactory: ControllerFactory;
  private authController!: AuthController;
  private userManagementController!: UserManagementController;

  constructor() {
    this.app = express();
    // Initialize shared repositories
    this.userRepository = new PrismaUserRepository(prisma);
    this.controllerFactory = new ControllerFactory(prisma);
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices() {
    // Initialize auth controller (doesn't need userId)
    this.authController = new AuthController(this.userRepository);
    this.userManagementController = new UserManagementController(this.userRepository);


  }

  private initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());

    // Rate limiting
    this.app.use("/api/", apiLimiter);

    // CORS configuration
    const defaultAllowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5177",
      "http://192.168.1.139:5173",
      "http://100.100.8.83:5173",
    ];

    // Parse CORS_ORIGIN from environment - can be comma-separated list
    const allowedOrigins = [...defaultAllowedOrigins];
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
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

          // For development, allow any localhost origin
          if (
            process.env.NODE_ENV === "development" &&
            origin.includes("localhost")
          ) {
            return callback(null, true);
          }

          // Log rejected origins for debugging
          console.warn(`CORS rejected origin: ${origin}`);
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

    // Swagger documentation
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "Expense Tracker API Documentation"
    }));

    // API routes with specific rate limiters
    this.app.use("/api/transactions/dashboard", dashboardLimiter);
    this.app.post("/api/transactions", createTransactionLimiter);
    this.app.use("/api/import", uploadLimiter);

    // Auth routes (no auth required)
    this.app.use("/api/auth", createAuthRoutes(this.authController));

    // User management routes (admin only)
    this.app.use(
      "/api/admin/users",
      createUserManagementRoutes(this.userManagementController),
    );

    // API routes (auth required for most)
    // Use new V2 routes with controller factory
    this.app.use(
      "/api/transactions",
      createTransactionRoutesV2(this.controllerFactory),
    );
    this.app.use(
      "/api/categories",
      createCategoryRoutesV2(this.controllerFactory),
    );
    this.app.use(
      "/api/dashboard",
      createDashboardRoutesV2(this.controllerFactory),
    );
    this.app.use(
      "/api/import",
      createImportRoutesV2(this.controllerFactory),
    );
    this.app.use(
      "/api/metrics",
      createMetricsRoutesV2(this.controllerFactory),
    );

    // V2 routes using factory pattern for all functionality
    this.app.use(
      "/api/preferences",
      createUserPreferencesRoutesV2(this.controllerFactory),
    );
    this.app.use("/api/seed", createSeedRoutesV2(this.controllerFactory));

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

      // Initial setup is now handled differently with multi-user support
      // Admin user is created via seed script

      // Start server with automatic port detection
      const server = this.app.listen(preferredPort, () => {
        const actualPort = (server.address() as any)?.port || preferredPort;
        console.log("✅ Server is running!");
        console.log(`📍 Port: ${actualPort}`);
        console.log(`🔗 Health check: http://localhost:${actualPort}/health`);
        console.log(`🚀 API Base: http://localhost:${actualPort}/api`);
        console.log(`📚 API Docs: http://localhost:${actualPort}/api-docs`);
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
