import type { DomainEvent } from './event.js';
import type { EventBus } from './event-bus.js';

/**
 * Event subscription handle
 * Call the returned function to unsubscribe
 */
export type SubscriptionHandle = () => Promise<void>;

/**
 * Event subscriber - application service for subscribing to events
 */
export class EventSubscriber {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Subscribe to a single event type
   */
  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<SubscriptionHandle> {
    return this.eventBus.on(eventType, handler);
  }

  /**
   * Subscribe to multiple event types with the same handler
   */
  async subscribeToMany<T extends DomainEvent>(
    eventTypes: string[],
    handler: (event: T) => Promise<void> | void
  ): Promise<SubscriptionHandle> {
    const unsubscribers = await Promise.all(
      eventTypes.map((type) => this.eventBus.on(type, handler))
    );

    return async () => {
      await Promise.all(unsubscribers.map((unsub) => unsub()));
    };
  }

  /**
   * Subscribe to events matching a pattern
   * Note: Pattern matching depends on transport capabilities
   */
  async subscribeToPattern<T extends DomainEvent>(
    pattern: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<SubscriptionHandle> {
    return this.eventBus.on(pattern, handler);
  }
}

/**
 * Create an event subscriber
 */
export function createEventSubscriber(eventBus: EventBus): EventSubscriber {
  return new EventSubscriber(eventBus);
}
