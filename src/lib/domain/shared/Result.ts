/**
 * Result pattern implementation for functional error handling
 * Prevents exceptions and provides explicit error states
 */
export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value, undefined);
  }

  static fail<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  static failWithMessage<T>(message: string): Result<T, Error> {
    return new Result<T, Error>(false, undefined, new Error(message));
  }

  isSuccess(): boolean {
    return this._isSuccess;
  }

  isFailure(): boolean {
    return !this._isSuccess;
  }

  getValue(): T {
    if (!this._isSuccess || this._value === undefined) {
      throw new Error("Cannot get value from failed result");
    }
    return this._value;
  }

  getError(): E {
    if (this._isSuccess || this._error === undefined) {
      throw new Error("Cannot get error from successful result");
    }
    return this._error;
  }

  getValueOrDefault(defaultValue: T): T {
    return this._isSuccess && this._value !== undefined
      ? this._value
      : defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess && this._value !== undefined) {
      return new Result<U, E>(true, fn(this._value), undefined);
    }
    return new Result<U, E>(false, undefined, this._error!);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return new Result<T, F>(true, this._value!, undefined);
    }
    return Result.fail(fn(this._error!));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess && this._value !== undefined) {
      return fn(this._value);
    }
    return Result.fail(this._error!);
  }
}
