/**
 * UserRole Value Object
 * Encapsulates role logic and permissions
 */

export type RoleType = 'admin' | 'user' | 'viewer';

export class UserRole {
  private constructor(private readonly _value: RoleType) {}

  static create(value: string): UserRole {
    if (!['admin', 'user', 'viewer'].includes(value)) {
      throw new Error(`Invalid role: ${value}`);
    }
    return new UserRole(value as RoleType);
  }

  static admin(): UserRole {
    return new UserRole('admin');
  }

  static user(): UserRole {
    return new UserRole('user');
  }

  static viewer(): UserRole {
    return new UserRole('viewer');
  }

  get value(): RoleType {
    return this._value;
  }

  isAdmin(): boolean {
    return this._value === 'admin';
  }

  isUser(): boolean {
    return this._value === 'user';
  }

  isViewer(): boolean {
    return this._value === 'viewer';
  }

  canEdit(): boolean {
    return this._value === 'admin' || this._value === 'user';
  }

  canView(): boolean {
    return true; // All roles can view
  }

  canManageUsers(): boolean {
    return this._value === 'admin';
  }

  canManageCategories(): boolean {
    return this._value === 'admin';
  }

  equals(other: UserRole): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}