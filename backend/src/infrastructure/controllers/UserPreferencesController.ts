import { Request, Response } from 'express';
import { UserPreferencesRepository } from '../../domain/repositories/UserPreferencesRepository';

export class UserPreferencesController {
  constructor(private readonly userPreferencesRepository: UserPreferencesRepository) {}

  async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || 'default';

      const result = await this.userPreferencesRepository.findByUserId(userId);

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error });
        return;
      }

      if (!result.value) {
        // Create default preferences if none exist
        const createResult = await this.userPreferencesRepository.create({ userId });
        if (!createResult.isSuccess) {
          res.status(500).json({ error: createResult.error });
          return;
        }
        res.json(createResult.value);
        return;
      }

      res.json(result.value);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId = 'default', currency, language, theme } = req.body;

      const result = await this.userPreferencesRepository.create({
        userId,
        currency,
        language,
        theme,
      });

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error });
        return;
      }

      res.status(201).json(result.value);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || 'default';
      const { currency, language, theme } = req.body;

      const result = await this.userPreferencesRepository.update(userId, {
        currency,
        language,
        theme,
      });

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error });
        return;
      }

      res.json(result.value);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || 'default';

      const result = await this.userPreferencesRepository.delete(userId);

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}