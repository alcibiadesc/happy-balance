import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { prisma } from "@infrastructure/database/prisma";
import { PrismaUserRepository } from "@infrastructure/repositories/PrismaUserRepository";
import { PrismaUserPreferencesRepository } from "@infrastructure/repositories/PrismaUserPreferencesRepository";
import { AuthController } from "@infrastructure/controllers/AuthController";
import { UserManagementController } from "@infrastructure/controllers/UserManagementController";
import { createTransactionRoutesV2 } from "@infrastructure/routes/transactionRoutesV2";
import { createCategoryRoutesV2 } from "@infrastructure/routes/categoryRoutesV2";
import { createDashboardRoutesV2 } from "@infrastructure/routes/dashboardRoutesV2";
import { createImportRoutesV2 } from "@infrastructure/routes/importRoutesV2";
import { createMetricsRoutesV2 } from "@infrastructure/routes/metricsRoutesV2";
import { createUserPreferencesRoutesV2 } from "@infrastructure/routes/userPreferencesRoutesV2";
import { createSeedRoutesV2 } from "@infrastructure/routes/seedRoutesV2";
import { createInvestmentRoutesV2 } from "@infrastructure/routes/investmentRoutesV2";
import { createExportRoutes } from "@infrastructure/routes/exportRoutesV2";
import { createWidgetSettingsRoutesV2 } from "@infrastructure/routes/widgetSettingsRoutesV2";
import { createBackupRoutes } from "@infrastructure/routes/backupRoutes";
import { ControllerFactory } from "@infrastructure/factories/ControllerFactory";
import {
  initializeBackupScheduler,
  stopBackupScheduler,
} from "@infrastructure/jobs/backupScheduler";
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
import { seedAdminUser } from "./scripts/seed-admin";


class App {
  private app: express.Application;
  // Shared repositories (don't need userId)
  private userRepository: PrismaUserRepository;
  private userPreferencesRepository: PrismaUserPreferencesRepository;
  private controllerFactory: ControllerFactory;
  private authController!: AuthController;
  private userManagementController!: UserManagementController;

  constructor() {
    this.app = express();
    // Initialize shared repositories
    this.userRepository = new PrismaUserRepository(prisma);
    this.userPreferencesRepository = new PrismaUserPreferencesRepository(prisma);
    this.controllerFactory = new ControllerFactory(prisma);
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices() {
    // Initialize auth controller (doesn't need userId)
    this.authController = new AuthController(this.userRepository);
    this.userManagementController = new UserManagementController(
      this.userRepository,
      this.userPreferencesRepository
    );


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

          // Check if wildcard CORS is enabled (for zero-config deployment)
          if (process.env.CORS_ORIGIN === "*") {
            return callback(null, true);
          }

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

    // Version endpoint
    this.app.get("/version", (req, res) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const versionFile = path.join(process.cwd(), ".version.json");

        if (fs.existsSync(versionFile)) {
          const versionData = JSON.parse(fs.readFileSync(versionFile, "utf8"));
          res.json(versionData);
        } else {
          // Fallback for local development
          const packageJson = require("../../../package.json");
          res.json({
            version: packageJson.version || "unknown",
            commit: "local-dev",
            buildTimestamp: new Date().toISOString(),
            component: "backend",
            environment: process.env.NODE_ENV || "development"
          });
        }
      } catch (error) {
        res.status(500).json({
          error: "Failed to read version information",
          version: "unknown"
        });
      }
    });

    // Check for updates endpoint
    this.app.get("/api/system/check-updates", async (req, res) => {
      try {
        const https = require("https");
        const fs = require("fs");
        const path = require("path");

        // Get current version
        const versionFile = path.join(process.cwd(), ".version.json");
        let currentVersion = { version: "unknown", commit: "local-dev" };

        if (fs.existsSync(versionFile)) {
          currentVersion = JSON.parse(fs.readFileSync(versionFile, "utf8"));
        }

        // Check Docker Hub for latest image labels
        const dockerHubUrl = "https://hub.docker.com/v2/repositories/alcibiadesc/happy-balance/tags/backend-latest";

        https.get(dockerHubUrl, (response: any) => {
          let data = "";
          response.on("data", (chunk: any) => { data += chunk; });
          response.on("end", () => {
            try {
              const imageInfo = JSON.parse(data);
              const latestCommit = imageInfo.name?.split("-").pop() || "unknown";

              res.json({
                current: currentVersion,
                latest: {
                  version: imageInfo.tag_last_pushed ? "latest" : "unknown",
                  commit: latestCommit,
                  lastPushed: imageInfo.tag_last_pushed
                },
                updateAvailable: currentVersion.commit !== latestCommit && currentVersion.commit !== "local-dev"
              });
            } catch (error) {
              res.json({
                current: currentVersion,
                latest: null,
                updateAvailable: false,
                error: "Could not parse Docker Hub response"
              });
            }
          });
        }).on("error", () => {
          res.json({
            current: currentVersion,
            latest: null,
            updateAvailable: false,
            error: "Could not reach Docker Hub"
          });
        });
      } catch (error) {
        res.status(500).json({
          error: "Failed to check for updates",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Trigger update endpoint (requires proper permissions)
    this.app.post("/api/system/update", async (req, res) => {
      try {
        const { exec } = require("child_process");
        const path = require("path");

        // Find the update script
        const scriptPath = path.join(process.cwd(), "../../../scripts/update-docker.sh");

        // Execute the update script
        exec(scriptPath, (error: any, stdout: string, stderr: string) => {
          if (error) {
            console.error("Update error:", error);
            return res.status(500).json({
              success: false,
              error: "Failed to execute update script",
              details: error.message,
              stderr: stderr,
              note: "This operation may require additional Docker permissions. Consider running the update script manually: ./scripts/update-docker.sh"
            });
          }

          res.json({
            success: true,
            message: "Update initiated successfully. The application will restart with the latest version.",
            output: stdout
          });
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to trigger update",
          details: error instanceof Error ? error.message : String(error),
          note: "This operation may require additional Docker permissions. Consider running the update script manually: ./scripts/update-docker.sh"
        });
      }
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

    // Widget Settings routes
    this.app.use(
      "/api/widgets",
      createWidgetSettingsRoutesV2(this.controllerFactory),
    );

    // Investment/Portfolio routes
    this.app.use(
      "/api/investments",
      createInvestmentRoutesV2(this.controllerFactory),
    );

    // Export routes
    this.app.use(
      "/api/export",
      createExportRoutes(this.controllerFactory),
    );

    // Backup routes
    this.app.use("/api/backups", createBackupRoutes());

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
    const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 14040;

    try {
      // Test database connection
      await prisma.$connect();

      // Automatically seed admin user on startup
      await seedAdminUser();

      // Initialize backup scheduler
      initializeBackupScheduler();

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
  stopBackupScheduler();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  stopBackupScheduler();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
app.start();

export default app;
