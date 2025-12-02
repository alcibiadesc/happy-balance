export interface UserPreferences {
  id: string;
  userId: string;
  currency: string;
  language: string;
  theme: string;
  portfolioGoal: number;
  fireWithdrawalRate: number;
  fireTargetExpenses: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPreferencesData {
  userId?: string;
  currency?: string;
  language?: string;
  theme?: string;
  portfolioGoal?: number;
  fireWithdrawalRate?: number;
  fireTargetExpenses?: number | null;
}

export interface UpdateUserPreferencesData {
  currency?: string;
  language?: string;
  theme?: string;
  portfolioGoal?: number;
  fireWithdrawalRate?: number;
  fireTargetExpenses?: number | null;
}
