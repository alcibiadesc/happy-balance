import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export const createDashboardRoutesV2 = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    '/available-periods',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getAvailablePeriods(req, res);
    })
  );

  router.get(
    '/history',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getHistory(req, res);
    })
  );

  router.get(
    '/trends',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getTrends(req, res);
    })
  );

  router.get(
    '/year/:year',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getYearMetrics(req, res);
    })
  );

  router.get(
    '/month/:year/:month',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getMonthMetrics(req, res);
    })
  );

  router.get(
    '/quarter/:year/:quarter',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getQuarterMetrics(req, res);
    })
  );

  router.get(
    '/comparison/:year/:month',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getMonthWithComparison(req, res);
    })
  );

  router.get(
    '/categories/:year/:month',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getCategoryBreakdown(req, res);
    })
  );

  router.get(
    '/savings/:year/:month',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getSavingsMetrics(req, res);
    })
  );

  router.get(
    '/enhanced/:year/:month',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getEnhancedMonthMetrics(req, res);
    })
  );

  router.get(
    '/current',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getCurrentPeriod(req, res);
    })
  );

  router.get(
    '/range',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createDashboardController(userId);
      await controller.getDateRange(req, res);
    })
  );

  return router;
};
