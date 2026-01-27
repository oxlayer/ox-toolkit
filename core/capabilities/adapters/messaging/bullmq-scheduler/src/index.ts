/**
 * BullMQ Scheduler Adapter
 *
 * Scheduler implementation using BullMQ job schedulers.
 *
 * @example
 * ```ts
 * import { createBullMQScheduler } from '@oxlayer/capabilities-adapters-bullmq-scheduler';
 * import { createDefaultRedisClient } from '@oxlayer/capabilities-adapters-redis';
 *
 * const redisClient = createDefaultRedisClient();
 * const scheduler = createBullMQScheduler({ redisClient });
 *
 * // Schedule a job every minute
 * await scheduler.schedule('cleanup', {
 *   every: 60_000,
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

export * from './bullmq-scheduler.js';
