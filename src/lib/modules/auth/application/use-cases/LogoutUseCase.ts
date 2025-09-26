/**
 * Logout Use Case - Application Layer
 */

import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.logout();
  }
}