/**
 * Mock Event Bus
 *
 * In-memory event bus for testing.
 * Tracks published events for assertions.
 * Implements the full EventBus interface from @oxlayer/capabilities-events.
 *
 * @example
 * ```typescript
 * import { MockEventBus } from '@oxlayer/capabilities-testing/mock-event-bus';
 *
 * const eventBus = new MockEventBus();
 *
 * // Emit events
 * await eventBus.emit(new TodoCreatedEvent({ ... }));
 *
 * // Assert events were published
 * expect(eventBus.wasPublished('Todo.Created')).toBe(true);
 * expect(eventBus.count('Todo.Created')).toBe(1);
 *
 * // Clear for next test
 * eventBus.clear();
 * ```
 */

import type { EventBus, DomainEvent, EventEnvelope } from '@oxlayer/capabilities-events';

export interface PublishedEvent {
  event: DomainEvent;
  timestamp: Date;
}

/**
 * Mock Event Bus for testing event-driven functionality.
 *
 * This mock implements the full EventBus interface from @oxlayer/capabilities-events
 * but stores all events in memory for testing assertions.
 *
 * Features:
 * - Tracks all published events
 * - Allows querying by event type
 * - Supports event handlers (on/onEnvelope)
 * - Provides helper methods for assertions (wasPublished, count, etc.)
 * - Can be cleared between tests
 */
export class MockEventBus implements EventBus {
  private publishedEvents: Map<string, PublishedEvent[]> = new Map();
  private handlers: Map<string, Array<(event: unknown) => void | Promise<void>>> = new Map();

  /**
   * Emit a domain event.
   *
   * @param event - The domain event to emit
   *
   * @example
   * ```typescript
   * await eventBus.emit(new TodoCreatedEvent({
   *   aggregateId: 'todo-1',
   *   userId: 'user-1',
   *   title: 'Test Todo'
   * }));
   * ```
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.eventType || 'unknown';

    if (!this.publishedEvents.has(eventType)) {
      this.publishedEvents.set(eventType, []);
    }

    this.publishedEvents.get(eventType)!.push({
      event,
      timestamp: new Date(),
    });

    // Call any registered handlers
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  /**
   * Emit an event envelope.
   *
   * @param envelope - The event envelope to emit
   *
   * @example
   * ```typescript
   * await eventBus.emitEnvelope({
   *   id: 'env-1',
   *   type: 'Todo.Created',
   *   version: '1.0',
   *   timestamp: new Date().toISOString(),
   *   source: 'test',
   *   data: { ... }
   * });
   * ```
   */
  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    const eventType = envelope.type;

    if (!this.publishedEvents.has(eventType)) {
      this.publishedEvents.set(eventType, []);
    }

    this.publishedEvents.get(eventType)!.push({
      event: envelope.data as DomainEvent,
      timestamp: new Date(),
    });

    // Call any registered handlers
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      await handler(envelope.data);
    }
  }

  /**
   * Subscribe to events by type.
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - The handler function to call when events are emitted
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = await eventBus.on('Todo.Created', async (event) => {
   *   console.log('Todo created:', event);
   * });
   *
   * // Later: unsubscribe()
   * ```
   */
  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): Promise<() => Promise<void>> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as any);

    // Return unsubscribe function
    return async () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler as any);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to event envelopes.
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - The handler function to call when events are emitted
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * await eventBus.onEnvelope('Todo.Created', async (envelope) => {
   *   console.log('Received envelope:', envelope);
   * });
   * ```
   */
  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => void | Promise<void>
  ): Promise<() => Promise<void>> {
    // Create a wrapper that converts the event to an envelope format
    const envelopeHandler = async (event: T) => {
      const envelope: EventEnvelope<T> = {
        id: crypto.randomUUID(),
        type: eventType,
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'mock-event-bus',
        data: event,
      };
      await handler(envelope);
    };

    return this.on(eventType, envelopeHandler as any);
  }

  /**
   * Alias for emit (deprecated).
   *
   * @deprecated Use emit() instead
   */
  async publish(event: DomainEvent): Promise<void> {
    return this.emit(event);
  }

  /**
   * Subscribe to an event (deprecated alias).
   *
   * @deprecated Use on() instead
   */
  async subscribe(
    event: string,
    handler: (event: unknown) => void | Promise<void>
  ): Promise<void> {
    await this.on(event, handler);
  }

  /**
   * Get all published events of a specific type.
   *
   * @param eventType - The type of event to retrieve
   * @returns Array of published events
   *
   * @example
   * ```typescript
   * const events = eventBus.getEvents('Todo.Created');
   * expect(events).toHaveLength(1);
   * expect(events[0].event.aggregateId).toBe('todo-1');
   * ```
   */
  getEvents(eventType: string): PublishedEvent[] {
    return this.publishedEvents.get(eventType) || [];
  }

  /**
   * Get all published events across all types.
   *
   * @returns Array of all published events
   *
   * @example
   * ```typescript
   * const allEvents = eventBus.getAllEvents();
   * expect(allEvents.length).toBeGreaterThan(0);
   * ```
   */
  getAllEvents(): PublishedEvent[] {
    const all: PublishedEvent[] = [];
    for (const events of this.publishedEvents.values()) {
      all.push(...events);
    }
    return all;
  }

  /**
   * Clear all published events and handlers.
   *
   * Call this in test setup/teardown to ensure test isolation.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   eventBus.clear();
   * });
   * ```
   */
  clear(): void {
    this.publishedEvents.clear();
    this.handlers.clear();
  }

  /**
   * Check if an event type was published.
   *
   * @param eventType - The type of event to check
   * @returns true if at least one event of this type was published
   *
   * @example
   * ```typescript
   * expect(eventBus.wasPublished('Todo.Created')).toBe(true);
   * ```
   */
  wasPublished(eventType: string): boolean {
    const events = this.publishedEvents.get(eventType);
    return events !== undefined && events.length > 0;
  }

  /**
   * Get count of published events by type.
   *
   * @param eventType - The type of event to count
   * @returns The number of events of this type that were published
   *
   * @example
   * ```typescript
   * expect(eventBus.count('Todo.Created')).toBe(1);
   * ```
   */
  count(eventType: string): number {
    return this.getEvents(eventType).length;
  }

  /**
   * Disconnect (no-op for mock).
   *
   * This method exists for compatibility with the EventBus interface.
   * In the mock, it does nothing since there's no actual connection.
   */
  async disconnect(): Promise<void> {
    // No-op for mock
  }

  /**
   * Check connection status (always true for mock).
   *
   * @returns Always true for mock
   */
  isConnected(): boolean {
    return true;
  }

  /**
   * Start the event bus (no-op for mock).
   *
   * This method exists for compatibility with the EventBus interface.
   */
  async start(): Promise<void> {
    // No-op for mock
  }

  /**
   * Stop the event bus (no-op for mock).
   *
   * This method exists for compatibility with the EventBus interface.
   */
  async stop(): Promise<void> {
    // No-op for mock
  }
}

/**
 * Create a new MockEventBus instance.
 *
 * Convenience function for creating a mock event bus.
 *
 * @example
 * ```typescript
 * import { createMockEventBus } from '@oxlayer/capabilities-testing/mock-event-bus';
 *
 * const eventBus = createMockEventBus();
 * ```
 */
export function createMockEventBus(): MockEventBus {
  return new MockEventBus();
}
