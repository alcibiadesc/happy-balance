import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export const createCategoryRoutes = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  // All category routes require authentication
  router.use(authenticate);

  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.getCategories(req, res);
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.getCategory(req, res);
    })
  );

  router.get(
    '/:id/stats',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.getCategoryUsageStats(req, res);
    })
  );

  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.createCategory(req, res);
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.updateCategory(req, res);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.deleteCategory(req, res);
    })
  );

  router.delete(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createCategoryController(userId);
      await controller.clearAllCategories(req, res);
    })
  );

  return router;
};
