/**
 * SQS Tenancy Adapter
 *
 * Multi-tenant AWS SQS with shared/dedicated queue isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareSQS } from '@oxlayer/pro-adapters-sqs-tenancy';
 *
 * const tenantSQS = createTenancyAwareSQS({
 *   tenantResolver,
 *   region: 'us-east-1',
 * });
 *
 * const sqs = await tenantSQS.resolve('acme-corp');
 * await sqs.send('events', message);
 * ```
 */

export * from './tenancy-aware-sqs.js';
