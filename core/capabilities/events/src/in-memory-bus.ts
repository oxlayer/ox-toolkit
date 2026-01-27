import type { DomainEvent } from './event.js';
import type { EventBus, EventEnvelope } from './event-bus.js';

/**
 * In-memory event bus for testing and development
 *
 * WARNING: This is NOT for production use!
 * - No persistence
 * - No cross-process communication
 * - No delivery guarantees
 * - Lost events on process crash
 *
 * Use only for:
 * - Unit tests
 * - Integration tests
 * - Local development
 * - Single-process scenarios
 */
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Set<(event: any) => Promise<void>>>();
  private envelopeHandlers = new Map<
    string,
    Set<(envelope: EventEnvelope<any>) => Promise<void>>
  >();
  private started = false;

  async start(): Promise<void> {
    this.started = true;
  }

  async stop(): Promise<void> {
    this.handlers.clear();
    this.envelopeHandlers.clear();
    this.started = false;
  }

  async emit<T extends DomainEvent>(event: T): Promise<void> {
    if (!this.started) {
      console.warn('[InMemoryEventBus] Bus not started, event may be lost:', event.eventType);
    }
    const handlers = this.handlers.get(event.eventType);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map((handler) => handler(event))
      );
    }
  }

  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    if (!this.started) {
      console.warn('[InMemoryEventBus] Bus not started, envelope may be lost:', envelope.type);
    }
    const handlers = this.envelopeHandlers.get(envelope.type);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map((handler) => handler(envelope))
      );
    }
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as any);

    return async () => {
      this.handlers.get(eventType)?.delete(handler as any);
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.envelopeHandlers.has(eventType)) {
      this.envelopeHandlers.set(eventType, new Set());
    }
    this.envelopeHandlers.get(eventType)!.add(handler as any);

    return async () => {
      this.envelopeHandlers.get(eventType)?.delete(handler as any);
    };
  }

  /**
   * Get the number of handlers for an event type (useful for testing)
   */
  handlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.envelopeHandlers.clear();
  }
}

/**
 * Create an in-memory event bus
 */
export function createInMemoryEventBus(): InMemoryEventBus {
  const bus = new InMemoryEventBus();
  bus.start();
  return bus;
}
