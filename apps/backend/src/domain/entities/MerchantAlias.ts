import { Result } from '../shared/Result';

export type AliasSource = 'user' | 'system' | 'learned';

export class MerchantAliasId {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<MerchantAliasId> {
    if (!value || value.trim().length === 0) {
      return Result.failWithMessage('MerchantAlias ID cannot be empty');
    }
    return Result.ok(new MerchantAliasId(value.trim()));
  }

  static generate(): MerchantAliasId {
    const id = `alias-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    return MerchantAliasId.create(id).getValue();
  }

  get value(): string {
    return this._value;
  }

  equals(other: MerchantAliasId): boolean {
    return this._value === other._value;
  }
}

/**
 * MerchantAlias - Maps raw merchant patterns to canonical names
 *
 * This enables the system to recognize variations of merchant names
 * and map them to a consistent canonical form for better categorization.
 *
 * Examples:
 *   rawPattern: "uber eats" → canonicalName: "uber eats"
 *   rawPattern: "uber *eats" → canonicalName: "uber eats"
 *   rawPattern: "ubr eats" → canonicalName: "uber eats"
 */
export class MerchantAlias {
  private constructor(
    private readonly _id: MerchantAliasId,
    private _rawPattern: string,
    private _canonicalName: string,
    private _confidence: number,
    private _matchCount: number,
    private _lastMatchedAt: Date | null,
    private _source: AliasSource,
    private readonly _userId: string | null,
    private readonly _createdAt: Date
  ) {}

  static create(
    rawPattern: string,
    canonicalName: string,
    source: AliasSource = 'user',
    userId: string | null = null,
    confidence = 1.0,
    id?: MerchantAliasId
  ): Result<MerchantAlias> {
    if (!rawPattern || rawPattern.trim().length === 0) {
      return Result.failWithMessage('Raw pattern cannot be empty');
    }

    if (rawPattern.length > 200) {
      return Result.failWithMessage('Raw pattern cannot exceed 200 characters');
    }

    if (!canonicalName || canonicalName.trim().length === 0) {
      return Result.failWithMessage('Canonical name cannot be empty');
    }

    if (canonicalName.length > 100) {
      return Result.failWithMessage('Canonical name cannot exceed 100 characters');
    }

    if (confidence < 0 || confidence > 1) {
      return Result.failWithMessage('Confidence must be between 0 and 1');
    }

    const normalizedRaw = rawPattern.trim().toLowerCase();
    const normalizedCanonical = canonicalName.trim().toLowerCase();
    const aliasId = id || MerchantAliasId.generate();

    return Result.ok(
      new MerchantAlias(
        aliasId,
        normalizedRaw,
        normalizedCanonical,
        confidence,
        0,
        null,
        source,
        userId,
        new Date()
      )
    );
  }

  // Getters
  get id(): MerchantAliasId {
    return this._id;
  }

  get rawPattern(): string {
    return this._rawPattern;
  }

  get canonicalName(): string {
    return this._canonicalName;
  }

  get confidence(): number {
    return this._confidence;
  }

  get matchCount(): number {
    return this._matchCount;
  }

  get lastMatchedAt(): Date | null {
    return this._lastMatchedAt ? new Date(this._lastMatchedAt.getTime()) : null;
  }

  get source(): AliasSource {
    return this._source;
  }

  get userId(): string | null {
    return this._userId;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  // Business methods

  /**
   * Check if this alias matches the given merchant string
   */
  matches(merchant: string): boolean {
    const normalized = merchant.toLowerCase().trim();

    // Exact match
    if (normalized === this._rawPattern) {
      return true;
    }

    // Contains match (raw pattern is a substring)
    if (normalized.includes(this._rawPattern)) {
      return true;
    }

    return false;
  }

  /**
   * Record that this alias was used to match a merchant
   */
  recordMatch(): void {
    this._matchCount++;
    this._lastMatchedAt = new Date();

    // Boost confidence slightly for used aliases (max 1.0)
    if (this._confidence < 1.0) {
      this._confidence = Math.min(1.0, this._confidence + 0.01);
    }
  }

  /**
   * Decay confidence for unused aliases (called periodically)
   */
  decayConfidence(factor = 0.99): void {
    // Don't decay system aliases below 0.5
    const minConfidence = this._source === 'system' ? 0.5 : 0.1;
    this._confidence = Math.max(minConfidence, this._confidence * factor);
  }

  /**
   * Update the canonical name
   */
  updateCanonicalName(newName: string): Result<void> {
    if (!newName || newName.trim().length === 0) {
      return Result.failWithMessage('Canonical name cannot be empty');
    }
    this._canonicalName = newName.trim().toLowerCase();
    return Result.ok(undefined);
  }

  /**
   * Update confidence score
   */
  updateConfidence(newConfidence: number): Result<void> {
    if (newConfidence < 0 || newConfidence > 1) {
      return Result.failWithMessage('Confidence must be between 0 and 1');
    }
    this._confidence = newConfidence;
    return Result.ok(undefined);
  }

  /**
   * Convert to snapshot for persistence
   */
  toSnapshot(): MerchantAliasSnapshot {
    return {
      id: this._id.value,
      rawPattern: this._rawPattern,
      canonicalName: this._canonicalName,
      confidence: this._confidence,
      matchCount: this._matchCount,
      lastMatchedAt: this._lastMatchedAt?.toISOString() || null,
      source: this._source,
      userId: this._userId,
      createdAt: this._createdAt.toISOString(),
    };
  }

  /**
   * Reconstruct from persistence snapshot
   */
  static fromSnapshot(snapshot: MerchantAliasSnapshot): Result<MerchantAlias> {
    const idResult = MerchantAliasId.create(snapshot.id);
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    const alias = new MerchantAlias(
      idResult.getValue(),
      snapshot.rawPattern,
      snapshot.canonicalName,
      snapshot.confidence,
      snapshot.matchCount,
      snapshot.lastMatchedAt ? new Date(snapshot.lastMatchedAt) : null,
      snapshot.source as AliasSource,
      snapshot.userId,
      new Date(snapshot.createdAt)
    );

    return Result.ok(alias);
  }
}

export interface MerchantAliasSnapshot {
  id: string;
  rawPattern: string;
  canonicalName: string;
  confidence: number;
  matchCount: number;
  lastMatchedAt: string | null;
  source: AliasSource;
  userId: string | null;
  createdAt: string;
}
