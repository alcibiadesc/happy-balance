import { prisma } from "@infrastructure/database/prisma";
import { ExportData } from "@infrastructure/controllers/ExportController";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface BackupMetadata {
  totalTransactions: number;
  totalCategories: number;
  totalInvestments: number;
  totalHistoryEntries: number;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface BackupInfo {
  id: string;
  type: string;
  status: string;
  filename: string;
  sizeBytes: number;
  version: string;
  description: string | null;
  metadata: BackupMetadata | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
}

export interface BackupPolicyInfo {
  id: string;
  enabled: boolean;
  frequency: string;
  hourUtc: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  retentionDays: number;
  maxBackups: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}

export type BackupType = "MANUAL" | "SCHEDULED" | "AUTO";
export type BackupStatus = "PENDING" | "SUCCESS" | "FAILED";
export type BackupFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";

export class BackupService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.ensureBackupDir();
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Create a new backup snapshot
   */
  async createBackup(
    type: BackupType = "MANUAL",
    description?: string
  ): Promise<BackupInfo> {
    // Create pending backup record
    const backup = await prisma.backup.create({
      data: {
        userId: this.userId,
        type,
        status: "PENDING",
        filename: "",
        description,
      },
    });

    try {
      // Gather all user data
      const exportData = await this.gatherExportData();

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${this.userId.slice(0, 8)}-${timestamp}.json.gz`;
      const filePath = path.join(BACKUP_DIR, filename);

      // Compress and write
      const jsonData = JSON.stringify(exportData, null, 0);
      const compressed = await gzip(Buffer.from(jsonData, "utf-8"));
      fs.writeFileSync(filePath, compressed);

      const stats = fs.statSync(filePath);

      // Calculate expiration based on policy
      const policy = await this.getOrCreatePolicy();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + policy.retentionDays);

      // Update backup record
      const updated = await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: "SUCCESS",
          filename,
          sizeBytes: stats.size,
          metadata: exportData.data.summary as any,
          completedAt: new Date(),
          expiresAt,
        },
      });

      // Enforce max backups policy
      await this.enforceMaxBackups(policy.maxBackups);

      return this.mapBackupToInfo(updated);
    } catch (error) {
      // Mark as failed
      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * List all backups for user
   */
  async listBackups(): Promise<BackupInfo[]> {
    const backups = await prisma.backup.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
    });
    return backups.map(this.mapBackupToInfo);
  }

  /**
   * Get backup by ID
   */
  async getBackup(backupId: string): Promise<BackupInfo | null> {
    const backup = await prisma.backup.findFirst({
      where: { id: backupId, userId: this.userId },
    });
    return backup ? this.mapBackupToInfo(backup) : null;
  }

  /**
   * Download backup file contents
   */
  async downloadBackup(backupId: string): Promise<ExportData | null> {
    const backup = await prisma.backup.findFirst({
      where: { id: backupId, userId: this.userId, status: "SUCCESS" },
    });

    if (!backup) return null;

    const filePath = path.join(BACKUP_DIR, backup.filename);
    if (!fs.existsSync(filePath)) {
      throw new Error("Backup file not found on disk");
    }

    const compressed = fs.readFileSync(filePath);
    const decompressed = await gunzip(compressed);
    return JSON.parse(decompressed.toString("utf-8"));
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    const backup = await prisma.backup.findFirst({
      where: { id: backupId, userId: this.userId },
    });

    if (!backup) return false;

    // Delete file
    const filePath = path.join(BACKUP_DIR, backup.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record
    await prisma.backup.delete({ where: { id: backupId } });
    return true;
  }

  /**
   * Clean up expired backups
   */
  async cleanupExpiredBackups(): Promise<number> {
    const expired = await prisma.backup.findMany({
      where: {
        userId: this.userId,
        expiresAt: { lt: new Date() },
      },
    });

    let deleted = 0;
    for (const backup of expired) {
      const filePath = path.join(BACKUP_DIR, backup.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.backup.delete({ where: { id: backup.id } });
      deleted++;
    }

    return deleted;
  }

  /**
   * Get or create backup policy for user
   */
  async getOrCreatePolicy(): Promise<BackupPolicyInfo> {
    let policy = await prisma.backupPolicy.findUnique({
      where: { userId: this.userId },
    });

    if (!policy) {
      policy = await prisma.backupPolicy.create({
        data: {
          userId: this.userId,
          enabled: true,
          frequency: "DAILY",
          hourUtc: 3,
          retentionDays: 30,
          maxBackups: 10,
        },
      });
    }

    return this.mapPolicyToInfo(policy);
  }

  /**
   * Update backup policy
   */
  async updatePolicy(updates: Partial<{
    enabled: boolean;
    frequency: BackupFrequency;
    hourUtc: number;
    dayOfWeek: number;
    dayOfMonth: number;
    retentionDays: number;
    maxBackups: number;
  }>): Promise<BackupPolicyInfo> {
    const policy = await prisma.backupPolicy.upsert({
      where: { userId: this.userId },
      create: {
        userId: this.userId,
        ...updates,
      },
      update: updates,
    });

    return this.mapPolicyToInfo(policy);
  }

  /**
   * Check if scheduled backup should run
   */
  async shouldRunScheduledBackup(): Promise<boolean> {
    const policy = await prisma.backupPolicy.findUnique({
      where: { userId: this.userId },
    });

    if (!policy || !policy.enabled) return false;

    const now = new Date();

    // Check if it's the right hour
    if (now.getUTCHours() !== policy.hourUtc) return false;

    // Check frequency
    if (policy.frequency === "WEEKLY" && policy.dayOfWeek !== null) {
      if (now.getUTCDay() !== policy.dayOfWeek) return false;
    } else if (policy.frequency === "MONTHLY" && policy.dayOfMonth !== null) {
      if (now.getUTCDate() !== policy.dayOfMonth) return false;
    }

    // Check if already ran today
    if (policy.lastRunAt) {
      const lastRun = new Date(policy.lastRunAt);
      if (
        lastRun.getUTCFullYear() === now.getUTCFullYear() &&
        lastRun.getUTCMonth() === now.getUTCMonth() &&
        lastRun.getUTCDate() === now.getUTCDate()
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Run scheduled backup if needed
   */
  async runScheduledBackupIfNeeded(): Promise<BackupInfo | null> {
    const shouldRun = await this.shouldRunScheduledBackup();
    if (!shouldRun) return null;

    // Update lastRunAt
    await prisma.backupPolicy.update({
      where: { userId: this.userId },
      data: { lastRunAt: new Date() },
    });

    return this.createBackup("SCHEDULED");
  }

  /**
   * Enforce max backups limit - delete oldest if exceeded
   */
  private async enforceMaxBackups(maxBackups: number): Promise<void> {
    const backups = await prisma.backup.findMany({
      where: { userId: this.userId, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });

    if (backups.length <= maxBackups) return;

    const toDelete = backups.slice(maxBackups);
    for (const backup of toDelete) {
      const filePath = path.join(BACKUP_DIR, backup.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.backup.delete({ where: { id: backup.id } });
    }
  }

  /**
   * Gather all export data for backup
   */
  private async gatherExportData(): Promise<ExportData> {
    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: this.userId },
    });

    // Get categories (user's + global)
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: this.userId }, { isGlobal: true }],
      },
    });

    // Get investments with history
    const investments = await prisma.investment.findMany({
      where: { userId: this.userId },
      include: { history: true },
    });

    const allHistory = investments.flatMap((inv) => inv.history);

    // Calculate date range
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const dateFrom = dates.length > 0
      ? new Date(Math.min(...dates)).toISOString().split("T")[0]
      : null;
    const dateTo = dates.length > 0
      ? new Date(Math.max(...dates)).toISOString().split("T")[0]
      : null;

    return {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      user: {
        id: this.userId,
        exportedAt: new Date().toISOString(),
      },
      data: {
        transactions: transactions.map((t) => ({
          ...t,
          amount: t.amount.toString(),
          splitPercentage: t.splitPercentage?.toString() || null,
        })),
        categories: categories.map((c) => ({
          ...c,
          annualBudget: c.annualBudget?.toString() || null,
        })),
        investments: investments.map((inv) => ({
          ...inv,
          currentValue: inv.currentValue.toString(),
          history: undefined,
        })),
        investmentHistory: allHistory.map((h) => ({
          ...h,
          amount: h.amount.toString(),
        })),
        summary: {
          totalTransactions: transactions.length,
          totalCategories: categories.length,
          totalInvestments: investments.length,
          totalHistoryEntries: allHistory.length,
          dateRange: { from: dateFrom, to: dateTo },
        },
      },
    };
  }

  private mapBackupToInfo(backup: any): BackupInfo {
    return {
      id: backup.id,
      type: backup.type,
      status: backup.status,
      filename: backup.filename,
      sizeBytes: Number(backup.sizeBytes),
      version: backup.version,
      description: backup.description,
      metadata: backup.metadata as BackupMetadata | null,
      createdAt: backup.createdAt,
      completedAt: backup.completedAt,
      expiresAt: backup.expiresAt,
    };
  }

  private mapPolicyToInfo(policy: any): BackupPolicyInfo {
    return {
      id: policy.id,
      enabled: policy.enabled,
      frequency: policy.frequency,
      hourUtc: policy.hourUtc,
      dayOfWeek: policy.dayOfWeek,
      dayOfMonth: policy.dayOfMonth,
      retentionDays: policy.retentionDays,
      maxBackups: policy.maxBackups,
      lastRunAt: policy.lastRunAt,
      nextRunAt: policy.nextRunAt,
    };
  }
}

/**
 * Global function to run scheduled backups for all users with enabled policies
 */
export async function runAllScheduledBackups(): Promise<{
  ran: number;
  failed: number;
}> {
  const policies = await prisma.backupPolicy.findMany({
    where: { enabled: true },
  });

  let ran = 0;
  let failed = 0;

  for (const policy of policies) {
    const service = new BackupService(policy.userId);
    try {
      const result = await service.runScheduledBackupIfNeeded();
      if (result) ran++;
    } catch (error) {
      console.error(`Scheduled backup failed for user ${policy.userId}:`, error);
      failed++;
    }
  }

  return { ran, failed };
}

/**
 * Global function to cleanup all expired backups
 */
export async function cleanupAllExpiredBackups(): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;

  for (const user of users) {
    const service = new BackupService(user.id);
    total += await service.cleanupExpiredBackups();
  }

  return total;
}
