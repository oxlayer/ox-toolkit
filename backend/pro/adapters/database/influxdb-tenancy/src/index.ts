/**
 * InfluxDB Tenancy Adapter
 *
 * Multi-tenant InfluxDB with shared/dedicated bucket isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareInfluxDB } from '@oxlayer/pro-adapters-influxdb-tenancy';
 *
 * const tenantInfluxDB = createTenancyAwareInfluxDB({
 *   tenantResolver,
 *   influxdbClient: baseClient,
 * });
 *
 * const influxdb = await tenantInfluxDB.resolve('acme-corp');
 * const queryApi = influxdb.getQueryApi(org);
 * const result = await queryApi.query('from(bucket:"metrics") |> range(start: -1h)');
 * ```
 */

export * from './tenancy-aware-influxdb.js';
