import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { AuthenticationService } from '@domain/services/AuthenticationService';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User } from '@domain/entities/User';

const LoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1)
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string()
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4).max(100)
});

const ResetPasswordChangeSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4).max(100)
});

export class AuthController {
  private authService: AuthenticationService;

  constructor(private userRepository: IUserRepository) {
    this.authService = new AuthenticationService();
  }

  async login(req: Request, res: Response) {
    try {
      const validationResult = LoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const { username, password } = validationResult.data;

      // Find user by username
      const userResult = await this.userRepository.findByUsername(username);
      if (userResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to process login'
        });
      }

      const user = userResult.getValue();
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is disabled'
        });
      }

      // Verify password
      const passwordResult = await this.authService.verifyPassword(password, user.password);
      if (passwordResult.isFailure() || !passwordResult.getValue()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check if user must change password
      if (user.mustChangePassword) {
        return res.status(200).json({
          success: true,
          requiresPasswordChange: true,
          message: 'Password change required',
          data: {
            userId: user.id,
            username: user.username
          }
        });
      }

      // Generate tokens
      const tokensResult = this.authService.generateTokens(user);
      if (tokensResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate tokens'
        });
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      const tokens = tokensResult.getValue();
      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: user.toDTO()
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const validationResult = RefreshTokenSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const { refreshToken } = validationResult.data;

      // Verify refresh token
      const payloadResult = this.authService.verifyRefreshToken(refreshToken);
      if (payloadResult.isFailure()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        });
      }

      const payload = payloadResult.getValue();

      // Get user from database
      const userResult = await this.userRepository.findById(payload.userId);
      if (userResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to process refresh'
        });
      }

      const user = userResult.getValue();
      if (!user || !user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const tokensResult = this.authService.generateTokens(user);
      if (tokensResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate tokens'
        });
      }

      const tokens = tokensResult.getValue();
      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const validationResult = ChangePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const { currentPassword, newPassword } = validationResult.data;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get user
      const userResult = await this.userRepository.findById(userId);
      if (userResult.isFailure() || !userResult.getValue()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.getValue()!;

      // Verify current password
      const passwordResult = await this.authService.verifyPassword(currentPassword, user.password);
      if (passwordResult.isFailure() || !passwordResult.getValue()) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashResult = await this.authService.hashPassword(newPassword);
      if (hashResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update password'
        });
      }

      // Update user with new password and clear password change requirement
      const updatedUser = User.create({
        ...user.toDTO(),
        password: hashResult.getValue(),
        mustChangePassword: false,
        passwordResetAt: undefined
      });

      const updateResult = await this.userRepository.update(updatedUser);
      if (updateResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update password'
        });
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async resetPasswordChange(req: Request, res: Response) {
    try {
      const validationResult = ResetPasswordChangeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const { userId, currentPassword, newPassword } = validationResult.data;

      // Get user
      const userResult = await this.userRepository.findById(userId);
      if (userResult.isFailure() || !userResult.getValue()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.getValue()!;

      // Verify user must change password
      if (!user.mustChangePassword) {
        return res.status(400).json({
          success: false,
          error: 'Password change not required'
        });
      }

      // Verify current password (temporary password)
      const passwordResult = await this.authService.verifyPassword(currentPassword, user.password);
      if (passwordResult.isFailure() || !passwordResult.getValue()) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashResult = await this.authService.hashPassword(newPassword);
      if (hashResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update password'
        });
      }

      // Update user with new password and clear password change requirement
      const updatedUser = User.create({
        ...user.toDTO(),
        password: hashResult.getValue(),
        mustChangePassword: false,
        passwordResetAt: undefined
      });

      const updateResult = await this.userRepository.update(updatedUser);
      if (updateResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update password'
        });
      }

      // Generate tokens for successful login
      const tokensResult = this.authService.generateTokens(updatedUser);
      if (tokensResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate tokens'
        });
      }

      // Update last login
      await this.userRepository.updateLastLogin(updatedUser.id);

      const tokens = tokensResult.getValue();
      res.json({
        success: true,
        message: 'Password changed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: updatedUser.toDTO()
        }
      });
    } catch (error) {
      console.error('Reset password change error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async logout(req: Request, res: Response) {
    // For JWT-based auth, logout is typically handled client-side
    // by removing the tokens. This endpoint is for audit/tracking purposes.
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const userResult = await this.userRepository.findById(userId);
      if (userResult.isFailure() || !userResult.getValue()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.getValue()!;
      res.json({
        success: true,
        data: user.toDTO()
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}