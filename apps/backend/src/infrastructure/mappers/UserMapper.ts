import type { UserDTO } from '@happy-balance/shared-types';
import { User } from '@domain/entities/User';

/**
 * Maps domain User to API UserDTO.
 * Strips sensitive fields (password, etc.) for API responses.
 */
export function mapUserToDTO(user: User): UserDTO {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    displayName: user.displayName,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
