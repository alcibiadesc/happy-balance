import { Router } from "express";
import { UserPreferencesController } from "../controllers/UserPreferencesController";

export const createUserPreferencesRoutes = (
  userPreferencesController: UserPreferencesController,
): Router => {
  const router = Router();

  // User preferences CRUD operations
  router.get(
    "/",
    userPreferencesController.getUserPreferences.bind(
      userPreferencesController,
    ),
  );
  router.get(
    "/:userId",
    userPreferencesController.getUserPreferences.bind(
      userPreferencesController,
    ),
  );
  router.post(
    "/",
    userPreferencesController.createUserPreferences.bind(
      userPreferencesController,
    ),
  );
  router.put(
    "/:userId",
    userPreferencesController.updateUserPreferences.bind(
      userPreferencesController,
    ),
  );
  router.delete(
    "/:userId",
    userPreferencesController.deleteUserPreferences.bind(
      userPreferencesController,
    ),
  );

  return router;
};
