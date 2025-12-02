import { PrismaClient, Prisma } from "@prisma/client";
import { WidgetSettingsRepository } from "../../domain/repositories/WidgetSettingsRepository";
import {
  WidgetSettings,
  CreateWidgetSettingsData,
  UpdateWidgetSettingsData,
} from "../../domain/entities/WidgetSettings";
import { Result } from "../../domain/shared/Result";

export class PrismaWidgetSettingsRepository implements WidgetSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserAndWidget(userId: string, widgetId: string): Promise<Result<WidgetSettings | null>> {
    try {
      const settings = await this.prisma.widgetSettings.findUnique({
        where: { userId_widgetId: { userId, widgetId } },
      });

      if (!settings) {
        return Result.ok(null);
      }

      return Result.ok({
        ...settings,
        settings: settings.settings as Record<string, unknown>,
      });
    } catch (error) {
      return Result.failWithMessage(`Failed to find widget settings: ${error}`);
    }
  }

  async findAllByUser(userId: string): Promise<Result<WidgetSettings[]>> {
    try {
      const settings = await this.prisma.widgetSettings.findMany({
        where: { userId },
      });

      return Result.ok(
        settings.map((s) => ({
          ...s,
          settings: s.settings as Record<string, unknown>,
        }))
      );
    } catch (error) {
      return Result.failWithMessage(`Failed to find widget settings: ${error}`);
    }
  }

  async upsert(data: CreateWidgetSettingsData): Promise<Result<WidgetSettings>> {
    try {
      const settings = await this.prisma.widgetSettings.upsert({
        where: { userId_widgetId: { userId: data.userId, widgetId: data.widgetId } },
        create: {
          userId: data.userId,
          widgetId: data.widgetId,
          settings: data.settings as Prisma.InputJsonValue,
        },
        update: {
          settings: data.settings as Prisma.InputJsonValue,
        },
      });

      return Result.ok({
        ...settings,
        settings: settings.settings as Record<string, unknown>,
      });
    } catch (error) {
      return Result.failWithMessage(`Failed to upsert widget settings: ${error}`);
    }
  }

  async update(
    userId: string,
    widgetId: string,
    data: UpdateWidgetSettingsData
  ): Promise<Result<WidgetSettings>> {
    try {
      const settings = await this.prisma.widgetSettings.update({
        where: { userId_widgetId: { userId, widgetId } },
        data: { settings: data.settings as Prisma.InputJsonValue },
      });

      return Result.ok({
        ...settings,
        settings: settings.settings as Record<string, unknown>,
      });
    } catch (error) {
      return Result.failWithMessage(`Failed to update widget settings: ${error}`);
    }
  }

  async delete(userId: string, widgetId: string): Promise<Result<void>> {
    try {
      await this.prisma.widgetSettings.delete({
        where: { userId_widgetId: { userId, widgetId } },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(`Failed to delete widget settings: ${error}`);
    }
  }
}
