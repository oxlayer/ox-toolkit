/**
 * Error Handling Test Patterns
 *
 * Reusable test patterns for error handling including network failures,
 * timeouts, constraint violations, and cascading failures.
 *
 * @example
 * ```typescript
 * import { createFaultyRepository, createTimeoutPromise } from '@oxlayer/capabilities-testing/patterns/errors';
 *
 * describe('Error Handling Tests', () => {
 *   test('should handle repository errors', async () => {
 *     const faultyRepo = createFaultyRepository({ createError: 'Connection lost' });
 *     const useCase = new CreateTodoUseCase(faultyRepo, ...);
 *     const result = await useCase.execute({ title: 'Test', userId: 'user-1' });
 *     expect(result.success).toBe(false);
 *   });
 * });
 * ```
 */

/**
 * A result type for use case operations
 */
export type AppResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

export interface ErrorHandlingTestOptions<TInput, TOutput> {
  /**
   * Create a use case with a faulty repository
   */
  createUseCase: (faultyRepo: any) => unknown;

  /**
   * Execute the action
   */
  executeAction: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input for the action
   */
  createInput: () => TInput;

  /**
   * Setup a faulty repository
   */
  setupFaultyRepository: (errorType: 'connection' | 'timeout' | 'constraint') => any;

  /**
   * Expected error code for the action
   */
  expectedErrorCode?: string;
}

/**
 * Test definitions for error handling
 */
export function errorHandlingTests<TInput, TOutput>(
  _options: ErrorHandlingTestOptions<TInput, TOutput>
): void {
  throw new Error(
    'errorHandlingTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate error handling tests.'
  );
}

/**
 * Create a faulty repository for testing
 *
 * Utility function to create a repository that fails in specific ways.
 *
 * @example
 * ```typescript
 * const faultyRepo = createFaultyRepository({
 *   createError: 'Connection lost',
 *   errorRate: 0.5 // 50% of operations fail
 * });
 * ```
 */
export function createFaultyRepository(options: {
  createError?: string;
  readError?: string;
  updateError?: string;
  deleteError?: string;
  errorRate?: number; // 0-1, fraction of operations that fail
}): any {
  const { errorRate = 1, createError, readError, updateError, deleteError } = options;

  return {
    create: async () => {
      if (createError && Math.random() < errorRate) {
        throw new Error(createError);
      }
    },
    findById: async () => {
      if (readError && Math.random() < errorRate) {
        throw new Error(readError);
      }
      return null;
    },
    findAll: async () => {
      if (readError && Math.random() < errorRate) {
        throw new Error(readError);
      }
      return [];
    },
    update: async () => {
      if (updateError && Math.random() < errorRate) {
        throw new Error(updateError);
      }
    },
    delete: async () => {
      if (deleteError && Math.random() < errorRate) {
        throw new Error(deleteError);
      }
    },
    count: async () => {
      if (readError && Math.random() < errorRate) {
        throw new Error(readError);
      }
      return 0;
    }
  };
}

/**
 * Create a timeout promise for testing timeout scenarios
 *
 * @example
 * ```typescript
 * test('should timeout', async () => {
 *   const result = Promise.race([
 *     useCase.execute(input),
 *     createTimeoutPromise(1000)
 *   ]);
 *   await expect(result).rejects.toThrow('Timeout');
 * });
 * ```
 */
export function createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeoutMs);
  });
}

export interface RetryTestOptions<TInput, TOutput> {
  createUseCase: (shouldFail: () => boolean) => unknown;
  executeAction: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;
  createInput: () => TInput;
  maxRetries?: number;
}

/**
 * Test definitions for retry logic
 */
export function retryTests<TInput, TOutput>(
  _options: RetryTestOptions<TInput, TOutput>
): void {
  throw new Error(
    'retryTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate retry tests.'
  );
}

// Legacy function names for backward compatibility
export const describeErrorHandlingTests = errorHandlingTests;
export const describeRetryTests = retryTests;
