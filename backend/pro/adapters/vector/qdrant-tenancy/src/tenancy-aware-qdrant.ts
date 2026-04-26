/**
 * Qdrant Tenancy Adapter
 *
 * Multi-tenant Qdrant vector search adapter supporting:
 * - Shared: Single collection with tenant_id payload filtering (B2C)
 * - Collection: Separate collection per tenant (B2B)
 *
 * @example
 * ```ts
 * import { createTenancyAwareQdrant } from '@oxlayer/pro-adapters-qdrant-tenancy';
 *
 * const tenantQdrant = createTenancyAwareQdrant({
 *   tenantResolver,
 *   defaultCollection: 'embeddings',
 * });
 *
 * const qdrant = await tenantQdrant.resolve('acme-corp');
 * await qdrant.upsert([point1, point2]);
 * const results = await qdrant.search(vector, { limit: 10 });
 * ```
 */

import type { TenantResolver } from '@oxlayer/pro-tenancy';

/**
 * Vector point interface
 */
export interface VectorPoint {
  id: string;
  vector: number[];
  payload?: Record<string, any>;
}

/**
 * Search results interface
 */
export interface SearchResult {
  id: string;
  score: number;
  payload?: Record<string, any>;
}

/**
 * Qdrant client interface (minimal)
 */
export interface QdrantClient {
  upsert(points: VectorPoint[]): Promise<void>;
  search(vector: number[], options?: SearchOptions): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: any;
}

/**
 * Tenancy-aware Qdrant configuration
 */
export interface TenancyAwareQdrantConfig {
  tenantResolver: TenantResolver;
  defaultCollection: string;
  endpoint: string;
  apiKey?: string;
}

/**
 * Tenancy-aware Qdrant resolver
 */
export class TenancyAwareQdrant {
  constructor(private config: TenancyAwareQdrantConfig) { }

  /**
   * Resolve Qdrant client for tenant
   */
  async resolve(tenantId: string): Promise<QdrantClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    switch (tenant.isolation.vector) {
      case 'shared':
        return new SharedQdrantClient({
          tenantId,
          collection: this.config.defaultCollection,
          endpoint: this.config.endpoint,
          apiKey: this.config.apiKey,
        });

      case 'dedicated':
        return new DedicatedQdrantClient({
          tenantId,
          collection: `${tenantId}_embeddings`,
          endpoint: this.config.endpoint,
          apiKey: this.config.apiKey,
        });

      default:
        throw new Error(`Unsupported vector isolation mode: ${tenant.isolation.vector}`);
    }
  }
}

/**
 * Shared Qdrant client with tenant filtering
 */
class SharedQdrantClient implements QdrantClient {
  constructor(
    private config: {
      tenantId: string;
      collection: string;
      endpoint: string;
      apiKey?: string;
    }
  ) { }

  async upsert(points: VectorPoint[]): Promise<void> {
    // Automatically add tenant_id to payload
    const _enrichedPoints = points.map(p => ({
      ...p,
      payload: {
        ...p.payload,
        tenant_id: this.config.tenantId,
      },
    }));
    // TODO: Upsert to Qdrant
  }

  async search(vector: number[], options?: SearchOptions): Promise<SearchResult[]> {
    // Add tenant_id filter to search
    const _filter = {
      must: [
        ...(options?.filter?.must || []),
        { key: 'tenant_id', match: { value: this.config.tenantId } },
      ],
    };
    // TODO: Search in Qdrant with filter
    return [];
  }

  async delete(_ids: string[]): Promise<void> {
    // TODO: Delete from Qdrant
  }
}

/**
 * Dedicated Qdrant client for tenant-specific collection
 */
class DedicatedQdrantClient implements QdrantClient {
  constructor(
    private config: {
      tenantId: string;
      collection: string;
      endpoint: string;
      apiKey?: string;
    }
  ) { }

  async upsert(_points: VectorPoint[]): Promise<void> {
    // TODO: Upsert to tenant's dedicated collection
    // No tenant_id injection needed - collection is isolated
  }

  async search(_vector: number[], _options?: SearchOptions): Promise<SearchResult[]> {
    // TODO: Search in tenant's dedicated collection
    return [];
  }

  async delete(_ids: string[]): Promise<void> {
    // TODO: Delete from tenant's dedicated collection
  }
}

/**
 * Create a tenancy-aware Qdrant resolver
 */
export function createTenancyAwareQdrant(
  config: TenancyAwareQdrantConfig
): TenancyAwareQdrant {
  return new TenancyAwareQdrant(config);
}
