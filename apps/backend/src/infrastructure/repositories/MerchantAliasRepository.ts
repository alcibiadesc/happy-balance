import { PrismaClient } from '@prisma/client';
import { MerchantAlias, AliasSource } from '../../domain/entities/MerchantAlias';
import { Result } from '../../domain/shared/Result';

export interface IMerchantAliasRepository {
  findById(id: string): Promise<MerchantAlias | null>;
  findByRawPattern(pattern: string, userId?: string | null): Promise<MerchantAlias | null>;
  findByCanonicalName(canonicalName: string, userId?: string | null): Promise<MerchantAlias[]>;
  findAllForUser(userId: string | null): Promise<MerchantAlias[]>;
  findBestMatch(merchant: string, userId?: string | null): Promise<MerchantAlias | null>;
  save(alias: MerchantAlias): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<number>;
}

export class MerchantAliasRepository implements IMerchantAliasRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<MerchantAlias | null> {
    const record = await this.prisma.merchantAlias.findUnique({
      where: { id },
    });

    if (!record) return null;

    const result = MerchantAlias.fromSnapshot({
      id: record.id,
      rawPattern: record.rawPattern,
      canonicalName: record.canonicalName,
      confidence: record.confidence.toNumber(),
      matchCount: record.matchCount,
      lastMatchedAt: record.lastMatchedAt?.toISOString() || null,
      source: record.source as AliasSource,
      userId: record.userId,
      createdAt: record.createdAt.toISOString(),
    });

    return result.isSuccess() ? result.getValue() : null;
  }

  async findByRawPattern(
    pattern: string,
    userId: string | null = null
  ): Promise<MerchantAlias | null> {
    const normalizedPattern = pattern.toLowerCase().trim();

    // First try exact match for user
    const userMatch = await this.prisma.merchantAlias.findFirst({
      where: {
        rawPattern: normalizedPattern,
        userId: userId,
      },
    });

    if (userMatch) {
      const result = this.mapToEntity(userMatch);
      return result.isSuccess() ? result.getValue() : null;
    }

    // Fall back to global aliases
    if (userId !== null) {
      const globalMatch = await this.prisma.merchantAlias.findFirst({
        where: {
          rawPattern: normalizedPattern,
          userId: null,
        },
      });

      if (globalMatch) {
        const result = this.mapToEntity(globalMatch);
        return result.isSuccess() ? result.getValue() : null;
      }
    }

    return null;
  }

  async findByCanonicalName(
    canonicalName: string,
    userId: string | null = null
  ): Promise<MerchantAlias[]> {
    const normalized = canonicalName.toLowerCase().trim();

    const records = await this.prisma.merchantAlias.findMany({
      where: {
        canonicalName: normalized,
        OR: [{ userId: userId }, { userId: null }],
      },
      orderBy: [{ userId: 'desc' }, { confidence: 'desc' }], // User-specific first
    });

    return records
      .map((r) => this.mapToEntity(r))
      .filter((r) => r.isSuccess())
      .map((r) => r.getValue());
  }

  async findAllForUser(userId: string | null): Promise<MerchantAlias[]> {
    const records = await this.prisma.merchantAlias.findMany({
      where: {
        OR: [{ userId: userId }, { userId: null }],
      },
      orderBy: [{ confidence: 'desc' }, { matchCount: 'desc' }],
    });

    return records
      .map((r) => this.mapToEntity(r))
      .filter((r) => r.isSuccess())
      .map((r) => r.getValue());
  }

  /**
   * Find the best matching alias for a merchant string
   * Considers both exact matches and substring matches
   */
  async findBestMatch(
    merchant: string,
    userId: string | null = null
  ): Promise<MerchantAlias | null> {
    const normalized = merchant.toLowerCase().trim();

    // First try exact match
    const exactMatch = await this.findByRawPattern(normalized, userId);
    if (exactMatch) {
      return exactMatch;
    }

    // Get all aliases for user (including global)
    const allAliases = await this.findAllForUser(userId);

    // Find best substring match
    let bestMatch: MerchantAlias | null = null;
    let bestScore = 0;

    for (const alias of allAliases) {
      if (alias.matches(normalized)) {
        // Score based on pattern length (longer = more specific = better)
        // and confidence
        const lengthScore = alias.rawPattern.length / normalized.length;
        const score = lengthScore * alias.confidence;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = alias;
        }
      }
    }

    return bestMatch;
  }

  async save(alias: MerchantAlias): Promise<void> {
    const snapshot = alias.toSnapshot();

    await this.prisma.merchantAlias.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        rawPattern: snapshot.rawPattern,
        canonicalName: snapshot.canonicalName,
        confidence: snapshot.confidence,
        matchCount: snapshot.matchCount,
        lastMatchedAt: snapshot.lastMatchedAt ? new Date(snapshot.lastMatchedAt) : null,
        source: snapshot.source,
        userId: snapshot.userId,
      },
      update: {
        rawPattern: snapshot.rawPattern,
        canonicalName: snapshot.canonicalName,
        confidence: snapshot.confidence,
        matchCount: snapshot.matchCount,
        lastMatchedAt: snapshot.lastMatchedAt ? new Date(snapshot.lastMatchedAt) : null,
        source: snapshot.source,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.merchantAlias.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.merchantAlias.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  private mapToEntity(record: any): Result<MerchantAlias> {
    return MerchantAlias.fromSnapshot({
      id: record.id,
      rawPattern: record.rawPattern,
      canonicalName: record.canonicalName,
      confidence: record.confidence.toNumber(),
      matchCount: record.matchCount,
      lastMatchedAt: record.lastMatchedAt?.toISOString() || null,
      source: record.source as AliasSource,
      userId: record.userId,
      createdAt: record.createdAt.toISOString(),
    });
  }
}
