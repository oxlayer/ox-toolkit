/**
 * Scheduler types and interfaces
 */

/**
 * Base repeat options for all strategies
 */
export interface BaseRepeatOptions {
  /**
   * Start date for the schedule
   */
  startDate?: Date;
  /**
   * End date for the schedule
   */
  endDate?: Date;
  /**
   * Limit the number of executions
   */
  limit?: number;
  /**
   * Timezone for cron expressions
   */
  tz?: string;
}

/**
 * "Every" strategy - repeat at fixed intervals
 */
export interface EveryRepeatOptions extends BaseRepeatOptions {
  /**
   * Interval in milliseconds
   */
  every: number;
}

/**
 * "Cron" strategy - repeat using cron expressions
 *
 * Cron format:
 * *    *    *    *    *    *
 * ┬    ┬    ┬    ┬    ┬    ┬
 * │    │    │    │    │    │
 * │    │    │    │    │    └ day of week (0 - 7, 1L - 7L, where 0 or 7 is Sunday)
 * │    │    │    │    └───── month (1 - 12)
 * │    │    │    └────────── day of month (1 - 31, L for the last day of the month)
 * │    │    └─────────────── hour (0 - 23)
 * │    └──────────────────── minute (0 - 59)
 * └───────────────────────── second (0 - 59, optional)
 */
export interface CronRepeatOptions extends BaseRepeatOptions {
  /**
   * Cron expression pattern
   */
  pattern: string;
}

/**
 * Custom repeat strategy
 *
 * Allows defining custom scheduling logic beyond "every" and "cron".
 * The strategy function receives the current timestamp, repeat options,
 * and job name, and should return the next execution timestamp.
 */
export interface CustomRepeatOptions extends BaseRepeatOptions {
  /**
   * Custom pattern (e.g., RRULE string)
   */
  pattern: string;
  /**
   * Strategy function to calculate next execution time
   */
  strategy: (millis: number, opts: RepeatOptions, jobName: string) => number | undefined;
}

/**
 * Union type for all repeat options
 */
export type RepeatOptions = EveryRepeatOptions | CronRepeatOptions | CustomRepeatOptions;

/**
 * Job definition for scheduled execution
 */
export interface ScheduledJob {
  /**
   * Job name (identifier)
   */
  name: string;
  /**
   * Job data payload
   */
  data?: unknown;
  /**
   * Additional job options
   */
  opts?: ScheduledJobOptions;
}

/**
 * Options for scheduled jobs
 */
export interface ScheduledJobOptions {
  /**
   * Job priority
   */
  priority?: number;
  /**
   * Unique job identifier
   */
  jobId?: string;
  /**
   * Maximum number of retries
   */
  attempts?: number;
  /**
   * Backoff strategy for retries
   */
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  /**
   * Delay before first execution
   */
  delay?: number;
  /**
   * Remove job after completion
   */
  removeOnComplete?: number;
  /**
   * Remove job after failure
   */
  removeOnFail?: number;
}

/**
 * Job scheduler metadata
 */
export interface JobScheduler {
  /**
   * Scheduler key/identifier
   */
  key: string;
  /**
   * Repeat options (schedule)
   */
  repeat: RepeatOptions;
  /**
   * Job definition
   */
  job: ScheduledJob;
  /**
   * Next execution timestamp
   */
  next?: number;
  /**
   * Creation date
   */
  created?: number;
}

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  /**
   * Queue name for scheduled jobs
   */
  queueName?: string;
}

/**
 * Scheduler list options
 */
export interface SchedulerListOptions {
  /**
   * Start offset
   */
  start?: number;
  /**
   * End offset
   */
  end?: number;
  /**
   * Sort by next execution time (ascending)
   */
  ascending?: boolean;
}
