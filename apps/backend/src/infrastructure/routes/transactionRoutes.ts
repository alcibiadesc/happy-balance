import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export const createTransactionRoutes = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  router.use(authenticate);

  // Transaction CRUD operations
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.createTransaction(req, res);
    })
  );

  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.getTransactions(req, res);
    })
  );

  router.get(
    '/paginated',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.getPaginatedTransactions(req, res);
    })
  );

  router.get(
    '/statistics',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.getStatistics(req, res);
    })
  );

  router.get(
    '/dashboard',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.getDashboard(req, res);
    })
  );

  router.get(
    '/metrics',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.getMetrics(req, res);
    })
  );

  router.delete(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.deleteAll(req, res);
    })
  );

  router.post(
    '/auto-categorize',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.autoCategorizeTransactions(req, res);
    })
  );

  router.post(
    '/:id/categorize',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.smartCategorizeTransaction(req, res);
    })
  );

  router.get(
    '/:id/similar',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.findSimilarTransactions(req, res);
    })
  );

  router.get(
    '/:id/potential-reimbursements',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.findPotentialReimbursements(req, res);
    })
  );

  router.post(
    '/:id/link-split',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.linkSplitTransactions(req, res);
    })
  );

  router.delete(
    '/:id/unlink-split',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.unlinkSplitTransactions(req, res);
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.getTransaction(req, res);
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.updateTransaction(req, res);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createTransactionController(userId);
      await controller.deleteTransaction(req, res);
    })
  );

  return router;
};
