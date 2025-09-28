/**
 * User Entity - Core business entity for authentication
 * Following DDD principles
 */

import type { UserRole } from '../value-objects/UserRole';
import type { UserId } from '../value-objects/UserId';
import type { Username } from '../value-objects/Username';

export interface UserProps {
  id: UserId;
  username: Username;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdBy?: UserId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): UserId {
    return this.props.id;
  }

  get username(): Username {
    return this.props.username;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): UserId | undefined {
    return this.props.createdBy;
  }

  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role.isAdmin();
  }

  isUser(): boolean {
    return this.props.role.isUser();
  }

  isViewer(): boolean {
    return this.props.role.isViewer();
  }

  canEdit(): boolean {
    return this.props.role.canEdit();
  }

  canManageUsers(): boolean {
    return this.props.role.canManageUsers();
  }

  toJSON() {
    return {
      id: this.props.id.value,
      username: this.props.username.value,
      displayName: this.props.displayName,
      role: this.props.role.value,
      isActive: this.props.isActive,
      createdBy: this.props.createdBy?.value,
      lastLogin: this.props.lastLogin,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
  }
}