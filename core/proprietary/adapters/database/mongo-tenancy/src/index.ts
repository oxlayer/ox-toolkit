/**
 * MongoDB Tenancy Adapter
 *
 * Multi-tenant MongoDB adapter supporting:
 * - **Shared**: Single database with tenant_id field filtering (B2C)
 * - **Collection**: Separate collection per tenant (prefix-based)
 * - **Database**: Separate database per tenant (B2B)
 *
 * Works with ANY client database/collections - no external dependencies.
 * Automatically adds tenant_id to documents in shared mode.
 *
 * @example
 * ```ts
 * import { createTenancyAwareMongo } from '@oxlayer/pro-adapters-mongo-tenancy';
 *
 * const tenantMongo = createTenancyAwareMongo({
 *   tenantResolver,
 *   bitwardenClient,
 *   sharedClient: mongoClient,
 *   defaultDatabase: 'app',
 * });
 *
 * // Enable tenant_id on all collections (adds index if needed)
 * await tenantMongo.enableTenantIndexing();
 *
 * const mongo = await tenantMongo.resolve('acme-corp');
 * await mongo.collection('users').insertOne({ name: 'John' });
 * // Automatically adds { tenant_id: 'acme-corp', name: 'John' }
 * ```
 */

export * from './tenancy-aware-mongo.js';
