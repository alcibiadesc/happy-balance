import { Result } from '../shared/Result';
import { UserPreferences, CreateUserPreferencesData, UpdateUserPreferencesData } from '../entities/UserPreferences';

export interface UserPreferencesRepository {
  findByUserId(userId: string): Promise<Result<UserPreferences | null>>;
  create(data: CreateUserPreferencesData): Promise<Result<UserPreferences>>;
  update(userId: string, data: UpdateUserPreferencesData): Promise<Result<UserPreferences>>;
  delete(userId: string): Promise<Result<void>>;
}