import type { Context, Next } from 'hono';
import { RabbitMQClient } from './client.js';
import type { RabbitMQMiddlewareOptions } from './types.js';

export interface RabbitMQVariables {
  rabbitmq: RabbitMQClient;
}

declare module 'hono' {
  interface ContextVariableMap extends RabbitMQVariables { }
}

/**
 * RabbitMQ middleware factory for Hono
 *
 * Creates a singleton RabbitMQ client and attaches it to the Hono context.
 *
 * @example
 * ```ts
 * import { rabbitmqMiddleware } from '@oxlayer/capabilities-rabbitmq';
 *
 * app.use('/api/*', rabbitmqMiddleware({
 *   connection: {
 *     hostname: process.env.RABBITMQ_HOST || 'localhost',
 *     port: Number(process.env.RABBITMQ_PORT) || 5672,
 *     username: process.env.RABBITMQ_USER || 'guest',
 *     password: process.env.RABBITMQ_PASS || 'guest',
 *     vhost: process.env.RABBITMQ_VHOST || '/',
 *   },
 *   exchanges: {
 *     events: {
 *       name: 'events',
 *       type: 'topic',
 *       options: { durable: true },
 *     },
 *   },
 *   queues: {
 *     userEvents: {
 *       name: 'user.events',
 *       routingKey: 'user.*',
 *     },
 *   },
 * }));
 *
 * // Use in handlers
 * app.post('/users', async (c) => {
 *   const rabbitmq = c.get('rabbitmq');
 *   await rabbitmq.publish('user.created', { userId: '123' });
 *   return c.json({ success: true });
 * });
 * ```
 */
export function rabbitmqMiddleware(options: RabbitMQMiddlewareOptions) {
  // Create singleton client
  const client = new RabbitMQClient(
    options.connection,
    options.exchanges,
    options.queues
  );

  // Initialize connection
  client.connect().catch((err) => {
    console.error('Failed to connect to RabbitMQ:', err);
  });

  return async (c: Context, next: Next) => {
    c.set('rabbitmq', client);
    await next();
  };
}
