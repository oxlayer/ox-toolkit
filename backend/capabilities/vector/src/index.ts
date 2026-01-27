/**
 * Vector capability for @oxlayer/capabilities
 *
 * Defines vector similarity search semantics and interfaces.
 * This is the WHAT (capability) for vector operations.
 *
 * Implementations (HOW):
 * - QdrantVectorStore: import from '@oxlayer/capabilities-adapters-qdrant'
 */

/**
 * Distance metrics for vector similarity
 */
export enum DistanceMetric {
  /** Cosine similarity (-1 to 1) */
  COSINE = 'Cosine',
  /** Euclidean distance */
  EUCLIDEAN = 'Euclid',
  /** Dot product */
  DOT = 'Dot',
}

/**
 * A single point in vector space
 */
export interface VectorPoint<T = Record<string, unknown>> {
  /** Unique identifier */
  id: string;
  /** Vector embedding */
  vector: number[];
  /** Optional payload/metadata */
  payload?: T;
}

/**
 * Search query for vector similarity
 */
export interface VectorSearchQuery {
  /** Query vector */
  vector: number[];
  /** Max results to return */
  limit?: number;
  /** Minimum score threshold */
  scoreThreshold?: number;
  /** Include payload in results */
  includePayload?: boolean;
  /** Include vector in results */
  includeVector?: boolean;
  /** Filter for payload metadata */
  filter?: VectorFilter;
}

/**
 * Filter for vector search
 */
export type VectorFilter = {
  must?: VectorFilterCondition[];
  should?: VectorFilterCondition[];
  must_not?: VectorFilterCondition[];
};

export type VectorFilterCondition = {
  key: string;
  match?: string | number | boolean;
  range?: { gte?: number; lte?: number; gt?: number; lt?: number };
  isNull?: boolean;
};

/**
 * A vector search result
 */
export interface VectorMatch<T = Record<string, unknown>> {
  /** Point identifier */
  id: string;
  /** Similarity score */
  score: number;
  /** Payload/metadata */
  payload?: T;
  /** Vector embedding (if requested) */
  vector?: number[];
}

/**
 * Vector collection configuration
 */
export interface VectorCollectionConfig {
  /** Vector dimension */
  size: number;
  /** Distance metric */
  distance: DistanceMetric;
}

/**
 * Vector store interface
 *
 * Defines operations for vector similarity search and storage.
 */
export interface VectorStore {
  /** Collection name */
  readonly name: string;

  /**
   * Upsert vectors (insert or update)
   */
  upsert(points: VectorPoint[]): Promise<void>;

  /**
   * Search for similar vectors
   */
  search(query: VectorSearchQuery): Promise<VectorMatch[]>;

  /**
   * Get a vector by ID
   */
  get(id: string): Promise<VectorPoint | null>;

  /**
   * Get multiple vectors by IDs
   */
  getMany(ids: string[]): Promise<VectorPoint[]>;

  /**
   * Delete vectors by IDs
   */
  delete(ids: string[]): Promise<number>;

  /**
   * Delete vectors by filter
   */
  deleteByFilter(filter: VectorSearchQuery['filter']): Promise<number>;

  /**
   * Count vectors
   */
  count(filter?: VectorSearchQuery['filter']): Promise<number>;

  /**
   * Get collection info
   */
  getInfo(): Promise<{
    name: string;
    dimension: number;
    distance: DistanceMetric;
    count: number;
    status: 'green' | 'yellow' | 'red';
  }>;

  /**
   * Create payload index for filtering
   */
  createIndex(fieldName: string, fieldType: 'keyword' | 'integer' | 'float' | 'bool'): Promise<void>;

  /**
   * Delete payload index
   */
  deleteIndex(fieldName: string): Promise<void>;

  /**
   * List payload indexes
   */
  listIndexes(): Promise<Array<{ fieldName: string; fieldType: string }>>;

  /**
   * Scroll through vectors (pagination)
   */
  scroll(options?: {
    limit?: number;
    offset?: string | number;
    filter?: VectorSearchQuery['filter'];
  }): Promise<{
    points: VectorPoint[];
    nextPage?: string;
  }>;

  /**
   * Clear all vectors
   */
  clear(): Promise<void>;
}
