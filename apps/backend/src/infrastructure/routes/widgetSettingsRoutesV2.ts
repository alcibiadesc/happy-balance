import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";

export const createWidgetSettingsRoutesV2 = (
  controllerFactory: ControllerFactory
): Router => {
  const router = Router();

  // All widget settings routes require authentication
  router.use(authenticate);

  /**
   * @swagger
   * /api/widgets:
   *   get:
   *     tags: [Widget Settings]
   *     summary: Get all widget settings for current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Widget settings retrieved successfully
   */
  router.get("/", async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const controller = controllerFactory.createWidgetSettingsController();
    await controller.getAllForUser(req, res);
  });

  /**
   * @swagger
   * /api/widgets/{widgetId}:
   *   get:
   *     tags: [Widget Settings]
   *     summary: Get settings for a specific widget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: widgetId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Widget settings retrieved successfully
   */
  router.get("/:widgetId", async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const controller = controllerFactory.createWidgetSettingsController();
    await controller.getByWidget(req, res);
  });

  /**
   * @swagger
   * /api/widgets/{widgetId}:
   *   put:
   *     tags: [Widget Settings]
   *     summary: Update or create settings for a widget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: widgetId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Widget settings updated successfully
   */
  router.put("/:widgetId", async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const controller = controllerFactory.createWidgetSettingsController();
    await controller.upsert(req, res);
  });

  /**
   * @swagger
   * /api/widgets/{widgetId}:
   *   delete:
   *     tags: [Widget Settings]
   *     summary: Delete settings for a widget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: widgetId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Widget settings deleted successfully
   */
  router.delete("/:widgetId", async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const controller = controllerFactory.createWidgetSettingsController();
    await controller.delete(req, res);
  });

  return router;
};
