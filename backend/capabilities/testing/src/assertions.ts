/**
 * Custom Test Assertions
 *
 * Additional assertion helpers for common testing scenarios.
 *
 * @example
 * ```typescript
 * import {
 *   assertEventPublished,
 *   assertMetricRecorded,
 *   assertDeepEqual,
 *   assertThrows
 * } from '@oxlayer/capabilities-testing/assertions';
 *
 * // Assert an event was published
 * assertEventPublished(eventBus, 'Todo.Created');
 *
 * // Assert a metric was recorded
 * assertMetricRecorded(metricEmitter, 'todos.created');
 *
 * // Assert deep equality with better error messages
 * assertDeepEqual(actual, expected);
 *
 * // Assert a function throws
 * assertThrows(() => riskyOperation(), Error);
 * ```
 */

import type { MockEventBus, PublishedEvent } from './mock-event-bus.js';
import type { MockDomainEventEmitter } from './mock-emitters.js';
import type { MockBusinessMetricEmitter } from './mock-emitters.js';

/**
 * Assert that an event was published to the event bus.
 *
 * @param eventBus - The MockEventBus to check
 * @param eventType - The expected event type
 * @param count - Optional expected count (default: >= 1)
 * @throws Error if the event was not published
 *
 * @example
 * ```typescript
 * assertEventPublished(eventBus, 'Todo.Created');
 * assertEventPublished(eventBus, 'Todo.Created', 2); // Exactly 2 times
 * ```
 */
export function assertEventPublished(
  eventBus: MockEventBus,
  eventType: string,
  count?: number
): void {
  const actualCount = eventBus.count(eventType);

  if (actualCount === 0) {
    const allTypes = eventBus.getAllEvents().map(e => e.event.eventType);
    throw new Error(
      `Expected event "${eventType}" to be published, but it was not.\n` +
      `Published event types: ${JSON.stringify(allTypes)}`
    );
  }

  if (count !== undefined && actualCount !== count) {
    throw new Error(
      `Expected event "${eventType}" to be published ${count} times, ` +
      `but it was published ${actualCount} times.`
    );
  }
}

/**
 * Assert that an event was NOT published to the event bus.
 *
 * @param eventBus - The MockEventBus to check
 * @param eventType - The event type that should not be published
 * @throws Error if the event was published
 *
 * @example
 * ```typescript
 * assertEventNotPublished(eventBus, 'Todo.Deleted');
 * ```
 */
export function assertEventNotPublished(
  eventBus: MockEventBus,
  eventType: string
): void {
  const actualCount = eventBus.count(eventType);

  if (actualCount > 0) {
    throw new Error(
      `Expected event "${eventType}" to NOT be published, ` +
      `but it was published ${actualCount} times.`
    );
  }
}

/**
 * Assert that an event was published with specific payload.
 *
 * @param eventBus - The MockEventBus to check
 * @param eventType - The event type to check
 * @param matcher - Function to match the event payload
 * @throws Error if no matching event was found
 *
 * @example
 * ```typescript
 * assertEventPublishedWith(eventBus, 'Todo.Created', (event) => {
 *   return event.payload.aggregateId === 'todo-1';
 * });
 * ```
 */
export function assertEventPublishedWith(
  eventBus: MockEventBus,
  eventType: string,
  matcher: (event: PublishedEvent) => boolean
): void {
  const events = eventBus.getEvents(eventType);
  const matching = events.filter(matcher);

  if (matching.length === 0) {
    throw new Error(
      `Expected event "${eventType}" with matching payload to be published, ` +
      `but no matching event was found.`
    );
  }
}

/**
 * Assert that a domain event was emitted.
 *
 * @param emitter - The MockDomainEventEmitter to check
 * @param eventName - The expected event name
 * @param count - Optional expected count (default: >= 1)
 * @throws Error if the event was not emitted
 *
 * @example
 * ```typescript
 * assertDomainEventEmitted(eventEmitter, 'Todo.Created');
 * assertDomainEventEmitted(eventEmitter, 'Todo.Created', 2); // Exactly 2 times
 * ```
 */
export function assertDomainEventEmitted(
  emitter: MockDomainEventEmitter,
  eventName: string,
  count?: number
): void {
  const actualCount = emitter.count(eventName);

  if (actualCount === 0) {
    const allNames = emitter.getEvents().map(e => e.eventName);
    throw new Error(
      `Expected domain event "${eventName}" to be emitted, but it was not.\n` +
      `Emitted event names: ${JSON.stringify(allNames)}`
    );
  }

  if (count !== undefined && actualCount !== count) {
    throw new Error(
      `Expected domain event "${eventName}" to be emitted ${count} times, ` +
      `but it was emitted ${actualCount} times.`
    );
  }
}

/**
 * Assert that a business metric was recorded.
 *
 * @param emitter - The MockBusinessMetricEmitter to check
 * @param metricName - The expected metric name
 * @param count - Optional expected count (default: >= 1)
 * @throws Error if the metric was not recorded
 *
 * @example
 * ```typescript
 * assertMetricRecorded(metricEmitter, 'todos.created');
 * assertMetricRecorded(metricEmitter, 'todos.created', 2); // Exactly 2 times
 * ```
 */
export function assertMetricRecorded(
  emitter: MockBusinessMetricEmitter,
  metricName: string,
  count?: number
): void {
  const actualCount = emitter.count(metricName);

  if (actualCount === 0) {
    const allNames = emitter.getMetrics().map(m => m.metricName);
    throw new Error(
      `Expected metric "${metricName}" to be recorded, but it was not.\n` +
      `Recorded metric names: ${JSON.stringify(allNames)}`
    );
  }

  if (count !== undefined && actualCount !== count) {
    throw new Error(
      `Expected metric "${metricName}" to be recorded ${count} times, ` +
      `but it was recorded ${actualCount} times.`
    );
  }
}

/**
 * Assert that a counter metric has a specific value.
 *
 * @param emitter - The MockBusinessMetricEmitter to check
 * @param metricName - The metric name
 * @param expectedValue - The expected counter value
 * @throws Error if the counter value doesn't match
 *
 * @example
 * ```typescript
 * await metricEmitter.increment('todos.created');
 * await metricEmitter.increment('todos.created');
 * assertCounterValue(metricEmitter, 'todos.created', 2);
 * ```
 */
export function assertCounterValue(
  emitter: MockBusinessMetricEmitter,
  metricName: string,
  expectedValue: number
): void {
  const actualValue = emitter.getCounterValue(metricName);

  if (actualValue !== expectedValue) {
    throw new Error(
      `Expected counter "${metricName}" to have value ${expectedValue}, ` +
      `but it has value ${actualValue}.`
    );
  }
}

/**
 * Assert that a gauge metric has a specific value.
 *
 * @param emitter - The MockBusinessMetricEmitter to check
 * @param metricName - The metric name
 * @param expectedValue - The expected gauge value
 * @throws Error if the gauge value doesn't match
 *
 * @example
 * ```typescript
 * await metricEmitter.gauge('todos.active_count', 5);
 * assertGaugeValue(metricEmitter, 'todos.active_count', 5);
 * ```
 */
export function assertGaugeValue(
  emitter: MockBusinessMetricEmitter,
  metricName: string,
  expectedValue: number
): void {
  const actualValue = emitter.getGaugeValue(metricName);

  if (actualValue !== expectedValue) {
    throw new Error(
      `Expected gauge "${metricName}" to have value ${expectedValue}, ` +
      `but it has value ${actualValue}.`
    );
  }
}

/**
 * Assert deep equality with better error messages.
 *
 * @param actual - The actual value
 * @param expected - The expected value
 * @param message - Optional error message
 * @throws Error if values are not deeply equal
 *
 * @example
 * ```typescript
 * assertDeepEqual(result, { id: 'todo-1', title: 'Test' });
 * ```
 */
export function assertDeepEqual<T>(
  actual: T,
  expected: T,
  message?: string
): void {
  const isEqual = deepEqual(actual, expected);

  if (!isEqual) {
    const diff = formatDiff(actual, expected);
    throw new Error(
      message ||
      `Values are not deeply equal:\n${diff}`
    );
  }
}

/**
 * Assert that a value is an instance of a specific class.
 *
 * @param value - The value to check
 * @param constructor - The expected constructor
 * @throws Error if value is not an instance
 *
 * @example
 * ```typescript
 * assertInstanceOf(error, ValidationError);
 * ```
 */
export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T
): void {
  if (!(value instanceof constructor)) {
    throw new Error(
      `Expected value to be instance of ${constructor.name}, ` +
      `but got ${value === null ? 'null' : typeof value}.`
    );
  }
}

/**
 * Assert that a function throws an error.
 *
 * @param fn - Function that should throw
 * @param errorType - Expected error type (optional)
 * @param message - Optional error message to match
 * @returns The thrown error
 * @throws Error if function didn't throw
 *
 * @example
 * ```typescript
 * // Assert any error is thrown
 * assertThrows(() => riskyOperation());
 *
 * // Assert specific error type
 * assertThrows(() => riskyOperation(), ValidationError);
 *
 * // Assert error message matches
 * assertThrows(() => riskyOperation(), Error, 'Invalid input');
 * ```
 */
export function assertThrows<T extends Error = Error>(
  fn: () => unknown,
  errorType?: new (...args: any[]) => T,
  message?: string | RegExp
): T {
  let thrown: unknown;

  try {
    fn();
  } catch (e) {
    thrown = e;
  }

  if (!(thrown instanceof Error)) {
    throw new Error('Expected function to throw an error, but it did not.');
  }

  if (errorType && !(thrown instanceof errorType)) {
    throw new Error(
      `Expected error to be instance of ${errorType.name}, ` +
      `but got ${thrown.constructor.name}.`
    );
  }

  if (message) {
    const errorMessage = thrown.message;
    const matches = typeof message === 'string'
      ? errorMessage.includes(message)
      : message.test(errorMessage);

    if (!matches) {
      throw new Error(
        `Expected error message to match "${message}", ` +
        `but got "${errorMessage}".`
      );
    }
  }

  return thrown as T;
}

/**
 * Assert that a promise rejects.
 *
 * @param promise - Promise that should reject
 * @param errorType - Expected error type (optional)
 * @param message - Optional error message to match
 * @returns Promise that rejects with the error
 *
 * @example
 * ```typescript
 * await assertRejects(async () => {
 *   throw new ValidationError('Invalid input');
 * }, ValidationError);
 * ```
 */
export async function assertRejects<T extends Error = Error>(
  fn: () => unknown | Promise<unknown>,
  errorType?: new (...args: any[]) => T,
  message?: string | RegExp
): Promise<T> {
  let thrown: unknown;

  try {
    await fn();
  } catch (e) {
    thrown = e;
  }

  if (!(thrown instanceof Error)) {
    throw new Error('Expected promise to reject, but it did not.');
  }

  if (errorType && !(thrown instanceof errorType)) {
    throw new Error(
      `Expected error to be instance of ${errorType.name}, ` +
      `but got ${thrown.constructor.name}.`
    );
  }

  if (message) {
    const errorMessage = thrown.message;
    const matches = typeof message === 'string'
      ? errorMessage.includes(message)
      : message.test(errorMessage);

    if (!matches) {
      throw new Error(
        `Expected error message to match "${message}", ` +
        `but got "${errorMessage}".`
      );
    }
  }

  return thrown as T;
}

// Helper functions

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  );
}

function formatDiff(actual: unknown, expected: unknown): string {
  return `- Expected: ${JSON.stringify(expected, null, 2)}
+ Received: ${JSON.stringify(actual, null, 2)}`;
}
