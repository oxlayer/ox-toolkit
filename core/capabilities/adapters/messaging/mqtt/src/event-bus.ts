import type { DomainEvent } from '@oxlayer/capabilities-events';
import type { EventBus, EventEnvelope } from '@oxlayer/capabilities-events';
import { createEnvelope } from '@oxlayer/capabilities-events';
import { MQTTClient } from './client.js';
import type { MQTTConnectionConfig, MQTTPublishOptions } from './types.js';

export interface MQTTEventBusConfig {
  connection: MQTTConnectionConfig;
  /**
   * Topic prefix for all events
   * @default 'events'
   */
  topicPrefix?: string;
}

export interface MQTTEventBusOptions {
  /**
   * Service name for event source attribution
   */
  serviceName: string;
  /**
   * Service version
   */
  serviceVersion?: string;
  /**
   * Default publish options
   */
  publishOptions?: MQTTPublishOptions;
}

/**
 * MQTT event bus implementation
 *
 * Compatible with all MQTT 3.1.1/5.0 brokers:
 * - Mosquitto (open-source, lightweight)
 * - HiveMQ (enterprise, high-performance)
 * - EMQX (enterprise, scalable)
 * - RabbitMQ (with MQTT plugin)
 * - Apache ActiveMQ Artemis (with MQTT support)
 * - VerneMQ (distributed, scalable)
 *
 * Ideal for:
 * - IoT scenarios
 * - Lightweight messaging
 * - Pub/sub patterns
 * - Low-bandwidth networks
 */
export class MQTTEventBus implements EventBus {
  private client: MQTTClient;
  private topicPrefix: string;
  private started = false;
  private handlers = new Map<string, Set<(event: any) => Promise<void>>>();

  constructor(
    private readonly config: MQTTEventBusConfig,
    private readonly options: MQTTEventBusOptions
  ) {
    this.client = new MQTTClient(config.connection);
    this.topicPrefix = config.topicPrefix || 'events';
  }

  async start(): Promise<void> {
    if (this.started) return;

    await this.client.connect();
    this.started = true;
    console.log('[MQTTEventBus] Started');
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    // Unsubscribe from all topics
    for (const eventType of this.handlers.keys()) {
      const topic = this.buildTopic(eventType);
      await this.client.unsubscribe(topic);
    }

    await this.client.end();
    this.handlers.clear();
    this.started = false;
    console.log('[MQTTEventBus] Stopped');
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
      throw new Error('MQTTEventBus not started. Call start() first.');
    }

    const topic = this.buildTopic(envelope.type);
    await this.client.publish(topic, envelope, this.options.publishOptions);
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('MQTTEventBus not started. Call start() first.');
    }

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as any);

    const topic = this.buildTopic(eventType);

    // Subscribe to the topic
    await this.client.subscribe(topic, async (receivedTopic, message) => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        for (const h of handlers) {
          try {
            await h(message);
          } catch (error) {
            console.error(`[MQTTEventBus] Error in handler for '${eventType}':`, error);
          }
        }
      }
    });

    // Return unsubscribe function
    return async () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as any);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
          await this.client.unsubscribe(topic);
        }
      }
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    // Subscribe to the topic and pass envelope to handler
    const topic = this.buildTopic(eventType);

    await this.client.subscribe(topic, async (receivedTopic, message) => {
      // Message is already an envelope from emitEnvelope
      await handler(message);
    });

    // Return unsubscribe function
    return async () => {
      await this.client.unsubscribe(topic);
    };
  }

  /**
   * Subscribe to all events using MQTT wildcard
   */
  async onAll<T extends DomainEvent>(
    handler: (event: T, envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('MQTTEventBus not started. Call start() first.');
    }

    const topic = `${this.topicPrefix}/#`;

    await this.client.subscribe(topic, async (receivedTopic, message) => {
      try {
        await handler(message, message);
      } catch (error) {
        console.error(`[MQTTEventBus] Error in wildcard handler:`, error);
      }
    });

    return async () => {
      await this.client.unsubscribe(topic);
    };
  }

  /**
   * Get the underlying MQTT client for advanced usage
   */
  getClient(): MQTTClient {
    return this.client;
  }

  /**
   * Build MQTT topic from event type
   * Converts PascalCase to topic format: UserCreated -> events/user.created
   */
  private buildTopic(eventType: string): string {
    const topicName = eventType
      .replace(/([A-Z])/g, '.$1')
      .toLowerCase()
      .substring(1);

    return `${this.topicPrefix}/${topicName}`;
  }
}

/**
 * Create an MQTT event bus
 */
export function createMQTTEventBus(
  config: MQTTEventBusConfig,
  options: MQTTEventBusOptions
): MQTTEventBus {
  return new MQTTEventBus(config, options);
}
