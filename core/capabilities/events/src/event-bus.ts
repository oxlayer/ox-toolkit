import type { DomainEvent } from './event.js';
import type { EventEnvelope } from './envelope.js';

// Re-export EventEnvelope for use in implementations
export type { EventEnvelope } from './envelope.js';

/**
 * Event bus interface - transport-agnostic contract for event emission and subscription
 *
 * Implementations:
 * - InMemoryEventBus (for testing)
 * - RabbitMQEventBus (in @staples/adapters/rabbitmq)
 * - BullMQEventBus (in @staples/adapters/bullmq)
 * - SQSEventBus (in @staples/adapters/sqs)
 * - MQTTEventBus (in @staples/adapters/mqtt)
 */
export interface EventBus {
  /**
   * Emit a domain event
   */
  emit<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * Emit an event envelope
   */
  emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void>;

  /**
   * Subscribe to events by type
   */
  on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>>;

  /**
   * Subscribe to event envelopes
   */
  onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>>;

  /**
   * Start the event bus (connect to transports, etc.)
   */
  start?(): Promise<void>;

  /**
   * Stop the event bus (close connections, etc.)
   */
  stop?(): Promise<void>;
}

/**
 * Event handler options
 */
export interface EventHandlerOptions {
  /**
   * Number of concurrent handlers
   */
  concurrency?: number;

  /**
   * Retry attempts on failure
   */
  retryAttempts?: number;

  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;

  /**
   * Dead letter queue for failed events
   */
  deadLetterQueue?: string;
}

/**
 * Extended event bus with subscription options
 */
export interface EventBusWithSubscriptions extends EventBus {
  /**
   * Subscribe with options
   */
  onWithOptions<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void,
    options: EventHandlerOptions
  ): Promise<() => Promise<void>>;
}
