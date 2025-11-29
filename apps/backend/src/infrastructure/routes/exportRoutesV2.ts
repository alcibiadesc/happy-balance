import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export function createExportRoutes(controllerFactory: ControllerFactory): Router {
  const router = Router();

  // All export routes require authentication
  router.use(authenticate);

  // Export all data (transactions, categories, investments, history)
  router.get("/all", async (req: Request, res: Response) => {
    const userId = req.user?.userId || "default";
    const controller = controllerFactory.createExportController(userId);
    await controller.exportAll(req, res);
  });

  // Export only transactions
  router.get("/transactions", async (req: Request, res: Response) => {
    const userId = req.user?.userId || "default";
    const controller = controllerFactory.createExportController(userId);
    await controller.exportTransactions(req, res);
  });

  // Export only investments with history
  router.get("/investments", async (req: Request, res: Response) => {
    const userId = req.user?.userId || "default";
    const controller = controllerFactory.createExportController(userId);
    await controller.exportInvestments(req, res);
  });

  return router;
}
