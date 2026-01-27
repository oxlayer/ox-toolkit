/**
 * Qdrant Tenancy Adapter
 *
 * Multi-tenant Qdrant vector search with shared/dedicated collection isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareQdrant } from '@oxlayer/pro-adapters-qdrant-tenancy';
 *
 * const tenantQdrant = createTenancyAwareQdrant({
 *   tenantResolver,
 *   defaultCollection: 'embeddings',
 *   endpoint: 'http://localhost:6333',
 * });
 *
 * const qdrant = await tenantQdrant.resolve('acme-corp');
 * const results = await qdrant.search(embedding, { limit: 10 });
 * ```
 */

export * from './tenancy-aware-qdrant.js';
