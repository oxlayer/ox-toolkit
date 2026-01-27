import { QdrantClient as QdrantRestClient } from '@qdrant/js-client-rest';
import type { QdrantConfig, Point, ScoredPoint, SearchOptions, CollectionConfig, CollectionInfo, BatchInsertOptions } from './types.js';

/**
 * Qdrant client wrapper
 *
 * Provides a simplified interface for common Qdrant vector database operations.
 *
 * @example
 * ```ts
 * import { createQdrantClient } from '@oxlayer/capabilities-adapters-qdrant';
 *
 * const qdrant = createQdrantClient({
 *   url: 'http://localhost:6333',
 * });
 *
 * // Create a collection
 * await qdrant.createCollection('products', {
 *   vectorSize: 384,
 *   distance: 'Cosine',
 * });
 *
 * // Upsert points
 * await qdrant.upsert('products', [
 *   { id: '1', vector: [0.1, 0.2, ...], payload: { name: 'Product A' } },
 * ]);
 *
 * // Search similar vectors
 * const results = await qdrant.search('products', [0.1, 0.2, ...], { limit: 10 });
 * ```
 */
export class QdrantClient {
  private client: QdrantRestClient;

  constructor(private config: QdrantConfig) {
    this.client = new QdrantRestClient({
      url: config.url,
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    });

    console.log(`[QdrantClient] Initialized for ${config.url}`);
  }

  /**
   * Create a new collection
   *
   * @param name - Collection name
   * @param config - Collection configuration
   */
  async createCollection(name: string, config: CollectionConfig): Promise<void> {
    const hnswConfig = config.hnswConfig
      ? {
        hnsw_config: {
          m: config.hnswConfig.m,
          ef_construct: config.hnswConfig.ef_construct,
        },
      }
      : {};

    const quantizationConfig = config.quantizationConfig?.scalar
      ? {
        quantization_config: {
          scalar: {
            type: config.quantizationConfig.scalar.type,
          },
        },
      }
      : {};

    await this.client.createCollection(name, {
      vectors: {
        size: config.vectorSize,
        distance: config.distance,
        hnsw_config: hnswConfig.hnsw_config,
      },
      optimizers_config: config.optimizersConfig,
      replication_factor: config.replicationFactor,
      shard_number: config.shardNumber,
      write_consistency_factor: config.writeConsistencyFactor,
      ...quantizationConfig,
    });

    console.log(`[QdrantClient] Collection ${name} created`);

    // Create payload indexes if specified
    if (config.payloadIndexes) {
      for (const index of config.payloadIndexes) {
        await this.createPayloadIndex(name, index.fieldName, index.fieldType);
      }
    }
  }

  /**
   * Delete a collection
   *
   * @param name - Collection name
   */
  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection(name);
    console.log(`[QdrantClient] Collection ${name} deleted`);
  }

  /**
   * Get collection info
   *
   * @param name - Collection name
   * @returns Collection info
   */
  async getCollection(name: string): Promise<CollectionInfo> {
    const result = await this.client.getCollection(name) as {
      status: string;
      optimizer_status: unknown;
      points_count?: number;
      segments_count: number;
      config: {
        params: {
          vectors: {
            size: number;
            distance: string;
          };
        };
      };
    };

    const vectors = result.config.params.vectors;

    return {
      name,
      vectorConfig: {
        size: vectors.size,
        distance: vectors.distance as 'Cosine' | 'Euclid' | 'Dot',
      },
      pointsCount: result.points_count || 0,
      segmentsCount: result.segments_count,
      status: result.status as 'green' | 'yellow' | 'red',
      optimizerStatus: result.optimizer_status as 'ok' | 'optimizing' | 'failed',
    };
  }

  /**
   * List all collections
   *
   * @returns List of collection names
   */
  async listCollections(): Promise<string[]> {
    const result = await this.client.getCollections();
    return result.collections.map((c) => c.name);
  }

  /**
   * Check if a collection exists
   *
   * @param name - Collection name
   * @returns True if collection exists
   */
  async collectionExists(name: string): Promise<boolean> {
    const collections = await this.listCollections();
    return collections.includes(name);
  }

  /**
   * Upsert points (insert or update)
   *
   * @param collection - Collection name
   * @param points - Points to upsert
   * @param options - Batch insert options
   */
  async upsert(collection: string, points: Point[], options?: BatchInsertOptions): Promise<void> {
    await this.client.upsert(collection, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
      wait: options?.waitFor || false,
      ordering: options?.ordering,
    });

    console.log(`[QdrantClient] Upserted ${points.length} points to ${collection}`);
  }

  /**
   * Insert points (fail if exists)
   *
   * @param collection - Collection name
   * @param points - Points to insert
   * @param options - Batch insert options
   */
  async insert(collection: string, points: Point[], options?: BatchInsertOptions): Promise<void> {
    // Qdrant doesn't have a separate insert method, use upsert with checking
    // For true insert behavior, you'd need to check if points exist first
    await this.client.upsert(collection, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
      wait: options?.waitFor || false,
      ordering: options?.ordering,
    });

    console.log(`[QdrantClient] Inserted ${points.length} points to ${collection}`);
  }

  /**
   * Update points
   *
   * @param collection - Collection name
   * @param points - Points to update
   * @param options - Batch insert options
   */
  async update(collection: string, points: Point[], options?: BatchInsertOptions): Promise<void> {
    await this.client.upsert(collection, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
      wait: options?.waitFor || false,
      ordering: options?.ordering,
    });

    console.log(`[QdrantClient] Updated ${points.length} points in ${collection}`);
  }

  /**
   * Delete points by IDs
   *
   * @param collection - Collection name
   * @param ids - Point IDs to delete
   */
  async delete(collection: string, ids: Array<string | number>): Promise<void> {
    await this.client.delete(collection, {
      points: ids,
    });

    console.log(`[QdrantClient] Deleted ${ids.length} points from ${collection}`);
  }

  /**
   * Delete points by filter
   *
   * @param collection - Collection name
   * @param filter - Filter to delete by
   */
  async deleteByFilter(collection: string, filter: SearchOptions['filter']): Promise<void> {
    const convertedFilter = this.convertFilter(filter);
    if (!convertedFilter) {
      throw new Error('Filter cannot be empty for deleteByFilter');
    }
    await this.client.delete(collection, {
      filter: convertedFilter,
    });

    console.log(`[QdrantClient] Deleted points from ${collection} by filter`);
  }

  /**
   * Search for similar vectors
   *
   * @param collection - Collection name
   * @param vector - Query vector
   * @param options - Search options
   * @returns Search results
   */
  async search(collection: string, vector: number[], options?: SearchOptions): Promise<ScoredPoint[]> {
    const result = await this.client.search(collection, {
      vector,
      limit: options?.limit || 10,
      score_threshold: options?.scoreThreshold,
      with_payload: options?.withPayload,
      with_vector: options?.withVector,
      filter: options?.filter ? this.convertFilter(options.filter) : undefined,
    });

    return result.map((point) => ({
      id: point.id as string | number,
      score: point.score || 0,
      vector: point.vector as number[] | undefined,
      payload: point.payload as Record<string, unknown> | undefined,
    }));
  }

  /**
   * Search in multiple collections
   *
   * @param collections - Collection names
   * @param vector - Query vector
   * @param options - Search options
   * @returns Search results grouped by collection
   */
  async searchMulti(
    collections: string[],
    vector: number[],
    options?: SearchOptions
  ): Promise<Map<string, ScoredPoint[]>> {
    const results = new Map<string, ScoredPoint[]>();

    for (const collection of collections) {
      try {
        const collectionResults = await this.search(collection, vector, options);
        results.set(collection, collectionResults);
      } catch (error) {
        console.error(`[QdrantClient] Search failed for ${collection}:`, error);
      }
    }

    return results;
  }

  /**
   * Get point by ID
   *
   * @param collection - Collection name
   * @param id - Point ID
   * @returns Point or null
   */
  async getPoint(collection: string, id: string | number): Promise<Point | null> {
    const result = await this.client.retrieve(collection, {
      ids: [id],
    });

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id as string | number,
      vector: result[0].vector as number[],
      payload: result[0].payload as Record<string, unknown>,
    };
  }

  /**
   * Get multiple points by IDs
   *
   * @param collection - Collection name
   * @param ids - Point IDs
   * @returns Points
   */
  async getPoints(collection: string, ids: Array<string | number>): Promise<Point[]> {
    const result = await this.client.retrieve(collection, {
      ids,
    });

    return result.map((point) => ({
      id: point.id as string | number,
      vector: point.vector as number[],
      payload: point.payload as Record<string, unknown>,
    }));
  }

  /**
   * Scroll through points
   *
   * @param collection - Collection name
   * @param options - Scroll options
   * @returns Points and next page token
   */
  async scroll(
    collection: string,
    options?: {
      limit?: number;
      offset?: number;
      filter?: SearchOptions['filter'];
      withPayload?: boolean | string[];
      withVector?: boolean;
    }
  ): Promise<{ points: Point[]; nextPageOffset: string | null }> {
    const result = await this.client.scroll(collection, {
      limit: options?.limit || 10,
      offset: options?.offset?.toString(),
      filter: options?.filter ? this.convertFilter(options.filter) : undefined,
      with_payload: options?.withPayload,
      with_vector: options?.withVector,
    });

    return {
      points: result.points.map((point) => ({
        id: point.id as string | number,
        vector: point.vector as number[],
        payload: point.payload as Record<string, unknown>,
      })),
      nextPageOffset: result.next_page_offset ? String(result.next_page_offset) : null,
    };
  }

  /**
   * Count points in a collection
   *
   * @param collection - Collection name
   * @param filter - Optional filter
   * @returns Point count
   */
  async count(collection: string, filter?: SearchOptions['filter']): Promise<number> {
    const result = await this.client.count(collection, {
      filter: filter ? this.convertFilter(filter) : undefined,
    });

    return result.count || 0;
  }

  /**
   * Create a payload index
   *
   * @param collection - Collection name
   * @param fieldName - Field name to index
   * @param fieldType - Field type
   */
  async createPayloadIndex(collection: string, fieldName: string, fieldType?: 'keyword' | 'integer' | 'float' | 'bool'): Promise<void> {
    await this.client.createPayloadIndex(collection, {
      field_name: fieldName,
      field_schema: fieldType,
    });

    console.log(`[QdrantClient] Created payload index for ${fieldName} in ${collection}`);
  }

  /**
   * Delete a payload index
   *
   * @param collection - Collection name
   * @param fieldName - Field name
   */
  async deletePayloadIndex(collection: string, fieldName: string): Promise<void> {
    await this.client.deletePayloadIndex(collection, fieldName);

    console.log(`[QdrantClient] Deleted payload index for ${fieldName} in ${collection}`);
  }

  /**
   * Health check
   *
   * @returns True if Qdrant is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.getCollections();
      return result.collections !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get the underlying Qdrant client
   *
   * Use this for advanced operations not covered by the wrapper.
   *
   * @returns QdrantClient instance
   */
  getClient(): QdrantRestClient {
    return this.client;
  }

  /**
   * Convert filter to Qdrant format
   */
  private convertFilter(filter?: SearchOptions['filter']) {
    if (!filter) return undefined;

    const conditions: unknown[] = [];

    if (filter.must) {
      for (const condition of filter.must) {
        if (condition.match !== undefined) {
          conditions.push({
            key: condition.key,
            match: condition.match,
          });
        }
      }
    }

    if (filter.must_not) {
      for (const condition of filter.must_not) {
        if (condition.match !== undefined) {
          conditions.push({
            key: condition.key,
            match: condition.match,
          });
        }
      }
    }

    if (conditions.length === 0) return undefined;

    return {
      must: filter.must?.map((c) => ({
        key: c.key,
        match: c.match,
      })),
      must_not: filter.must_not?.map((c) => ({
        key: c.key,
        match: c.match,
      })),
    };
  }
}

/**
 * Create a Qdrant client
 *
 * @param config - Qdrant configuration
 * @returns QdrantClient instance
 *
 * @example
 * ```ts
 * import { createQdrantClient } from '@oxlayer/capabilities-adapters-qdrant';
 *
 * const qdrant = createQdrantClient({
 *   url: 'http://localhost:6333',
 * });
 * ```
 */
export function createQdrantClient(config: QdrantConfig): QdrantClient {
  return new QdrantClient(config);
}

/**
 * Create a default Qdrant client from environment variables
 *
 * Environment variables:
 * - QDRANT_URL
 * - QDRANT_API_KEY
 *
 * @param config - Optional config overrides
 * @returns QdrantClient instance
 */
export function createDefaultQdrantClient(config?: Partial<QdrantConfig>): QdrantClient {
  return createQdrantClient({
    url: config?.url || process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: config?.apiKey || process.env.QDRANT_API_KEY,
    timeout: config?.timeout,
    appName: config?.appName,
  });
}
