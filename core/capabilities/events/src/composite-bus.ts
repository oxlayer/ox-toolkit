import type { DomainEvent } from './event.js';
import type { EventBus, EventEnvelope } from './event-bus.js';

/**
 * Composite event bus - publishes to multiple event buses simultaneously
 *
 * This allows you to:
 * - Use RabbitMQ for inter-service events
 * - Use BullMQ for background jobs
 * - Use in-memory bus for testing
 * - All at the same time, without changing domain/application code
 *
 * @example
 * ```ts
 * const eventBus = new CompositeEventBus([
 *   createRabbitMQEventBus(),
 *   createBullMQEventBus(),
 * ]);
 * ```
 */
export class CompositeEventBus implements EventBus {
  constructor(private readonly buses: EventBus[]) {}

  async emit<T extends DomainEvent>(event: T): Promise<void> {
    await Promise.all(this.buses.map((bus) => bus.emit(event)));
  }

  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    await Promise.all(this.buses.map((bus) => bus.emitEnvelope(envelope)));
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    const unsubscribers = await Promise.all(
      this.buses.map((bus) => bus.on(eventType, handler))
    );

    return async () => {
      await Promise.all(unsubscribers.map((unsub) => unsub()));
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    const unsubscribers = await Promise.all(
      this.buses.map((bus) => bus.onEnvelope(eventType, handler))
    );

    return async () => {
      await Promise.all(unsubscribers.map((unsub) => unsub()));
    };
  }

  async start(): Promise<void> {
    await Promise.all(
      this.buses.map((bus) => bus.start?.()).filter(Boolean)
    );
  }

  async stop(): Promise<void> {
    await Promise.all(
      this.buses.map((bus) => bus.stop?.()).filter(Boolean)
    );
  }

  /**
   * Add a new event bus to the composite
   */
  add(bus: EventBus): void {
    this.buses.push(bus);
  }

  /**
   * Remove an event bus from the composite
   */
  remove(bus: EventBus): void {
    const index = this.buses.indexOf(bus);
    if (index !== -1) {
      this.buses.splice(index, 1);
    }
  }
}
