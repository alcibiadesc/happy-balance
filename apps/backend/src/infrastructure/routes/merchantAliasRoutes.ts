import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export const createMerchantAliasRoutes = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  // All merchant alias routes require authentication
  router.use(authenticate);

  // List all aliases for user
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.list(req, res);
    })
  );

  // Get known merchants (static list from normalizer) - must be before /:id
  router.get(
    '/known-merchants',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.getKnownMerchants(req, res);
    })
  );

  // Search aliases by canonical name - must be before /:id
  router.get(
    '/search',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.searchByCanonical(req, res);
    })
  );

  // Get single alias by ID
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.getById(req, res);
    })
  );

  // Create new alias
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.create(req, res);
    })
  );

  // Normalize a merchant name (utility) - must be before /:id for POST
  router.post(
    '/normalize',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.normalize(req, res);
    })
  );

  // Bulk normalize merchants - must be before /:id for POST
  router.post(
    '/bulk-normalize',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.bulkNormalize(req, res);
    })
  );

  // Update alias
  router.put(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.update(req, res);
    })
  );

  // Delete alias
  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createMerchantAliasController(userId);
      await controller.delete(req, res);
    })
  );

  return router;
};
