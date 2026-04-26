import type { Filter, Sort, _UpdateFilter } from 'mongodb';

/**
 * MongoDB connection configuration
 */
export interface MongoConfig {
  /**
   * Connection URL
   */
  url: string;
  /**
   * Database name
   */
  database: string;
  /**
   * Connection options
   */
  options?: {
    /**
     * Maximum pool size
     */
    maxPoolSize?: number;
    /**
     * Minimum pool size
     */
    minPoolSize?: number;
    /**
     * Maximum idle time in milliseconds
     */
    maxIdleTimeMS?: number;
    /**
     * Connection timeout in milliseconds
     */
    connectTimeoutMS?: number;
    /**
     * Socket timeout in milliseconds
     */
    socketTimeoutMS?: number;
    /**
     * Server selection timeout in milliseconds
     */
    serverSelectionTimeoutMS?: number;
    /**
     * Heartbeat frequency in milliseconds
     */
    heartbeatFrequencyMS?: number;
    /**
     * Application name for connection tracking
     */
    appName?: string;
  };
}

/**
 * Find options
 */
export interface FindOptions<T = unknown> {
  /**
   * Query filter
   */
  filter?: Filter<T>;
  /**
   * Sort specification
   */
  sort?: Sort;
  /**
   * Number of documents to skip
   */
  skip?: number;
  /**
   * Maximum number of documents to return
   */
  limit?: number;
  /**
   * Projection
   */
  projection?: Record<string, number | boolean>;
}

/**
 * Update options
 */
export interface UpdateOptions {
  /**
   * Return the updated document
   */
  returnDocument?: 'before' | 'after';
  /**
   * Upsert document if not found
   */
  upsert?: boolean;
}

/**
 * Aggregate pipeline stage
 */
export type AggregatePipeline = Array<Record<string, unknown>>;

/**
 * Index specification
 */
export interface IndexSpec {
  /**
   * Index keys
   */
  keys: Record<string, number | string>;
  /**
   * Index options
   */
  options?: {
    unique?: boolean;
    sparse?: boolean;
    expireAfterSeconds?: number;
    name?: string;
  };
}

/**
 * Collection statistics
 */
export interface CollectionStats {
  /**
   * Collection name
   */
  name: string;
  /**
   * Number of documents
   */
  count: number;
  /**
   * Size in bytes
   */
  size: number;
  /**
   * Average object size
   */
  avgObjSize: number;
  /**
   * Index count
   */
  indexCount: number;
  /**
   * Total index size
   */
  indexSize: number;
}
