export interface UserPreferences {
  id: string;
  userId: string;
  currency: string;
  language: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPreferencesData {
  userId?: string;
  currency?: string;
  language?: string;
  theme?: string;
}

export interface UpdateUserPreferencesData {
  currency?: string;
  language?: string;
  theme?: string;
}
