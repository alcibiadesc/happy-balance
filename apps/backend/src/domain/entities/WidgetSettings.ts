export interface WidgetSettings {
  id: string;
  userId: string;
  widgetId: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWidgetSettingsData {
  userId: string;
  widgetId: string;
  settings: Record<string, unknown>;
}

export interface UpdateWidgetSettingsData {
  settings: Record<string, unknown>;
}
