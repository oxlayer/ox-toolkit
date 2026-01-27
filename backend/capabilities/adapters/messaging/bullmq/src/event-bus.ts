import { Queue, Worker, type JobsOptions } from 'bullmq';
import type { DomainEvent } from '@oxlayer/capabilities-events';
import type { EventBus, EventEnvelope } from '@oxlayer/capabilities-events';
import { createEnvelope } from '@oxlayer/capabilities-events';
import type { RedisClient } from '@oxlayer/capabilities-adapters-redis';

export interface BullMQEventBusConfig {
  connection?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queuePrefix?: string;
}

export interface BullMQEventBusOptions {
  /**
   * Service name for event source attribution
   */
  serviceName: string;
  /**
   * Service version
   */
  serviceVersion?: string;
  /**
   * Default job options
   */
  jobOptions?: JobsOptions;
}

/**
 * BullMQ event bus implementation
 *
 * Uses BullMQ for reliable event delivery with retries and persistence.
 * Ideal for background jobs and async processing.
 *
 * Can reuse an existing Redis client from the Redis adapter.
 */
export class BullMQEventBus implements EventBus {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private handlers = new Map<string, Set<(event: any) => Promise<void>>>();
  private started = false;
  private connection: any;

  constructor(
    private readonly config: BullMQEventBusConfig,
    private readonly options: BullMQEventBusOptions,
    redisClient?: RedisClient
  ) {
    // Use provided Redis client's ioredis connection or create new connection
    if (redisClient) {
      this.connection = {
        connection: redisClient.getRawClient(),
      };
    } else if (config.connection) {
      this.connection = {
        connection: config.connection,
      };
    } else {
      throw new Error('Either config.connection or redisClient must be provided');
    }
  }

  async start(): Promise<void> {
    if (this.started) return;

    // Start any existing workers
    for (const [eventType, handlers] of this.handlers) {
      await this.startWorker(eventType, handlers);
    }

    this.started = true;
    console.log('[BullMQEventBus] Started');
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    // Close all workers
    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker.close())
    );

    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    );

    this.workers.clear();
    this.queues.clear();
    this.started = false;
    console.log('[BullMQEventBus] Stopped');
  }

  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const envelope = createEnvelope(event, {
      source: this.options.serviceName,
      sourceVersion: this.options.serviceVersion,
    });

    await this.emitEnvelope(envelope);
  }

  async emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void> {
    const queue = await this.getQueue(envelope.type);

    await queue.add(
      envelope.type,
      envelope,
      this.options.jobOptions || {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    );
  }

  async on<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    // Wrap handler to ensure it always returns Promise<void>
    const wrappedHandler = async (event: any) => {
      await handler(event);
    };
    this.handlers.get(eventType)!.add(wrappedHandler as any);

    if (this.started) {
      await this.startWorker(eventType, this.handlers.get(eventType)!);
    }

    // Return unsubscribe function
    return async () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as any);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
          const worker = this.workers.get(eventType);
          if (worker) {
            await worker.close();
            this.workers.delete(eventType);
          }
        }
      }
    };
  }

  async onEnvelope<T>(
    eventType: string,
    handler: (envelope: EventEnvelope<T>) => Promise<void> | void
  ): Promise<() => Promise<void>> {
    // Convert envelope handler to data handler
    const dataHandler = (event: DomainEvent) => handler({ type: eventType, data: event as any } as any);
    return this.on(eventType, dataHandler);
  }

  private async getQueue(eventType: string): Promise<Queue> {
    if (!this.queues.has(eventType)) {
      const queueName = this.getQueueName(eventType);
      const queue = new Queue(queueName, this.connection);
      this.queues.set(eventType, queue);
    }
    return this.queues.get(eventType)!;
  }

  private async startWorker(
    eventType: string,
    handlers: Set<(event: any) => Promise<void>>
  ): Promise<void> {
    if (this.workers.has(eventType)) {
      return; // Worker already exists
    }

    const queueName = this.getQueueName(eventType);
    const worker = new Worker(
      queueName,
      async (job) => {
        const envelope = job.data as EventEnvelope;
        for (const handler of handlers) {
          await handler(envelope.data);
        }
      },
      {
        ...this.connection,
        concurrency: 5,
      }
    );

    worker.on('failed', (job, error) => {
      console.error(`[BullMQEventBus] Job ${job?.id} failed:`, error);
    });

    worker.on('completed', (job) => {
      console.log(`[BullMQEventBus] Job ${job.id} completed`);
    });

    this.workers.set(eventType, worker);
  }

  private getQueueName(eventType: string): string {
    const prefix = this.config.queuePrefix || 'events';
    return `${prefix}:${eventType.toLowerCase()}`;
  }
}

/**
 * Create a BullMQ event bus
 *
 * @example
 * ```ts
 * // With existing Redis client (recommended)
 * const redisClient = createDefaultRedisClient();
 * const eventBus = createBullMQEventBus(
 *   { queuePrefix: 'events' },
 *   { serviceName: 'my-service' },
 *   redisClient
 * );
 *
 * // With new connection
 * const eventBus = createBullMQEventBus(
 *   {
 *     connection: { host: 'localhost', port: 6379 },
 *     queuePrefix: 'events',
 *   },
 *   { serviceName: 'my-service' }
 * );
 * ```
 */
export function createBullMQEventBus(
  config: BullMQEventBusConfig,
  options: BullMQEventBusOptions,
  redisClient?: RedisClient
): BullMQEventBus {
  return new BullMQEventBus(config, options, redisClient);
}
