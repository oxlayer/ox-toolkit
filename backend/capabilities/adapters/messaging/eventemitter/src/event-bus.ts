import { EventEmitter } from 'node:events';
import type { DomainEvent } from '@oxlayer/capabilities-events';
import type { EventBus, EventEnvelope } from '@oxlayer/capabilities-events';
import { createEnvelope } from '@oxlayer/capabilities-events';

export interface EventEmitterEventBusOptions {
  /**
   * Service name for event source attribution
   */
  serviceName: string;
  /**
   * Service version
   */
  serviceVersion?: string;
  /**
   * Maximum number of listeners per event
   * @default 100
   */
  maxListeners?: number;
  /**
   * Enable error capture
   * When true, errors in handlers are caught and emitted via 'error' event
   * @default true
   */
  captureErrors?: boolean;
}

/**
 * EventEmitter event bus implementation
 *
 * Uses Node/Bun's built-in EventEmitter for in-process event delivery.
 * Ideal for single-process applications, testing, and development.
 *
 * Note: Events are NOT persisted and only delivered to in-process listeners.
 * For distributed systems, use RabbitMQEventBus, BullMQEventBus, or SQSEventBus.
 */
export class EventEmitterEventBus implements EventBus {
  private emitter: EventEmitter;
  private started = false;

  constructor(private readonly options: EventEmitterEventBusOptions) {
    this.emitter = new EventEmitter();

    if (options.maxListeners) {
      this.emitter.setMaxListeners(options.maxListeners);
    }

    // Handle process termination
    this.setupGracefulShutdown();
  }

  async start(): Promise<void> {
    if (this.started) return;

    this.started = true;
    console.log('[EventEmitterEventBus] Started');
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    // Remove all listeners
    this.emitter.removeAllListeners();
    this.started = false;
    console.log('[EventEmitterEventBus] Stopped');
  }

  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const envelope = createEnvelope(event, {
      source: this.options.serviceName,
      sourceVersion: this.options.serviceVersion,
    });

    await this.emitEnvelope(envelope);
  }

  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    if (!this.started) {
      throw new Error('EventEmitterEventBus not started. Call start() first.');
    }

    // Emit to both data and envelope listeners
    this.emitter.emit(envelope.type, envelope.data, envelope);
    this.emitter.emit(`${envelope.type}:envelope`, envelope);

    // Also emit to wildcard listeners
    this.emitter.emit('*', envelope.data, envelope);
    this.emitter.emit('*:envelope', envelope);
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('EventEmitterEventBus not started. Call start() first.');
    }

    const wrappedHandler = async (data: T, envelope: EventEnvelope<T>) => {
      if (this.options.captureErrors !== false) {
        try {
          await handler(data);
        } catch (error) {
          this.emitter.emit('error', error, envelope);
        }
      } else {
        await handler(data);
      }
    };

    this.emitter.on(eventType, wrappedHandler);

    // Return unsubscribe function
    return async () => {
      this.emitter.off(eventType, wrappedHandler);
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('EventEmitterEventBus not started. Call start() first.');
    }

    const envelopeEventType = `${eventType}:envelope`;

    const wrappedHandler = async (envelope: EventEnvelope<T>) => {
      if (this.options.captureErrors !== false) {
        try {
          await handler(envelope);
        } catch (error) {
          this.emitter.emit('error', error, envelope);
        }
      } else {
        await handler(envelope);
      }
    };

    this.emitter.on(envelopeEventType, wrappedHandler);

    // Return unsubscribe function
    return async () => {
      this.emitter.off(envelopeEventType, wrappedHandler);
    };
  }

  /**
   * Subscribe to all events (wildcard)
   */
  async onAll<T extends DomainEvent>(
    handler: (event: T, envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('EventEmitterEventBus not started. Call start() first.');
    }

    const wrappedHandler = async (data: T, envelope: EventEnvelope<T>) => {
      if (this.options.captureErrors !== false) {
        try {
          await handler(data, envelope);
        } catch (error) {
          this.emitter.emit('error', error, envelope);
        }
      } else {
        await handler(data, envelope);
      }
    };

    this.emitter.on('*', wrappedHandler);

    return async () => {
      this.emitter.off('*', wrappedHandler);
    };
  }

  /**
   * Subscribe to errors
   */
  onError(
    handler: (error: Error, envelope?: EventEnvelope) => Promise<void> | void
  ): () => void {
    this.emitter.on('error', handler);
    return () => {
      this.emitter.off('error', handler);
    };
  }

  /**
   * Get the underlying EventEmitter for advanced usage
   */
  getEmitter(): EventEmitter {
    return this.emitter;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }

  /**
   * Get all event names with listeners
   */
  eventNames(): string[] {
    return this.emitter.eventNames() as string[];
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      await this.stop();
    };

    process.once('beforeexit', shutdown);
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
}

/**
 * Create an EventEmitter event bus
 */
export function createEventEmitterEventBus(
  options: EventEmitterEventBusOptions
): EventEmitterEventBus {
  return new EventEmitterEventBus(options);
}
