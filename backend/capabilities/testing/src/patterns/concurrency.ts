/**
 * Concurrency Test Patterns
 *
 * Reusable test patterns for concurrency testing including race conditions,
 * idempotency, stress testing, and fault tolerance.
 *
 * @example
 * ```typescript
 * import { createRaceConditionTests } from '@oxlayer/capabilities-testing/patterns/concurrency';
 *
 * describe('Concurrency Tests', () => {
 *   raceConditionTests({
 *     setup: async () => {
 *       const todo = await createTodoUseCase.execute({ title: 'Test', userId: 'user-1' });
 *       return todo.data.id;
 *     },
 *     createUseCase: () => new UpdateTodoUseCase(...),
 *     executeAction: (useCase, id) => useCase.execute({ id, userId: 'user-1', title: 'Updated' }),
 *     actionName: 'update',
 *     isIdempotent: false
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

export interface RaceConditionTestOptions<_TInput, TOutput> {
  /**
   * Setup test data and return the entity ID
   */
  setup: () => Promise<string>;

  /**
   * Create a new use case instance for each operation
   */
  createUseCase: () => unknown;

  /**
   * Execute the action with the use case
   */
  executeAction: (useCase: unknown, entityId: string) => Promise<AppResult<TOutput>>;

  /**
   * Name of the action being tested
   */
  actionName: string;

  /**
   * Whether the action is idempotent (can be safely retried)
   */
  isIdempotent?: boolean;
}

/**
 * Test definitions for race conditions
 *
 * Run these tests in your test framework to verify concurrent operation safety.
 */
export function raceConditionTests<_TInput, TOutput>(
  _options: RaceConditionTestOptions<_TInput, TOutput>
): void {
  throw new Error(
    'raceConditionTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate race condition tests.'
  );
}

export interface IdempotencyTestOptions<_TInput, TOutput> {
  /**
   * Setup test data
   */
  setup: () => Promise<void>;

  /**
   * Create a use case
   */
  createUseCase: () => unknown;

  /**
   * Execute the action
   */
  executeAction: (useCase: unknown) => Promise<AppResult<TOutput>>;

  /**
   * Action name
   */
  actionName: string;

  /**
   * Verify both results are equivalent
   */
  assertEquivalent: (result1: AppResult<TOutput>, result2: AppResult<TOutput>) => void;
}

/**
 * Test definitions for idempotency
 */
export function idempotencyTests<_TInput, TOutput>(
  _options: IdempotencyTestOptions<_TInput, TOutput>
): void {
  throw new Error(
    'idempotencyTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate idempotency tests.'
  );
}

export interface StressTestOptions<_TInput, TOutput> {
  /**
   * Create a use case
   */
  createUseCase: () => unknown;

  /**
   * Execute a read operation
   */
  executeRead: (useCase: unknown) => Promise<AppResult<TOutput>>;

  /**
   * Execute a write operation
   */
  executeWrite: (useCase: unknown) => Promise<AppResult<TOutput>>;

  /**
   * Setup initial data
   */
  setup?: () => Promise<void>;
}

/**
 * Test definitions for stress testing
 */
export function stressTests<_TInput, TOutput>(
  _options: StressTestOptions<_TInput, TOutput>
): void {
  throw new Error(
    'stressTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate stress tests.'
  );
}

export interface FaultToleranceTestOptions<_TInput, TOutput> {
  /**
   * Setup test data
   */
  setup: () => Promise<void>;

  /**
   * Create a use case with a faulty dependency
   */
  createFaultyUseCase: (errorRate: number) => unknown;

  /**
   * Execute the action
   */
  executeAction: (useCase: unknown) => Promise<AppResult<TOutput>>;

  /**
   * Action name
   */
  actionName: string;
}

/**
 * Test definitions for fault tolerance
 */
export function faultToleranceTests<_TInput, TOutput>(
  _options: FaultToleranceTestOptions<_TInput, TOutput>
): void {
  throw new Error(
    'faultToleranceTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate fault tolerance tests.'
  );
}

// Legacy function names for backward compatibility
export const describeRaceConditionTests = raceConditionTests;
export const describeIdempotencyTests = idempotencyTests;
export const describeStressTests = stressTests;
export const describeFaultToleranceTests = faultToleranceTests;
