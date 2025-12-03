import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';

export const createTransactionRoutesV2 = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  // All transaction routes require authentication
  router.use(authenticate);

  // Transaction CRUD operations
  router.post('/', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.createTransaction(req, res);
  });

  router.get('/', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.getTransactions(req, res);
  });

  router.get('/paginated', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.getPaginatedTransactions(req, res);
  });

  router.get('/statistics', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.getStatistics(req, res);
  });

  router.get('/dashboard', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.getDashboard(req, res);
  });

  router.get('/metrics', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.getMetrics(req, res);
  });

  router.delete('/', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.deleteAll(req, res);
  });

  // Auto-categorize all uncategorized transactions (must be before :id routes)
  router.post('/auto-categorize', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.autoCategorizeTransactions(req, res);
  });

  // Smart categorization route
  router.post('/:id/categorize', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.smartCategorizeTransaction(req, res);
  });

  // Find similar transactions route
  router.get('/:id/similar', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.findSimilarTransactions(req, res);
  });

  // Split transaction routes
  router.get('/:id/potential-reimbursements', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.findPotentialReimbursements(req, res);
  });

  router.post('/:id/link-split', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.linkSplitTransactions(req, res);
  });

  router.delete('/:id/unlink-split', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.unlinkSplitTransactions(req, res);
  });

  // Single transaction operations
  router.get('/:id', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.getTransaction(req, res);
  });

  router.put('/:id', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.updateTransaction(req, res);
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createTransactionController(userId);
    await controller.deleteTransaction(req, res);
  });

  return router;
};
