import { Request, Response } from "express";
import { WidgetSettingsRepository } from "../../domain/repositories/WidgetSettingsRepository";

export class WidgetSettingsController {
  constructor(private readonly repository: WidgetSettingsRepository) {}

  async getByWidget(req: Request, res: Response) {
    const userId = req.user?.userId;
    const widgetId = req.params.widgetId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await this.repository.findByUserAndWidget(userId, widgetId);

    if (result.isFailure()) {
      res.status(500).json({ error: result.getError()?.message });
      return;
    }

    const settings = result.getValue();
    if (!settings) {
      res.json({ settings: {} });
      return;
    }

    res.json(settings);
  }

  async getAllForUser(req: Request, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await this.repository.findAllByUser(userId);

    if (result.isFailure()) {
      res.status(500).json({ error: result.getError()?.message });
      return;
    }

    res.json(result.getValue());
  }

  async upsert(req: Request, res: Response) {
    const userId = req.user?.userId;
    const widgetId = req.params.widgetId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const body = req.body;
      const settings = body.settings || body;

      const result = await this.repository.upsert({
        userId,
        widgetId,
        settings,
      });

      if (result.isFailure()) {
        res.status(500).json({ error: result.getError()?.message });
        return;
      }

      res.json(result.getValue());
    } catch (_error) {
      res.status(400).json({ error: "Invalid request body" });
    }
  }

  async delete(req: Request, res: Response) {
    const userId = req.user?.userId;
    const widgetId = req.params.widgetId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await this.repository.delete(userId, widgetId);

    if (result.isFailure()) {
      res.status(500).json({ error: result.getError()?.message });
      return;
    }

    res.json({ success: true });
  }
}
