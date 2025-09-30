/**
 * Auth Store - Presentation Layer
 * Using Svelte 5 runes for state management
 */

import { HttpAuthRepository } from '../../infrastructure/repositories/HttpAuthRepository';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { Username } from '../../domain/value-objects/Username';
import type { User } from '../../domain/entities/User';

class AuthStore {
  // State using Svelte 5 runes
  currentUser = $state<User | null>(null);
  isAuthenticated = $state(false);
  isLoading = $state(false);
  error = $state<string | null>(null);
  requiresPasswordChange = $state<{ userId: string; username: string } | null>(null);

  // Repository and use cases
  private authRepository: HttpAuthRepository;
  private loginUseCase: LoginUseCase;
  private logoutUseCase: LogoutUseCase;
  private getCurrentUserUseCase: GetCurrentUserUseCase;

  constructor() {
    this.authRepository = new HttpAuthRepository();
    this.loginUseCase = new LoginUseCase(this.authRepository);
    this.logoutUseCase = new LogoutUseCase(this.authRepository);
    this.getCurrentUserUseCase = new GetCurrentUserUseCase(this.authRepository);

    // Initialize auth state
    this.initializeAuth();
  }

  private async initializeAuth() {
    this.isLoading = true;
    try {
      const user = await this.getCurrentUserUseCase.execute();
      if (user) {
        this.currentUser = user;
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async login(username: string, password: string) {
    this.isLoading = true;
    this.error = null;
    this.requiresPasswordChange = null;

    try {
      const result = await this.authRepository.login({
        username: Username.create(username),
        password
      });

      if ('requiresPasswordChange' in result) {
        this.requiresPasswordChange = {
          userId: result.userId,
          username: result.username
        };
        return result;
      }

      this.currentUser = result.user;
      this.isAuthenticated = true;
      return result;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Login failed';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async resetPasswordChange(userId: string, currentPassword: string, newPassword: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await this.authRepository.resetPasswordChange(userId, currentPassword, newPassword);
      this.currentUser = result.user;
      this.isAuthenticated = true;
      this.requiresPasswordChange = null;
      return result;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Password change failed';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    this.isLoading = true;
    try {
      await this.logoutUseCase.execute();
      this.currentUser = null;
      this.isAuthenticated = false;
      this.requiresPasswordChange = null;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Computed getters using $derived
  isAdmin = $derived(this.currentUser?.isAdmin() ?? false);
  isUser = $derived(this.currentUser?.isUser() ?? false);
  isViewer = $derived(this.currentUser?.isViewer() ?? false);
  canEdit = $derived(this.currentUser?.canEdit() ?? false);
  canManageUsers = $derived(this.currentUser?.canManageUsers() ?? false);

  // Get access token for API calls
  getAccessToken(): string | null {
    return this.authRepository.getAccessToken();
  }
}

// Export singleton instance
export const authStore = new AuthStore();