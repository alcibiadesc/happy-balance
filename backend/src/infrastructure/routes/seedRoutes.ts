import { Router } from "express";
import { SeedController } from "@infrastructure/controllers/SeedController";

export function createSeedRoutes(seedController: SeedController): Router {
  const router = Router();

  // POST /api/seed - Reset all data to defaults
  router.post("/", (req, res) => seedController.resetToDefaults(req, res));

  return router;
}
