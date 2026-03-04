import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { ControllerFactory } from '@infrastructure/factories/ControllerFactory';
import { AuthController } from '@infrastructure/controllers/AuthController';
import { MagicLinkController } from '@infrastructure/controllers/MagicLinkController';
import { UserManagementController } from '@infrastructure/controllers/UserManagementController';
import { createTransactionRoutesV2 } from '@infrastructure/routes/transactionRoutesV2';
import { createCategoryRoutesV2 } from '@infrastructure/routes/categoryRoutesV2';
import { createDashboardRoutesV2 } from '@infrastructure/routes/dashboardRoutesV2';
import { createImportRoutesV2 } from '@infrastructure/routes/importRoutesV2';
import { createMetricsRoutesV2 } from '@infrastructure/routes/metricsRoutesV2';
import { createUserPreferencesRoutesV2 } from '@infrastructure/routes/userPreferencesRoutesV2';
import { createSeedRoutesV2 } from '@infrastructure/routes/seedRoutesV2';
import { createInvestmentRoutesV2 } from '@infrastructure/routes/investmentRoutesV2';
import { createExportRoutes } from '@infrastructure/routes/exportRoutesV2';
import { createWidgetSettingsRoutesV2 } from '@infrastructure/routes/widgetSettingsRoutesV2';
import { createBackupRoutes } from '@infrastructure/routes/backupRoutes';
import { createMerchantAliasRoutesV2 } from '@infrastructure/routes/merchantAliasRoutesV2';
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
  magicLinkController?: MagicLinkController;
}

/**
 * Register all application routes on the Express app
 */
export function registerRoutes(app: express.Application, deps: RouteDependencies): void {
  const { controllerFactory, authController, userManagementController, magicLinkController } = deps;

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
  app.use('/api/auth', createAuthRoutes(authController, magicLinkController));

  // User management routes (admin only)
  app.use('/api/admin/users', createUserManagementRoutes(userManagementController));

  // API routes (auth required for most)
  app.use('/api/transactions', createTransactionRoutesV2(controllerFactory));
  app.use('/api/categories', createCategoryRoutesV2(controllerFactory));
  app.use('/api/dashboard', createDashboardRoutesV2(controllerFactory));
  app.use('/api/import', createImportRoutesV2(controllerFactory));
  app.use('/api/metrics', createMetricsRoutesV2(controllerFactory));
  app.use('/api/preferences', createUserPreferencesRoutesV2(controllerFactory));
  app.use('/api/seed', createSeedRoutesV2(controllerFactory));
  app.use('/api/widgets', createWidgetSettingsRoutesV2(controllerFactory));
  app.use('/api/investments', createInvestmentRoutesV2(controllerFactory));
  app.use('/api/export', createExportRoutes(controllerFactory));
  app.use('/api/backups', createBackupRoutes());
  app.use('/api/merchant-aliases', createMerchantAliasRoutesV2(controllerFactory));

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
