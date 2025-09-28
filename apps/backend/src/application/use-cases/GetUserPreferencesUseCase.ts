import { UserPreferencesRepository } from "@domain/repositories/UserPreferencesRepository";
import { UserPreferences } from "@domain/entities/UserPreferences";
import { Result } from "@domain/shared/Result";

export class GetUserPreferencesUseCase {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async execute(userId: string): Promise<Result<UserPreferences>> {
    try {
      const result = await this.userPreferencesRepository.findByUserId(userId);

      if (!result.isSuccess()) {
        return Result.failWithMessage(
          `Failed to get user preferences: ${result.getError()}`,
        );
      }

      if (!result.getValue()) {
        // Create default preferences if none exist
        const createResult = await this.userPreferencesRepository.create({
          userId,
        });
        return createResult;
      }

      return Result.ok(result.getValue()!);
    } catch (error) {
      return Result.failWithMessage(`Failed to get user preferences: ${error}`);
    }
  }
}
