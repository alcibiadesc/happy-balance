export interface UserPreferences {
  id: string;
  userId: string;
  currency: string;
  language: string;
  theme: string;
  portfolioGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPreferencesData {
  userId?: string;
  currency?: string;
  language?: string;
  theme?: string;
  portfolioGoal?: number;
}

export interface UpdateUserPreferencesData {
  currency?: string;
  language?: string;
  theme?: string;
  portfolioGoal?: number;
}
