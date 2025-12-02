import { Result } from "../shared/Result";
import {
  WidgetSettings,
  CreateWidgetSettingsData,
  UpdateWidgetSettingsData,
} from "../entities/WidgetSettings";

export interface WidgetSettingsRepository {
  findByUserAndWidget(userId: string, widgetId: string): Promise<Result<WidgetSettings | null>>;
  findAllByUser(userId: string): Promise<Result<WidgetSettings[]>>;
  upsert(data: CreateWidgetSettingsData): Promise<Result<WidgetSettings>>;
  update(userId: string, widgetId: string, data: UpdateWidgetSettingsData): Promise<Result<WidgetSettings>>;
  delete(userId: string, widgetId: string): Promise<Result<void>>;
}
