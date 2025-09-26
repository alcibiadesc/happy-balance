import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export const createDashboardRoutesV2 = (
  controllerFactory: ControllerFactory,
): Router => {
  const router = Router();

  // All dashboard routes require authentication
  router.use(authenticate);

  router.get("/metrics", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getMetrics(req, res);
  });

  router.get("/category-distribution", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getCategoryDistribution(req, res);
  });

  router.get("/available-periods", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getAvailablePeriods(req, res);
  });

  router.get("/monthly-trend", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getMonthlyTrend(req, res);
  });

  router.get("/week", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getWeekData(req, res);
  });

  router.get("/month", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getMonthData(req, res);
  });

  router.get("/quarter", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getQuarterData(req, res);
  });

  router.get("/year", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createDashboardController(userId);
    await controller.getYearData(req, res);
  });

  return router;
};