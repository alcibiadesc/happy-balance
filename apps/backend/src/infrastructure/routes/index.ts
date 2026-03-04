import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { ControllerFactory } from '@infrastructure/factories/ControllerFactory';
import { AuthController } from '@infrastructure/controllers/AuthController';
import { UserManagementController } from '@infrastructure/controllers/UserManagementController';
import { createTransactionRoutes } from '@infrastructure/routes/transactionRoutes';
import { createCategoryRoutes } from '@infrastructure/routes/categoryRoutes';
import { createDashboardRoutes } from '@infrastructure/routes/dashboardRoutes';
import { createImportRoutes } from '@infrastructure/routes/importRoutes';
import { createMetricsRoutes } from '@infrastructure/routes/metricsRoutes';
import { createUserPreferencesRoutes } from '@infrastructure/routes/userPreferencesRoutes';
import { createSeedRoutes } from '@infrastructure/routes/seedRoutes';
import { createInvestmentRoutes } from '@infrastructure/routes/investmentRoutes';
import { createExportRoutes } from '@infrastructure/routes/exportRoutes';
import { createWidgetSettingsRoutes } from '@infrastructure/routes/widgetSettingsRoutes';
import { createBackupRoutes } from '@infrastructure/routes/backupRoutes';
import { createMerchantAliasRoutes } from '@infrastructure/routes/merchantAliasRoutes';
import { createAuthRoutes } from '@infrastructure/routes/authRoutes';
import { createUserManagementRoutes } from '@infrastructure/routes/userManagementRoutes';
import { createSystemRoutes } from '@infrastructure/routes/systemRoutes';
import { errorHandler } from '@infrastructure/middleware/errorHandler';
import { swaggerSpec } from '@infrastructure/config/swagger';
import '@infrastructure/routes/swaggerDocs';
import {
  uploadLimiter,
  dashboardLimiter,
  createTransactionLimiter,
} from '@infrastructure/middleware/rateLimiter';

interface RouteDependencies {
  controllerFactory: ControllerFactory;
  authController: AuthController;
  userManagementController: UserManagementController;
}

/**
 * Register all application routes on the Express app.
 *
 * Route map:
 *   GET/POST       /api/auth/*            - Authentication (login, refresh)
 *   GET/POST/PATCH /api/admin/users/*     - User management (admin only)
 *   GET/POST/PUT/DELETE /api/transactions/* - Transaction CRUD + smart categorize
 *   GET/POST/PUT/DELETE /api/categories/*  - Category CRUD
 *   GET            /api/dashboard/*       - Dashboard metrics
 *   GET            /api/metrics/*         - Period stats, trends
 *   POST           /api/import/*          - CSV/Excel import
 *   GET            /api/export/*          - CSV/JSON export
 *   GET/PUT        /api/preferences       - User preferences
 *   GET/POST/PUT/DELETE /api/investments/* - Investment portfolio
 *   GET/POST/PUT/DELETE /api/widgets/*     - Widget settings
 *   GET/POST       /api/backups/*         - Database backups
 *   GET/POST/PUT/DELETE /api/merchant-aliases/* - Merchant alias rules
 *   POST           /api/seed/*            - Development seed data
 *   GET            /health                - Health check
 *   GET            /version               - Version info
 *   GET            /api/system/*          - System updates
 */
export function registerRoutes(app: express.Application, deps: RouteDependencies): void {
  const { controllerFactory, authController, userManagementController } = deps;

  // System routes (health, version, updates)
  app.use('/', createSystemRoutes());

  // Swagger documentation
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Expense Tracker API Documentation',
    })
  );

  // Route-specific rate limiters
  app.use('/api/transactions/dashboard', dashboardLimiter);
  app.post('/api/transactions', createTransactionLimiter);
  app.use('/api/import', uploadLimiter);

  // Auth routes (no auth required)
  app.use('/api/auth', createAuthRoutes(authController));

  // User management routes (admin only)
  app.use('/api/admin/users', createUserManagementRoutes(userManagementController));

  // Core API routes
  app.use('/api/transactions', createTransactionRoutes(controllerFactory));
  app.use('/api/categories', createCategoryRoutes(controllerFactory));
  app.use('/api/dashboard', createDashboardRoutes(controllerFactory));
  app.use('/api/import', createImportRoutes(controllerFactory));
  app.use('/api/metrics', createMetricsRoutes(controllerFactory));
  app.use('/api/preferences', createUserPreferencesRoutes(controllerFactory));
  app.use('/api/seed', createSeedRoutes(controllerFactory));
  app.use('/api/widgets', createWidgetSettingsRoutes(controllerFactory));
  app.use('/api/investments', createInvestmentRoutes(controllerFactory));
  app.use('/api/export', createExportRoutes(controllerFactory));
  app.use('/api/backups', createBackupRoutes());
  app.use('/api/merchant-aliases', createMerchantAliasRoutes(controllerFactory));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);
}
