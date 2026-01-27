import type { QuickwitConfig, SearchQuery, SearchResult } from './types.js';
import { QuickwitSearchClient } from './client.js';

/**
 * Quickwit searcher with advanced features
 *
 * Provides fuzzy search, reranking, and other advanced search capabilities.
 *
 * @example
 * ```ts
 * import { createQuickwitSearcher } from '@oxlayer/capabilities-adapters-search-quickwit';
 *
 * const searcher = createQuickwitSearcher({
 *   url: 'http://localhost:7280',
 *   indexId: 'products',
 * });
 *
 * // Fuzzy search with reranking
 * const results = await searcher.fuzzySearchWithRerank('laptop', {
 *   maxHits: 10,
 *   rerankField: 'title',
 * });
 * ```
 */
export class QuickwitSearcher {
  private client: QuickwitSearchClient;

  constructor(config: QuickwitConfig) {
    this.client = new QuickwitSearchClient(config);
  }

  /**
   * Fuzzy search with automatic reranking
   *
   * @param queryString - Query string
   * @param options - Search options
   * @returns Search results
   */
  async fuzzySearchWithRerank(
    queryString: string,
    options?: {
      maxHits?: number;
      fuzziness?: 'auto' | number;
      prefixLength?: number;
      fields?: string[];
      rerankField?: string;
      rerankTopK?: number;
    }
  ): Promise<SearchResult[]> {
    const initialResults = await this.client.fuzzySearch(queryString, {
      maxHits: options?.maxHits ? (options.maxHits * (options.rerankTopK || 3)) : 30,
      fuzziness: options?.fuzziness,
      prefixLength: options?.prefixLength,
      fields: options?.fields,
    });

    let results = initialResults.hits || [];

    // Rerank if a field is specified
    if (options?.rerankField && results.length > 0) {
      results = this.rerank(results, queryString, options.rerankField);
    }

    // Limit results
    const maxHits = options?.maxHits || 10;
    return results.slice(0, maxHits);
  }

  /**
   * Rerank results based on text similarity
   *
   * @param results - Initial search results
   * @param query - Query string
   * @param field - Field to rerank on
   * @returns Reranked results
   */
  private rerank(results: SearchResult[], query: string, field: string): SearchResult[] {
    const queryLower = query.toLowerCase();

    return results
      .map((result) => ({
        result,
        score: this.calculateSimilarity(queryLower, String(result[field] || '')),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.result);
  }

  /**
   * Calculate text similarity score
   *
   * @param query - Query string (lowercase)
   * @param text - Text to compare
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(query: string, text: string): number {
    const textLower = text.toLowerCase();

    // Exact match
    if (textLower === query) {
      return 1.0;
    }

    // Contains query
    if (textLower.includes(query)) {
      return 0.9;
    }

    // Word-based similarity
    const queryWords = query.split(/\s+/);
    const textWords = textLower.split(/\s+/);

    const matches = queryWords.filter((word) => textWords.includes(word)).length;
    const matchScore = matches / queryWords.length;

    // Character-based similarity (Levenshtein-like)
    const charScore = this.calculateCharSimilarity(query, textLower);

    // Combine scores
    return matchScore * 0.7 + charScore * 0.3;
  }

  /**
   * Calculate character-based similarity
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1)
   */
  private calculateCharSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 || len2 === 0) {
      return 0;
    }

    // Simple character overlap
    const set1 = new Set(str1);
    const set2 = new Set(str2);

    const intersection = [...set1].filter((c) => set2.has(c)).length;
    const union = new Set([...set1, ...set2]).size;

    return intersection / union;
  }

  /**
   * Multi-field search
   *
   * @param query - Query string
   * @param fields - Fields to search
   * @param options - Search options
   * @returns Search results
   */
  async multiFieldSearch(
    query: string,
    fields: string[],
    options?: {
      maxHits?: number;
      fieldWeights?: Record<string, number>;
    }
  ): Promise<SearchResult[]> {
    const weights = options?.fieldWeights || {};
    const defaultWeight = 1.0;

    // Build query with field boosts
    const weightedQuery = fields
      .map((field) => {
        const weight = weights[field] || defaultWeight;
        return `${field}:(${query})^${weight}`;
      })
      .join(' ');

    const searchQuery: SearchQuery = {
      query: weightedQuery,
      maxHits: options?.maxHits,
    };

    const response = await this.client.search(searchQuery);
    return response.hits || [];
  }

  /**
   * Phrase search (exact phrase matching)
   *
   * @param phrase - Phrase to search for
   * @param options - Search options
   * @returns Search results
   */
  async phraseSearch(
    phrase: string,
    options?: {
      maxHits?: number;
      fields?: string[];
      slop?: number;
    }
  ): Promise<SearchResult[]> {
    const slop = options?.slop || 0;

    // Build phrase query with proximity
    const phraseQuery = `"${phrase}"~${slop}`;

    const searchQuery: SearchQuery = {
      query: options?.fields
        ? options.fields.map((field) => `${field}:(${phraseQuery})`).join(' OR ')
        : phraseQuery,
      maxHits: options?.maxHits,
    };

    const response = await this.client.search(searchQuery);
    return response.hits || [];
  }

  /**
   * Autocomplete suggestions
   *
   * @param prefix - Query prefix
   * @param options - Search options
   * @returns Suggestions
   */
  async autocomplete(
    prefix: string,
    options?: {
      maxSuggestions?: number;
      field?: string;
    }
  ): Promise<Array<{ text: string; score?: number }>> {
    const field = options?.field || 'body';

    // Build prefix query
    const query = `${field}:${prefix}*`;

    const searchQuery: SearchQuery = {
      query,
      maxHits: options?.maxSuggestions || 10,
      fetchFields: [field],
    };

    const response = await this.client.search(searchQuery);

    return (response.hits || []).map((hit) => ({
      text: String(hit[field] || ''),
      score: hit.score,
    }));
  }

  /**
   * Get the underlying search client
   */
  getClient(): QuickwitSearchClient {
    return this.client;
  }
}

/**
 * Create a Quickwit searcher
 *
 * @param config - Quickwit configuration
 * @returns QuickwitSearcher instance
 *
 * @example
 * ```ts
 * import { createQuickwitSearcher } from '@oxlayer/capabilities-adapters-search-quickwit';
 *
 * const searcher = createQuickwitSearcher({
 *   url: 'http://localhost:7280',
 *   indexId: 'products',
 * });
 * ```
 */
export function createQuickwitSearcher(config: QuickwitConfig): QuickwitSearcher {
  return new QuickwitSearcher(config);
}

/**
 * Create a default Quickwit searcher from environment variables
 *
 * Environment variables:
 * - QUICKWIT_URL
 * - QUICKWIT_INDEX_ID
 * - QUICKWIT_API_KEY
 *
 * @param config - Optional config overrides
 * @returns QuickwitSearcher instance
 */
export function createDefaultQuickwitSearcher(config?: Partial<QuickwitConfig>): QuickwitSearcher {
  return createQuickwitSearcher({
    url: config?.url || process.env.QUICKWIT_URL || 'http://localhost:7280',
    indexId: config?.indexId || process.env.QUICKWIT_INDEX_ID || 'default',
    apiKey: config?.apiKey || process.env.QUICKWIT_API_KEY,
    timeout: config?.timeout,
  });
}
