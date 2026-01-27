/**
 * Base class for test data builders (Builder pattern).
 *
 * Builders provide a fluent API for creating test data with sensible defaults,
 * making tests more readable and maintainable.
 */
export abstract class Builder<T> {
  /**
   * Build the final object with current configuration
   */
  abstract build(): T;
}
