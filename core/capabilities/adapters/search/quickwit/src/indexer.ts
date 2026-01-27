import type { QuickwitConfig, IndexConfig, SearchDocument } from './types.js';

/**
 * Quickwit indexer wrapper
 *
 * Provides methods for indexing documents in Quickwit.
 *
 * @example
 * ```ts
 * import { createQuickwitIndexer } from '@oxlayer/capabilities-adapters-search-quickwit';
 *
 * const indexer = createQuickwitIndexer({
 *   url: 'http://localhost:7280',
 *   indexId: 'products',
 * });
 *
 * // Create an index
 * await indexer.createIndex({
 *   docMapping: { fieldMappings: [...] },
 * });
 *
 * // Index a document
 * await indexer.index({
 *   id: '1',
 *   title: 'Product A',
 *   description: 'A great product',
 * });
 * ```
 */
export class QuickwitIndexer {
  private baseUrl: string;

  constructor(private config: QuickwitConfig) {
    const url = new URL(config.url);
    this.baseUrl = url.toString().replace(/\/$/, '');
  }

  /**
   * Create an index
   *
   * @param indexConfig - Index configuration
   */
  async createIndex(indexConfig: IndexConfig): Promise<void> {
    const endpoint = '/api/v1/indexes';
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...indexConfig,
          indexId: indexConfig.indexId || this.config.indexId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Quickwit create index failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitIndexer] Index ${indexConfig.indexId || this.config.indexId} created`);
    } catch (error) {
      console.error('[QuickwitIndexer] Create index error:', error);
      throw error;
    }
  }

  /**
   * Index a document
   *
   * @param docId - Document ID
   * @param document - Document data
   */
  async index(docId: string, document: Record<string, unknown>): Promise<void> {
    const endpoint = `/api/v1/${this.config.indexId}/ingest`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            docId,
            ...document,
          },
        ]),
      });

      if (!response.ok) {
        throw new Error(`Quickwit ingest failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitIndexer] Document ${docId} indexed`);
    } catch (error) {
      console.error('[QuickwitIndexer] Index error:', error);
      throw error;
    }
  }

  /**
   * Index multiple documents (bulk)
   *
   * @param documents - Array of documents with IDs
   */
  async bulkIndex(documents: Array<{ docId: string } & Record<string, unknown>>): Promise<void> {
    const endpoint = `/api/v1/${this.config.indexId}/ingest`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documents),
      });

      if (!response.ok) {
        throw new Error(`Quickwit bulk ingest failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitIndexer] Bulk indexed ${documents.length} documents`);
    } catch (error) {
      console.error('[QuickwitIndexer] Bulk index error:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   *
   * @param docId - Document ID
   */
  async delete(docId: string): Promise<void> {
    const endpoint = `/api/v1/${this.config.indexId}/docs/${encodeURIComponent(docId)}`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit delete document failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitIndexer] Document ${docId} deleted`);
    } catch (error) {
      console.error('[QuickwitIndexer] Delete error:', error);
      throw error;
    }
  }

  /**
   * Trigger index merge
   *
   * Forces Quickwit to merge the index segments.
   */
  async merge(): Promise<void> {
    const endpoint = `/api/v1/${this.config.indexId}/merge`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit merge failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitIndexer] Index ${this.config.indexId} merged`);
    } catch (error) {
      console.error('[QuickwitIndexer] Merge error:', error);
      throw error;
    }
  }

  /**
   * Trigger index garbage collection
   *
   * Removes deleted documents from the index.
   */
  async garbageCollect(): Promise<void> {
    const endpoint = `/api/v1/${this.config.indexId}/gc`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit GC failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitIndexer] Index ${this.config.indexId} garbage collected`);
    } catch (error) {
      console.error('[QuickwitIndexer] GC error:', error);
      throw error;
    }
  }

  /**
   * Get index metadata
   *
   * @returns Index metadata
   */
  async getMetadata(): Promise<{
    indexId: string;
    createdAt: string;
    numDocs?: number;
    size?: number;
  }> {
    const endpoint = `/api/v1/indexes/${this.config.indexId}`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit get metadata failed: ${response.status} ${response.statusText}`);
      }

      return await response.json() as {
        indexId: string;
        createdAt: string;
        numDocs?: number;
        size?: number;
      };
    } catch (error) {
      console.error('[QuickwitIndexer] Get metadata error:', error);
      throw error;
    }
  }

  /**
   * Fetch with authentication
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });
  }
}

/**
 * Create a Quickwit indexer
 *
 * @param config - Quickwit configuration
 * @returns QuickwitIndexer instance
 *
 * @example
 * ```ts
 * import { createQuickwitIndexer } from '@oxlayer/capabilities-adapters-search-quickwit';
 *
 * const indexer = createQuickwitIndexer({
 *   url: 'http://localhost:7280',
 *   indexId: 'products',
 * });
 * ```
 */
export function createQuickwitIndexer(config: QuickwitConfig): QuickwitIndexer {
  return new QuickwitIndexer(config);
}

/**
 * Create a default Quickwit indexer from environment variables
 *
 * Environment variables:
 * - QUICKWIT_URL
 * - QUICKWIT_INDEX_ID
 * - QUICKWIT_API_KEY
 *
 * @param config - Optional config overrides
 * @returns QuickwitIndexer instance
 */
export function createDefaultQuickwitIndexer(config?: Partial<QuickwitConfig>): QuickwitIndexer {
  return createQuickwitIndexer({
    url: config?.url || process.env.QUICKWIT_URL || 'http://localhost:7280',
    indexId: config?.indexId || process.env.QUICKWIT_INDEX_ID || 'default',
    apiKey: config?.apiKey || process.env.QUICKWIT_API_KEY,
    timeout: config?.timeout,
  });
}
