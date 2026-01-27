/**
 * Redis Tenancy Adapter
 *
 * Multi-tenant Redis adapter supporting:
 * - **Shared**: Single Redis instance with tenant-prefixed keys (B2C)
 * - **Database**: Separate Redis database per tenant (B2B)
 * - **Dedicated**: Separate Redis instance per tenant (enterprise)
 *
 * Works with ANY client keyspace - automatic `{tenantId}:` prefixing.
 *
 * @example
 * ```ts
 * import { createTenancyAwareCache } from '@oxlayer/pro-adapters-redis-tenancy';
 *
 * const tenantCache = createTenancyAwareCache({
 *   tenantResolver,
 *   bitwardenClient,
 *   baseCache: redisCache,
 * });
 *
 * const cache = await tenantCache.resolve('acme-corp');
 * await cache.set('user:123', userData);
 * // Automatically stored as '{acme-corp}:user:123'
 * ```
 */

export * from "./tenancy-aware-cache.js";
