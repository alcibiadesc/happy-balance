import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";

export function createDashboardRoutes(
  dashboardController: DashboardController
): Router {
  const router = Router();

  // Rutas principales del dashboard - claras y RESTful

  // Período actual (mes/trimestre/año actual)
  router.get("/current", (req, res) =>
    dashboardController.getCurrentPeriod(req, res)
  );

  // Histórico de los últimos N meses
  router.get("/history", (req, res) =>
    dashboardController.getHistory(req, res)
  );

  // Períodos disponibles con datos
  router.get("/available-periods", (req, res) =>
    dashboardController.getAvailablePeriods(req, res)
  );

  // Métricas de un mes específico
  router.get("/month/:year/:month", (req, res) =>
    dashboardController.getMonthMetrics(req, res)
  );

  // Endpoint mejorado con todas las métricas y categorías reales
  router.get("/enhanced/:year/:month", (req, res) =>
    dashboardController.getEnhancedMonthMetrics(req, res)
  );

  // Métricas de un año completo
  router.get("/year/:year", (req, res) =>
    dashboardController.getYearMetrics(req, res)
  );

  // Rango de fechas personalizado
  router.get("/range", (req, res) =>
    dashboardController.getDateRange(req, res)
  );

  // === NUEVOS ENDPOINTS AVANZADOS ===

  // Comparación con período anterior
  router.get("/comparison/:year/:month", (req, res) =>
    dashboardController.getMonthWithComparison(req, res)
  );

  // Tendencias y predicciones
  router.get("/trends", (req, res) =>
    dashboardController.getTrends(req, res)
  );

  // Distribución por categorías
  router.get("/categories/:year/:month", (req, res) =>
    dashboardController.getCategoryBreakdown(req, res)
  );

  // Métricas de ahorro
  router.get("/savings/:year/:month", (req, res) =>
    dashboardController.getSavingsMetrics(req, res)
  );

  return router;
}

/**
 * Ejemplos de uso de la nueva API:
 *
 * GET /api/dashboard/current?type=month
 * - Obtiene las métricas del mes actual
 *
 * GET /api/dashboard/month/2025/1
 * - Obtiene las métricas de enero 2025
 *
 * GET /api/dashboard/month/2025/8
 * - Obtiene las métricas de agosto 2025
 *
 * GET /api/dashboard/year/2025
 * - Obtiene las métricas de todo el año 2025
 *
 * GET /api/dashboard/history?months=6
 * - Obtiene el histórico de los últimos 6 meses
 *
 * GET /api/dashboard/range?startDate=2025-01-01&endDate=2025-03-31
 * - Obtiene las métricas para un rango personalizado
 *
 * GET /api/dashboard/available-periods
 * - Obtiene la lista de períodos que tienen datos disponibles
 */