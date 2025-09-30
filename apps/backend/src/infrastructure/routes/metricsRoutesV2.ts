import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export const createMetricsRoutesV2 = (
  controllerFactory: ControllerFactory,
): Router => {
  const router = Router();

  // All metrics routes require authentication
  router.use(authenticate);

  router.get("/trends", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMetricsController(userId);
    await controller.getTrends(req, res);
  });

  return router;
};