/**
 * Quickwit Tenancy Adapter
 *
 * Multi-tenant Quickwit search adapter supporting:
 * - Shared: Single index with tenant_id field filtering (B2C)
 * - Index: Separate index per tenant (B2B)
 *
 * @example
 * ```ts
 * import { createTenancyAwareQuickwit } from '@oxlayer/pro-adapters-quickwit-tenancy';
 *
 * const tenantQuickwit = createTenancyAwareQuickwit({
 *   tenantResolver,
 *   endpoint: 'http://localhost:7280',
 * });
 *
 * const qw = await tenantQuickwit.resolve('acme-corp');
 * await qw.search('logs', 'error', { timeRange: '1h' });
 * ```
 */

import type { TenantResolver } from '@oxlayer/pro-tenancy';

/**
 * Search client interface
 */
export interface SearchClient {
  search(index: string, query: string, options?: SearchOptions): Promise<SearchResult>;
  index(index: string, documents: Document[]): Promise<void>;
}

export interface SearchOptions {
  timeRange?: string;
  limit?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface SearchResult {
  hits: Document[];
  totalHits: number;
  latency: number;
}

export interface Document {
  id: string;
  body: any;
  timestamp?: Date;
  tags?: Record<string, string>;
}

/**
 * Tenancy-aware Quickwit configuration
 */
export interface TenancyAwareQuickwitConfig {
  tenantResolver: TenantResolver;
  endpoint: string;
  defaultIndex: string;
}

/**
 * Tenancy-aware Quickwit resolver
 */
export class TenancyAwareQuickwit {
  constructor(private config: TenancyAwareQuickwitConfig) { }

  async resolve(tenantId: string): Promise<SearchClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    switch (tenant.isolation.search) {
      case 'shared':
        return new SharedQuickwitClient({
          tenantId,
          endpoint: this.config.endpoint,
          index: this.config.defaultIndex,
        });

      case 'dedicated':
        return new DedicatedQuickwitClient({
          tenantId,
          endpoint: this.config.endpoint,
          index: `${tenantId}_logs`,
        });

      default:
        throw new Error(`Unsupported search isolation mode: ${tenant.isolation.search}`);
    }
  }
}

/**
 * Shared Quickwit client with tenant filtering
 */
class SharedQuickwitClient implements SearchClient {
  constructor(
    private config: {
      tenantId: string;
      endpoint: string;
      index: string;
    }
  ) { }

  async search(index: string, query: string, options?: SearchOptions): Promise<SearchResult> {
    // Add tenant_id filter to query
    const tenantQuery = query.includes('tenant_id')
      ? query
      : `${query} AND tenant_id:${this.config.tenantId}`;

    // TODO: Search Quickwit index with tenant filter
    console.log(`[Quickwit-${this.config.tenantId}] Searching: ${tenantQuery}`);
    return { hits: [], totalHits: 0, latency: 0 };
  }

  async index(index: string, documents: Document[]): Promise<void> {
    // Automatically add tenant_id to documents
    const enrichedDocs = documents.map(doc => ({
      ...doc,
      tags: {
        ...doc.tags,
        tenant_id: this.config.tenantId,
      },
    }));
    // TODO: Index documents in Quickwit
  }
}

/**
 * Dedicated Quickwit client for tenant-specific index
 */
class DedicatedQuickwitClient implements SearchClient {
  constructor(
    private config: {
      tenantId: string;
      endpoint: string;
      index: string;
    }
  ) { }

  async search(index: string, query: string, options?: SearchOptions): Promise<SearchResult> {
    // TODO: Search in tenant's dedicated index
    console.log(`[Quickwit-${this.config.tenantId}] Searching ${this.config.index}: ${query}`);
    return { hits: [], totalHits: 0, latency: 0 };
  }

  async index(index: string, documents: Document[]): Promise<void> {
    // TODO: Index in tenant's dedicated index
    // No tenant_id injection needed - index is isolated
  }
}

export function createTenancyAwareQuickwit(
  config: TenancyAwareQuickwitConfig
): TenancyAwareQuickwit {
  return new TenancyAwareQuickwit(config);
}
