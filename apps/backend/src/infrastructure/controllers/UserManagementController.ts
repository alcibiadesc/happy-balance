import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { AuthenticationService } from '@domain/services/AuthenticationService';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User, UserRole } from '@domain/entities/User';
import { AuthRequest } from '@infrastructure/middleware/auth';

const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
  tempPassword: z.string().min(4).max(100).optional()
});

const UpdateUserSchema = z.object({
  role: z.enum(['admin', 'user', 'viewer']).optional(),
  isActive: z.boolean().optional()
});

const ResetPasswordSchema = z.object({
  userId: z.string(),
  tempPassword: z.string().min(4).max(100).optional()
});

export class UserManagementController {
  private authService: AuthenticationService;

  constructor(private userRepository: IUserRepository) {
    this.authService = new AuthenticationService();
  }

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const usersResult = await this.userRepository.findAll();

      if (usersResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch users'
        });
      }

      const users = usersResult.getValue().map(user => user.toDTO());

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      const validationResult = CreateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const { username, role, tempPassword } = validationResult.data;

      // Check if username already exists
      const existingUserResult = await this.userRepository.findByUsername(username);
      if (existingUserResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to check username availability'
        });
      }

      if (existingUserResult.getValue()) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists'
        });
      }

      // Generate temporary password if not provided
      const password = tempPassword || this.authService.generateTempPassword();

      // Hash password
      const hashResult = await this.authService.hashPassword(password);
      if (hashResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to process password'
        });
      }

      // Create user
      const newUser = User.create({
        id: randomUUID(),
        username,
        password: hashResult.getValue(),
        role: role as UserRole,
        isActive: true,
        mustChangePassword: true,
        createdBy: req.user?.userId
      });

      const createResult = await this.userRepository.create(newUser);
      if (createResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create user'
        });
      }

      const createdUser = createResult.getValue();

      res.status(201).json({
        success: true,
        data: {
          user: createdUser.toDTO(),
          tempPassword: password // Return temp password to admin
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      const validationResult = UpdateUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const updates = validationResult.data;

      // Get existing user
      const userResult = await this.userRepository.findById(userId);
      if (userResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch user'
        });
      }

      const user = userResult.getValue();
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Prevent admin from removing their own admin role
      if (userId === req.user?.userId && updates.role && updates.role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove your own admin privileges'
        });
      }

      // Update user
      const updatedUser = User.create({
        ...user.toDTO(),
        role: updates.role || user.role,
        isActive: updates.isActive !== undefined ? updates.isActive : user.isActive
      });

      const updateResult = await this.userRepository.update(updatedUser);
      if (updateResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update user'
        });
      }

      res.json({
        success: true,
        data: updateResult.getValue().toDTO()
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;

      // Prevent admin from deleting themselves
      if (userId === req.user?.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }

      // Check if user exists
      const userResult = await this.userRepository.findById(userId);
      if (userResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch user'
        });
      }

      if (!userResult.getValue()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Delete user
      const deleteResult = await this.userRepository.delete(userId);
      if (deleteResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete user'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async resetPassword(req: AuthRequest, res: Response) {
    try {
      const validationResult = ResetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const { userId, tempPassword } = validationResult.data;

      // Get user
      const userResult = await this.userRepository.findById(userId);
      if (userResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch user'
        });
      }

      const user = userResult.getValue();
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Generate new password
      const newPassword = tempPassword || this.authService.generateTempPassword();

      // Hash password
      const hashResult = await this.authService.hashPassword(newPassword);
      if (hashResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to process password'
        });
      }

      // Update user with new password and mark for password change
      const updatedUser = User.create({
        ...user.toDTO(),
        password: hashResult.getValue(),
        mustChangePassword: true,
        passwordResetAt: new Date()
      });

      const updateResult = await this.userRepository.update(updatedUser);
      if (updateResult.isFailure()) {
        return res.status(500).json({
          success: false,
          error: 'Failed to reset password'
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Password reset successfully',
          tempPassword: newPassword
        }
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}