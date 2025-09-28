import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Result } from '@domain/shared/Result';
import { User, UserRole } from '@domain/entities/User';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthenticationService {
  private readonly saltRounds = 10;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '1h'; // 1 hour for access token
  private readonly refreshTokenExpiry = '30d'; // 30 days for refresh token

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-me';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me';

    if (this.accessTokenSecret.includes('default') || this.refreshTokenSecret.includes('default')) {
      console.warn('⚠️ Using default JWT secrets. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production');
    }
  }

  async hashPassword(password: string): Promise<Result<string>> {
    try {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return Result.ok(hashedPassword);
    } catch (error) {
      return Result.fail(`Failed to hash password: ${error}`);
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<Result<boolean>> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return Result.ok(isValid);
    } catch (error) {
      return Result.fail(`Failed to verify password: ${error}`);
    }
  }

  generateTokens(user: User): Result<AuthTokens> {
    try {
      const payload: AuthTokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role
      };

      const accessToken = jwt.sign(
        payload,
        this.accessTokenSecret,
        { expiresIn: this.accessTokenExpiry }
      );

      const refreshToken = jwt.sign(
        payload,
        this.refreshTokenSecret,
        { expiresIn: this.refreshTokenExpiry }
      );

      return Result.ok({ accessToken, refreshToken });
    } catch (error) {
      return Result.fail(`Failed to generate tokens: ${error}`);
    }
  }

  verifyAccessToken(token: string): Result<AuthTokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as AuthTokenPayload;
      return Result.ok(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return Result.fail('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return Result.fail('Invalid token');
      }
      return Result.fail(`Token verification failed: ${error}`);
    }
  }

  verifyRefreshToken(token: string): Result<AuthTokenPayload> {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as AuthTokenPayload;
      return Result.ok(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return Result.fail('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return Result.fail('Invalid refresh token');
      }
      return Result.fail(`Refresh token verification failed: ${error}`);
    }
  }

  generateTempPassword(): string {
    // Generate a random temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}