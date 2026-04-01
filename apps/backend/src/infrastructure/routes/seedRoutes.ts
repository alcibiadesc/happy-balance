import { Router, Request, Response } from 'express';
import { ControllerFactory } from '../factories/ControllerFactory';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '@infrastructure/errors';

export const createSeedRoutes = (controllerFactory: ControllerFactory): Router => {
  const router = Router();

  // All seed routes require authentication
  router.use(authenticate);

  /**
   * @swagger
   * /api/seed:
   *   post:
   *     tags: [Seed]
   *     summary: Reset data to defaults for current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Data reset successfully
   *       403:
   *         description: Forbidden - Admin access required
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId || 'default';
      const controller = controllerFactory.createSeedController(userId);
      await controller.resetToDefaults(req, res);
    })
  );

  return router;
};
