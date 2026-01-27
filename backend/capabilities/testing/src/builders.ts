/**
 * Test Builder Pattern
 *
 * A fluent builder pattern for creating test data quickly and consistently.
 * Supports method chaining, defaults, and common test data helpers.
 *
 * @example
 * ```typescript
 * import { TestBuilder } from '@oxlayer/capabilities-testing/builders';
 *
 * interface TodoProps {
 *   id: string;
 *   title: string;
 *   status: 'pending' | 'completed';
 *   userId: string;
 *   createdAt: Date;
 * }
 *
 * const todoBuilder = new TestBuilder<TodoProps>({
 *   id: () => `todo-${Date.now()}`,
 *   title: 'Test Todo',
 *   status: 'pending',
 *   userId: 'test-user',
 *   createdAt: () => new Date()
 * });
 *
 * const todo1 = todoBuilder.build();
 * const todo2 = todoBuilder.withTitle('Custom Todo').withStatus('completed').build();
 * const todo3 = todoBuilder.withDefaults({ userId: 'custom-user' }).build();
 * ```
 */

export type BuilderValue<T> = T | (() => T);

/**
 * Convert a builder value to its actual value
 * Resolves functions by calling them, otherwise returns the value as-is.
 */
function resolveValue<T>(value: BuilderValue<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

export interface TestBuilderOptions<T> {
  /**
   * Default values for the builder
   * Functions will be called when building
   */
  defaults: Record<keyof T, BuilderValue<T[keyof T]>>;
}

/**
 * Generic Test Builder
 *
 * Provides a fluent API for building test data with defaults and overrides.
 */
export class TestBuilder<T extends Record<string, unknown>> {
  protected defaults: Partial<Record<keyof T, BuilderValue<T[keyof T]>>>;
  protected overrides: Partial<Record<keyof T, BuilderValue<T[keyof T]>>>;

  constructor(defaults: Partial<Record<keyof T, BuilderValue<T[keyof T]>>>) {
    this.defaults = { ...defaults };
    this.overrides = {};
  }

  /**
   * Set multiple default values at once
   *
   * @param values - Object with values to set as defaults
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withDefaults({ userId: 'user-1', status: 'active' })
   *   .build();
   * ```
   */
  withDefaults(values: Partial<Record<keyof T, BuilderValue<T[keyof T]>>>): this {
    Object.assign(this.defaults, values);
    return this;
  }

  /**
   * Set a single field value
   *
   * @param key - The field name
   * @param value - The value to set
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.with('title', 'Custom Title').build();
   * ```
   */
  with<K extends keyof T>(key: K, value: BuilderValue<T[K]>): this {
    this.overrides[key] = value;
    return this;
  }

  /**
   * Build the final object
   *
   * Resolves all defaults and overrides, with overrides taking precedence.
   *
   * @returns The built object
   *
   * @example
   * ```typescript
   * const todo = builder.build();
   * ```
   */
  build(): T {
    const result: Partial<T> = {};

    // Resolve defaults first
    for (const key in this.defaults) {
      (result as any)[key] = resolveValue(this.defaults[key]);
    }

    // Then apply overrides (they take precedence)
    for (const key in this.overrides) {
      (result as any)[key] = resolveValue(this.overrides[key]);
    }

    return result as T;
  }

  /**
   * Build partial props object
   *
   * Useful when you want to spread the result into another object.
   *
   * @returns Partial object with all properties
   *
   * @example
   * ```typescript
   * const entity = new Todo({
   *   ...builder.buildProps(),
   *   extraField: 'value'
   * });
   * ```
   */
  buildProps(): Partial<T> {
    return this.build() as Partial<T>;
  }

  /**
   * Create multiple instances with variations
   *
   * @param variants - Array of overrides for each variant
   * @returns Array of built objects
   *
   * @example
   * ```typescript
   * const todos = builder.buildMany([
   *   { title: 'First' },
   *   { title: 'Second' },
   *   { title: 'Third' }
   * ]);
   * ```
   */
  buildMany(variants: Array<Partial<Record<keyof T, BuilderValue<T[keyof T]>>>>): T[] {
    return variants.map(variant => {
      const newBuilder = new (this.constructor as typeof TestBuilder)(this.defaults);
      return newBuilder.withDefaults(variant as any).build();
    }) as T[];
  }

  /**
   * Clone this builder
   *
   * Creates a new builder with the same defaults and overrides.
   * Useful when you want to create multiple similar builders.
   *
   * @returns A new builder instance
   *
   * @example
   * ```typescript
   * const builder1 = new TestBuilder({ title: 'Test' });
   * const builder2 = builder1.clone();
   * builder2.with('title', 'Different').build();
   * // builder1 still has default title 'Test'
   * ```
   */
  clone(): this {
    const cloned = new (this.constructor as any)({ ...this.defaults });
    cloned.overrides = { ...this.overrides };
    return cloned;
  }

  /**
   * Reset all overrides
   *
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.with('title', 'Custom').reset().build();
   * // Uses default title
   * ```
   */
  reset(): this {
    this.overrides = {};
    return this;
  }
}

/**
 * Specialized builder for entities with date fields
 */
export class DateBuilder<T extends Record<string, unknown>> extends TestBuilder<T> {
  /**
   * Set a date field to a date relative to now
   *
   * @param field - The date field name
   * @param days - Days from now (negative for past, positive for future)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withRelativeDate('dueDate', 7) // 7 days from now
   *   .withRelativeDate('createdAt', -1) // 1 day ago
   *   .build();
   * ```
   */
  withRelativeDate<K extends keyof T>(field: K, days: number): this {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return this.with(field, date as T[K]);
  }

  /**
   * Set a date field to a past date
   *
   * @param field - The date field name
   * @param days - Days in the past (default: 1)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withPastDate('createdAt', 7).build();
   * ```
   */
  withPastDate<K extends keyof T>(field: K, days: number = 1): this {
    return this.withRelativeDate(field, -days);
  }

  /**
   * Set a date field to a future date
   *
   * @param field - The date field name
   * @param days - Days in the future (default: 1)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withFutureDate('dueDate', 30).build();
   * ```
   */
  withFutureDate<K extends keyof T>(field: K, days: number = 1): this {
    return this.withRelativeDate(field, days);
  }

  /**
   * Set a date field to today
   *
   * @param field - The date field name
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withToday('createdAt').build();
   * ```
   */
  withToday<K extends keyof T>(field: K): this {
    return this.with(field, new Date() as T[K]);
  }
}

/**
 * Specialized builder for entities with ID fields
 */
export class IdBuilder<T extends Record<string, unknown>> extends TestBuilder<T> {
  /**
   * Set an ID field with a generated value
   *
   * @param field - The ID field name
   * @param prefix - Prefix for the ID (default: 'id')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withId('todoId', 'todo').build();
   * // Generates: todo-timestamp-random
   * ```
   */
  withId<K extends keyof T>(field: K, prefix: string = 'id'): this {
    const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    return this.with(field, id as T[K]);
  }

  /**
   * Set a UUID field
   *
   * @param field - The UUID field name
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withUUID('id').build();
   * ```
   */
  withUUID<K extends keyof T>(field: K): this {
    const uuid = `00000000-0000-4000-8000-000000000000`.replace(/0/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
    return this.with(field, uuid as T[K]);
  }
}

/**
 * Specialized builder for entities with status fields
 */
export class StatusBuilder<T extends Record<string, unknown>, S extends string> extends TestBuilder<T> {
  /**
   * Set a status field
   *
   * @param field - The status field name
   * @param status - The status value
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withStatus('status', 'active').build();
   * ```
   */
  withStatus<K extends keyof T>(field: K, status: S): this {
    return this.with(field, status as T[K]);
  }

  /**
   * Set entity as pending
   *
   * @param field - The status field name (default: 'status')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.pending().build();
   * ```
   */
  pending<K extends keyof T = 'status'>(field: K = 'status' as K): this {
    return this.withStatus(field, 'pending' as S);
  }

  /**
   * Set entity as active/in progress
   *
   * @param field - The status field name (default: 'status')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.active().build();
   * ```
   */
  active<K extends keyof T = 'status'>(field: K = 'status' as K): this {
    return this.withStatus(field, 'active' as S);
  }

  /**
   * Set entity as completed/done
   *
   * @param field - The status field name (default: 'status')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.completed().build();
   * ```
   */
  completed<K extends keyof T = 'status'>(field: K = 'status' as K): this {
    return this.withStatus(field, 'completed' as S);
  }
}

/**
 * Combined builder with all specialized features
 *
 * Combines DateBuilder, IdBuilder, and StatusBuilder functionality.
 * Uses composition instead of complex inheritance.
 */
export class CombinedBuilder<
  T extends Record<string, unknown>,
  S extends string
> extends TestBuilder<T> {
  /**
   * Set a date field to a date relative to now
   *
   * @param field - The date field name
   * @param days - Days from now (negative for past, positive for future)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withRelativeDate('dueDate', 7) // 7 days from now
   *   .withRelativeDate('createdAt', -1) // 1 day ago
   *   .build();
   * ```
   */
  withRelativeDate<K extends keyof T>(field: K, days: number): this {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return this.with(field, date as T[K]);
  }

  /**
   * Set a date field to a past date
   *
   * @param field - The date field name
   * @param days - Days in the past (default: 1)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withPastDate('createdAt', 7).build();
   * ```
   */
  withPastDate<K extends keyof T>(field: K, days: number = 1): this {
    return this.withRelativeDate(field, -days);
  }

  /**
   * Set a date field to a future date
   *
   * @param field - The date field name
   * @param days - Days in the future (default: 1)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withFutureDate('dueDate', 30).build();
   * ```
   */
  withFutureDate<K extends keyof T>(field: K, days: number = 1): this {
    return this.withRelativeDate(field, days);
  }

  /**
   * Set a date field to today
   *
   * @param field - The date field name
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withToday('createdAt').build();
   * ```
   */
  withToday<K extends keyof T>(field: K): this {
    return this.with(field, new Date() as T[K]);
  }

  /**
   * Set an ID field with a generated value
   *
   * @param field - The ID field name
   * @param prefix - Prefix for the ID (default: 'id')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withId('todoId', 'todo').build();
   * // Generates: todo-timestamp-random
   * ```
   */
  withId<K extends keyof T>(field: K, prefix: string = 'id'): this {
    const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    return this.with(field, id as T[K]);
  }

  /**
   * Set a UUID field
   *
   * @param field - The UUID field name
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withUUID('id').build();
   * ```
   */
  withUUID<K extends keyof T>(field: K): this {
    const uuid = `00000000-0000-4000-8000-000000000000`.replace(/0/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
    return this.with(field, uuid as T[K]);
  }

  /**
   * Set a status field
   *
   * @param field - The status field name
   * @param status - The status value
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.withStatus('status', 'active').build();
   * ```
   */
  withStatus<K extends keyof T>(field: K, status: S): this {
    return this.with(field, status as T[K]);
  }

  /**
   * Set entity as pending
   *
   * @param field - The status field name (default: 'status')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.pending().build();
   * ```
   */
  pending<K extends keyof T = 'status'>(field: K = 'status' as K): this {
    return this.withStatus(field, 'pending' as S);
  }

  /**
   * Set entity as active/in progress
   *
   * @param field - The status field name (default: 'status')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.active().build();
   * ```
   */
  active<K extends keyof T = 'status'>(field: K = 'status' as K): this {
    return this.withStatus(field, 'active' as S);
  }

  /**
   * Set entity as completed/done
   *
   * @param field - The status field name (default: 'status')
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * builder.completed().build();
   * ```
   */
  completed<K extends keyof T = 'status'>(field: K = 'status' as K): this {
    return this.withStatus(field, 'completed' as S);
  }
}

/**
 * Create a new TestBuilder
 *
 * Convenience function for creating a test builder.
 *
 * @example
 * ```typescript
 * import { createTestBuilder } from '@oxlayer/capabilities-testing/builders';
 *
 * const builder = createTestBuilder<TodoProps>({
 *   id: () => `todo-${Date.now()}`,
 *   title: 'Test Todo',
 *   status: 'pending',
 *   userId: 'test-user'
 * });
 * ```
 */
export function createTestBuilder<T extends Record<string, unknown>>(
  defaults: Partial<Record<keyof T, BuilderValue<T[keyof T]>>>
): TestBuilder<T> {
  return new TestBuilder(defaults);
}

/**
 * Create a new CombinedBuilder with all specialized features
 *
 * @example
 * ```typescript
 * import { createCombinedBuilder } from '@oxlayer/capabilities-testing/builders';
 *
 * const builder = createCombinedBuilder<TodoProps, TodoStatus>({
 *   id: () => `todo-${Date.now()}`,
 *   title: 'Test Todo',
 *   status: 'pending',
 *   userId: 'test-user'
 * });
 *
 * // Use specialized methods
 * const todo = builder
 *   .withId('id', 'todo')
 *   .withDueDate('dueDate', 7)
 *   .completed()
 *   .build();
 * ```
 */
export function createCombinedBuilder<
  T extends Record<string, unknown>,
  S extends string
>(
  defaults: Partial<Record<keyof T, BuilderValue<T[keyof T]>>>
): CombinedBuilder<T, S> {
  return new CombinedBuilder<T, S>(defaults);
}
