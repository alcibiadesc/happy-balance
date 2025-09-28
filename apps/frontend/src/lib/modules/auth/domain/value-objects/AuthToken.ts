/**
 * AuthToken Value Objects
 * Encapsulates JWT tokens
 */

export class AccessToken {
  private constructor(private readonly _value: string) {}

  static create(value: string): AccessToken {
    if (!value || value.trim() === '') {
      throw new Error('Access token cannot be empty');
    }
    return new AccessToken(value);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}

export class RefreshToken {
  private constructor(private readonly _value: string) {}

  static create(value: string): RefreshToken {
    if (!value || value.trim() === '') {
      throw new Error('Refresh token cannot be empty');
    }
    return new RefreshToken(value);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}

export class AuthTokens {
  constructor(
    public readonly accessToken: AccessToken,
    public readonly refreshToken: RefreshToken
  ) {}

  static create(accessToken: string, refreshToken: string): AuthTokens {
    return new AuthTokens(
      AccessToken.create(accessToken),
      RefreshToken.create(refreshToken)
    );
  }
}