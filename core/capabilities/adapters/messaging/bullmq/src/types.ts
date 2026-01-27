import type { QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';

export interface BullMQQueueConfig {
  name: string;
  queueOptions: QueueOptions;
  workerOptions: WorkerOptions;
}

export interface BullMQConfig {
  /**
   * Connection config (optional if using Redis client)
   * If not provided, you must pass a RedisClient to the constructor
   */
  connection?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queues: Record<string, BullMQQueueConfig>;
}

export interface BullMQQueues {
  [key: string]: any; // Queue instance
}

export interface BullMQWorkers {
  [key: string]: any; // Worker instance
}

export interface BullMQQueueEvents {
  [key: string]: any; // QueueEvents instance
}
