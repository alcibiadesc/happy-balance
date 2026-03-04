import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export function createExportRoutes(controllerFactory: ControllerFactory): Router {
  const router = Router();

  // All export routes require authentication
  router.use(authenticate);

  // Export all data (transactions, categories, investments, history)
  router.get(
    '/all',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createExportController(userId);
      await controller.exportAll(req, res);
    })
  );

  // Import all data (transactions, categories, investments, history)
  router.post(
    '/import-all',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createExportController(userId);
      await controller.importAll(req, res);
    })
  );

  // Export only transactions
  router.get(
    '/transactions',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createExportController(userId);
      await controller.exportTransactions(req, res);
    })
  );

  // Export only investments with history
  router.get(
    '/investments',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createExportController(userId);
      await controller.exportInvestments(req, res);
    })
  );

  // Export only categories
  router.get(
    '/categories',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createExportController(userId);
      await controller.exportCategories(req, res);
    })
  );

  return router;
}
