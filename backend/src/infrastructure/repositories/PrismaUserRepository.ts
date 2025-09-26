import { PrismaClient } from '@prisma/client';
import { Result } from '@domain/shared/Result';
import { User, UserRole } from '@domain/entities/User';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Result<User | null>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return Result.ok(null);
      }

      return Result.ok(
        User.create({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          password: user.password,
          role: user.role as UserRole,
          isActive: user.isActive,
          createdBy: user.createdBy || undefined,
          lastLogin: user.lastLogin || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })
      );
    } catch (error) {
      return Result.fail(`Failed to find user by id: ${error}`);
    }
  }

  async findByUsername(username: string): Promise<Result<User | null>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username }
      });

      if (!user) {
        return Result.ok(null);
      }

      return Result.ok(
        User.create({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          password: user.password,
          role: user.role as UserRole,
          isActive: user.isActive,
          createdBy: user.createdBy || undefined,
          lastLogin: user.lastLogin || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })
      );
    } catch (error) {
      return Result.fail(`Failed to find user by username: ${error}`);
    }
  }

  async findAll(): Promise<Result<User[]>> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const domainUsers = users.map(user =>
        User.create({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          password: user.password,
          role: user.role as UserRole,
          isActive: user.isActive,
          createdBy: user.createdBy || undefined,
          lastLogin: user.lastLogin || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })
      );

      return Result.ok(domainUsers);
    } catch (error) {
      return Result.fail(`Failed to find all users: ${error}`);
    }
  }

  async create(user: User): Promise<Result<User>> {
    try {
      const created = await this.prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          password: user.password,
          role: user.role,
          isActive: user.isActive,
          createdBy: user.createdBy
        }
      });

      return Result.ok(
        User.create({
          id: created.id,
          username: created.username,
          displayName: created.displayName,
          password: created.password,
          role: created.role as UserRole,
          isActive: created.isActive,
          createdBy: created.createdBy || undefined,
          lastLogin: created.lastLogin || undefined,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        })
      );
    } catch (error) {
      return Result.fail(`Failed to create user: ${error}`);
    }
  }

  async update(user: User): Promise<Result<User>> {
    try {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: user.displayName,
          role: user.role,
          isActive: user.isActive
        }
      });

      return Result.ok(
        User.create({
          id: updated.id,
          username: updated.username,
          displayName: updated.displayName,
          password: updated.password,
          role: updated.role as UserRole,
          isActive: updated.isActive,
          createdBy: updated.createdBy || undefined,
          lastLogin: updated.lastLogin || undefined,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        })
      );
    } catch (error) {
      return Result.fail(`Failed to update user: ${error}`);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to delete user: ${error}`);
    }
  }

  async updateLastLogin(userId: string): Promise<Result<void>> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLogin: new Date()
        }
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to update last login: ${error}`);
    }
  }
}