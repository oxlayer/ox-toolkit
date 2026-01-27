/**
 * Authorization Test Patterns
 *
 * Reusable test patterns for authorization and ownership testing.
 *
 * @example
 * ```typescript
 * import { createOwnershipTests } from '@oxlayer/capabilities-testing/patterns/authorization';
 *
 * // Use the patterns in your test framework
 * describe('Ownership Tests', () => {
 *   ownershipTests({
 *     setup: async () => {
 *       const todo = Todo.create({ title: 'Test', userId: 'owner-1' });
 *       await repository.seed([todo]);
 *       return { todoId: todo.id, ownerId: 'owner-1' };
 *     },
 *     createUseCase: (userId) => new UpdateTodoUseCase(..., userId),
 *     executeAction: (useCase, input) => useCase.execute(input),
 *     createInput: (todoId, userId) => ({ id: todoId, userId, title: 'Updated' }),
 *     actionName: 'update'
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

export interface OwnershipTestOptions<TInput, TOutput> {
  /**
   * Setup test data and return the entity ID and owner ID
   */
  setup: () => Promise<{ entityId: string; ownerId: string }>;

  /**
   * Create a use case for the given user
   */
  createUseCase: (userId: string) => unknown;

  /**
   * Execute the action with the use case
   */
  executeAction: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input for the action
   */
  createInput: (entityId: string, userId: string) => TInput;

  /**
   * Name of the action being tested (for test descriptions)
   */
  actionName: string;
}

/**
 * Test definitions for ownership authorization
 *
 * Run these tests in your test framework to verify ownership-based access control.
 *
 * @example
 * ```typescript
 * import { ownershipTests } from '@oxlayer/capabilities-testing/patterns/authorization';
 *
 * describe('Ownership', () => {
 *   ownershipTests({
 *     setup: async () => ({ entityId: '1', ownerId: 'user-1' }),
 *     createUseCase: (userId) => new UpdateUseCase(userId),
 *     executeAction: (uc, i) => uc.execute(i),
 *     createInput: (id, userId) => ({ id, userId, title: 'Test' }),
 *     actionName: 'update'
 *   });
 * });
 * ```
 */
export function ownershipTests<TInput, TOutput>(
  options: OwnershipTestOptions<TInput, TOutput>
): void {
  throw new Error(
    'ownershipTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate ownership tests.'
  );
}

export interface PermissionTestOptions<TInput, TOutput> {
  /**
   * Setup test with different permission scenarios
   */
  setup: () => Promise<void>;

  /**
   * Create a use case with the given permissions
   */
  createUseCase: (permissions: string[]) => unknown;

  /**
   * Execute the action
   */
  executeAction: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input for the action
   */
  createInput: () => TInput;

  /**
   * Name of the action being tested
   */
  actionName: string;
}

/**
 * Test definitions for permission-based authorization
 */
export function permissionTests<TInput, TOutput>(
  options: PermissionTestOptions<TInput, TOutput>
): void {
  throw new Error(
    'permissionTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate permission tests.'
  );
}

export interface CrossUserAccessTestOptions<TInput, TOutput> {
  /**
   * Setup multiple users with their own resources
   */
  setup: () => Promise<{
    user1Id: string;
    user1EntityId: string;
    user2Id: string;
    user2EntityId: string;
  }>;

  /**
   * Create a use case for the given user
   */
  createUseCase: (userId: string) => unknown;

  /**
   * Execute the action
   */
  executeAction: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input for the action
   */
  createInput: (entityId: string, userId: string) => TInput;

  /**
   * Action name
   */
  actionName: string;
}

/**
 * Test definitions for cross-user access prevention
 */
export function crossUserAccessTests<TInput, TOutput>(
  options: CrossUserAccessTestOptions<TInput, TOutput>
): void {
  throw new Error(
    'crossUserAccessTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate cross-user access tests.'
  );
}

export interface DataFilteringTestOptions<TInput, TOutput> {
  /**
   * Setup resources for multiple users
   */
  setup: () => Promise<{
    user1Id: string;
    user1ResourceCount: number;
    user2Id: string;
    user2ResourceCount: number;
  }>;

  /**
   * Create a use case for listing resources
   */
  createUseCase: (userId: string) => unknown;

  /**
   * Execute the list action
   */
  executeAction: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input for listing
   */
  createInput: (userId: string) => TInput;

  /**
   * Get items from the result
   */
  getItems: (result: AppResult<TOutput>) => unknown[];

  /**
   * Get the owner ID from an item
   */
  getOwnerId: (item: unknown) => string;
}

/**
 * Test definitions for data filtering
 */
export function dataFilteringTests<TInput, TOutput>(
  options: DataFilteringTestOptions<TInput, TOutput>
): void {
  throw new Error(
    'dataFilteringTests is a template. Import this function and call it within ' +
    'your test framework (describe/test) to generate data filtering tests.'
  );
}

// Legacy function names for backward compatibility
export const describeOwnershipTests = ownershipTests;
export const describePermissionTests = permissionTests;
export const describeCrossUserAccessTests = crossUserAccessTests;
export const describeDataFilteringTests = dataFilteringTests;
