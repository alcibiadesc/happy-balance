import { Result } from '@domain/shared/Result';
import { User } from '@domain/entities/User';

export interface IUserRepository {
  findById(id: string): Promise<Result<User | null>>;
  findByUsername(username: string): Promise<Result<User | null>>;
  findAll(): Promise<Result<User[]>>;
  create(user: User): Promise<Result<User>>;
  update(user: User): Promise<Result<User>>;
  delete(id: string): Promise<Result<void>>;
  updateLastLogin(userId: string): Promise<Result<void>>;
}