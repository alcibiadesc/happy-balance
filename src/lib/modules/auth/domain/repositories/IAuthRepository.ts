/**
 * Auth Repository Interface - Domain Layer (Hexagonal Architecture)
 * Defines the port for authentication operations
 */

import type { User } from '../entities/User';
import type { AuthTokens } from '../value-objects/AuthToken';
import type { Username } from '../value-objects/Username';
import type { UserId } from '../value-objects/UserId';

export interface LoginCredentials {
  username: Username;
  password: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  getCurrentUser(): Promise<User | null>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}