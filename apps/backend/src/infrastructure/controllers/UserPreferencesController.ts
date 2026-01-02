import { Request, Response } from 'express';
import { z } from 'zod';
import { GetUserPreferencesUseCase } from '@application/use-cases/GetUserPreferencesUseCase';
import { UpdateUserPreferencesUseCase } from '@application/use-cases/UpdateUserPreferencesUseCase';
import { UserPreferencesRepository } from '@domain/repositories/UserPreferencesRepository';
import {
  BadRequestError,
  validateBody,
  handleResult,
  successResponse,
  createdResponse,
  noContentResponse,
} from '@infrastructure/errors';

// Validation schemas
const CreatePreferencesSchema = z.object({
  userId: z.string().optional(),
  currency: z.string().min(3).max(3).default('EUR'),
  language: z.string().min(2).max(5).default('en'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  portfolioGoal: z.number().min(0).optional(),
});

const UpdatePreferencesSchema = z.object({
  currency: z.string().min(3).max(3).optional(),
  language: z.string().min(2).max(5).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  portfolioGoal: z.number().min(0).optional(),
});

export class UserPreferencesController {
  private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase;
  private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;

  constructor(private readonly userPreferencesRepository: UserPreferencesRepository) {
    this.getUserPreferencesUseCase = new GetUserPreferencesUseCase(userPreferencesRepository);
    this.updateUserPreferencesUseCase = new UpdateUserPreferencesUseCase(userPreferencesRepository);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const result = await this.getUserPreferencesUseCase.execute(userId);
    const preferences = handleResult(result, 'Failed to get user preferences');

    successResponse(res, preferences);
  }

  /**
   * Create user preferences
   */
  async createUserPreferences(req: Request, res: Response): Promise<void> {
    const validatedData = validateBody(CreatePreferencesSchema, req);
    const userId = validatedData.userId || req.user?.userId;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const result = await this.userPreferencesRepository.create({
      userId,
      currency: validatedData.currency,
      language: validatedData.language,
      theme: validatedData.theme,
      portfolioGoal: validatedData.portfolioGoal,
    });

    const preferences = handleResult(result, 'Failed to create user preferences');

    createdResponse(res, preferences);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const validatedData = validateBody(UpdatePreferencesSchema, req);

    const result = await this.updateUserPreferencesUseCase.execute(userId, {
      currency: validatedData.currency,
      language: validatedData.language,
      theme: validatedData.theme,
      portfolioGoal: validatedData.portfolioGoal,
    });

    const preferences = handleResult(result, 'Failed to update user preferences');

    successResponse(res, preferences);
  }

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const result = await this.userPreferencesRepository.delete(userId);
    handleResult(result, 'Failed to delete user preferences');

    noContentResponse(res);
  }
}
