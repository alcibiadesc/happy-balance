import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';
import { upload } from '../middleware/upload';

export const createImportRoutes = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    '/generate-hashes',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.generateHashes(req, res);
    })
  );

  router.post(
    '/check-duplicates',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.checkDuplicates(req, res);
    })
  );

  router.post(
    '/selected',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.importSelected(req, res);
    })
  );

  router.post(
    '/csv',
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.importFromCsv(req, res);
    })
  );

  router.post(
    '/preview',
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.previewCsv(req, res);
    })
  );

  router.post(
    '/validate',
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.validateCsv(req, res);
    })
  );

  router.get(
    '/history',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createImportController(userId);
      await controller.getImportHistory(req, res);
    })
  );

  return router;
};
