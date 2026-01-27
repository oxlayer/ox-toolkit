/**
 * Base class for test data builders (Builder pattern).
 *
 * Builders provide a fluent API for creating test data with sensible defaults,
 * making tests more readable and maintainable.
 *
 * @example
 * ```ts
 * class UserBuilder extends Builder<User> {
 *   private id = 'user-1';
 *   private email = 'test@example.com';
 *   private name = 'Test User';
 *
 *   withId(id: string): this {
 *     this.id = id;
 *     return this;
 *   }
 *
 *   withEmail(email: string): this {
 *     this.email = email;
 *     return this;
 *   }
 *
 *   build(): User {
 *     return new User(this.id, this.email, this.name);
 *   }
 * }
 *
 * // Usage:
 * const user = new UserBuilder().withEmail('john@example.com').build();
 * ```
 */
export abstract class Builder<T> {
  /**
   * Build the final object with current configuration
   */
  abstract build(): T;
}

/**
 * Create a builder function for simple object creation
 *
 * @example
 * ```ts
 * interface UserProps {
 *   id: string;
 *   email: string;
 *   name: string;
 * }
 *
 * const buildUser = createBuilder<UserProps>({
 *   id: 'user-1',
 *   email: 'test@example.com',
 *   name: 'Test User',
 * });
 *
 * const user = buildUser({ email: 'john@example.com' });
 * // { id: 'user-1', email: 'john@example.com', name: 'Test User' }
 * ```
 */
export function createBuilder<T extends object>(defaults: T): (overrides?: Partial<T>) => T {
  return (overrides?: Partial<T>) => ({
    ...defaults,
    ...overrides,
  });
}

/**
 * Generate a unique ID for test data
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate a random email for test data
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}_${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random date within a range
 */
export function generateTestDate(
  start: Date = new Date('2020-01-01'),
  end: Date = new Date()
): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}
