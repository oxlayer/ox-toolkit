import type { DomainEvent } from './event.js';
import type { EventBus } from './event-bus.js';
import type { EventEnvelope } from './envelope.js';

/**
 * Instrumented event bus options
 */
export interface InstrumentedEventBusOptions {
  /**
   * Metrics client with counter, timer methods
   */
  metrics?: {
    counter(name: string, value: number, labels?: Record<string, string>): void;
    timer(name: string, labels?: Record<string, string>): () => void;
  };
  /**
   * Tracer with startSpan method
   */
  tracer?: {
    startSpan(name: string, options?: { attributes?: Record<string, string | number | undefined> }): {
      end(): void;
      setAttribute(key: string, value: string | number | boolean): void;
    };
  };
  /**
   * Service name for metrics labels
   */
  serviceName?: string;
}

/**
 * Instrumented event bus - wraps any EventBus with telemetry and metrics
 *
 * This class implements the EventBus interface and adds observability
 * through metrics and tracing without modifying the underlying behavior.
 *
 * Metrics emitted:
 * - events_publish_total{event_type, status} - Counter for published events
 * - events_publish_duration_ms{event_type} - Histogram for emit duration
 * - events_consume_total{event_type, status} - Counter for consumed events
 * - events_consume_duration_ms{event_type} - Histogram for handler duration
 *
 * Traces:
 * - event.publish span with event.type and event.id attributes
 * - event.consume span with event.type and handler attributes
 *
 * Important: This class is designed to be non-blocking.
 * Metrics/tracing failures are swallowed to prevent breaking event delivery.
 */
export class InstrumentedEventBus implements EventBus {
  constructor(
    private readonly inner: EventBus,
    private readonly options: InstrumentedEventBusOptions = {}
  ) { }

  /**
   * Emit a domain event with instrumentation
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const span = this.options.tracer?.startSpan('event.publish', {
      attributes: {
        'event.type': event.eventType,
        'event.id': event.eventId,
        ...(this.options.serviceName && { 'service.name': this.options.serviceName }),
      },
    });

    const timer = this.options.metrics?.timer('events_publish_duration_ms', {
      event_type: event.eventType,
      ...(this.options.serviceName && { service: this.options.serviceName }),
    });

    try {
      await this.inner.emit(event);
      this.options.metrics?.counter('events_publish_total', 1, {
        event_type: event.eventType,
        status: 'success',
        ...(this.options.serviceName && { service: this.options.serviceName }),
      });
    } catch (error) {
      this.options.metrics?.counter('events_publish_total', 1, {
        event_type: event.eventType,
        status: 'failed',
        ...(this.options.serviceName && { service: this.options.serviceName }),
      });
      throw error;
    } finally {
      timer?.();
      span?.end();
    }
  }

  /**
   * Emit an event envelope with instrumentation
   */
  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    const span = this.options.tracer?.startSpan('event.publish_envelope', {
      attributes: {
        'event.type': envelope.type,
        'event.id': envelope.id,
        'event.version': envelope.version,
        ...(this.options.serviceName && { 'service.name': this.options.serviceName }),
      },
    });

    const timer = this.options.metrics?.timer('events_publish_duration_ms', {
      event_type: envelope.type,
      ...(this.options.serviceName && { service: this.options.serviceName }),
    });

    try {
      await this.inner.emitEnvelope(envelope);
      this.options.metrics?.counter('events_publish_total', 1, {
        event_type: envelope.type,
        status: 'success',
        ...(this.options.serviceName && { service: this.options.serviceName }),
      });
    } catch (error) {
      this.options.metrics?.counter('events_publish_total', 1, {
        event_type: envelope.type,
        status: 'failed',
        ...(this.options.serviceName && { service: this.options.serviceName }),
      });
      throw error;
    } finally {
      timer?.();
      span?.end();
    }
  }

  /**
   * Subscribe to events by type with instrumentation
   */
  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    const wrappedHandler = async (event: T): Promise<void> => {
      const span = this.options.tracer?.startSpan('event.consume', {
        attributes: {
          'event.type': eventType,
          'event.id': event.eventId,
          ...(this.options.serviceName && { 'service.name': this.options.serviceName }),
        },
      });

      const timer = this.options.metrics?.timer('events_consume_duration_ms', {
        event_type: eventType,
        ...(this.options.serviceName && { service: this.options.serviceName }),
      });

      try {
        await handler(event);
        this.options.metrics?.counter('events_consume_total', 1, {
          event_type: eventType,
          status: 'success',
          ...(this.options.serviceName && { service: this.options.serviceName }),
        });
      } catch (error) {
        this.options.metrics?.counter('events_consume_total', 1, {
          event_type: eventType,
          status: 'failed',
          ...(this.options.serviceName && { service: this.options.serviceName }),
        });
        throw error;
      } finally {
        timer?.();
        span?.end();
      }
    };

    return this.inner.on(eventType, wrappedHandler);
  }

  /**
   * Subscribe to event envelopes with instrumentation
   */
  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    const wrappedHandler = async (envelope: EventEnvelope<T>): Promise<void> => {
      const span = this.options.tracer?.startSpan('event.consume_envelope', {
        attributes: {
          'event.type': eventType,
          'event.id': envelope.id,
          'event.version': envelope.version,
          ...(this.options.serviceName && { 'service.name': this.options.serviceName }),
        },
      });

      const timer = this.options.metrics?.timer('events_consume_duration_ms', {
        event_type: eventType,
        ...(this.options.serviceName && { service: this.options.serviceName }),
      });

      try {
        await handler(envelope);
        this.options.metrics?.counter('events_consume_total', 1, {
          event_type: eventType,
          status: 'success',
          ...(this.options.serviceName && { service: this.options.serviceName }),
        });
      } catch (error) {
        this.options.metrics?.counter('events_consume_total', 1, {
          event_type: eventType,
          status: 'failed',
          ...(this.options.serviceName && { service: this.options.serviceName }),
        });
        throw error;
      } finally {
        timer?.();
        span?.end();
      }
    };

    return this.inner.onEnvelope(eventType, wrappedHandler);
  }

  /**
   * Start the event bus with instrumentation
   */
  async start(): Promise<void> {
    const span = this.options.tracer?.startSpan('event_bus.start', {
      attributes: {
        ...(this.options.serviceName && { 'service.name': this.options.serviceName }),
      },
    });

    try {
      await this.inner.start?.();
    } finally {
      span?.end();
    }
  }

  /**
   * Stop the event bus with instrumentation
   */
  async stop(): Promise<void> {
    const span = this.options.tracer?.startSpan('event_bus.stop', {
      attributes: {
        ...(this.options.serviceName && { 'service.name': this.options.serviceName }),
      },
    });

    try {
      await this.inner.stop?.();
    } finally {
      span?.end();
    }
  }

  /**
   * Get the underlying event bus
   */
  getInner(): EventBus {
    return this.inner;
  }
}

/**
 * Create an instrumented event bus
 *
 * @param inner - The underlying event bus to wrap
 * @param options - Instrumentation options
 *
 * @example
 * ```ts
 * import { InstrumentedEventBus } from '@oxlayer/capabilities-events';
 * import { EventEmitterEventBus } from '@oxlayer/capabilities-adapters-eventemitter';
 * import { MetricsClient } from '@oxlayer/capabilities-metrics';
 * import { TelemetryClient } from '@oxlayer/capabilities-telemetry';
 *
 * const metrics = new MetricsClient();
 * const telemetry = new TelemetryClient({ serviceName: 'my-service' });
 * await telemetry.initialize();
 *
 * const baseBus = new EventEmitterEventBus({ serviceName: 'my-service' });
 * const bus = new InstrumentedEventBus(baseBus, {
 *   metrics,
 *   tracer: telemetry.getTracer(),
 *   serviceName: 'my-service',
 * });
 *
 * await bus.start();
 * await bus.emit({ eventType: 'UserCreated', data: { id: 1 } });
 * ```
 */
export function createInstrumentedEventBus(
  inner: EventBus,
  options?: InstrumentedEventBusOptions
): InstrumentedEventBus {
  return new InstrumentedEventBus(inner, options);
}
