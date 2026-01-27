/**
 * Test Helpers
 *
 * Common utility functions for testing.
 *
 * @example
 * ```typescript
 * import { waitFor, retry, delay } from '@oxlayer/capabilities-testing/test-helpers';
 *
 * // Wait for a condition to be true
 * await waitFor(() => eventBus.wasPublished('Todo.Created'));
 *
 * // Retry an operation with backoff
 * const result = await retry(() => fetch(url), { maxAttempts: 3 });
 *
 * // Delay for a specific time
 * await delay(100);
 * ```
 */

/**
 * Options for waitFor function.
 */
export interface WaitForOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Poll interval in milliseconds (default: 50) */
  interval?: number;
  /** Custom error message */
  message?: string;
}

/**
 * Wait for a condition to become true.
 *
 * @param condition - Function that returns true when condition is met
 * @param options - Optional configuration
 * @returns Promise that resolves when condition is true
 * @throws Error if timeout is reached
 *
 * @example
 * ```typescript
 * // Wait for an event to be published
 * await waitFor(() => eventBus.wasPublished('Todo.Created'));
 *
 * // Wait with custom timeout
 * await waitFor(
 *   () => todoRepository.findById('todo-1') !== null,
 *   { timeout: 10000, interval: 100 }
 * );
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: WaitForOptions = {}
): Promise<void> {
  const { timeout = 5000, interval = 50, message } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }

  throw new Error(
    message || `Wait condition not met within ${timeout}ms`
  );
}

/**
 * Options for retry function.
 */
export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 100) */
  initialDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay in milliseconds (default: 5000) */
  maxDelay?: number;
  /** Whether to retry on all errors (default: true) */
  retryAllErrors?: boolean;
  /** Function to determine if an error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Retry an operation with exponential backoff.
 *
 * @param fn - Function to retry
 * @param options - Optional configuration
 * @returns Promise that resolves with the function result
 * @throws The last error if all attempts fail
 *
 * @example
 * ```typescript
 * // Retry a fetch request
 * const result = await retry(() => fetch(url), { maxAttempts: 3 });
 *
 * // Retry with custom backoff
 * await retry(
 *   () => database.query(sql),
 *   { maxAttempts: 5, initialDelay: 200, backoffMultiplier: 1.5 }
 * );
 *
 * // Retry only on specific errors
 * await retry(
 *   () => apiCall(),
 *   {
 *     isRetryable: (err) => err instanceof NetworkError
 *   }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    backoffMultiplier = 2,
    maxDelay = 5000,
    retryAllErrors = true,
    isRetryable = () => retryAllErrors,
  } = options;

  let lastError: unknown;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }

      await delay(Math.min(currentDelay, maxDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Delay for a specified amount of time.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```typescript
 * await delay(100); // Wait 100ms
 * await delay(1000); // Wait 1 second
 * ```
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a promise that resolves after a timeout.
 *
 * @param ms - Milliseconds to timeout
 * @param value - Value to resolve with (default: undefined)
 * @returns Promise that resolves with the value after timeout
 *
 * @example
 * ```typescript
 * // Race between two operations
 * const result = await Promise.race([
 *   slowOperation(),
 *   timeout(1000, null)
 * ]);
 *
 * if (result === null) {
 *   console.log('Operation timed out');
 * }
 * ```
 */
export function timeout<T>(ms: number, value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

/**
 * Create a timeout promise that rejects.
 *
 * @param ms - Milliseconds to timeout
 * @param message - Error message (default: 'Operation timed out')
 * @returns Promise that rejects with an Error after timeout
 *
 * @example
 * ```typescript
 * // Fail test if operation takes too long
 * await Promise.race([
 *   operation(),
 *   timeoutError(5000, 'Operation took too long')
 * ]);
 * ```
 */
export function timeoutError(
  ms: number,
  message = 'Operation timed out'
): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}

/**
 * Measure the time it takes for a function to execute.
 *
 * @param fn - Function to measure
 * @returns Promise resolving to [result, duration in ms]
 *
 * @example
 * ```typescript
 * const [result, duration] = await measureTime(() => expensiveOperation());
 * console.log(`Operation took ${duration}ms`);
 * ```
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>
): Promise<[T, number]> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return [result, duration];
}

/**
 * Run multiple functions concurrently and wait for all to complete.
 *
 * @param fns - Array of functions to run
 * @returns Promise resolving to array of results
 *
 * @example
 * ```typescript
 * const results = await concurrent([
 *   () => fetch(url1),
 *   () => fetch(url2),
 *   () => fetch(url3),
 * ]);
 * ```
 */
export async function concurrent<T>(
  fns: Array<() => T | Promise<T>>
): Promise<T[]> {
  return Promise.all(fns.map(fn => fn()));
}

/**
 * Create a test context that cleans up after itself.
 *
 * @param setup - Setup function that returns a teardown function
 * @returns Promise resolving to the created context
 *
 * @example
 * ```typescript
 * const { eventBus, cleanup } = await createTestContext(async () => {
 *   const eventBus = new MockEventBus();
 *   return {
 *     eventBus,
 *     cleanup: async () => {
 *       await eventBus.disconnect();
 *     }
 *   };
 * });
 *
 * // Use eventBus...
 *
 * // Cleanup after test
 * await cleanup();
 * ```
 */
export async function createTestContext<T>(
  setup: () => T | Promise<T>
): Promise<T> {
  return setup();
}

/**
 * Create a spy function that tracks calls.
 *
 * @param fn - Optional function to wrap (default: no-op)
 * @returns Spy function with tracking properties
 *
 * @example
 * ```typescript
 * const spy = createSpy((x: number) => x * 2);
 *
 * spy(5);
 * spy(10);
 *
 * expect(spy.callCount).toBe(2);
 * expect(spy.calls).toEqual([[5], [10]]);
 * expect(spy.lastCall).toEqual([10]);
 * ```
 */
export function createSpy<TArgs extends unknown[], TReturn>(
  fn?: (...args: TArgs) => TReturn
): ((...args: TArgs) => TReturn) & {
  calls: TArgs[];
  callCount: number;
  lastCall: TArgs[] | undefined;
} {
  const calls: TArgs[] = [];

  const spy = ((...args: TArgs): TReturn => {
    calls.push(args);
    return fn ? fn(...args) : undefined as TReturn;
  }) as ((...args: TArgs) => TReturn) & {
    calls: TArgs[];
    callCount: number;
    lastCall: TArgs[] | undefined;
  };

  spy.calls = calls;
  spy.callCount = 0;
  spy.lastCall = undefined;

  // Proxy to update callCount and lastCall
  return new Proxy(spy, {
    apply(_target, _thisArg, argArray) {
      const result = fn ? fn(...(argArray as TArgs)) : undefined as TReturn;
      calls.push(argArray as TArgs);
      (spy as any).callCount = calls.length;
      (spy as any).lastCall = argArray as TArgs;
      return result;
    },
  });
}

/**
 * Stub a method on an object.
 *
 * @param obj - Object to stub
 * @param method - Method name to stub
 * @param fn - Function to replace with
 * @returns Function to restore the original method
 *
 * @example
 * ```typescript
 * const restore = stubMethod(todoRepository, 'findById', async (id) => {
 *   return mockTodo;
 * });
 *
 * const todo = await todoRepository.findById('todo-1');
 *
 * // Restore original method
 * restore();
 * ```
 */
export function stubMethod<T extends object, K extends keyof T>(
  obj: T,
  method: K,
  fn: T[K]
): () => void {
  const original = obj[method];
  (obj as any)[method] = fn;
  return () => {
    (obj as any)[method] = original;
  };
}
