/**
 * Result pattern implementation for better error handling
 * Inspired by Rust's Result<T, E> type
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly success = true;
  readonly failure = false;
  
  constructor(public readonly data: T) {}
  
  map<U>(fn: (data: T) => U): Result<U, never> {
    return new Success(fn(this.data));
  }
  
  flatMap<U, E>(fn: (data: T) => Result<U, E>): Result<U, E> {
    return fn(this.data);
  }
  
  mapError<F>(_fn: (error: never) => F): Result<T, F> {
    return this as any;
  }
  
  match<U>(onSuccess: (data: T) => U, _onFailure: (error: never) => U): U {
    return onSuccess(this.data);
  }
  
  unwrap(): T {
    return this.data;
  }
  
  unwrapOr(_defaultValue: T): T {
    return this.data;
  }
  
  isSuccess(): this is Success<T> {
    return true;
  }
  
  isFailure(): this is Failure<never> {
    return false;
  }
}

export class Failure<E> {
  readonly success = false;
  readonly failure = true;
  
  constructor(public readonly error: E) {}
  
  map<U>(_fn: (data: never) => U): Result<U, E> {
    return this as any;
  }
  
  flatMap<U>(_fn: (data: never) => Result<U, E>): Result<U, E> {
    return this as any;
  }
  
  mapError<F>(fn: (error: E) => F): Result<never, F> {
    return new Failure(fn(this.error));
  }
  
  match<U>(_onSuccess: (data: never) => U, onFailure: (error: E) => U): U {
    return onFailure(this.error);
  }
  
  unwrap(): never {
    throw this.error;
  }
  
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }
  
  isSuccess(): this is Success<never> {
    return false;
  }
  
  isFailure(): this is Failure<E> {
    return true;
  }
}

// Factory functions
export const success = <T>(data: T): Success<T> => new Success(data);
export const failure = <E>(error: E): Failure<E> => new Failure(error);

// Utility functions
export const fromPromise = async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
  try {
    const data = await promise;
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fromThrowable = <T, Args extends any[]>(
  fn: (...args: Args) => T
) => (...args: Args): Result<T, Error> => {
  try {
    return success(fn(...args));
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

// Combine multiple results
export const combine = <T extends readonly Result<any, any>[]>(
  results: T
): Result<
  { [K in keyof T]: T[K] extends Result<infer U, any> ? U : never },
  T[number] extends Result<any, infer E> ? E : never
> => {
  const successes: any[] = [];
  
  for (const result of results) {
    if (result.isFailure()) {
      return result as any;
    }
    successes.push(result.data);
  }
  
  return success(successes as any);
};