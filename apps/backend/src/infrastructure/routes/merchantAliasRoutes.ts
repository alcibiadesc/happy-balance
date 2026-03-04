import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';

export const createMerchantAliasRoutes = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  // All merchant alias routes require authentication
  router.use(authenticate);

  // List all aliases for user
  router.get('/', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.list(req, res);
  });

  // Get known merchants (static list from normalizer)
  router.get('/known-merchants', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.getKnownMerchants(req, res);
  });

  // Search aliases by canonical name
  router.get('/search', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.searchByCanonical(req, res);
  });

  // Get single alias by ID
  router.get('/:id', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.getById(req, res);
  });

  // Create new alias
  router.post('/', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.create(req, res);
  });

  // Normalize a merchant name (utility)
  router.post('/normalize', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.normalize(req, res);
  });

  // Bulk normalize merchants
  router.post('/bulk-normalize', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.bulkNormalize(req, res);
  });

  // Update alias
  router.put('/:id', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.update(req, res);
  });

  // Delete alias
  router.delete('/:id', async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createMerchantAliasController(userId);
    await controller.delete(req, res);
  });

  return router;
};
