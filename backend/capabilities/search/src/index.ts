/**
 * Search capability - defines search semantics and interfaces
 *
 * This is the WHAT (capability): full-text search, fuzzy matching, ranking
 * Adapters like Quickwit, OpenSearch, Meilisearch, Typesense implement this.
 */

/**
 * Search query
 */
export interface SearchQuery {
  /**
   * Query string (depends on search engine syntax)
   */
  query: string;

  /**
   * Maximum number of results
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;

  /**
   * Fields to search
   */
  fields?: string[];

  /**
   * Filters to apply
   */
  filters?: Record<string, unknown>;

  /**
   * Sort specification
   */
  sort?: SortSpecification;

  /**
   * Facet aggregation
   */
  facets?: FacetRequest[];
}

/**
 * Sort specification
 */
export type SortSpecification =
  | {
      /**
       * Sort by field (ascending)
       */
      field: string;
      order: 'asc';
    }
  | {
      /**
       * Sort by field (descending)
       */
      field: string;
      order: 'desc';

      /**
       * Nested sort (for geo or nested objects)
       */
      mode?: 'avg' | 'sum' | 'max' | 'min';
    };

/**
 * Facet aggregation request
 */
export interface FacetRequest {
  /**
   * Field to facet on
   */
  field: string;

  /**
   * Maximum number of facet values
   */
  size?: number;

  /**
   * Facet sort (count, alpha, etc.)
   */
  sort?: 'count' | 'alpha' | 'term';
}

/**
 * Facet result
 */
export interface FacetResult {
  /**
   * Field name
   */
  field: string;

  /**
   * Facet values
   */
  values: Array<{
    /**
     * Facet value
     */
    value: string;

    /**
     * Count of documents with this value
     */
    count: number;
  }>;
}

/**
 * Search result
 */
export interface SearchResult<T = unknown> {
  /**
   * Document ID
   */
  id: string;

  /**
   * Relevance score
   */
  score?: number;

  /**
   * Highlighted snippets
   */
  highlights?: Record<string, string[]>;

  /**
   * Document data
   */
  document: T;
}

/**
 * Search response
 */
export interface SearchResponse<T = unknown> {
  /**
   * Search results
   */
  hits: SearchResult<T>[];

  /**
   * Total number of matching documents
   */
  totalHits: number;

  /**
   * Search duration in milliseconds
   */
  elapsed?: number;

  /**
   * Facet results
   */
  facets?: FacetResult[];

  /**
   * Pagination info
   */
  pagination?: {
    /**
     * Current offset
     */
    offset: number;

    /**
     * Page limit
     */
    limit: number;

    /**
     * Has more results?
     */
    hasMore: boolean;
  };
}

/**
 * Document to index
 */
export interface SearchDocument {
  /**
   * Document ID
   */
  id: string;

  /**
   * Document fields
   */
  fields: Record<string, unknown>;

  /**
   * Document timestamp for sorting/boosting
   */
  timestamp?: number;

  /**
   * Document boost (relevance multiplier)
   */
  boost?: number;
}

/**
 * Index configuration
 */
export interface IndexConfig {
  /**
   * Index name
   */
  name: string;

  /**
   * Field configurations
   */
  fields: FieldConfig[];

  /**
   * Default search fields
   */
  defaultSearchFields?: string[];

  /**
   * Default sort field
   */
  defaultSortField?: string;
}

/**
 * Field configuration
 */
export interface FieldConfig {
  /**
   * Field name
   */
  name: string;

  /**
   * Field type
   */
  type: 'text' | 'keyword' | 'number' | 'boolean' | 'date' | 'geo' | 'nested';

  /**
   * Whether field is indexed
   */
  indexed?: boolean;

  /**
   * Whether field is stored
   */
  stored?: boolean;

  /**
   * Whether field is sortable
   */
  sortable?: boolean;

  /**
   * Whether field is facetable
   */
  facetable?: boolean;

  /**
   * Boost factor for relevance
   */
  boost?: number;
}

/**
 * Search interface - the core capability contract
 *
 * Defines search semantics (WHAT), not implementation (HOW).
 * Adapters like Quickwit, OpenSearch, Meilisearch implement this.
 */
export interface Search {
  /**
   * Index a document
   *
   * @param document - Document to index
   */
  index(document: SearchDocument): Promise<void>;

  /**
   * Index multiple documents (bulk)
   *
   * @param documents - Documents to index
   */
  indexMany(documents: SearchDocument[]): Promise<void>;

  /**
   * Search for documents
   *
   * @param query - Search query
   * @returns Search response
   */
  search<T = unknown>(query: SearchQuery): Promise<SearchResponse<T>>;

  /**
   * Get a document by ID
   *
   * @param id - Document ID
   * @returns Document or null
   */
  get<T = unknown>(id: string): Promise<SearchDocument | null>;

  /**
   * Delete a document
   *
   * @param id - Document ID
   * @returns True if deleted
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete multiple documents
   *
   * @param ids - Document IDs
   * @returns Number of documents deleted
   */
  deleteMany(ids: string[]): Promise<number>;

  /**
   * Update a document
   *
   * @param document - Document with updated fields
   */
  update(document: Partial<SearchDocument> & { id: string }): Promise<void>;

  /**
   * Create or update an index
   *
   * @param config - Index configuration
   */
  createIndex(config: IndexConfig): Promise<void>;

  /**
   * Delete an index
   *
   * @param name - Index name
   */
  deleteIndex(name: string): Promise<void>;

  /**
   * Get index info
   *
   * @param name - Index name
   * @returns Index configuration
   */
  getIndex(name: string): Promise<IndexConfig>;

  /**
   * List all indexes
   *
   * @returns List of index names
   */
  listIndexes(): Promise<string[]>;
}

/**
 * Search store interface for adapter implementations
 *
 * Lower-level interface that adapters implement.
 */
export interface SearchStore {
  /**
   * Raw index operation
   */
  index(index: string, document: SearchDocument): Promise<void>;

  /**
   * Raw search operation
   */
  search<T>(index: string, query: SearchQuery): Promise<SearchResponse<T>>;

  /**
   * Raw get operation
   */
  get<T>(index: string, id: string): Promise<SearchDocument | null>;

  /**
   * Raw delete operation
   */
  delete(index: string, id: string): Promise<boolean>;

  /**
   * Raw delete many operation
   */
  deleteMany(index: string, ids: string[]): Promise<number>;
}
