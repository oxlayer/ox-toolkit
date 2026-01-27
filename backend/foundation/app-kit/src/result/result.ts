/**
 * Result type for operations that can fail.
 *
 * This is a discriminated union that forces callers to handle both success and failure cases.
 * Use this instead of throwing exceptions for expected business failures.
 *
 * @example
 * ```ts
 * function divide(a: number, b: number): Result<number, DivisionByZeroError> {
 *   if (b === 0) {
 *     return Result.fail(new DivisionByZeroError());
 *   }
 *   return Result.ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isOk()) {
 *   console.log(result.value); // 5
 * } else {
 *   console.log(result.error.message);
 * }
 * ```
 */
export type Result<T, E extends Error = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly ok = true as const;

  constructor(public readonly value: T) {}

  isOk(): this is Success<T> {
    return true;
  }

  isErr(): this is Failure<never> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  flatMap<U, E extends Error>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }
}

export class Failure<E extends Error> {
  readonly ok = false as const;

  constructor(public readonly error: E) {}

  isOk(): this is Success<never> {
    return false;
  }

  isErr(): this is Failure<E> {
    return true;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Failure<E>;
  }

  flatMap<U, E2 extends Error>(_fn: (value: never) => Result<U, E2>): Result<U, E | E2> {
    return this as unknown as Failure<E>;
  }

  unwrap(): never {
    throw this.error;
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }
}

/**
 * Helper namespace for creating Result values
 */
export const Result = {
  /**
   * Create a successful result
   */
  ok<T>(value: T): Success<T> {
    return new Success(value);
  },

  /**
   * Create a failed result
   */
  fail<E extends Error>(error: E): Failure<E> {
    return new Failure(error);
  },

  /**
   * Wrap a promise that might throw into a Result
   */
  async fromPromise<T, E extends Error = Error>(
    promise: Promise<T>,
    errorMapper?: (error: unknown) => E
  ): Promise<Result<T, E>> {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      if (errorMapper) {
        return Result.fail(errorMapper(error));
      }
      if (error instanceof Error) {
        return Result.fail(error as E);
      }
      return Result.fail(new Error(String(error)) as E);
    }
  },

  /**
   * Combine multiple results into a single result
   * Returns first failure or all successes
   */
  all<T, E extends Error>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (result.isErr()) {
        return result as unknown as Failure<E>;
      }
      values.push(result.value);
    }
    return Result.ok(values);
  },
};

/**
 * Type guard to check if a result is a success
 */
export function isOk<T, E extends Error>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

/**
 * Type guard to check if a result is a failure
 */
export function isErr<T, E extends Error>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}
