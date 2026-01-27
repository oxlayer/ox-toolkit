/**
 * Mock ClickHouse Emitters
 *
 * Mock implementations for DomainEventEmitter and BusinessMetricEmitter
 * for testing without requiring actual ClickHouse connections.
 *
 * These mocks track what was emitted for testing assertions.
 *
 * @example
 * ```typescript
 * import { MockDomainEventEmitter, MockBusinessMetricEmitter } from '@oxlayer/capabilities-testing/mock-emitters';
 *
 * const eventEmitter = new MockDomainEventEmitter();
 * const metricEmitter = new MockBusinessMetricEmitter();
 *
 * // Emit events/metrics
 * await eventEmitter.emit('Todo.Created', { todoId: 'todo-1' });
 * await metricEmitter.increment('todos.created');
 *
 * // Assert
 * expect(eventEmitter.wasEventEmitted('Todo.Created')).toBe(true);
 * expect(metricEmitter.wasMetricRecorded('todos.created')).toBe(true);
 *
 * // Clear for next test
 * eventEmitter.clear();
 * metricEmitter.clear();
 * ```
 */

export interface DomainEventRecord {
  eventName: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface BusinessMetricRecord {
  metricName: string;
  value: number;
  kind: 'counter' | 'gauge' | 'histogram';
  dimensions?: Record<string, unknown>;
}

/**
 * Mock Domain Event Emitter for testing ClickHouse domain events.
 *
 * This mock implements the interface of DomainEventEmitter but stores
 * all events in memory for testing assertions.
 *
 * Features:
 * - Tracks all emitted events
 * - Allows querying by event name
 * - Provides helper methods for assertions (wasEventEmitted, count, etc.)
 * - Can be cleared between tests
 */
export class MockDomainEventEmitter {
  private events: DomainEventRecord[] = [];

  /**
   * Emit a domain event.
   *
   * @param eventName - The name of the event (e.g., 'Todo.Created')
   * @param payload - The event payload
   * @param metadata - Optional event metadata
   *
   * @example
   * ```typescript
   * await eventEmitter.emit('Todo.Created', {
   *   aggregateId: 'todo-1',
   *   userId: 'user-1',
   *   title: 'Test Todo'
   * });
   * ```
   */
  async emit(
    eventName: string,
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    this.events.push({ eventName, payload, metadata });
    // Don't actually send to ClickHouse in tests
  }

  /**
   * Get all events that were emitted.
   *
   * @returns A copy of all emitted events
   *
   * @example
   * ```typescript
   * const events = eventEmitter.getEvents();
   * expect(events).toHaveLength(2);
   * ```
   */
  getEvents(): DomainEventRecord[] {
    return [...this.events];
  }

  /**
   * Get events filtered by name.
   *
   * @param eventName - The event name to filter by
   * @returns Array of events with the given name
   *
   * @example
   * ```typescript
   * const createdEvents = eventEmitter.getEventsByName('Todo.Created');
   * expect(createdEvents).toHaveLength(1);
   * ```
   */
  getEventsByName(eventName: string): DomainEventRecord[] {
    return this.events.filter(e => e.eventName === eventName);
  }

  /**
   * Get the most recent event (if any).
   *
   * @returns The most recent event or undefined
   *
   * @example
   * ```typescript
   * const lastEvent = eventEmitter.getLastEvent();
   * expect(lastEvent?.eventName).toBe('Todo.Deleted');
   * ```
   */
  getLastEvent(): DomainEventRecord | undefined {
    return this.events[this.events.length - 1];
  }

  /**
   * Clear all events.
   *
   * Call this in test setup/teardown to ensure test isolation.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   eventEmitter.clear();
   * });
   * ```
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Check if an event was emitted.
   *
   * @param eventName - The event name to check
   * @returns true if at least one event with this name was emitted
   *
   * @example
   * ```typescript
   * expect(eventEmitter.wasEventEmitted('Todo.Created')).toBe(true);
   * ```
   */
  wasEventEmitted(eventName: string): boolean {
    return this.events.some(e => e.eventName === eventName);
  }

  /**
   * Get count of events emitted by name.
   *
   * @param eventName - The event name to count
   * @returns The number of events with this name
   *
   * @example
   * ```typescript
   * expect(eventEmitter.count('Todo.Created')).toBe(1);
   * ```
   */
  count(eventName: string): number {
    return this.events.filter(e => e.eventName === eventName).length;
  }

  /**
   * Get total count of all events emitted.
   *
   * @returns The total number of events
   *
   * @example
   * ```typescript
   * expect(eventEmitter.totalCount()).toBe(3);
   * ```
   */
  totalCount(): number {
    return this.events.length;
  }
}

/**
 * Mock Business Metric Emitter for testing ClickHouse metrics.
 *
 * This mock implements the interface of BusinessMetricEmitter but stores
 * all metrics in memory for testing assertions.
 *
 * Features:
 * - Tracks all emitted metrics
 * - Supports counters, gauges, and histograms
 * - Allows querying by metric name
 * - Provides helper methods for assertions (wasMetricRecorded, count, etc.)
 * - Can be cleared between tests
 */
export class MockBusinessMetricEmitter {
  private metrics: BusinessMetricRecord[] = [];

  /**
   * Increment a counter metric.
   *
   * @param metricName - The name of the metric (e.g., 'todos.created')
   * @param dimensions - Optional dimensions for the metric
   *
   * @example
   * ```typescript
   * await metricEmitter.increment('todos.created', { userId: 'user-1' });
   * ```
   */
  async increment(
    metricName: string,
    dimensions?: Record<string, unknown>
  ): Promise<void> {
    this.metrics.push({ metricName, value: 1, kind: 'counter', dimensions });
  }

  /**
   * Record a gauge metric.
   *
   * @param metricName - The name of the metric
   * @param value - The gauge value
   * @param dimensions - Optional dimensions for the metric
   *
   * @example
   * ```typescript
   * await metricEmitter.gauge('todos.active_count', 5);
   * ```
   */
  async gauge(
    metricName: string,
    value: number,
    dimensions?: Record<string, unknown>
  ): Promise<void> {
    this.metrics.push({ metricName, value, kind: 'gauge', dimensions });
  }

  /**
   * Record a metric with a specific kind.
   *
   * @param metricName - The name of the metric
   * @param value - The metric value
   * @param kind - The kind of metric (counter, gauge, or histogram)
   * @param dimensions - Optional dimensions for the metric
   *
   * @example
   * ```typescript
   * await metricEmitter.record('todos.duration', 150, 'histogram');
   * ```
   */
  async record(
    metricName: string,
    value: number,
    kind: 'counter' | 'gauge' | 'histogram',
    dimensions?: Record<string, unknown>
  ): Promise<void> {
    this.metrics.push({ metricName, value, kind, dimensions });
  }

  /**
   * Get all metrics that were recorded.
   *
   * @returns A copy of all recorded metrics
   *
   * @example
   * ```typescript
   * const metrics = metricEmitter.getMetrics();
   * expect(metrics).toHaveLength(2);
   * ```
   */
  getMetrics(): BusinessMetricRecord[] {
    return [...this.metrics];
  }

  /**
   * Get metrics filtered by name.
   *
   * @param metricName - The metric name to filter by
   * @returns Array of metrics with the given name
   *
   * @example
   * ```typescript
   * const createdMetrics = metricEmitter.getMetricsByName('todos.created');
   * expect(createdMetrics).toHaveLength(1);
   * ```
   */
  getMetricsByName(metricName: string): BusinessMetricRecord[] {
    return this.metrics.filter(m => m.metricName === metricName);
  }

  /**
   * Get the sum of values for a counter metric.
   *
   * @param metricName - The metric name
   * @returns The sum of all values for this metric
   *
   * @example
   * ```typescript
   * await metricEmitter.increment('todos.created');
   * await metricEmitter.increment('todos.created');
   * expect(metricEmitter.getCounterValue('todos.created')).toBe(2);
   * ```
   */
  getCounterValue(metricName: string): number {
    return this.metrics
      .filter(m => m.metricName === metricName && m.kind === 'counter')
      .reduce((sum, m) => sum + m.value, 0);
  }

  /**
   * Get the last value for a gauge metric.
   *
   * @param metricName - The metric name
   * @returns The last value recorded for this metric or undefined
   *
   * @example
   * ```typescript
   * await metricEmitter.gauge('todos.active_count', 5);
   * await metricEmitter.gauge('todos.active_count', 3);
   * expect(metricEmitter.getGaugeValue('todos.active_count')).toBe(3);
   * ```
   */
  getGaugeValue(metricName: string): number | undefined {
    const gaugeMetrics = this.metrics.filter(m => m.metricName === metricName && m.kind === 'gauge');
    if (gaugeMetrics.length === 0) return undefined;
    return gaugeMetrics[gaugeMetrics.length - 1].value;
  }

  /**
   * Clear all metrics.
   *
   * Call this in test setup/teardown to ensure test isolation.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   metricEmitter.clear();
   * });
   * ```
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Check if a metric was recorded.
   *
   * @param metricName - The metric name to check
   * @returns true if at least one metric with this name was recorded
   *
   * @example
   * ```typescript
   * expect(metricEmitter.wasMetricRecorded('todos.created')).toBe(true);
   * ```
   */
  wasMetricRecorded(metricName: string): boolean {
    return this.metrics.some(m => m.metricName === metricName);
  }

  /**
   * Get count of metrics recorded by name.
   *
   * @param metricName - The metric name to count
   * @returns The number of metrics with this name
   *
   * @example
   * ```typescript
   * expect(metricEmitter.count('todos.created')).toBe(1);
   * ```
   */
  count(metricName: string): number {
    return this.metrics.filter(m => m.metricName === metricName).length;
  }

  /**
   * Get total count of all metrics recorded.
   *
   * @returns The total number of metrics
   *
   * @example
   * ```typescript
   * expect(metricEmitter.totalCount()).toBe(3);
   * ```
   */
  totalCount(): number {
    return this.metrics.length;
  }
}

/**
 * Create a new MockDomainEventEmitter instance.
 *
 * Convenience function for creating a mock domain event emitter.
 *
 * @example
 * ```typescript
 * import { createMockDomainEventEmitter } from '@oxlayer/capabilities-testing/mock-emitters';
 *
 * const eventEmitter = createMockDomainEventEmitter();
 * ```
 */
export function createMockDomainEventEmitter(): MockDomainEventEmitter {
  return new MockDomainEventEmitter();
}

/**
 * Create a new MockBusinessMetricEmitter instance.
 *
 * Convenience function for creating a mock business metric emitter.
 *
 * @example
 * ```typescript
 * import { createMockBusinessMetricEmitter } from '@oxlayer/capabilities-testing/mock-emitters';
 *
 * const metricEmitter = createMockBusinessMetricEmitter();
 * ```
 */
export function createMockBusinessMetricEmitter(): MockBusinessMetricEmitter {
  return new MockBusinessMetricEmitter();
}
