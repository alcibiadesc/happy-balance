import { describe, it, expect } from 'vitest';
import {
  MerchantAlias,
  MerchantAliasId,
  MerchantAliasSnapshot,
} from '@domain/entities/MerchantAlias';

describe('MerchantAlias', () => {
  describe('create', () => {
    it('rejects empty rawPattern', () => {
      const result = MerchantAlias.create('', 'uber eats');
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Raw pattern cannot be empty');
    });

    it('rejects whitespace-only rawPattern', () => {
      const result = MerchantAlias.create('   ', 'uber eats');
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Raw pattern cannot be empty');
    });

    it('rejects rawPattern over 200 chars', () => {
      const result = MerchantAlias.create('a'.repeat(201), 'uber eats');
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Raw pattern cannot exceed 200 characters');
    });

    it('rejects empty canonicalName', () => {
      const result = MerchantAlias.create('uber eats', '');
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Canonical name cannot be empty');
    });

    it('rejects canonicalName over 100 chars', () => {
      const result = MerchantAlias.create('uber', 'a'.repeat(101));
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Canonical name cannot exceed 100 characters');
    });

    it('rejects confidence below 0', () => {
      const result = MerchantAlias.create('uber', 'uber eats', 'user', null, -0.1);
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Confidence must be between 0 and 1');
    });

    it('rejects confidence above 1', () => {
      const result = MerchantAlias.create('uber', 'uber eats', 'user', null, 1.1);
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Confidence must be between 0 and 1');
    });

    it('accepts confidence at boundaries 0 and 1', () => {
      expect(MerchantAlias.create('uber', 'uber eats', 'user', null, 0).isSuccess()).toBe(true);
      expect(MerchantAlias.create('uber', 'uber eats', 'user', null, 1).isSuccess()).toBe(true);
    });

    it('trims and lowercases rawPattern and canonicalName', () => {
      const alias = MerchantAlias.create('  Uber EATS  ', '  UBER Eats  ').getValue();
      expect(alias.rawPattern).toBe('uber eats');
      expect(alias.canonicalName).toBe('uber eats');
    });

    it('defaults source to user, confidence 1.0, matchCount 0, lastMatchedAt null', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      expect(alias.source).toBe('user');
      expect(alias.confidence).toBe(1.0);
      expect(alias.matchCount).toBe(0);
      expect(alias.lastMatchedAt).toBeNull();
      expect(alias.userId).toBeNull();
    });
  });

  describe('matches', () => {
    it('matches exact (case-insensitive, trimmed)', () => {
      const alias = MerchantAlias.create('uber eats', 'uber eats').getValue();
      expect(alias.matches('UBER EATS')).toBe(true);
      expect(alias.matches('  uber eats  ')).toBe(true);
    });

    it('matches when rawPattern is a substring of merchant', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      expect(alias.matches('UBER EATS LONDON')).toBe(true);
    });

    it('does not match unrelated merchant', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      expect(alias.matches('deliveroo')).toBe(false);
    });
  });

  describe('recordMatch', () => {
    it('increments matchCount, sets lastMatchedAt, and boosts confidence by 0.01 capped at 1.0', () => {
      const alias = MerchantAlias.create('uber', 'uber eats', 'user', null, 0.5).getValue();
      expect(alias.lastMatchedAt).toBeNull();
      alias.recordMatch();
      expect(alias.matchCount).toBe(1);
      expect(alias.lastMatchedAt).toBeInstanceOf(Date);
      expect(alias.confidence).toBeCloseTo(0.51, 10);
    });

    it('does not exceed confidence 1.0', () => {
      const alias = MerchantAlias.create('uber', 'uber eats', 'user', null, 1.0).getValue();
      alias.recordMatch();
      expect(alias.confidence).toBe(1.0);
      expect(alias.matchCount).toBe(1);
    });

    it('caps near the top boundary', () => {
      const alias = MerchantAlias.create('uber', 'uber eats', 'user', null, 0.995).getValue();
      alias.recordMatch();
      expect(alias.confidence).toBe(1.0);
    });
  });

  describe('decayConfidence', () => {
    it('floors at 0.5 for system source', () => {
      const alias = MerchantAlias.create('uber', 'uber eats', 'system', null, 0.5).getValue();
      alias.decayConfidence();
      expect(alias.confidence).toBe(0.5);
      // even after many decays stays at 0.5
      for (let i = 0; i < 100; i++) alias.decayConfidence();
      expect(alias.confidence).toBe(0.5);
    });

    it('floors at 0.1 for non-system source', () => {
      const alias = MerchantAlias.create('uber', 'uber eats', 'learned', null, 0.11).getValue();
      for (let i = 0; i < 200; i++) alias.decayConfidence();
      expect(alias.confidence).toBe(0.1);
    });

    it('applies the decay factor when above the floor', () => {
      const alias = MerchantAlias.create('uber', 'uber eats', 'user', null, 1.0).getValue();
      alias.decayConfidence(0.99);
      expect(alias.confidence).toBeCloseTo(0.99, 10);
    });
  });

  describe('updateCanonicalName', () => {
    it('rejects empty name', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      const result = alias.updateCanonicalName('  ');
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Canonical name cannot be empty');
      expect(alias.canonicalName).toBe('uber eats');
    });

    it('trims and lowercases the new name', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      const result = alias.updateCanonicalName('  Uber FOOD  ');
      expect(result.isSuccess()).toBe(true);
      expect(alias.canonicalName).toBe('uber food');
    });
  });

  describe('updateConfidence', () => {
    it('rejects out-of-range and accepts in-range', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      expect(alias.updateConfidence(-0.1).isFailure()).toBe(true);
      expect(alias.updateConfidence(1.1).isFailure()).toBe(true);
      expect(alias.updateConfidence(0.3).isSuccess()).toBe(true);
      expect(alias.confidence).toBe(0.3);
    });
  });

  describe('toSnapshot / fromSnapshot round-trip', () => {
    it('round-trips preserving all fields', () => {
      const id = MerchantAliasId.create('alias-123').getValue();
      const original = MerchantAlias.create(
        'Uber',
        'Uber Eats',
        'learned',
        'user-1',
        0.8,
        id
      ).getValue();
      original.recordMatch();

      const snapshot = original.toSnapshot();
      expect(snapshot.id).toBe('alias-123');
      expect(snapshot.rawPattern).toBe('uber');
      expect(snapshot.canonicalName).toBe('uber eats');
      expect(snapshot.confidence).toBeCloseTo(0.81, 10);
      expect(snapshot.matchCount).toBe(1);
      expect(typeof snapshot.lastMatchedAt).toBe('string');
      expect(snapshot.source).toBe('learned');
      expect(snapshot.userId).toBe('user-1');
      expect(typeof snapshot.createdAt).toBe('string');

      const restoredResult = MerchantAlias.fromSnapshot(snapshot);
      expect(restoredResult.isSuccess()).toBe(true);
      const restored = restoredResult.getValue();
      expect(restored.id.value).toBe('alias-123');
      expect(restored.rawPattern).toBe('uber');
      expect(restored.canonicalName).toBe('uber eats');
      expect(restored.confidence).toBeCloseTo(0.81, 10);
      expect(restored.matchCount).toBe(1);
      expect(restored.source).toBe('learned');
      expect(restored.userId).toBe('user-1');
      expect(restored.lastMatchedAt).toBeInstanceOf(Date);
      expect(restored.toSnapshot()).toEqual(snapshot);
    });

    it('round-trips null lastMatchedAt', () => {
      const alias = MerchantAlias.create('uber', 'uber eats').getValue();
      const snapshot = alias.toSnapshot();
      expect(snapshot.lastMatchedAt).toBeNull();
      const restored = MerchantAlias.fromSnapshot(snapshot).getValue();
      expect(restored.lastMatchedAt).toBeNull();
    });

    it('fromSnapshot fails on empty id', () => {
      const snapshot: MerchantAliasSnapshot = {
        id: '',
        rawPattern: 'uber',
        canonicalName: 'uber eats',
        confidence: 1.0,
        matchCount: 0,
        lastMatchedAt: null,
        source: 'user',
        userId: null,
        createdAt: new Date().toISOString(),
      };
      const result = MerchantAlias.fromSnapshot(snapshot);
      expect(result.isFailure()).toBe(true);
    });
  });
});
