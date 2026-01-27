import type { Context, Next } from 'hono';
import { BullMQClient } from './client.js';
import type { BullMQConfig } from './types.js';

export interface BullMQVariables {
  bullmq: BullMQClient;
}

declare module 'hono' {
  interface ContextVariableMap extends BullMQVariables { }
}

/**
 * BullMQ middleware factory for Hono
 *
 * @example
 * ```ts
 * import { bullmqMiddleware } from '@oxlayer/capabilities-adapters/bullmq';
 *
 * app.use('/api/*', bullmqMiddleware({
 *   connection: {
 *     host: process.env.REDIS_HOST || 'localhost',
 *     port: Number(process.env.REDIS_PORT) || 6379,
 *     password: process.env.REDIS_PASSWORD,
 *   },
 *   queues: {
 *     emails: {
 *       name: 'emails',
 *       queueOptions: { defaultJobOptions: { attempts: 3 } },
 *       workerOptions: {
 *         processor: async (job) => {
 *           // Process email job
 *         },
 *       },
 *     },
 *   },
 * }));
 *
 * // Use in handlers
 * app.post('/send-email', async (c) => {
 *   const bullmq = c.get('bullmq');
 *   await bullmq.addJob('emails', 'send', { to: 'user@example.com' });
 *   return c.json({ success: true });
 * });
 * ```
 */
export function bullmqMiddleware(config: BullMQConfig) {
  // Create singleton client
  const client = new BullMQClient(config);

  // Initialize on first use
  let initialized = false;

  return async (c: Context, next: Next) => {
    if (!initialized) {
      await client.initialize();
      initialized = true;
    }

    c.set('bullmq', client);
    await next();
  };
}
