/**
 * Scheduler Capability
 *
 * Job scheduling and periodic task execution support.
 *
 * This capability defines:
 * - Scheduler interfaces for scheduling jobs
 * - Repeat strategies (every, cron, custom)
 * - Job scheduler lifecycle management
 *
 * Example Usage:
 * ```ts
 * import { scheduler } from '@oxlayer/capabilities-scheduler';
 *
 * // Schedule a job to run every minute
 * await scheduler.schedule('cleanup', {
 *   every: 60_000,
 * }, {
 *   name: 'cleanup-task',
 *   data: { type: 'logs' },
 * });
 *
 * // Schedule with cron expression
 * await scheduler.schedule('reports', {
 *   pattern: '0 0 9 * * 1-5', // 9 AM weekdays
 * }, {
 *   name: 'daily-report',
 *   data: { format: 'pdf' },
 * });
 * ```
 */

// Core types
export * from './types.js';

// Scheduler interface
export * from './scheduler.js';

// Domain errors
export * from './errors.js';
