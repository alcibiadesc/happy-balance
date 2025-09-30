import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export const createDashboardRoutesV2 = (
  controllerFactory: ControllerFactory,
): Router => {
  const router = Router();

  // All dashboard routes require authentication
  router.use(authenticate);

  router.get("/available-periods", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getAvailablePeriods(req, res);
  });

  router.get("/history", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getHistory(req, res);
  });

  // Parameterized routes from legacy dashboard
  router.get("/year/:year", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getYearMetrics(req, res);
  });

  router.get("/month/:year/:month", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getMonthMetrics(req, res);
  });

  router.get("/quarter/:year/:quarter", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getQuarterMetrics(req, res);
  });

  router.get("/enhanced/:year/:month", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getEnhancedMonthMetrics(req, res);
  });

  router.get("/current", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getCurrentPeriod(req, res);
  });

  router.get("/range", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getDateRange(req, res);
  });

  return router;
};