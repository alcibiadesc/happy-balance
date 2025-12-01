import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { BackupService, BackupFrequency } from "@application/services/BackupService";

export function createBackupRoutes(): Router {
  const router = Router();

  // All backup routes require authentication
  router.use(authenticate);

  // List all backups
  router.get("/", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const service = new BackupService(userId);
      const backups = await service.listBackups();

      res.json({
        success: true,
        data: backups,
      });
    } catch (error) {
      console.error("Error listing backups:", error);
      res.status(500).json({
        success: false,
        error: "Failed to list backups",
      });
    }
  });

  // Create new backup (manual)
  router.post("/", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const { description } = req.body;
      const service = new BackupService(userId);
      const backup = await service.createBackup("MANUAL", description);

      res.status(201).json({
        success: true,
        data: backup,
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create backup",
      });
    }
  });

  // Get specific backup info
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const service = new BackupService(userId);
      const backup = await service.getBackup(req.params.id);

      if (!backup) {
        res.status(404).json({
          success: false,
          error: "Backup not found",
        });
        return;
      }

      res.json({
        success: true,
        data: backup,
      });
    } catch (error) {
      console.error("Error getting backup:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get backup",
      });
    }
  });

  // Download backup content
  router.get("/:id/download", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const service = new BackupService(userId);
      const data = await service.downloadBackup(req.params.id);

      if (!data) {
        res.status(404).json({
          success: false,
          error: "Backup not found",
        });
        return;
      }

      // Set download headers
      const backup = await service.getBackup(req.params.id);
      const filename = backup?.filename?.replace(".gz", "") || "backup.json";
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      res.json(data);
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download backup",
      });
    }
  });

  // Delete backup
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const service = new BackupService(userId);
      const deleted = await service.deleteBackup(req.params.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Backup not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Backup deleted",
      });
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete backup",
      });
    }
  });

  // Get backup policy
  router.get("/policy/current", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const service = new BackupService(userId);
      const policy = await service.getOrCreatePolicy();

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      console.error("Error getting backup policy:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get backup policy",
      });
    }
  });

  // Update backup policy
  router.put("/policy", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const {
        enabled,
        frequency,
        hourUtc,
        dayOfWeek,
        dayOfMonth,
        retentionDays,
        maxBackups,
      } = req.body;

      // Validate inputs
      if (frequency && !["DAILY", "WEEKLY", "MONTHLY"].includes(frequency)) {
        res.status(400).json({
          success: false,
          error: "Invalid frequency. Must be DAILY, WEEKLY, or MONTHLY",
        });
        return;
      }

      if (hourUtc !== undefined && (hourUtc < 0 || hourUtc > 23)) {
        res.status(400).json({
          success: false,
          error: "hourUtc must be between 0 and 23",
        });
        return;
      }

      if (retentionDays !== undefined && retentionDays < 1) {
        res.status(400).json({
          success: false,
          error: "retentionDays must be at least 1",
        });
        return;
      }

      if (maxBackups !== undefined && maxBackups < 1) {
        res.status(400).json({
          success: false,
          error: "maxBackups must be at least 1",
        });
        return;
      }

      const service = new BackupService(userId);
      const policy = await service.updatePolicy({
        enabled,
        frequency: frequency as BackupFrequency,
        hourUtc,
        dayOfWeek,
        dayOfMonth,
        retentionDays,
        maxBackups,
      });

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      console.error("Error updating backup policy:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update backup policy",
      });
    }
  });

  // Cleanup expired backups (manual trigger)
  router.post("/cleanup", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || "default";
      const service = new BackupService(userId);
      const deleted = await service.cleanupExpiredBackups();

      res.json({
        success: true,
        data: { deletedCount: deleted },
      });
    } catch (error) {
      console.error("Error cleaning up backups:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cleanup backups",
      });
    }
  });

  return router;
}
