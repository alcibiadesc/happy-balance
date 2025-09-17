import { Router } from "express";
import { CategoryController } from "@infrastructure/controllers/CategoryController";

export function createCategoryRoutes(categoryController: CategoryController): Router {
  const router = Router();

  // GET /api/categories - Get all categories with optional filters
  router.get("/", (req, res) => categoryController.getCategories(req, res));

  // GET /api/categories/:id - Get category by ID
  router.get("/:id", (req, res) => categoryController.getCategory(req, res));

  // POST /api/categories - Create new category
  router.post("/", (req, res) => categoryController.createCategory(req, res));

  // PUT /api/categories/:id - Update category
  router.put("/:id", (req, res) => categoryController.updateCategory(req, res));

  // DELETE /api/categories/:id - Delete category (soft delete)
  router.delete("/:id", (req, res) => categoryController.deleteCategory(req, res));

  // GET /api/categories/:id/stats - Get category usage statistics
  router.get("/:id/stats", (req, res) => categoryController.getCategoryUsageStats(req, res));

  // DELETE /api/categories - Clear all categories (for reset functionality)
  router.delete("/", (req, res) => categoryController.clearAllCategories(req, res));

  return router;
}