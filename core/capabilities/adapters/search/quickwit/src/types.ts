/**
 * Quickwit search configuration
 */
export interface QuickwitConfig {
  /**
   * Quickwit server URL
   */
  url: string;
  /**
   * Index ID
   */
  indexId: string;
  /**
   * API key for authentication (optional)
   */
  apiKey?: string;
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Search document
 */
export interface SearchDocument {
  /**
   * Document ID
   */
  id: string;
  /**
   * Document body/text
   */
  body?: string;
  /**
   * Document timestamp
   */
  timestamp?: string | number;
  /**
   * Additional custom fields
   */
  [key: string]: unknown;
}

/**
 * Search query
 */
export interface SearchQuery {
  /**
   * Query string (Quickwit query syntax)
   */
  query: string;
  /**
   * Maximum number of results
   */
  maxHits?: number;
  /**
   * Start offset for pagination
   */
  startOffset?: number;
  /**
   * Sort by field
   */
  sortField?: string;
  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
  /**
   * Fields to retrieve
   */
  fetchFields?: string[];
  /**
   * Aggregation request
   */
  aggregationRequest?: AggregationRequest;
  /**
   * Search context (snippet extraction)
   */
  snippetConfiguration?: {
    /**
     * Max number of characters per snippet
     */
    maxNumChars?: number;
    /**
     * Number of snippets
     */
    numSnippets?: number;
    /**
     * Fields to extract snippets from
     */
    fields?: string[];
  };
}

/**
 * Aggregation request
 */
export interface AggregationRequest {
  /**
   * Aggregation name
   */
  [key: string]: {
    /**
     * Aggregation type (terms, range, etc.)
     */
    terms?: {
      /**
       * Field to aggregate
       */
      field: string;
      /**
       * Maximum number of buckets
       */
      size?: number;
    };
    /**
     * Range aggregation
     */
    range?: {
      /**
       * Field to aggregate
       */
      field: string;
      /**
       * Ranges
       */
      ranges: Array<{ from?: number; to?: number; name: string }>;
    };
  };
}

/**
 * Search result
 */
export interface SearchResult {
  /**
   * Document ID
   */
  id: string;
  /**
   * Document score
   */
  score?: number;
  /**
   * Sort value
   */
  sortValue?: number[] | string[];
  /**
   * Document snippet (highlighted)
   */
  snippet?: {
    [key: string]: string;
  };
  /**
   * Document fields
   */
  [key: string]: unknown;
}

/**
 * Search response
 */
export interface SearchResponse {
  /**
   * Number of matched documents
   */
  numHits: number;
  /**
   * Search results
   */
  hits: SearchResult[];
  /**
   * Aggregation results
   */
  aggregations?: {
    [key: string]: {
      buckets?: Array<{ key: string; docFrequency: number }>;
    };
  };
  /**
   * Elapsed time in milliseconds
   */
  elapsedTimeMicros: number;
}

/**
 * Index configuration
 */
export interface IndexConfig {
  /**
   * Index ID
   */
  indexId: string;
  /**
   * Indexing mode
   */
  mode: 'create' | 'overwrite';
  /**
   * Document mapping
   */
  docMapping: {
    /**
     * Field mappings
     */
    fieldMappings?: Array<{
      name: string;
      type: 'text' | 'integer' | 'float' | 'bool' | 'datetime' | 'ip';
      stored: boolean;
      indexed: boolean;
      fast: boolean;
      tokenizer?: 'default' | 'raw' | 'whitespace' | 'lowercase';
      record: 'basic' | 'frequency' | 'position';
      normalize: boolean;
    }>;
    /**
     * Timestamp field
     */
    timestampField?: string;
    /**
     * Tag fields (for fast filtering)
     */
    tagFields?: string[];
  };
  /**
   * Search settings
   */
  searchSettings?: {
    /**
     * Default search fields
     */
    defaultSearchFields?: string[];
  };
  /**
   * Retention
   */
  retention?: {
    /**
     * Retention period in seconds
     */
    periodSec?: number;
  };
}
