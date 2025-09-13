import { Result } from '../shared/Result';

/**
 * Merchant value object
 * Represents the merchant/partner information for a transaction
 */
export class Merchant {
  private constructor(
    private readonly _name: string,
    private readonly _normalizedName: string
  ) {}

  static create(name: string): Result<Merchant> {
    if (!name || name.trim().length === 0) {
      return Result.failWithMessage('Merchant name cannot be empty');
    }

    if (name.trim().length < 2) {
      return Result.failWithMessage('Merchant name must be at least 2 characters');
    }

    if (name.length > 100) {
      return Result.failWithMessage('Merchant name cannot exceed 100 characters');
    }

    const cleanName = name.trim();
    const normalizedName = this.normalize(cleanName);

    return Result.ok(new Merchant(cleanName, normalizedName));
  }

  private static normalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  get name(): string {
    return this._name;
  }

  get normalizedName(): string {
    return this._normalizedName;
  }

  /**
   * Check if this merchant is similar to another (for duplicate detection)
   */
  isSimilarTo(other: Merchant, threshold = 0.8): boolean {
    return this.calculateSimilarity(other.normalizedName) >= threshold;
  }

  /**
   * Calculate similarity using Levenshtein distance
   */
  private calculateSimilarity(other: string): number {
    const a = this._normalizedName;
    const b = other;

    if (a === b) return 1.0;
    if (a.length === 0) return b.length === 0 ? 1.0 : 0.0;
    if (b.length === 0) return 0.0;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Extract potential category hints from merchant name
   */
  getCategoryHints(): string[] {
    const hints: string[] = [];
    const name = this._normalizedName;

    // Common merchant patterns
    const patterns: Record<string, string[]> = {
      food: ['restaurant', 'cafe', 'pizza', 'burger', 'food', 'kitchen', 'bistro', 'bar', 'pub'],
      transport: ['taxi', 'uber', 'lyft', 'bus', 'train', 'metro', 'gas', 'fuel', 'parking'],
      shopping: ['store', 'shop', 'market', 'mall', 'amazon', 'ebay', 'clothing', 'fashion'],
      utilities: ['electric', 'water', 'gas', 'internet', 'phone', 'mobile', 'utility'],
      health: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'health', 'dental'],
      entertainment: ['cinema', 'movie', 'theater', 'concert', 'game', 'sport', 'gym', 'fitness']
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter(keyword => name.includes(keyword));
      if (matches.length > 0) {
        hints.push(category);
      }
    }

    return hints;
  }

  equals(other: Merchant): boolean {
    return this._normalizedName === other._normalizedName;
  }

  toString(): string {
    return this._name;
  }
}