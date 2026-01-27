import type { Result, Success, Failure } from '@oxlayer/foundation-app-kit';

/**
 * Assert that a Result is successful
 *
 * @example
 * ```ts
 * const result = await createUser.execute(input);
 * assertOk(result);
 * expect(result.value.id).toBeDefined();
 * ```
 */
export function assertOk<T, E extends Error>(
  result: Result<T, E>,
  message?: string
): asserts result is Success<T> {
  if (!result.ok) {
    throw new Error(
      message ?? `Expected Result to be ok, but got error: ${result.error.message}`
    );
  }
}

/**
 * Assert that a Result is a failure
 *
 * @example
 * ```ts
 * const result = await createUser.execute(invalidInput);
 * assertErr(result);
 * expect(result.error).toBeInstanceOf(ValidationError);
 * ```
 */
export function assertErr<T, E extends Error>(
  result: Result<T, E>,
  message?: string
): asserts result is Failure<E> {
  if (result.ok) {
    throw new Error(message ?? 'Expected Result to be err, but got ok');
  }
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

/**
 * Assert that a value is null or undefined
 */
export function assertNotDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is null | undefined {
  if (value !== null && value !== undefined) {
    throw new Error(message ?? 'Expected value to be null or undefined');
  }
}

/**
 * Wait for a condition to become true
 *
 * @example
 * ```ts
 * await waitFor(() => repository.count() > 0, { timeout: 1000 });
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
