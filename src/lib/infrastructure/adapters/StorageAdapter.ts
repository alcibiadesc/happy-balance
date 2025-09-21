import { Result } from "../../domain/shared/Result";
import { getTranslation } from "../../utils/i18n-utils";

/**
 * Storage adapter interface - Port for data persistence
 * Abstracts away the specific storage implementation
 */
export interface IStorageAdapter {
  /**
   * Get item from storage
   */
  getItem<T>(key: string): Promise<Result<T | null>>;

  /**
   * Set item in storage
   */
  setItem<T>(key: string, value: T): Promise<Result<void>>;

  /**
   * Remove item from storage
   */
  removeItem(key: string): Promise<Result<void>>;

  /**
   * Clear all items from storage
   */
  clear(): Promise<Result<void>>;

  /**
   * Get all keys
   */
  getAllKeys(): Promise<Result<string[]>>;

  /**
   * Check if key exists
   */
  hasKey(key: string): Promise<Result<boolean>>;

  /**
   * Get storage size information
   */
  getStorageInfo(): Promise<
    Result<{
      used: number;
      available: number;
      keys: number;
    }>
  >;
}

/**
 * LocalStorage implementation of StorageAdapter
 * Provides secure and robust localStorage access
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly encryptionEnabled: boolean;
  private readonly keyPrefix: string;

  constructor(
    keyPrefix = "expense_tracker_",
    encryptionEnabled = false, // Future enhancement
  ) {
    this.keyPrefix = keyPrefix;
    this.encryptionEnabled = encryptionEnabled;
  }

  async getItem<T>(key: string): Promise<Result<T | null>> {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.failWithMessage("LocalStorage is not available");
      }

      const fullKey = this.keyPrefix + key;
      const item = localStorage.getItem(fullKey);

      if (item === null) {
        return Result.ok(null);
      }

      const parsed = JSON.parse(item);

      // Future: Add decryption here if encryptionEnabled
      if (this.encryptionEnabled) {
        // TODO: Implement decryption
      }

      return Result.ok(parsed as T);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get item '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async setItem<T>(key: string, value: T): Promise<Result<void>> {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.failWithMessage("LocalStorage is not available");
      }

      let dataToStore = value;

      // Future: Add encryption here if encryptionEnabled
      if (this.encryptionEnabled) {
        // TODO: Implement encryption
      }

      const fullKey = this.keyPrefix + key;
      const serialized = JSON.stringify(dataToStore);

      // Check storage quota
      const estimatedSize = new Blob([serialized]).size;
      const storageInfo = await this.getStorageInfo();

      if (storageInfo.isSuccess()) {
        const { available } = storageInfo.getValue();
        if (estimatedSize > available) {
          return Result.failWithMessage(
            `Storage quota exceeded. Need ${estimatedSize} bytes, only ${available} available`,
          );
        }
      }

      localStorage.setItem(fullKey, serialized);
      return Result.ok(undefined);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        return Result.failWithMessage(getTranslation("validation.storage_quota_exceeded"));
      }

      return Result.failWithMessage(
        `Failed to set item '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async removeItem(key: string): Promise<Result<void>> {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.failWithMessage("LocalStorage is not available");
      }

      const fullKey = this.keyPrefix + key;
      localStorage.removeItem(fullKey);
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to remove item '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async clear(): Promise<Result<void>> {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.failWithMessage("LocalStorage is not available");
      }

      // Only clear items with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to clear storage: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getAllKeys(): Promise<Result<string[]>> {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.failWithMessage("LocalStorage is not available");
      }

      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keys.push(key.substring(this.keyPrefix.length));
        }
      }

      return Result.ok(keys);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get keys: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async hasKey(key: string): Promise<Result<boolean>> {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.ok(false);
      }

      const fullKey = this.keyPrefix + key;
      return Result.ok(localStorage.getItem(fullKey) !== null);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to check key existence: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStorageInfo(): Promise<
    Result<{
      used: number;
      available: number;
      keys: number;
    }>
  > {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return Result.failWithMessage("LocalStorage is not available");
      }

      // Calculate used space
      let used = 0;
      let keys = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            used += new Blob([key + item]).size;
          }
          keys++;
        }
      }

      // Estimate available space (LocalStorage typically has ~5-10MB limit)
      const estimatedTotal = 5 * 1024 * 1024; // 5MB conservative estimate
      const available = Math.max(0, estimatedTotal - used);

      return Result.ok({
        used,
        available,
        keys,
      });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get storage info: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Backup data to JSON
   */
  async exportData(): Promise<Result<string>> {
    try {
      const keysResult = await this.getAllKeys();
      if (keysResult.isFailure()) {
        return Result.fail(keysResult.getError());
      }

      const data: Record<string, any> = {};

      for (const key of keysResult.getValue()) {
        const itemResult = await this.getItem(key);
        if (itemResult.isSuccess()) {
          data[key] = itemResult.getValue();
        }
      }

      return Result.ok(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            version: "1.0",
            data,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      return Result.failWithMessage(
        `Failed to export data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Restore data from JSON backup
   */
  async importData(jsonData: string): Promise<Result<number>> {
    try {
      const backup = JSON.parse(jsonData);

      if (!backup.data || typeof backup.data !== "object") {
        return Result.failWithMessage(getTranslation("validation.invalid_backup_format"));
      }

      let imported = 0;

      for (const [key, value] of Object.entries(backup.data)) {
        const result = await this.setItem(key, value);
        if (result.isSuccess()) {
          imported++;
        }
      }

      return Result.ok(imported);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to import data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
