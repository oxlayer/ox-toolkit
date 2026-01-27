import { Queue, Worker, QueueEvents } from 'bullmq';
import type { BullMQConfig, BullMQQueueConfig, BullMQQueues, BullMQWorkers, BullMQQueueEvents } from './types.js';
import type { RedisClient } from '@oxlayer/capabilities-adapters-redis';

export class BullMQClient {
  private queues: BullMQQueues = {};
  private workers: BullMQWorkers = {};
  private queueEvents: BullMQQueueEvents = {};
  private connection: any;

  constructor(
    private config: BullMQConfig,
    private redisClient?: RedisClient
  ) {
    // Use provided Redis client or create connection from config
    if (redisClient) {
      this.connection = {
        connection: redisClient.getRawClient(),
      };
    } else if (config.connection) {
      this.connection = {
        connection: {
          host: config.connection.host,
          port: config.connection.port,
          password: config.connection.password,
          db: config.connection.db || 0,
        },
      };
    } else {
      throw new Error('Either config.connection or redisClient must be provided');
    }
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing BullMQ client...');

    for (const [key, queueConfig] of Object.entries(this.config.queues)) {
      // Create queue
      this.queues[key] = new Queue(
        queueConfig.name,
        { ...this.connection, ...queueConfig.queueOptions }
      );
      console.log(`✅ BullMQ queue '${queueConfig.name}' created`);

      // Create worker if processor is defined
      const { processor, ...workerOptionsWithoutProcessor } = queueConfig.workerOptions as any;
      if (processor) {
        this.workers[key] = new Worker(
          queueConfig.name,
          processor,
          { ...this.connection, ...workerOptionsWithoutProcessor }
        );
        console.log(`✅ BullMQ worker for '${queueConfig.name}' created`);

        // Handle worker errors
        this.workers[key].on('failed', (job: any, error: Error) => {
          console.error(`❌ BullMQ job ${job.id} failed:`, error);
        });

        this.workers[key].on('completed', (job: any) => {
          console.log(`✅ BullMQ job ${job.id} completed`);
        });
      }

      // Create queue events listener
      this.queueEvents[key] = new QueueEvents(
        queueConfig.name,
        { ...this.connection }
      );

      this.queueEvents[key].on('waiting', (jobId: string) => {
        console.log(`📋 BullMQ job ${jobId} is waiting`);
      });

      this.queueEvents[key].on('active', (jobId: string) => {
        console.log(`⚡ BullMQ job ${jobId} is active`);
      });

      console.log(`✅ BullMQ events for '${queueConfig.name}' registered`);
    }

    console.log('✅ BullMQ client initialized');
  }

  getQueue<T = any>(key: string): any | undefined {
    return this.queues[key];
  }

  getWorker(key: string): any | undefined {
    return this.workers[key];
  }

  getQueueEvents(key: string): any | undefined {
    return this.queueEvents[key];
  }

  async addJob(queueKey: string, jobName: string, data: any, opts?: any): Promise<void> {
    const queue = this.queues[queueKey];
    if (!queue) {
      throw new Error(`Queue '${queueKey}' not found`);
    }
    await queue.add(jobName, data, opts);
    console.log(`📤 BullMQ job '${jobName}' added to queue '${queueKey}'`);
  }

  async close(): Promise<void> {
    console.log('🔌 Closing BullMQ connections...');

    // Close workers
    for (const [key, worker] of Object.entries(this.workers)) {
      await worker.close();
      console.log(`✅ BullMQ worker '${key}' closed`);
    }

    // Close queue events
    for (const [key, eventEmitter] of Object.entries(this.queueEvents)) {
      await eventEmitter.close();
      console.log(`✅ BullMQ events '${key}' closed`);
    }

    // Close queues
    for (const [key, queue] of Object.entries(this.queues)) {
      await queue.close();
      console.log(`✅ BullMQ queue '${key}' closed`);
    }

    console.log('✅ All BullMQ connections closed');
  }
}
