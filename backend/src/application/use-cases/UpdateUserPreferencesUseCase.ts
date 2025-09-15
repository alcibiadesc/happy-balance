import { UserPreferencesRepository } from '@domain/repositories/UserPreferencesRepository';
import { UserPreferences, UpdateUserPreferencesData } from '@domain/entities/UserPreferences';
import { Result } from '@domain/shared/Result';

export class UpdateUserPreferencesUseCase {
  constructor(private readonly userPreferencesRepository: UserPreferencesRepository) {}

  async execute(userId: string, data: UpdateUserPreferencesData): Promise<Result<UserPreferences>> {
    try {
      // Validate input data
      if (data.currency && !this.isValidCurrency(data.currency)) {
        return Result.failWithMessage('Invalid currency code');
      }

      if (data.language && !this.isValidLanguage(data.language)) {
        return Result.failWithMessage('Invalid language code');
      }

      if (data.theme && !this.isValidTheme(data.theme)) {
        return Result.failWithMessage('Invalid theme value');
      }

      // Check if preferences exist
      const existingResult = await this.userPreferencesRepository.findByUserId(userId);

      if (!existingResult.isSuccess()) {
        return Result.failWithMessage(`Failed to find user preferences: ${existingResult.getError()}`);
      }

      if (!existingResult.getValue()) {
        // Create preferences if they don't exist
        const createResult = await this.userPreferencesRepository.create({
          userId,
          ...data
        });
        return createResult;
      }

      // Update existing preferences
      const updateResult = await this.userPreferencesRepository.update(userId, data);
      return updateResult;
    } catch (error) {
      return Result.failWithMessage(`Failed to update user preferences: ${error}`);
    }
  }

  private isValidCurrency(currency: string): boolean {
    const validCurrencies = ['EUR', 'USD', 'GBP', 'JPY'];
    return validCurrencies.includes(currency);
  }

  private isValidLanguage(language: string): boolean {
    const validLanguages = ['en', 'es'];
    return validLanguages.includes(language);
  }

  private isValidTheme(theme: string): boolean {
    const validThemes = ['light', 'dark', 'system'];
    return validThemes.includes(theme);
  }
}