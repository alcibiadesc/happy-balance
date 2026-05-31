import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SmartCategorizationService,
  ICategoryPatternRepository,
  ITransactionRepository,
  IMerchantAliasRepository,
} from '@domain/services/SmartCategorizationService';
import { Transaction } from '@domain/entities/Transaction';
import { TransactionType } from '@domain/entities/TransactionType';
import { Category, CategoryId } from '@domain/entities/Category';
import { CategoryType } from '@domain/entities/CategoryType';
import { CategoryPattern, PatternType } from '@domain/entities/CategoryPattern';
import { MerchantAlias } from '@domain/entities/MerchantAlias';
import { Money } from '@domain/value-objects/Money';
import { TransactionDate } from '@domain/value-objects/TransactionDate';
import { Merchant } from '@domain/value-objects/Merchant';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTransaction(
  amount: number,
  type: TransactionType,
  merchant: string,
  description = ''
): Transaction {
  const money = Money.create(amount, 'EUR').getValue();
  const date = TransactionDate.create(new Date()).getValue();
  const merchantObj = Merchant.create(merchant).getValue();
  return Transaction.create(money, date, merchantObj, type, description).getValue();
}

function makeCategory(type: CategoryType, name = 'Cat'): Category {
  const id = CategoryId.create(`cat-${type}-${name}`).getValue();
  return Category.create(name, '#aabbcc', 'icon', type, id).getValue();
}

function makePattern(
  categoryId: CategoryId,
  patternText: string,
  opts: { priority?: number; matchCount?: number; patternType?: PatternType } = {}
): CategoryPattern {
  const pattern = CategoryPattern.create(
    categoryId,
    patternText,
    opts.patternType ?? PatternType.MERCHANT,
    true,
    opts.priority ?? 0
  ).getValue();
  // Bump matchCount via the public increment method
  for (let i = 0; i < (opts.matchCount ?? 0); i++) {
    pattern.incrementMatchCount();
  }
  return pattern;
}

function makeAlias(rawPattern: string, canonicalName: string, confidence = 0.9): MerchantAlias {
  return MerchantAlias.create(rawPattern, canonicalName, 'learned', null, confidence).getValue();
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function makePatternRepo(): ICategoryPatternRepository {
  return {
    findByCategory: vi.fn().mockResolvedValue([]),
    findActivePatterns: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeTransactionRepo(): ITransactionRepository {
  return {
    findByMerchant: vi.fn().mockResolvedValue([]),
    findByPattern: vi.fn().mockResolvedValue([]),
    findByNormalizedMerchant: vi.fn().mockResolvedValue([]),
    updateMany: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
  };
}

function makeAliasRepo(): IMerchantAliasRepository {
  return {
    findByRawPattern: vi.fn().mockResolvedValue(null),
    findBestMatch: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SmartCategorizationService', () => {
  let patternRepo: any;
  let transactionRepo: any;
  let aliasRepo: any;
  let service: SmartCategorizationService;

  beforeEach(() => {
    patternRepo = makePatternRepo();
    transactionRepo = makeTransactionRepo();
    aliasRepo = makeAliasRepo();
    service = new SmartCategorizationService(patternRepo, transactionRepo, aliasRepo);
  });

  // ----- (A) suggestCategory --------------------------------------------------

  describe('suggestCategory', () => {
    it('returns null when no active pattern matches', async () => {
      patternRepo.findActivePatterns.mockResolvedValue([]);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.suggestCategory(tx);

      expect(result).toBeNull();
    });

    it('returns null when patterns exist but none match the merchant', async () => {
      const catId = makeCategory(CategoryType.DISCRETIONARY).id;
      patternRepo.findActivePatterns.mockResolvedValue([makePattern(catId, 'spotify')]);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.suggestCategory(tx);

      expect(result).toBeNull();
    });

    it("returns the matched pattern's categoryId and patternId with matchedOn='pattern'", async () => {
      const cat = makeCategory(CategoryType.DISCRETIONARY);
      const pattern = makePattern(cat.id, 'netflix');
      patternRepo.findActivePatterns.mockResolvedValue([pattern]);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.suggestCategory(tx);

      expect(result).not.toBeNull();
      expect(result!.categoryId).toBe(cat.id.value);
      expect(result!.patternId).toBe(pattern.id.value);
      expect(result!.matchedOn).toBe('pattern');
      // Base 0.5 + matchCount(0) + normConf(0.7*0.3=0.21) + alias(0) = 0.71
      expect(result!.confidence).toBeCloseTo(0.71, 5);
      expect(result!.normalizedMerchant).toBe('netflix');
      expect(result!.canonicalMerchant).toBe('netflix');
    });

    it('prefers a higher-priority pattern over one with a higher matchCount', async () => {
      const catHighPriority = makeCategory(CategoryType.DISCRETIONARY, 'HighPriority');
      const catHighCount = makeCategory(CategoryType.ESSENTIAL, 'HighCount');

      const highPriorityPattern = makePattern(catHighPriority.id, 'netflix', {
        priority: 10,
        matchCount: 0,
      });
      const highCountPattern = makePattern(catHighCount.id, 'netflix', {
        priority: 1,
        matchCount: 99,
      });

      // Provide them in the "wrong" order to ensure sorting picks priority first
      patternRepo.findActivePatterns.mockResolvedValue([highCountPattern, highPriorityPattern]);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.suggestCategory(tx);

      expect(result!.patternId).toBe(highPriorityPattern.id.value);
      expect(result!.categoryId).toBe(catHighPriority.id.value);
    });

    it('clamps confidence to 1.0 when boosts exceed the maximum', async () => {
      const cat = makeCategory(CategoryType.DISCRETIONARY);
      // matchCount 100 -> min(100/100, 0.3) = 0.3
      // 0.5 + 0.3 + 0.7*0.3(0.21) = 1.01 -> clamped to 1.0
      const pattern = makePattern(cat.id, 'netflix', { matchCount: 100 });
      patternRepo.findActivePatterns.mockResolvedValue([pattern]);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.suggestCategory(tx);

      expect(result!.confidence).toBe(1.0);
    });

    it("uses matchedOn='alias' and includes alias confidence boost when alias canonical differs", async () => {
      const cat = makeCategory(CategoryType.DISCRETIONARY);
      const pattern = makePattern(cat.id, 'netflix');
      patternRepo.findActivePatterns.mockResolvedValue([pattern]);

      // Alias whose canonical differs from the normalizer canonical ("netflix")
      const alias = makeAlias('netflix', 'netflix-streaming', 0.5);
      aliasRepo.findBestMatch.mockResolvedValue(alias);

      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.suggestCategory(tx);

      expect(result!.matchedOn).toBe('alias');
      expect(result!.canonicalMerchant).toBe('netflix-streaming');
      // 0.5 + matchCount(0) + normConf(0.21) + alias(0.5*0.2=0.1) = 0.81
      expect(result!.confidence).toBeCloseTo(0.81, 5);
    });
  });

  // ----- (B) bucketAmount via applyToAll cascade -----------------------------

  describe('bucketAmount boundaries (exercised via applyToAll cascade)', () => {
    // bucketAmount = floor(log10(|amount|)); abs<1 -> 0
    //   9.99 -> floor(log10(9.99)) = 0 ; 10 -> 1
    //   99 -> 1 ; 100 -> 2
    //   1000 -> 3 ; 4000 -> 3 (same)
    //   125 -> 2 ; 4000 -> 3 (different)
    const cat = () => makeCategory(CategoryType.DISCRETIONARY);

    async function cascade(sourceAmount: number, otherAmount: number) {
      const category = cat();
      const source = makeTransaction(sourceAmount, TransactionType.EXPENSE, 'netflix');
      const other = makeTransaction(otherAmount, TransactionType.EXPENSE, 'netflix');

      // The cascade searches matching transactions via the repo.
      transactionRepo.findByNormalizedMerchant.mockResolvedValue([other]);
      transactionRepo.findByMerchant.mockResolvedValue([other]);
      transactionRepo.findByPattern.mockResolvedValue([]);

      const result = await service.categorizeTransaction(source, category, {
        applyToAll: true,
        applyToFuture: false,
        createPattern: false,
      });

      return result.getValue();
    }

    it('cascades to a transaction in the SAME bucket (1000 and 4000)', async () => {
      const res = await cascade(1000, 4000);
      // Source + other both categorized -> count 2
      expect(res.categorizedCount).toBe(2);
    });

    it('does NOT cascade to a transaction in a DIFFERENT bucket (125 vs 4000)', async () => {
      const res = await cascade(4000, 125);
      // Only the source transaction categorized -> count 1
      expect(res.categorizedCount).toBe(1);
    });

    it('treats 9.99 (bucket 0) and 10 (bucket 1) as different buckets', async () => {
      const res = await cascade(9.99, 10);
      expect(res.categorizedCount).toBe(1);
    });

    it('treats 99 (bucket 1) and 100 (bucket 2) as different buckets', async () => {
      const res = await cascade(99, 100);
      expect(res.categorizedCount).toBe(1);
    });
  });

  // ----- (C) categorizeTransaction -------------------------------------------

  describe('categorizeTransaction', () => {
    it('fails for an incompatible category type and performs NO bulk update', async () => {
      const incomeCategory = makeCategory(CategoryType.INCOME);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.categorizeTransaction(tx, incomeCategory, {
        applyToAll: true,
        applyToFuture: true,
        createPattern: true,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain('Cannot apply');
      expect(transactionRepo.updateMany).not.toHaveBeenCalled();
      expect(patternRepo.save).not.toHaveBeenCalled();
    });

    it('accepts a NO_COMPUTE category for an EXPENSE transaction', async () => {
      const noCompute = makeCategory(CategoryType.NO_COMPUTE);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.categorizeTransaction(tx, noCompute, {
        applyToAll: false,
        applyToFuture: false,
        createPattern: false,
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().categorizedCount).toBe(1);
    });

    it('accepts a NO_COMPUTE category for an INCOME transaction', async () => {
      const noCompute = makeCategory(CategoryType.NO_COMPUTE);
      const tx = makeTransaction(1000, TransactionType.INCOME, 'netflix');

      const result = await service.categorizeTransaction(tx, noCompute, {
        applyToAll: false,
        applyToFuture: false,
        createPattern: false,
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('accepts a NO_COMPUTE category for an INVESTMENT transaction', async () => {
      const noCompute = makeCategory(CategoryType.NO_COMPUTE);
      const tx = makeTransaction(1000, TransactionType.INVESTMENT, 'netflix');

      const result = await service.categorizeTransaction(tx, noCompute, {
        applyToAll: false,
        applyToFuture: false,
        createPattern: false,
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('createPattern=true with a merchant >= 2 chars saves a pattern and sets patternCreated=true', async () => {
      const category = makeCategory(CategoryType.DISCRETIONARY);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const result = await service.categorizeTransaction(tx, category, {
        applyToAll: false,
        applyToFuture: true,
        createPattern: true,
      });

      expect(result.isSuccess()).toBe(true);
      expect(patternRepo.save).toHaveBeenCalledTimes(1);
      expect(result.getValue().patternCreated).toBe(true);
    });

    it('learnMerchantAlias creates a NEW alias (save + aliasCreated=true) when none exists', async () => {
      // normalizedMerchant and canonicalMerchant must both be present for the
      // alias-learning branch. "netflix" normalizes to a known canonical.
      const category = makeCategory(CategoryType.DISCRETIONARY);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      aliasRepo.findByRawPattern.mockResolvedValue(null);

      const result = await service.categorizeTransaction(tx, category, {
        applyToAll: false,
        applyToFuture: true,
        createPattern: true,
      });

      expect(result.getValue().aliasCreated).toBe(true);
      // alias.save should have been called (creating the new alias)
      expect(aliasRepo.save).toHaveBeenCalled();
    });

    it('learnMerchantAlias UPDATES + recordMatch on an existing alias and reports aliasCreated=false', async () => {
      const category = makeCategory(CategoryType.DISCRETIONARY);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const existing = makeAlias('netflix', 'old-canonical', 0.9);
      const recordSpy = vi.spyOn(existing, 'recordMatch');
      const updateSpy = vi.spyOn(existing, 'updateCanonicalName');
      // findByRawPattern is used by learnMerchantAlias; findBestMatch by extractPatternWithAliases
      aliasRepo.findByRawPattern.mockResolvedValue(existing);

      const result = await service.categorizeTransaction(tx, category, {
        applyToAll: false,
        applyToFuture: true,
        createPattern: true,
      });

      expect(result.getValue().aliasCreated).toBe(false);
      expect(updateSpy).toHaveBeenCalled();
      expect(recordSpy).toHaveBeenCalled();
      expect(aliasRepo.save).toHaveBeenCalledWith(existing);
    });

    it('applyToAll cascade categorizes only same-bucket + same-type transactions', async () => {
      const category = makeCategory(CategoryType.DISCRETIONARY);
      // Source 4000 (bucket 3). Same-merchant candidates: 4000 (same bucket) and 125 (bucket 2).
      const source = makeTransaction(4000, TransactionType.EXPENSE, 'mapfre seguros');
      const sameBucket = makeTransaction(4500, TransactionType.EXPENSE, 'mapfre seguros');
      const differentBucket = makeTransaction(125, TransactionType.EXPENSE, 'mapfre seguros');

      transactionRepo.findByNormalizedMerchant.mockResolvedValue([sameBucket, differentBucket]);
      transactionRepo.findByMerchant.mockResolvedValue([sameBucket, differentBucket]);
      transactionRepo.findByPattern.mockResolvedValue([]);

      const result = await service.categorizeTransaction(source, category, {
        applyToAll: true,
        applyToFuture: false,
        createPattern: false,
      });

      const value = result.getValue();
      // source + sameBucket = 2; differentBucket excluded
      expect(value.categorizedCount).toBe(2);
      expect(value.affectedTransactionIds).toContain(source.id.value);
      expect(value.affectedTransactionIds).toContain(sameBucket.id.value);
      expect(value.affectedTransactionIds).not.toContain(differentBucket.id.value);

      // updateMany should have been called with only the cascaded (non-source) tx
      expect(transactionRepo.updateMany).toHaveBeenCalledTimes(1);
      const updatedArg = transactionRepo.updateMany.mock.calls[0][0];
      expect(updatedArg).toHaveLength(1);
      expect(updatedArg[0].id.value).toBe(sameBucket.id.value);
    });
  });

  // ----- extractPatternWithAliases -------------------------------------------

  describe('extractPatternWithAliases', () => {
    it('returns the base pattern unchanged when no alias is found', async () => {
      aliasRepo.findBestMatch.mockResolvedValue(null);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const pattern = await service.extractPatternWithAliases(tx);

      expect(pattern.normalizedMerchant).toBe('netflix');
      expect(pattern.canonicalMerchant).toBe('netflix');
      expect(aliasRepo.save).not.toHaveBeenCalled();
    });

    it('uses the alias canonical name, records a match and saves the alias when found', async () => {
      const alias = makeAlias('netflix', 'netflix-streaming', 0.5);
      const recordSpy = vi.spyOn(alias, 'recordMatch');
      aliasRepo.findBestMatch.mockResolvedValue(alias);
      const tx = makeTransaction(50, TransactionType.EXPENSE, 'netflix');

      const pattern = await service.extractPatternWithAliases(tx);

      expect(pattern.canonicalMerchant).toBe('netflix-streaming');
      // confidence = max(base 0.7, alias 0.51 after recordMatch boost) = 0.7
      expect(pattern.confidence).toBe(0.7);
      expect(recordSpy).toHaveBeenCalled();
      expect(aliasRepo.save).toHaveBeenCalledWith(alias);
    });
  });
});
