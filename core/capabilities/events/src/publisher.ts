import type { DomainEvent } from './event.js';
import type { EventBus } from './event-bus.js';

/**
 * Event publisher - application service for publishing events
 *
 * This is a thin wrapper around EventBus that provides
 * convenience methods for publishing events from the application layer.
 */
export class EventPublisher {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Publish a single event
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    await this.eventBus.emit(event);
  }

  /**
   * Publish multiple events
   */
  async publishAll<T extends DomainEvent>(events: T[]): Promise<void> {
    await Promise.all(events.map((e) => this.eventBus.emit(e)));
  }

  /**
   * Publish event with correlation
   */
  async publishWithCorrelation<T extends DomainEvent>(
    event: T,
    correlationId: string
  ): Promise<void> {
    event.withCorrelation(correlationId);
    await this.eventBus.emit(event);
  }

  /**
   * Publish event with causation
   */
  async publishWithCausation<T extends DomainEvent>(
    event: T,
    causationId: string
  ): Promise<void> {
    event.withCausation(causationId);
    await this.eventBus.emit(event);
  }

  /**
   * Publish event with both correlation and causation
   */
  async publishWithContext<T extends DomainEvent>(
    event: T,
    correlationId: string,
    causationId: string
  ): Promise<void> {
    event.withCorrelation(correlationId).withCausation(causationId);
    await this.eventBus.emit(event);
  }
}

/**
 * Create an event publisher
 */
export function createEventPublisher(eventBus: EventBus): EventPublisher {
  return new EventPublisher(eventBus);
}
