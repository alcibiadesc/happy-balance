import { describe, it, expect, beforeEach } from '@jest/globals';
import { GetUserPreferencesUseCase } from '../application/use-cases/GetUserPreferencesUseCase';
import { UpdateUserPreferencesUseCase } from '../application/use-cases/UpdateUserPreferencesUseCase';
import { UserPreferencesRepository } from '../domain/repositories/UserPreferencesRepository';
import { UserPreferences, CreateUserPreferencesData, UpdateUserPreferencesData } from '../domain/entities/UserPreferences';
import { Result } from '../domain/shared/Result';

// Mock repository implementation
class MockUserPreferencesRepository implements UserPreferencesRepository {
  private preferences: Map<string, UserPreferences> = new Map();

  async findByUserId(userId: string): Promise<Result<UserPreferences | null>> {
    const prefs = this.preferences.get(userId);
    return Result.ok(prefs || null);
  }

  async create(data: CreateUserPreferencesData): Promise<Result<UserPreferences>> {
    const preferences: UserPreferences = {
      id: 'mock-id',
      userId: data.userId || 'default',
      currency: data.currency || 'EUR',
      language: data.language || 'en',
      theme: data.theme || 'light',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.preferences.set(preferences.userId, preferences);
    return Result.ok(preferences);
  }

  async update(userId: string, data: UpdateUserPreferencesData): Promise<Result<UserPreferences>> {
    const existing = this.preferences.get(userId);
    if (!existing) {
      return Result.failWithMessage('User preferences not found');
    }

    const updated: UserPreferences = {
      ...existing,
      currency: data.currency || existing.currency,
      language: data.language || existing.language,
      theme: data.theme || existing.theme,
      updatedAt: new Date()
    };

    this.preferences.set(userId, updated);
    return Result.ok(updated);
  }

  async delete(userId: string): Promise<Result<void>> {
    this.preferences.delete(userId);
    return Result.ok(undefined);
  }
}

describe('User Preferences Use Cases', () => {
  let repository: MockUserPreferencesRepository;
  let getUserPreferencesUseCase: GetUserPreferencesUseCase;
  let updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;

  beforeEach(() => {
    repository = new MockUserPreferencesRepository();
    getUserPreferencesUseCase = new GetUserPreferencesUseCase(repository);
    updateUserPreferencesUseCase = new UpdateUserPreferencesUseCase(repository);
  });

  describe('GetUserPreferencesUseCase', () => {
    it('should create default preferences when none exist', async () => {
      const result = await getUserPreferencesUseCase.execute('user1');

      expect(result.isSuccess()).toBe(true);
      const preferences = result.getValue();
      expect(preferences.userId).toBe('user1');
      expect(preferences.currency).toBe('EUR');
      expect(preferences.language).toBe('en');
      expect(preferences.theme).toBe('light');
    });

    it('should return existing preferences', async () => {
      // Create preferences first
      await repository.create({
        userId: 'user2',
        currency: 'USD',
        language: 'es',
        theme: 'dark'
      });

      const result = await getUserPreferencesUseCase.execute('user2');

      expect(result.isSuccess()).toBe(true);
      const preferences = result.getValue();
      expect(preferences.userId).toBe('user2');
      expect(preferences.currency).toBe('USD');
      expect(preferences.language).toBe('es');
      expect(preferences.theme).toBe('dark');
    });
  });

  describe('UpdateUserPreferencesUseCase', () => {
    it('should update existing preferences', async () => {
      // Create initial preferences
      await repository.create({
        userId: 'user3',
        currency: 'EUR',
        language: 'en',
        theme: 'light'
      });

      const result = await updateUserPreferencesUseCase.execute('user3', {
        currency: 'USD',
        theme: 'dark'
      });

      expect(result.isSuccess()).toBe(true);
      const preferences = result.getValue();
      expect(preferences.currency).toBe('USD');
      expect(preferences.language).toBe('en'); // Should remain unchanged
      expect(preferences.theme).toBe('dark');
    });

    it('should create preferences if they do not exist', async () => {
      const result = await updateUserPreferencesUseCase.execute('user4', {
        currency: 'GBP',
        language: 'es',
        theme: 'dark'
      });

      expect(result.isSuccess()).toBe(true);
      const preferences = result.getValue();
      expect(preferences.userId).toBe('user4');
      expect(preferences.currency).toBe('GBP');
      expect(preferences.language).toBe('es');
      expect(preferences.theme).toBe('dark');
    });

    it('should validate currency codes', async () => {
      const result = await updateUserPreferencesUseCase.execute('user5', {
        currency: 'INVALID'
      });

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toBe('Invalid currency code');
    });

    it('should validate language codes', async () => {
      const result = await updateUserPreferencesUseCase.execute('user6', {
        language: 'invalid'
      });

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toBe('Invalid language code');
    });

    it('should validate theme values', async () => {
      const result = await updateUserPreferencesUseCase.execute('user7', {
        theme: 'invalid'
      });

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toBe('Invalid theme value');
    });
  });
});