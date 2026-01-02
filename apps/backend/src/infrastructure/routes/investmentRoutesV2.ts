import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export const createInvestmentRoutesV2 = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  // All investment routes require authentication
  router.use(authenticate);

  // Sync investments with categories (run once to fix existing data)
  router.post(
    '/sync-categories',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.syncWithCategories(req, res);
    })
  );

  // Portfolio summary
  router.get(
    '/summary',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.getPortfolioSummary(req, res);
    })
  );

  // Investments with metrics (for dashboard display)
  router.get(
    '/with-metrics',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.getInvestmentsWithMetrics(req, res);
    })
  );

  // History timeline (for charts)
  router.get(
    '/timeline',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.getHistoryTimeline(req, res);
    })
  );

  // Update sort order (batch)
  router.put(
    '/sort-order',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.updateSortOrder(req, res);
    })
  );

  // Import from Gofire (must be before /:id)
  router.post(
    '/import/gofire',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.importFromGofire(req, res);
    })
  );

  // Export portfolio (must be before /:id)
  router.get(
    '/export',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.exportPortfolio(req, res);
    })
  );

  // Get all investments
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.getInvestments(req, res);
    })
  );

  // Delete all investments
  router.delete(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.deleteAll(req, res);
    })
  );

  // Get single investment
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.getInvestment(req, res);
    })
  );

  // Create investment
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.createInvestment(req, res);
    })
  );

  // Update investment
  router.put(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.updateInvestment(req, res);
    })
  );

  // Delete investment
  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.deleteInvestment(req, res);
    })
  );

  // Add history entry to investment
  router.post(
    '/:id/history',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.addHistoryEntry(req, res);
    })
  );

  // Delete history entry from investment
  router.delete(
    '/:id/history/:historyId',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.deleteHistoryEntry(req, res);
    })
  );

  // Update history entry
  router.put(
    '/:id/history/:historyId',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createInvestmentController(userId);
      await controller.updateHistoryEntry(req, res);
    })
  );

  return router;
};
