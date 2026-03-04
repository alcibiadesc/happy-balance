import express from 'express';
import { prisma } from '@infrastructure/database/prisma';
import { PrismaUserRepository } from '@infrastructure/repositories/PrismaUserRepository';
import { PrismaUserPreferencesRepository } from '@infrastructure/repositories/PrismaUserPreferencesRepository';
import { AuthController } from '@infrastructure/controllers/AuthController';
import { UserManagementController } from '@infrastructure/controllers/UserManagementController';
import { ControllerFactory } from '@infrastructure/factories/ControllerFactory';
import { setupMiddleware } from '@infrastructure/middleware/setup';
import { registerRoutes } from '@infrastructure/routes/index';
import { startServer, registerShutdownHandlers } from './server';

/**
 * Application bootstrap - creates and wires all dependencies
 */
function createApp(): express.Application {
  const app = express();

  // Middleware
  setupMiddleware(app);

  // Dependencies
  const userRepository = new PrismaUserRepository(prisma);
  const userPreferencesRepository = new PrismaUserPreferencesRepository(prisma);
  const controllerFactory = new ControllerFactory(prisma);
  const authController = new AuthController(userRepository);
  const userManagementController = new UserManagementController(
    userRepository,
    userPreferencesRepository
  );

  // Routes
  registerRoutes(app, {
    controllerFactory,
    authController,
    userManagementController,
  });

  return app;
}

// Bootstrap
const app = createApp();
registerShutdownHandlers();
startServer(app);

export default app;
