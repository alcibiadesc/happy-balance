import { describe, it, expect } from 'vitest';
import {
  CategoryPattern,
  CategoryPatternId,
  PatternType,
  CategoryPatternSnapshot,
} from '@domain/entities/CategoryPattern';
import { CategoryId } from '@domain/entities/Category';

function makeCategoryId(value = 'cat-1'): CategoryId {
  return CategoryId.create(value).getValue();
}

describe('CategoryPattern', () => {
  describe('create', () => {
    it('rejects empty pattern', () => {
      const result = CategoryPattern.create(makeCategoryId(), '', PatternType.MERCHANT);
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Pattern cannot be empty');
    });

    it('rejects whitespace-only pattern', () => {
      const result = CategoryPattern.create(makeCategoryId(), '   ', PatternType.MERCHANT);
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Pattern cannot be empty');
    });

    it('rejects pattern longer than 200 chars', () => {
      const result = CategoryPattern.create(
        makeCategoryId(),
        'a'.repeat(201),
        PatternType.MERCHANT
      );
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Pattern cannot exceed 200 characters');
    });

    it('accepts pattern of exactly 200 chars', () => {
      const result = CategoryPattern.create(
        makeCategoryId(),
        'a'.repeat(200),
        PatternType.MERCHANT
      );
      expect(result.isSuccess()).toBe(true);
    });

    it('trims and lowercases the pattern', () => {
      const result = CategoryPattern.create(
        makeCategoryId(),
        '  Uber EATS  ',
        PatternType.MERCHANT
      );
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().pattern).toBe('uber eats');
    });

    it('defaults to active, applyToFuture true, priority 0, matchCount 0', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      expect(pattern.isActive).toBe(true);
      expect(pattern.applyToFuture).toBe(true);
      expect(pattern.priority).toBe(0);
      expect(pattern.matchCount).toBe(0);
    });
  });

  describe('matches', () => {
    it('MERCHANT type uses substring match on merchant, case-insensitive', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      expect(pattern.matches('AMAZON PRIME')).toBe(true);
      expect(pattern.matches('My amazon order')).toBe(true);
      expect(pattern.matches('ebay')).toBe(false);
    });

    it('MERCHANT type ignores the description', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      expect(pattern.matches('ebay', 'amazon purchase')).toBe(false);
    });

    it('DESCRIPTION type uses substring match on description, case-insensitive', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'grocery',
        PatternType.DESCRIPTION
      ).getValue();
      expect(pattern.matches('anything', 'Weekly GROCERY run')).toBe(true);
      expect(pattern.matches('grocery store', 'other')).toBe(false);
    });

    it('DESCRIPTION type with no description provided does not match', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'grocery',
        PatternType.DESCRIPTION
      ).getValue();
      expect(pattern.matches('grocery')).toBe(false);
    });

    it('COMBINED type matches on either merchant or description', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'fuel',
        PatternType.COMBINED
      ).getValue();
      expect(pattern.matches('FUEL station', '')).toBe(true);
      expect(pattern.matches('shop', 'diesel FUEL')).toBe(true);
      expect(pattern.matches('shop', 'groceries')).toBe(false);
    });
  });

  describe('incrementMatchCount', () => {
    it('increments matchCount by one each call', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      expect(pattern.matchCount).toBe(0);
      pattern.incrementMatchCount();
      expect(pattern.matchCount).toBe(1);
      pattern.incrementMatchCount();
      expect(pattern.matchCount).toBe(2);
    });
  });

  describe('updatePriority', () => {
    it('rejects negative priority', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      const result = pattern.updatePriority(-1);
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Priority cannot be negative');
      expect(pattern.priority).toBe(0);
    });

    it('accepts zero and positive priority', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      expect(pattern.updatePriority(0).isSuccess()).toBe(true);
      expect(pattern.priority).toBe(0);
      expect(pattern.updatePriority(5).isSuccess()).toBe(true);
      expect(pattern.priority).toBe(5);
    });
  });

  describe('activate / deactivate', () => {
    it('toggles isActive', () => {
      const pattern = CategoryPattern.create(
        makeCategoryId(),
        'amazon',
        PatternType.MERCHANT
      ).getValue();
      pattern.deactivate();
      expect(pattern.isActive).toBe(false);
      pattern.activate();
      expect(pattern.isActive).toBe(true);
    });
  });

  describe('toSnapshot / fromSnapshot round-trip', () => {
    it('round-trips preserving all fields', () => {
      const id = CategoryPatternId.create('pat-123').getValue();
      const original = CategoryPattern.create(
        makeCategoryId('cat-xyz'),
        'Amazon',
        PatternType.COMBINED,
        false,
        7,
        id
      ).getValue();
      original.incrementMatchCount();
      original.incrementMatchCount();

      const snapshot = original.toSnapshot();
      expect(snapshot.id).toBe('pat-123');
      expect(snapshot.categoryId).toBe('cat-xyz');
      expect(snapshot.pattern).toBe('amazon');
      expect(snapshot.patternType).toBe(PatternType.COMBINED);
      expect(snapshot.isActive).toBe(true);
      expect(snapshot.applyToFuture).toBe(false);
      expect(snapshot.priority).toBe(7);
      expect(snapshot.matchCount).toBe(2);
      expect(typeof snapshot.createdAt).toBe('string');

      const restoredResult = CategoryPattern.fromSnapshot(snapshot);
      expect(restoredResult.isSuccess()).toBe(true);
      const restored = restoredResult.getValue();
      expect(restored.id.value).toBe('pat-123');
      expect(restored.categoryId.value).toBe('cat-xyz');
      expect(restored.pattern).toBe('amazon');
      expect(restored.patternType).toBe(PatternType.COMBINED);
      expect(restored.isActive).toBe(true);
      expect(restored.applyToFuture).toBe(false);
      expect(restored.priority).toBe(7);
      expect(restored.matchCount).toBe(2);
      expect(restored.toSnapshot()).toEqual(snapshot);
    });

    it('fromSnapshot fails on empty id', () => {
      const snapshot: CategoryPatternSnapshot = {
        id: '',
        categoryId: 'cat-1',
        pattern: 'amazon',
        patternType: PatternType.MERCHANT,
        isActive: true,
        applyToFuture: true,
        priority: 0,
        matchCount: 0,
        createdAt: new Date().toISOString(),
      };
      const result = CategoryPattern.fromSnapshot(snapshot);
      expect(result.isFailure()).toBe(true);
    });
  });
});
