/**
 * Base interface for all domain events.
 *
 * Events represent facts that have already happened in the domain.
 * They are immutable and must be versioned for backward compatibility.
 *
 * Rules:
 * - Events are facts, not commands
 * - Events are immutable
 * - Events must be versioned
 * - Consumers must be idempotent
 *
 * @example
 * ```ts
 * interface UserCreatedEvent extends DomainEvent {
 *   name: 'user.created';
 *   version: 1;
 *   payload: {
 *     userId: string;
 *     email: string;
 *   };
 * }
 * ```
 */
export interface DomainEvent<TPayload = unknown> {
  /**
   * Event name in format: `context.action` (e.g., 'user.created', 'order.shipped')
   */
  readonly name: string;

  /**
   * Schema version for backward compatibility
   */
  readonly version: number;

  /**
   * ISO 8601 timestamp when the event occurred
   */
  readonly occurredAt: string;

  /**
   * Event-specific payload
   */
  readonly payload: TPayload;

  /**
   * Optional correlation ID for tracing related events
   */
  readonly correlationId?: string;

  /**
   * Optional causation ID linking to the event that caused this one
   */
  readonly causationId?: string;
}

/**
 * Envelope wrapping a domain event with metadata for transport
 */
export interface EventEnvelope<T extends DomainEvent = DomainEvent> {
  /**
   * Unique event ID
   */
  readonly eventId: string;

  /**
   * The domain event
   */
  readonly event: T;

  /**
   * Aggregate type that produced this event
   */
  readonly aggregateType: string;

  /**
   * Aggregate ID that produced this event
   */
  readonly aggregateId: string;

  /**
   * Sequence number within the aggregate
   */
  readonly sequence: number;

  /**
   * ISO 8601 timestamp when the event was recorded
   */
  readonly recordedAt: string;
}
