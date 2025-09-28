// Functional utilities for data transformation

// Pipe function for function composition
export const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value);

// Compose function (right to left)
export const compose = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduceRight((acc, fn) => fn(acc), value);

// Curry function for partial application
export const curry = <T extends (...args: any[]) => any>(fn: T) => {
  const arity = fn.length;
  return function curried(...args: any[]): any {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...nextArgs: any[]) => curried(...args, ...nextArgs);
  };
};

// Map for objects
export const mapObject = <T, U>(
  fn: (value: T, key: string) => U,
  obj: Record<string, T>
): Record<string, U> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = fn(value, key);
    return acc;
  }, {} as Record<string, U>);
};

// Filter for objects
export const filterObject = <T>(
  predicate: (value: T, key: string) => boolean,
  obj: Record<string, T>
): Record<string, T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (predicate(value, key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, T>);
};

// Reduce for objects
export const reduceObject = <T, U>(
  fn: (acc: U, value: T, key: string) => U,
  initial: U,
  obj: Record<string, T>
): U => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return fn(acc, value, key);
  }, initial);
};

// Memoization helper
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  }) as T;
};

// Debounce helper
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Either monad for error handling
export type Either<L, R> = Left<L> | Right<R>;

export class Left<L> {
  constructor(public readonly value: L) {}

  map<T>(_fn: (value: any) => T): Either<L, T> {
    return this as any;
  }

  flatMap<T>(_fn: (value: any) => Either<L, T>): Either<L, T> {
    return this as any;
  }

  fold<T>(onLeft: (value: L) => T, _onRight: (value: any) => T): T {
    return onLeft(this.value);
  }

  isLeft(): boolean {
    return true;
  }

  isRight(): boolean {
    return false;
  }
}

export class Right<R> {
  constructor(public readonly value: R) {}

  map<T>(fn: (value: R) => T): Either<any, T> {
    return new Right(fn(this.value));
  }

  flatMap<L, T>(fn: (value: R) => Either<L, T>): Either<L, T> {
    return fn(this.value);
  }

  fold<T>(_onLeft: (value: any) => T, onRight: (value: R) => T): T {
    return onRight(this.value);
  }

  isLeft(): boolean {
    return false;
  }

  isRight(): boolean {
    return true;
  }
}

export const left = <L>(value: L): Either<L, any> => new Left(value);
export const right = <R>(value: R): Either<any, R> => new Right(value);

// Option/Maybe monad for null handling
export type Option<T> = Some<T> | None;

export class Some<T> {
  constructor(public readonly value: T) {}

  map<U>(fn: (value: T) => U): Option<U> {
    return new Some(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }

  getOrElse(_defaultValue: T): T {
    return this.value;
  }

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }
}

export class None {
  map<U>(_fn: (value: any) => U): Option<U> {
    return new None();
  }

  flatMap<U>(_fn: (value: any) => Option<U>): Option<U> {
    return new None();
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }
}

export const some = <T>(value: T): Option<T> => new Some(value);
export const none = (): Option<any> => new None();
export const fromNullable = <T>(value: T | null | undefined): Option<T> =>
  value === null || value === undefined ? none() : some(value);