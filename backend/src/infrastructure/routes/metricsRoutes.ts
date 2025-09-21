import { Router } from "express";
import { MetricsController } from "../controllers/MetricsController";

export function createMetricsRoutes(
  metricsController: MetricsController
): Router {
  const router = Router();

  // GET /api/metrics/dashboard - Get complete dashboard data (unified endpoint)
  router.get("/dashboard", (req, res) =>
    metricsController.getDashboardData(req, res)
  );

  // GET /api/metrics/period - Get period statistics (fast aggregated data)
  router.get("/period", (req, res) =>
    metricsController.getPeriodStats(req, res)
  );

  // GET /api/metrics/trends - Get trends data for charts (lightweight)
  router.get("/trends", (req, res) =>
    metricsController.getTrends(req, res)
  );

  return router;
}