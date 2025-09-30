import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export const createCategoryRoutesV2 = (
  controllerFactory: ControllerFactory,
): Router => {
  const router = Router();

  // All category routes require authentication
  router.use(authenticate);

  router.get("/", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createCategoryController(userId);
    await controller.getCategories(req, res);
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createCategoryController(userId);
    await controller.getCategory(req, res);
  });

  router.post("/", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createCategoryController(userId);
    await controller.createCategory(req, res);
  });

  router.put("/:id", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createCategoryController(userId);
    await controller.updateCategory(req, res);
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createCategoryController(userId);
    await controller.deleteCategory(req, res);
  });

  return router;
};