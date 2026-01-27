/**
 * Base domain event
 * All domain events should extend this class
 */
export abstract class DomainEvent {
  abstract readonly eventType: string;
  readonly occurredAt: Date;
  readonly eventId: string;
  readonly correlationId?: string;
  readonly causationId?: string;

  constructor() {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }

  withCorrelation(correlationId: string): this {
    (this as any).correlationId = correlationId;
    return this;
  }

  withCausation(causationId: string): this {
    (this as any).causationId = causationId;
    return this;
  }
}
