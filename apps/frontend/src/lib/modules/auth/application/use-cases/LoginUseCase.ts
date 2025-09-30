/**
 * Login Use Case - Application Layer
 * Orchestrates the login flow
 */

import type { IAuthRepository, LoginResponse, PasswordChangeRequired } from '../../domain/repositories/IAuthRepository';
import type { User } from '../../domain/entities/User';
import type { AuthTokens } from '../../domain/value-objects/AuthToken';
import { Username } from '../../domain/value-objects/Username';

export interface LoginRequest {
  username: string;
  password: string;
}

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(request: LoginRequest): Promise<LoginResponse | PasswordChangeRequired> {
    // Validate input
    if (!request.username || !request.password) {
      throw new Error('Username and password are required');
    }

    // Create value objects
    const username = Username.create(request.username);

    // Perform login
    const result = await this.authRepository.login({
      username,
      password: request.password
    });

    return result;
  }
}