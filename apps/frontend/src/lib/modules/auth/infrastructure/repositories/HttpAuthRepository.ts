/**
 * HTTP Auth Repository - Infrastructure Layer (Hexagonal Architecture)
 * Adapter that implements the auth repository using HTTP API
 */

import type { IAuthRepository, LoginCredentials } from '../../domain/repositories/IAuthRepository';
import type { User } from '../../domain/entities/User';
import { User as UserEntity } from '../../domain/entities/User';
import { AuthTokens, AccessToken, RefreshToken } from '../../domain/value-objects/AuthToken';
import { UserId } from '../../domain/value-objects/UserId';
import { Username } from '../../domain/value-objects/Username';
import { UserRole } from '../../domain/value-objects/UserRole';
import { getApiUrl } from '$lib/utils/api-url';

const API_BASE = getApiUrl();

export class HttpAuthRepository implements IAuthRepository {
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;

  constructor() {
    // Load tokens from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshTokenValue = localStorage.getItem('refreshToken');
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens } | { requiresPasswordChange: true; userId: string; username: string }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: credentials.username.value,
        password: credentials.password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();

    // Check if password change is required
    if (result.requiresPasswordChange) {
      return {
        requiresPasswordChange: true,
        userId: result.data.userId,
        username: result.data.username
      };
    }

    // Store tokens
    this.accessToken = result.data.accessToken;
    this.refreshTokenValue = result.data.refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    // Map to domain entities
    const user = this.mapToDomainUser(result.data.user);
    const tokens = AuthTokens.create(
      result.data.accessToken,
      result.data.refreshToken
    );

    return { user, tokens };
  }

  async logout(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear tokens
    this.accessToken = null;
    this.refreshTokenValue = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const result = await response.json();

    // Update tokens
    this.accessToken = result.data.accessToken;
    this.refreshTokenValue = result.data.refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    return AuthTokens.create(
      result.data.accessToken,
      result.data.refreshToken
    );
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 && this.refreshTokenValue) {
          // Try to refresh token
          await this.refreshToken(this.refreshTokenValue);
          // Retry with new token
          return this.getCurrentUser();
        }
        return null;
      }

      const result = await response.json();
      return this.mapToDomainUser(result.data);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password change failed');
    }
  }

  async resetPasswordChange(userId: string, currentPassword: string, newPassword: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${API_BASE}/auth/reset-password-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password change failed');
    }

    const result = await response.json();

    // Store tokens
    this.accessToken = result.data.accessToken;
    this.refreshTokenValue = result.data.refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    // Map to domain entities
    const user = this.mapToDomainUser(result.data.user);
    const tokens = AuthTokens.create(
      result.data.accessToken,
      result.data.refreshToken
    );

    return { user, tokens };
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private mapToDomainUser(data: any): User {
    return UserEntity.create({
      id: UserId.create(data.id),
      username: Username.create(data.username),
      displayName: data.displayName,
      role: UserRole.create(data.role),
      isActive: data.isActive,
      createdBy: data.createdBy ? UserId.create(data.createdBy) : undefined,
      lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }
}