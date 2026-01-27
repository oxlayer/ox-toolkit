/**
 * ClickHouse Tenancy Adapter
 *
 * Multi-tenant ClickHouse analytics with shared/dedicated database isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareClickHouse } from '@oxlayer/pro-adapters-clickhouse-tenancy';
 *
 * const tenantCH = createTenancyAwareClickHouse({
 *   tenantResolver,
 *   bitwardenClient,
 *   defaultConfig: { host, port, username },
 *   pool,
 * });
 *
 * const ch = await tenantCH.resolve('acme-corp');
 * const result = await ch.query('SELECT * FROM events');
 * ```
 */

export * from './tenancy-aware-clickhouse.js';
