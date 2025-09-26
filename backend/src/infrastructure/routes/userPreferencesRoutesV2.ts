import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export const createUserPreferencesRoutesV2 = (
  controllerFactory: ControllerFactory,
): Router => {
  const router = Router();

  // All user preferences routes require authentication
  router.use(authenticate);

  /**
   * @swagger
   * /api/preferences:
   *   get:
   *     tags: [User Preferences]
   *     summary: Get current user preferences
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User preferences retrieved successfully
   */
  router.get("/", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createUserPreferencesController(userId);
    await controller.getUserPreferences(req, res);
  });

  /**
   * @swagger
   * /api/preferences/{userId}:
   *   get:
   *     tags: [User Preferences]
   *     summary: Get specific user preferences (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User preferences retrieved successfully
   */
  router.get("/:userId", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createUserPreferencesController(userId);
    await controller.getUserPreferences(req, res);
  });

  /**
   * @swagger
   * /api/preferences:
   *   post:
   *     tags: [User Preferences]
   *     summary: Create user preferences
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currency:
   *                 type: string
   *               language:
   *                 type: string
   *               theme:
   *                 type: string
   *     responses:
   *       201:
   *         description: User preferences created successfully
   */
  router.post("/", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createUserPreferencesController(userId);
    await controller.createUserPreferences(req, res);
  });

  /**
   * @swagger
   * /api/preferences/{userId}:
   *   put:
   *     tags: [User Preferences]
   *     summary: Update user preferences
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currency:
   *                 type: string
   *               language:
   *                 type: string
   *               theme:
   *                 type: string
   *     responses:
   *       200:
   *         description: User preferences updated successfully
   */
  router.put("/:userId", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createUserPreferencesController(userId);
    await controller.updateUserPreferences(req, res);
  });

  /**
   * @swagger
   * /api/preferences/{userId}:
   *   delete:
   *     tags: [User Preferences]
   *     summary: Delete user preferences
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User preferences deleted successfully
   */
  router.delete("/:userId", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createUserPreferencesController(userId);
    await controller.deleteUserPreferences(req, res);
  });

  return router;
};