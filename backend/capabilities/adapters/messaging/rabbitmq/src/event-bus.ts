import type { DomainEvent } from '@oxlayer/capabilities-events';
import type { EventBus, EventEnvelope } from '@oxlayer/capabilities-events';
import { createEnvelope } from '@oxlayer/capabilities-events';
import { RabbitMQClient } from './client.js';
import type { RabbitMQConnectionConfig, RabbitMQExchangeConfig, RabbitMQQueueConfig } from './types.js';
import { withMessagingSpan, setMessagingEventType, setMessagingRoutingKey } from '@oxlayer/capabilities-telemetry';
import type { Tracer } from '@opentelemetry/api';

export interface RabbitMQEventBusConfig {
  url: string;
  exchange: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  queue?: string;
  routingKey?: string;
  durable?: boolean;
  autoDelete?: boolean;
  /**
   * Heartbeat interval in seconds.
   * Default is 60s to match RabbitMQ server default.
   * Set to 0 to disable (not recommended).
   */
  heartbeat?: number;
}

export interface RabbitMQEventBusOptions {
  /**
   * Service name for event source attribution
   */
  serviceName: string;
  /**
   * Service version
   */
  serviceVersion?: string;
  /**
   * Default routing key pattern
   */
  routingKeyPattern?: string;
  /**
   * OpenTelemetry Tracer for instrumentation
   */
  tracer?: Tracer | null;
}

/**
 * RabbitMQ event bus implementation
 *
 * Uses RabbitMQClient from the adapter for connection management.
 * Implements the EventBus interface from @oxlayer/capabilities-events.
 */
export class RabbitMQEventBus implements EventBus {
  private client: RabbitMQClient;
  private exchangeName: string;
  private queueName?: string;
  private started = false;
  private handlers = new Map<string, Set<(event: any) => Promise<void> | void>>();
  private consumerTag?: string;
  private tracer?: Tracer | null;

  constructor(
    private readonly config: RabbitMQEventBusConfig,
    private readonly options: RabbitMQEventBusOptions
  ) {
    // Validate required configuration
    if (!config.url) {
      throw new Error('[RabbitMQEventBus] Configuration error: "url" is required');
    }
    if (!config.exchange) {
      throw new Error('[RabbitMQEventBus] Configuration error: "exchange" is required');
    }
    if (!options.serviceName) {
      throw new Error('[RabbitMQEventBus] Options error: "serviceName" is required');
    }

    // Validate URL format
    try {
      new URL(config.url);
    } catch (error) {
      throw new Error(`[RabbitMQEventBus] Invalid URL format: ${config.url}`);
    }

    // Validate heartbeat range
    if (config.heartbeat !== undefined && config.heartbeat < 0) {
      throw new Error(`[RabbitMQEventBus] Heartbeat must be >= 0, got: ${config.heartbeat}`);
    }

    this.tracer = options.tracer || null;

    // Warn if telemetry is not configured (optional but recommended)
    if (!options.tracer) {
      console.warn('[RabbitMQEventBus] No tracer provided - OpenTelemetry tracing disabled. Pass a tracer for better observability.');
    }

    // Create RabbitMQ client with event-specific configuration
    const parsedUrl = new URL(config.url);
    const connectionConfig: RabbitMQConnectionConfig = {
      hostname: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || 5672,
      username: parsedUrl.username || 'guest',
      password: parsedUrl.password || 'guest',
      // Remove leading slash from vhost pathname (e.g., "/vhost" -> "vhost")
      vhost: parsedUrl.pathname?.replace(/^\//, '') || '/',
      // Pass through heartbeat config, or let client use its safe default (10s)
      ...(config.heartbeat !== undefined && { heartbeat: config.heartbeat }),
    };

    const exchanges: Record<string, RabbitMQExchangeConfig> = {
      events: {
        name: config.exchange,
        type: config.exchangeType || 'topic',
        options: {
          durable: config.durable ?? true,
          autoDelete: config.autoDelete ?? false,
        },
      },
    };

    const queues: Record<string, RabbitMQQueueConfig> = config.queue
      ? {
        events: {
          name: config.queue,
          routingKey: config.routingKey || '#',
          options: {
            durable: config.durable ?? true,
            autoDelete: config.autoDelete ?? false,
          },
        },
      }
      : {};

    this.client = new RabbitMQClient(connectionConfig, exchanges, queues);
    this.exchangeName = config.exchange;
    this.queueName = config.queue;
  }

  async start(): Promise<void> {
    if (this.started) return;

    await this.client.connect();
    this.started = true;
    console.log(`[RabbitMQEventBus] Connected to ${this.config.url}`);
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    // Cancel consumer if exists
    if (this.consumerTag && this.client.channel) {
      try {
        await this.client.channel.cancel(this.consumerTag);
      } catch (error) {
        console.error('[RabbitMQEventBus] Error canceling consumer:', error);
      }
    }

    await this.client.close();
    this.started = false;
    this.handlers.clear();
  }

  /**
   * Alias for stop() - for compatibility with container shutdown
   */
  async disconnect(): Promise<void> {
    return this.stop();
  }

  async emit<T extends DomainEvent>(event: T): Promise<void> {
    if (!this.started) {
      throw new Error('RabbitMQEventBus not started. Call start() first.');
    }

    return withMessagingSpan(
      this.tracer || null,
      'publish',
      this.exchangeName,
      event.eventId,
      async (span) => {
        setMessagingEventType(span, event.eventType);
        span?.setAttribute('messaging.source', this.options.serviceName);

        const envelope = createEnvelope(event, {
          source: this.options.serviceName,
          sourceVersion: this.options.serviceVersion,
        });

        await this.emitEnvelope(envelope);
      }
    );
  }

  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    if (!this.started) {
      throw new Error('RabbitMQEventBus not started. Call start() first.');
    }

    return withMessagingSpan(
      this.tracer || null,
      'publish',
      this.exchangeName,
      envelope.id,
      async (span) => {
        setMessagingEventType(span, envelope.type);
        span?.setAttribute('messaging.event_version', envelope.version);
        span?.setAttribute('messaging.source', this.options.serviceName);

        const routingKey = this.buildRoutingKey(envelope.type);
        setMessagingRoutingKey(span, routingKey);

        await this.client.publish(routingKey, envelope);
      }
    );
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('RabbitMQEventBus not started. Call start() first.');
    }

    if (!this.queueName) {
      throw new Error('Cannot subscribe: no queue configured. Set queue in config.');
    }

    // Register handler
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as any);

    // Start consuming if not already consuming
    if (!this.consumerTag) {
      await this.startConsuming();
    }

    // Return unsubscribe function
    return async () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as any);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
      // If no more handlers, cancel consumer
      if (this.handlers.size === 0 && this.consumerTag) {
        await this.client.channel.cancel(this.consumerTag);
        this.consumerTag = undefined;
      }
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    // Convert envelope handler to event handler
    const eventHandler = async (event: DomainEvent) => {
      const envelope = createEnvelope(event, {
        source: this.options.serviceName,
        sourceVersion: this.options.serviceVersion,
      });
      await handler(envelope as EventEnvelope<T>);
    };
    return this.on(eventType, eventHandler as any);
  }

  /**
   * Start consuming messages from the queue
   */
  private async startConsuming(): Promise<void> {
    if (!this.client.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const { consumerTag } = await this.client.channel.consume(
      this.queueName!,
      async (msg: any) => {
        if (!msg) return;

        try {
          const envelope = JSON.parse(msg.content.toString()) as EventEnvelope<any>;
          const eventType = envelope.type;

          // Find and execute handlers for this event type
          const handlers = this.handlers.get(eventType);
          if (handlers) {
            for (const handler of handlers) {
              await handler(envelope.data);
            }
          }

          // Acknowledge message
          this.client.channel!.ack(msg);
        } catch (error) {
          console.error('[RabbitMQEventBus] Error processing message:', error);
          // Reject message (will be requeued)
          this.client.channel!.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    this.consumerTag = consumerTag;
    console.log(`[RabbitMQEventBus] Started consuming from queue '${this.queueName}'`);
  }

  /**
   * Get the underlying RabbitMQ client for advanced usage
   */
  getClient(): RabbitMQClient {
    return this.client;
  }

  isConnected(): boolean {
    return this.started;
  }

  /**
   * Get the raw channel for advanced subscription patterns
   */
  getChannel(): any {
    return this.client.channel;
  }

  private buildRoutingKey(eventType: string): string {
    // Convert event type to routing key format
    // e.g., "UserCreated" -> "user.created"
    // or use custom pattern if provided
    if (this.options.routingKeyPattern) {
      return this.options.routingKeyPattern.replace('{eventType}', eventType);
    }

    // Default: convert PascalCase to dot.case
    return eventType
      .replace(/([A-Z])/g, '.$1')
      .toLowerCase()
      .substring(1);
  }
}

/**
 * Create a RabbitMQ event bus
 */
export function createRabbitMQEventBus(
  config: RabbitMQEventBusConfig,
  options: RabbitMQEventBusOptions
): RabbitMQEventBus {
  return new RabbitMQEventBus(config, options);
}
