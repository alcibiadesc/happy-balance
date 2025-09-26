import { PrismaClient } from "@prisma/client";
import { UserPreferencesRepository } from "../../domain/repositories/UserPreferencesRepository";
import {
  UserPreferences,
  CreateUserPreferencesData,
  UpdateUserPreferencesData,
} from "../../domain/entities/UserPreferences";
import { Result } from "../../domain/shared/Result";

export class PrismaUserPreferencesRepository
  implements UserPreferencesRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Result<UserPreferences | null>> {
    try {
      const preferences = await this.prisma.userPreferences.findUnique({
        where: { userId },
      });

      return Result.ok(preferences);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to find user preferences: ${error}`,
      );
    }
  }

  async create(
    data: CreateUserPreferencesData,
  ): Promise<Result<UserPreferences>> {
    try {
      // Validate that the user exists first
      if (data.userId && data.userId !== "default") {
        const userExists = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true }
        });

        if (!userExists) {
          return Result.failWithMessage(`User with id ${data.userId} does not exist`);
        }
      }

      const preferences = await this.prisma.userPreferences.create({
        data: {
          userId: data.userId || "default",
          currency: data.currency || "EUR",
          language: data.language || "en",
          theme: data.theme || "light",
        },
      });

      return Result.ok(preferences);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to create user preferences: ${error}`,
      );
    }
  }

  async update(
    userId: string,
    data: UpdateUserPreferencesData,
  ): Promise<Result<UserPreferences>> {
    try {
      const preferences = await this.prisma.userPreferences.update({
        where: { userId },
        data: {
          ...(data.currency && { currency: data.currency }),
          ...(data.language && { language: data.language }),
          ...(data.theme && { theme: data.theme }),
        },
      });

      return Result.ok(preferences);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to update user preferences: ${error}`,
      );
    }
  }

  async delete(userId: string): Promise<Result<void>> {
    try {
      await this.prisma.userPreferences.delete({
        where: { userId },
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to delete user preferences: ${error}`,
      );
    }
  }
}
