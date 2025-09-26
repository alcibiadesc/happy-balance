export type UserRole = 'admin' | 'user' | 'viewer';

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _username: string,
    private readonly _displayName: string,
    private readonly _password: string,
    private readonly _role: UserRole,
    private readonly _isActive: boolean,
    private readonly _createdBy?: string,
    private _lastLogin?: Date,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    username: string;
    displayName: string;
    password: string;
    role?: UserRole;
    isActive?: boolean;
    createdBy?: string;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    return new User(
      props.id,
      props.username,
      props.displayName,
      props.password,
      props.role || 'user',
      props.isActive ?? true,
      props.createdBy,
      props.lastLogin,
      props.createdAt,
      props.updatedAt
    );
  }

  get id(): string {
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get displayName(): string {
    return this._displayName;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdBy(): string | undefined {
    return this._createdBy;
  }

  get lastLogin(): Date | undefined {
    return this._lastLogin;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  updateLastLogin(): void {
    this._lastLogin = new Date();
  }

  isAdmin(): boolean {
    return this._role === 'admin';
  }

  isUser(): boolean {
    return this._role === 'user';
  }

  isViewer(): boolean {
    return this._role === 'viewer';
  }

  canEdit(): boolean {
    return this._role === 'admin' || this._role === 'user';
  }

  canView(): boolean {
    return this._isActive;
  }

  canManageUsers(): boolean {
    return this._role === 'admin';
  }

  toDTO() {
    return {
      id: this._id,
      username: this._username,
      displayName: this._displayName,
      role: this._role,
      isActive: this._isActive,
      createdBy: this._createdBy,
      lastLogin: this._lastLogin,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}