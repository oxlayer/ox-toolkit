import type { DomainEvent } from '@oxlayer/capabilities-events';
import type { EventBus, EventEnvelope } from '@oxlayer/capabilities-events';
import { createEnvelope } from '@oxlayer/capabilities-events';
import { SQSClientAdapter } from './client.js';
import type { SQSConnectionConfig, SQSQueueConfig, SQSPublishOptions } from './types.js';

export interface SQSEventBusConfig {
  connection: SQSConnectionConfig;
  queues: Record<string, SQSQueueConfig>;
}

export interface SQSEventBusOptions {
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
  publishOptions?: SQSPublishOptions;
}

/**
 * SQS event bus implementation
 *
 * Uses AWS SQS for reliable event delivery with built-in retries and persistence.
 * Ideal for distributed systems and AWS-based architectures.
 */
export class SQSEventBus implements EventBus {
  private client: SQSClientAdapter;
  private queues: Record<string, SQSQueueConfig>;
  private started = false;

  constructor(
    private readonly config: SQSEventBusConfig,
    private readonly options: SQSEventBusOptions
  ) {
    this.client = new SQSClientAdapter(config.connection);
    this.queues = config.queues;
  }

  async start(): Promise<void> {
    if (this.started) return;

    await this.client.connect(this.queues);
    this.started = true;
    console.log('[SQSEventBus] Started');
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    await this.client.close();
    this.started = false;
    console.log('[SQSEventBus] Stopped');
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
      throw new Error('SQSEventBus not started. Call start() first.');
    }

    const queueKey = this.getQueueKey(envelope.type);
    await this.client.publish(queueKey, envelope, this.options.publishOptions);
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('SQSEventBus not started. Call start() first.');
    }

    const queueKey = this.getQueueKey(eventType);

    // Start polling for messages
    const poll = async () => {
      const messages = await this.client.receive(queueKey, {
        maxMessages: 10,
        waitTimeSeconds: 20,
      });

      if (messages) {
        for (const message of messages) {
          try {
            const envelope = message.Body as EventEnvelope<T>;
            await handler(envelope.data as T);
            await this.client.deleteMessage(queueKey, message.ReceiptHandle);
          } catch (error) {
            console.error(`[SQSEventBus] Error processing message:`, error);
          }
        }
      }
    };

    // Start polling interval
    const interval = setInterval(poll, 1000);

    // Return unsubscribe function
    return async () => {
      clearInterval(interval);
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.started) {
      throw new Error('SQSEventBus not started. Call start() first.');
    }

    const queueKey = this.getQueueKey(eventType);

    // Start polling for messages
    const poll = async () => {
      const messages = await this.client.receive(queueKey, {
        maxMessages: 10,
        waitTimeSeconds: 20,
      });

      if (messages) {
        for (const message of messages) {
          try {
            const envelope = message.Body as EventEnvelope<T>;
            await handler(envelope);
            await this.client.deleteMessage(queueKey, message.ReceiptHandle);
          } catch (error) {
            console.error(`[SQSEventBus] Error processing message:`, error);
          }
        }
      }
    };

    // Start polling interval
    const interval = setInterval(poll, 1000);

    // Return unsubscribe function
    return async () => {
      clearInterval(interval);
    };
  }

  /**
   * Get the underlying SQS client for advanced usage
   */
  getClient(): SQSClientAdapter {
    return this.client;
  }

  /**
   * Get queue key for event type
   */
  private getQueueKey(eventType: string): string {
    // Convert event type to queue key format
    // e.g., "UserCreated" -> "user-created"
    const key = eventType
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .substring(1);

    // Check if queue exists, otherwise use default
    if (this.queues[key]) {
      return key;
    }

    // Use first queue as default
    const keys = Object.keys(this.queues);
    if (keys.length === 0) {
      throw new Error('No queues configured');
    }

    return keys[0];
  }
}

/**
 * Create an SQS event bus
 */
export function createSQSEventBus(
  config: SQSEventBusConfig,
  options: SQSEventBusOptions
): SQSEventBus {
  return new SQSEventBus(config, options);
}
