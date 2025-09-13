export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Remove expired entries before adding new one
    this.cleanup();

    // If cache is at max size, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL,
      hits: 0
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count and timestamp for LRU
    entry.hits++;
    entry.timestamp = now;

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get or set with factory function
  async getOrSet<R = T>(
    key: string, 
    factory: () => Promise<R> | R, 
    ttl?: number
  ): Promise<R> {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached as R;
    }

    const data = await factory();
    this.set(key, data as T, ttl);
    return data;
  }

  // Cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: entries.filter(entry => now - entry.timestamp > entry.ttl).length,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge: entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length || 0
    };
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Specialized caches for different data types
export class TransactionCache extends CacheManager<any> {
  constructor() {
    super({ ttl: 2 * 60 * 1000, maxSize: 500 }); // 2 minutes TTL, 500 entries
  }

  getCacheKey(filters?: any): string {
    if (!filters) return 'all-transactions';
    return `transactions-${JSON.stringify(filters)}`;
  }
}

export class CategoryCache extends CacheManager<any> {
  constructor() {
    super({ ttl: 10 * 60 * 1000, maxSize: 100 }); // 10 minutes TTL, 100 entries
  }
}

export class AccountCache extends CacheManager<any> {
  constructor() {
    super({ ttl: 5 * 60 * 1000, maxSize: 50 }); // 5 minutes TTL, 50 entries
  }
}

// Global cache instances
export const transactionCache = new TransactionCache();
export const categoryCache = new CategoryCache();
export const accountCache = new AccountCache();

// Cache invalidation helper
export class CacheInvalidator {
  private static dependencies = new Map<string, string[]>();

  static addDependency(cacheKey: string, dependencies: string[]): void {
    CacheInvalidator.dependencies.set(cacheKey, dependencies);
  }

  static invalidate(pattern: string): void {
    // Invalidate direct matches
    if (transactionCache.has(pattern)) transactionCache.delete(pattern);
    if (categoryCache.has(pattern)) categoryCache.delete(pattern);
    if (accountCache.has(pattern)) accountCache.delete(pattern);

    // Invalidate dependencies
    for (const [key, deps] of CacheInvalidator.dependencies.entries()) {
      if (deps.includes(pattern)) {
        transactionCache.delete(key);
        categoryCache.delete(key);
        accountCache.delete(key);
      }
    }
  }

  static invalidateByPrefix(prefix: string): void {
    // This would require iterating through cache keys
    // For now, clear all caches
    transactionCache.clear();
    categoryCache.clear();
    accountCache.clear();
  }
}