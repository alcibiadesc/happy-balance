import * as cron from "node-cron";
import {
  runAllScheduledBackups,
  cleanupAllExpiredBackups,
} from "@application/services/BackupService";

let scheduledBackupsTask: cron.ScheduledTask | null = null;
let cleanupTask: cron.ScheduledTask | null = null;

/**
 * Initialize the backup scheduler
 * - Runs scheduled backups every hour (checks each user's policy)
 * - Runs cleanup of expired backups daily at 4am UTC
 */
export function initializeBackupScheduler(): void {
  // Check for scheduled backups every hour at minute 0
  scheduledBackupsTask = cron.schedule(
    "0 * * * *", // Every hour at minute 0
    async () => {
      console.log("[BackupScheduler] Running scheduled backup check...");
      try {
        const result = await runAllScheduledBackups();
        if (result.ran > 0 || result.failed > 0) {
          console.log(
            `[BackupScheduler] Completed: ${result.ran} backups created, ${result.failed} failed`
          );
        }
      } catch (error) {
        console.error("[BackupScheduler] Error running scheduled backups:", error);
      }
    },
    {
      timezone: "UTC",
    }
  );

  // Cleanup expired backups daily at 4am UTC
  cleanupTask = cron.schedule(
    "0 4 * * *", // Daily at 4:00 UTC
    async () => {
      console.log("[BackupScheduler] Running expired backup cleanup...");
      try {
        const deleted = await cleanupAllExpiredBackups();
        if (deleted > 0) {
          console.log(`[BackupScheduler] Cleaned up ${deleted} expired backups`);
        }
      } catch (error) {
        console.error("[BackupScheduler] Error cleaning up expired backups:", error);
      }
    },
    {
      timezone: "UTC",
    }
  );

  console.log("✅ Backup scheduler initialized");
  console.log("   - Scheduled backups: checked every hour");
  console.log("   - Expired cleanup: daily at 04:00 UTC");
}

/**
 * Stop the backup scheduler (for graceful shutdown)
 */
export function stopBackupScheduler(): void {
  if (scheduledBackupsTask) {
    scheduledBackupsTask.stop();
    scheduledBackupsTask = null;
  }
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
  }
  console.log("🛑 Backup scheduler stopped");
}
