/**
 * Qdrant connection configuration
 */
export interface QdrantConfig {
  /**
   * Qdrant server URL
   */
  url: string;
  /**
   * API key for authentication
   */
  apiKey?: string;
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
  /**
   * Application name for connection tracking
   */
  appName?: string;
}

/**
 * Vector point
 */
export interface Point {
  /**
   * Point ID
   */
  id: string | number;
  /**
   * Vector embedding
   */
  vector: number[];
  /**
   * Point payload
   */
  payload?: Record<string, unknown>;
}

/**
 * Scored point (search result)
 */
export interface ScoredPoint {
  /**
   * Point ID
   */
  id: string | number;
  /**
   * Score (similarity)
   */
  score: number;
  /**
   * Vector embedding
   */
  vector?: number[];
  /**
   * Point payload
   */
  payload?: Record<string, unknown>;
}

/**
 * Search options
 */
export interface SearchOptions {
  /**
   * Limit number of results
   */
  limit?: number;
  /**
   * Score threshold
   */
  scoreThreshold?: number;
  /**
   * Payload to include
   */
  withPayload?: boolean | string[];
  /**
   * Include vector in results
   */
  withVector?: boolean;
  /**
   * Filter by payload
   */
  filter?: {
    must?: Array<{ key: string; match?: { value: unknown } }>;
    must_not?: Array<{ key: string; match?: { value: unknown } }>;
  };
}

/**
 * Collection configuration
 */
export interface CollectionConfig {
  /**
   * Vector size (dimensionality)
   */
  vectorSize: number;
  /**
   * Distance metric
   */
  distance: 'Cosine' | 'Euclid' | 'Dot';
  /**
   * Payload indexes
   */
  payloadIndexes?: Array<{
    fieldName: string;
    fieldType?: 'keyword' | 'integer' | 'float' | 'bool';
  }>;
  /**
   * Replication factor
   */
  replicationFactor?: number;
  /**
   * Shard number
   */
  shardNumber?: number;
  /**
   * Write consistency factor
   */
  writeConsistencyFactor?: number;
  /**
   * Optimizers config
   */
  optimizersConfig?: {
    indexingThreshold?: number;
  };
  /**
   * HNSW index parameters
   */
  hnswConfig?: {
    m?: number;
    ef_construct?: number;
  };
  /**
   * Quantization config
   */
  quantizationConfig?: {
    scalar?: {
      type: 'int8' | 'uint8';
    };
  };
}

/**
 * Collection info
 */
export interface CollectionInfo {
  /**
   * Collection name
   */
  name: string;
  /**
   * Vector configuration
   */
  vectorConfig: {
    size: number;
    distance: 'Cosine' | 'Euclid' | 'Dot';
  };
  /**
   * Points count
   */
  pointsCount: number;
  /**
   * Segments count
   */
  segmentsCount: number;
  /**
   * Status
   */
  status: 'green' | 'yellow' | 'red';
  /**
   * Optimizer status
   */
  optimizerStatus: 'ok' | 'optimizing' | 'failed';
}

/**
 * Batch insert options
 */
export interface BatchInsertOptions {
  /**
   * Wait for operation to complete
   */
  waitFor?: boolean;
  /**
   * Ordering type
   */
  ordering?: 'weak' | 'medium' | 'strong';
}
