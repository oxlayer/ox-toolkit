/**
 * Scheduler interface
 *
 * Provides methods for scheduling, managing, and listing job schedulers.
 */

import type {
  RepeatOptions,
  ScheduledJob,
  JobScheduler,
  SchedulerConfig,
  SchedulerListOptions,
} from './types.js';

/**
 * Scheduler interface
 *
 * Abstracts the underlying implementation (BullMQ, Agenda, etc.)
 * for scheduling jobs and managing periodic tasks.
 */
export interface Scheduler {
  /**
   * Schedule a job to repeat based on the provided options
   *
   * @param key - Unique identifier for the scheduler
   * @param repeat - Repeat options (every, cron, or custom)
   * @param job - Job definition
   * @example
   * ```ts
   * // Schedule every 10 seconds
   * await scheduler.schedule('cleanup', {
   *   every: 10_000,
   * }, {
   *   name: 'cleanup-task',
   *   data: { type: 'logs' },
   * });
   *
   * // Schedule with cron (9 AM weekdays)
   * await scheduler.schedule('reports', {
   *   pattern: '0 0 9 * * 1-5',
   * }, {
   *   name: 'daily-report',
   *   data: { format: 'pdf' },
   * });
   * ```
   */
  schedule(key: string, repeat: RepeatOptions, job: ScheduledJob): Promise<void>;

  /**
   * Update an existing scheduler or create if it doesn't exist
   *
   * @param key - Scheduler identifier
   * @param repeat - New repeat options
   * @param job - New job definition
   */
  update(key: string, repeat: RepeatOptions, job: ScheduledJob): Promise<void>;

  /**
   * Remove a scheduler by its key
   *
   * @param key - Scheduler identifier
   * @returns true if scheduler was removed, false if not found
   */
  remove(key: string): Promise<boolean>;

  /**
   * Get a scheduler by its key
   *
   * @param key - Scheduler identifier
   * @returns Job scheduler or undefined if not found
   */
  get(key: string): Promise<JobScheduler | undefined>;

  /**
   * List all schedulers
   *
   * @param options - List options (pagination, sorting)
   * @returns Array of job schedulers
   */
  list(options?: SchedulerListOptions): Promise<JobScheduler[]>;

  /**
   * Remove all schedulers
   *
   * @returns Number of schedulers removed
   */
  removeAll(): Promise<number>;
}

/**
 * Factory options for creating a scheduler
 */
export interface SchedulerFactoryOptions extends SchedulerConfig {
  /**
   * Implementation-specific options
   */
  implementation?: Record<string, unknown>;
}

/**
 * Scheduler factory function type
 */
export type SchedulerFactory = (
  options: SchedulerFactoryOptions,
) => Scheduler;
