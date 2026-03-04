/**
 * Authentication types shared between frontend and backend.
 */

export type UserRole = 'admin' | 'user' | 'viewer';

export interface UserDTO {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  displayName?: string;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
