import { Request, Response } from "express";
import { GetUserPreferencesUseCase } from "@application/use-cases/GetUserPreferencesUseCase";
import { UpdateUserPreferencesUseCase } from "@application/use-cases/UpdateUserPreferencesUseCase";
import { UserPreferencesRepository } from "@domain/repositories/UserPreferencesRepository";

export class UserPreferencesController {
  private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase;
  private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;

  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {
    this.getUserPreferencesUseCase = new GetUserPreferencesUseCase(
      userPreferencesRepository,
    );
    this.updateUserPreferencesUseCase = new UpdateUserPreferencesUseCase(
      userPreferencesRepository,
    );
  }

  async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || "default";

      const result = await this.getUserPreferencesUseCase.execute(userId);

      if (!result.isSuccess()) {
        res.status(500).json({ error: result.getError().message });
        return;
      }

      res.json(result.getValue());
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId = "default", currency, language, theme } = req.body;

      const result = await this.userPreferencesRepository.create({
        userId,
        currency,
        language,
        theme,
      });

      if (!result.isSuccess()) {
        res.status(500).json({ error: result.getError().message });
        return;
      }

      res.status(201).json(result.getValue());
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || "default";
      const { currency, language, theme } = req.body;

      const result = await this.updateUserPreferencesUseCase.execute(userId, {
        currency,
        language,
        theme,
      });

      if (!result.isSuccess()) {
        res.status(400).json({ error: result.getError().message });
        return;
      }

      res.json(result.getValue());
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || "default";

      const result = await this.userPreferencesRepository.delete(userId);

      if (!result.isSuccess()) {
        res.status(500).json({ error: result.getError().message });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
