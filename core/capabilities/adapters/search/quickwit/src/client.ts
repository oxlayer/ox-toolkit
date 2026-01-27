import type { QuickwitConfig, SearchQuery, SearchResponse } from './types.js';

/**
 * Quickwit search client wrapper
 *
 * Provides a simplified interface for searching with Quickwit.
 *
 * @example
 * ```ts
 * import { createQuickwitSearchClient } from '@oxlayer/capabilities-adapters-search-quickwit';
 *
 * const search = createQuickwitSearchClient({
 *   url: 'http://localhost:7280',
 *   indexId: 'products',
 * });
 *
 * const results = await search.search({
 *   query: 'laptop',
 *   maxHits: 10,
 * });
 * ```
 */
export class QuickwitSearchClient {
  private baseUrl: string;

  constructor(private config: QuickwitConfig) {
    const url = new URL(config.url);
    this.baseUrl = url.toString().replace(/\/$/, '');
  }

  /**
   * Search documents
   *
   * @param query - Search query
   * @returns Search response
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const endpoint = `/api/v1/${this.config.indexId}/search`;
    const url = new URL(endpoint, this.baseUrl);

    // Build query parameters
    const params = new URLSearchParams();

    if (query.query) params.append('query', query.query);
    if (query.maxHits) params.append('max_hits', query.maxHits.toString());
    if (query.startOffset) params.append('start_offset', query.startOffset.toString());
    if (query.sortField) params.append('sort_by_field', query.sortField);
    if (query.sortOrder) params.append('sort_order', query.sortOrder);
    if (query.fetchFields) params.append('fetch_fields', query.fetchFields.join(','));

    if (query.aggregationRequest) {
      params.append('aggregation_request', JSON.stringify(query.aggregationRequest));
    }

    if (query.snippetConfiguration) {
      const snippetConfig: Record<string, unknown> = {};

      if (query.snippetConfiguration.maxNumChars) {
        snippetConfig.max_num_chars = query.snippetConfiguration.maxNumChars;
      }

      if (query.snippetConfiguration.numSnippets) {
        snippetConfig.num_snippets = query.snippetConfiguration.numSnippets;
      }

      if (query.snippetConfiguration.fields) {
        snippetConfig.fields = query.snippetConfiguration.fields;
      }

      params.append('snippet_configuration', JSON.stringify(snippetConfig));
    }

    url.search = params.toString();

    const start = Date.now();

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as SearchResponse;

      const duration = Date.now() - start;
      console.log(`[QuickwitSearchClient] Search executed in ${duration}ms: ${query.query.substring(0, 50)}...`);

      return result;
    } catch (error) {
      console.error('[QuickwitSearchClient] Search error:', error);
      throw error;
    }
  }

  /**
   * Search with fuzzy matching
   *
   * @param queryString - Query string
   * @param options - Search options
   * @returns Search response
   */
  async fuzzySearch(
    queryString: string,
    options?: {
      maxHits?: number;
      fuzziness?: 'auto' | number;
      prefixLength?: number;
      fields?: string[];
    }
  ): Promise<SearchResponse> {
    const fuzziness = options?.fuzziness || 'auto';
    const prefixLength = options?.prefixLength || 1;

    // Build fuzzy query
    const terms = queryString.split(/\s+/);
    const fuzzyTerms = terms.map((term) => {
      if (term.length < prefixLength) {
        return term;
      }

      if (fuzziness === 'auto') {
        return `${term}~2`;
      }

      return `${term}~${fuzziness}`;
    });

    const fuzzyQuery = fuzzyTerms.join(' ');

    const query: SearchQuery = {
      query: options?.fields
        ? options.fields.map((field) => `${field}:(${fuzzyQuery})`).join(' OR ')
        : fuzzyQuery,
      maxHits: options?.maxHits,
    };

    return this.search(query);
  }

  /**
   * Get document by ID
   *
   * @param docId - Document ID
   * @returns Document or null
   */
  async getDocument(docId: string): Promise<Record<string, unknown> | null> {
    const endpoint = `/api/v1/${this.config.indexId}/docs/${encodeURIComponent(docId)}`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Quickwit get document failed: ${response.status} ${response.statusText}`);
      }

      return await response.json() as Record<string, unknown> | null;
    } catch (error) {
      console.error('[QuickwitSearchClient] Get document error:', error);
      throw error;
    }
  }

  /**
   * Get index info
   *
   * @returns Index info
   */
  async getIndexInfo(): Promise<{
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
        throw new Error(`Quickwit get index info failed: ${response.status} ${response.statusText}`);
      }

      return await response.json() as {
        indexId: string;
        createdAt: string;
        numDocs?: number;
        size?: number;
      };
    } catch (error) {
      console.error('[QuickwitSearchClient] Get index info error:', error);
      throw error;
    }
  }

  /**
   * List all indexes
   *
   * @returns List of index IDs
   */
  async listIndexes(): Promise<string[]> {
    const endpoint = '/api/v1/indexes';
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit list indexes failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as Array<{ indexId: string }>;
      return result.map((index: { indexId: string }) => index.indexId);
    } catch (error) {
      console.error('[QuickwitSearchClient] List indexes error:', error);
      throw error;
    }
  }

  /**
   * Delete index
   *
   * @param indexId - Index ID (default: configured index)
   */
  async deleteIndex(indexId?: string): Promise<void> {
    const endpoint = `/api/v1/indexes/${indexId || this.config.indexId}`;
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await this.fetchWithAuth(url.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quickwit delete index failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitSearchClient] Index ${indexId || this.config.indexId} deleted`);
    } catch (error) {
      console.error('[QuickwitSearchClient] Delete index error:', error);
      throw error;
    }
  }

  /**
   * Health check
   *
   * @returns True if Quickwit is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const endpoint = '/api/v1/health';
      const url = new URL(endpoint, this.baseUrl);

      const response = await this.fetchWithAuth(url.toString(), {
        method: 'GET',
      });

      return response.ok;
    } catch {
      return false;
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
 * Create a Quickwit search client
 *
 * @param config - Quickwit configuration
 * @returns QuickwitSearchClient instance
 *
 * @example
 * ```ts
 * import { createQuickwitSearchClient } from '@oxlayer/capabilities-adapters-search-quickwit';
 *
 * const search = createQuickwitSearchClient({
 *   url: 'http://localhost:7280',
 *   indexId: 'products',
 * });
 * ```
 */
export function createQuickwitSearchClient(config: QuickwitConfig): QuickwitSearchClient {
  return new QuickwitSearchClient(config);
}

/**
 * Create a default Quickwit search client from environment variables
 *
 * Environment variables:
 * - QUICKWIT_URL
 * - QUICKWIT_INDEX_ID
 * - QUICKWIT_API_KEY
 *
 * @param config - Optional config overrides
 * @returns QuickwitSearchClient instance
 */
export function createDefaultQuickwitSearchClient(config?: Partial<QuickwitConfig>): QuickwitSearchClient {
  return createQuickwitSearchClient({
    url: config?.url || process.env.QUICKWIT_URL || 'http://localhost:7280',
    indexId: config?.indexId || process.env.QUICKWIT_INDEX_ID || 'default',
    apiKey: config?.apiKey || process.env.QUICKWIT_API_KEY,
    timeout: config?.timeout,
  });
}
