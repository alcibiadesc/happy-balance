import { Router, Request, Response } from "express";
import { ControllerFactory } from "../factories/ControllerFactory";
import { authenticate } from "../middleware/auth";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const createImportRoutesV2 = (
  controllerFactory: ControllerFactory,
): Router => {
  const router = Router();

  // All import routes require authentication
  router.use(authenticate);

  // TODO: Implement previewImport method
  // Parse CSV file and preview transactions
  // router.post("/preview", upload.single("file"), async (req: Request, res: Response) => {
  //   const userId = req.user?.userId || 'default';
  //   const controller = controllerFactory.createImportController(userId);
  //   await controller.previewImport(req, res);
  // });

  // Generate hashes for preview transactions
  router.post("/generate-hashes", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createImportController(userId);
    await controller.generateHashes(req, res);
  });

  // Check for duplicate transactions
  router.post("/check-duplicates", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createImportController(userId);
    await controller.checkDuplicates(req, res);
  });

  // Import selected transactions
  router.post("/selected", async (req: Request, res: Response) => {
    const userId = req.user?.userId || 'default';
    const controller = controllerFactory.createImportController(userId);
    await controller.importSelected(req, res);
  });

  // TODO: Implement importTransactions method
  // Full import (legacy)
  // router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  //   const userId = req.user?.userId || 'default';
  //   const controller = controllerFactory.createImportController(userId);
  //   await controller.importTransactions(req, res);
  // });

  return router;
};