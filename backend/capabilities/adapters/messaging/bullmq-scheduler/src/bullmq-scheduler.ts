/**
 * BullMQ Scheduler Implementation
 *
 * Provides scheduler functionality using BullMQ's job schedulers.
 * Supports:
 * - "every" strategy: Fixed interval scheduling
 * - "cron" strategy: Cron expression scheduling
 * - Custom strategies: RRULE or custom logic
 */

import { Queue } from 'bullmq';
import type {
  Scheduler,
  SchedulerFactoryOptions,
  RepeatOptions,
  ScheduledJob,
  JobScheduler,
  SchedulerListOptions,
} from '@oxlayer/capabilities-scheduler';
import type { RedisClient } from '@oxlayer/capabilities-adapters-redis';

/**
 * Options for creating a BullMQ scheduler
 */
export interface BullMQSchedulerOptions extends SchedulerFactoryOptions {
  /**
   * Redis client for connection reuse
   * If not provided, connection config must be provided
   */
  redisClient?: RedisClient;
  /**
   * Redis connection config (used if redisClient not provided)
   */
  connection?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  /**
   * Custom repeat strategy function
   * Only one strategy can be defined per queue
   */
  repeatStrategy?: (
    millis: number,
    opts: RepeatOptions,
    name: string,
  ) => number | undefined;
  /**
   * BullMQ queue settings
   */
  settings?: {
    repeatStrategy?: (
      millis: number,
      opts: any,
      name: string,
    ) => number | undefined;
  };
}

/**
 * BullMQ Scheduler implementation
 *
 * Wraps BullMQ Queue to provide scheduler functionality.
 */
export class BullMQScheduler implements Scheduler {
  private queue: Queue;

  constructor(private options: BullMQSchedulerOptions) {
    const connection = options.redisClient
      ? { connection: options.redisClient.getRawClient() }
      : options.connection
        ? { connection: options.connection }
        : undefined;

    if (!connection) {
      throw new Error('Either redisClient or connection must be provided');
    }

    // Build settings with custom repeat strategy if provided
    const settings = options.settings || {};
    if (options.repeatStrategy) {
      settings.repeatStrategy = options.repeatStrategy as any;
    }

    this.queue = new Queue(
      options.queueName || 'scheduled-jobs',
      Object.assign(connection, { settings }) as any,
    );
  }

  /**
   * Schedule a job to repeat based on the provided options
   *
   * @param key - Unique identifier for the scheduler
   * @param repeat - Repeat options (every, cron, or custom)
   * @param job - Job definition
   */
  async schedule(key: string, repeat: RepeatOptions, job: ScheduledJob): Promise<void> {
    const bullmqRepeat = this.toBullMQRepeatOptions(repeat);

    await this.queue.upsertJobScheduler(
      key,
      bullmqRepeat,
      {
        name: job.name,
        data: job.data,
        opts: job.opts,
      } as any, // BullMQ types are slightly different
    );
  }

  /**
   * Update an existing scheduler or create if it doesn't exist
   *
   * @param key - Scheduler identifier
   * @param repeat - New repeat options
   * @param job - New job definition
   */
  async update(key: string, repeat: RepeatOptions, job: ScheduledJob): Promise<void> {
    await this.schedule(key, repeat, job);
  }

  /**
   * Remove a scheduler by its key
   *
   * @param key - Scheduler identifier
   * @returns true if scheduler was removed, false if not found
   */
  async remove(key: string): Promise<boolean> {
    return await this.queue.removeJobScheduler(key);
  }

  /**
   * Get a scheduler by its key
   *
   * @param key - Scheduler identifier
   * @returns Job scheduler or undefined if not found
   */
  async get(key: string): Promise<JobScheduler | undefined> {
    const scheduler = await this.queue.getJobScheduler(key);
    if (!scheduler) return undefined;

    // BullMQ returns JobSchedulerJson which has a different structure
    const s = scheduler as any;

    return {
      key: s.name,
      repeat: s.repeat as RepeatOptions,
      job: {
        name: s.name,
        data: s.data,
        opts: s.opts,
      },
      next: typeof s.next === 'number' ? s.next : s.next?.getTime(),
      created: typeof s.created === 'number' ? s.created : s.created?.getTime(),
    };
  }

  /**
   * List all schedulers
   *
   * @param options - List options (pagination, sorting)
   * @returns Array of job schedulers
   */
  async list(options?: SchedulerListOptions): Promise<JobScheduler[]> {
    const start = options?.start ?? 0;
    const end = options?.end ?? 99;
    const asc = options?.ascending ?? true;

    const schedulers = await this.queue.getJobSchedulers(start, end, asc);

    return schedulers.map((s: any) => ({
      key: s.name,
      repeat: s.repeat as RepeatOptions,
      job: {
        name: s.name,
        data: s.data,
        opts: s.opts,
      },
      next: s.next?.getTime(),
      created: s.created?.getTime(),
    }));
  }

  /**
   * Remove all schedulers
   *
   * @returns Number of schedulers removed
   */
  async removeAll(): Promise<number> {
    const schedulers = await this.list();
    let count = 0;

    for (const scheduler of schedulers) {
      const removed = await this.remove(scheduler.key);
      if (removed) count++;
    }

    return count;
  }

  /**
   * Close the underlying queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
  }

  /**
   * Get the underlying BullMQ queue
   */
  getQueue(): Queue {
    return this.queue;
  }

  /**
   * Convert scheduler repeat options to BullMQ format
   */
  private toBullMQRepeatOptions(options: RepeatOptions): any {
    const base: any = {};

    if ('every' in options) {
      base.every = options.every;
    } else if ('pattern' in options) {
      base.pattern = options.pattern;
    }

    if (options.startDate) base.startDate = options.startDate;
    if (options.endDate) base.endDate = options.endDate;
    if (options.limit) base.limit = options.limit;
    if (options.tz) base.tz = options.tz;

    return base;
  }
}

/**
 * Create a BullMQ scheduler
 *
 * @example
 * ```ts
 * // With Redis client (recommended)
 * const redisClient = createDefaultRedisClient();
 * const scheduler = createBullMQScheduler({ redisClient });
 *
 * // With connection config
 * const scheduler = createBullMQScheduler({
 *   connection: { host: 'localhost', port: 6379 },
 *   queueName: 'my-jobs',
 * });
 * ```
 */
export function createBullMQScheduler(options: BullMQSchedulerOptions): Scheduler {
  return new BullMQScheduler(options);
}

/**
 * Create a custom repeat strategy using RRULE
 *
 * @example
 * ```ts
 * import { rrulestr } from 'rrule';
 * import { createBullMQScheduler } from '@oxlayer/capabilities-adapters-bullmq-scheduler';
 *
 * const scheduler = createBullMQScheduler({
 *   repeatStrategy: (millis, opts) => {
 *     const currentDate = opts.startDate && new Date(opts.startDate) > new Date(millis)
 *       ? new Date(opts.startDate)
 *       : new Date(millis);
 *
 *     const rrule = rrulestr(opts.pattern);
 *     const next = rrule.after(currentDate, false);
 *     return next?.getTime();
 *   },
 * });
 * ```
 */
export function createRRuleStrategy(): (
  millis: number,
  opts: any,
  jobName: string,
) => number | undefined {
  return (millis: number, opts: any, _jobName: string) => {
    // This would require 'rrule' package to be installed
    // Implementation provided as reference for custom strategies
    const _currentDate =
      opts.startDate && new Date(opts.startDate) > new Date(millis)
        ? new Date(opts.startDate)
        : new Date(millis);

    // Import rrule dynamically to avoid hard dependency
    // const rrule = rrulestr(opts.pattern);
    // const next = rrule.after(currentDate, false);
    // return next?.getTime();

    throw new Error(
      'RRULE strategy requires "rrule" package. Install it with: bun add rrule',
    );
  };
}

// Re-export BullMQ types
export { Queue } from 'bullmq';
export type { JobsOptions } from 'bullmq';
