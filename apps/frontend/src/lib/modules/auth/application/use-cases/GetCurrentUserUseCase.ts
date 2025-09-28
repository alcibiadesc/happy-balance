/**
 * Get Current User Use Case - Application Layer
 */

import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { User } from '../../domain/entities/User';

export class GetCurrentUserUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<User | null> {
    return await this.authRepository.getCurrentUser();
  }
}