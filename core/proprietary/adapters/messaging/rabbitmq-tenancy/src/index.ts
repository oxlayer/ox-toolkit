/**
 * RabbitMQ Tenancy Adapter
 *
 * Multi-tenant RabbitMQ with shared/dedicated exchange isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareRabbitMQ } from '@oxlayer/pro-adapters-rabbitmq-tenancy';
 *
 * const tenantMQ = createTenancyAwareRabbitMQ({
 *   tenantResolver,
 *   connection: { url: 'amqp://localhost' },
 * });
 *
 * const mq = await tenantMQ.resolve('acme-corp');
 * await mq.publish('events.user.created', eventData);
 * ```
 */

export * from './tenancy-aware-rabbitmq.js';
