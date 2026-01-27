import type { VectorStore, VectorCollectionConfig } from '@oxlayer/capabilities-vector';
import type { QdrantClient } from './client.js';
import type { QdrantConfig } from './types.js';

/**
 * Qdrant vector store implementation
 *
 * Implements VectorStore interface using Qdrant.
 * This is the HOW (implementation) for the vector WHAT (capability).
 *
 * @example
 * ```ts
 * import { QdrantVectorStore } from '@oxlayer/capabilities-adapters-qdrant';
 * import { createQdrantClient } from '@oxlayer/capabilities-adapters-qdrant';
 *
 * const qdrant = createQdrantClient({ url: 'http://localhost:6333' });
 * const vectorStore = new QdrantVectorStore('products', qdrant);
 *
 * await vectorStore.upsert([
 *   { id: '1', vector: embedding, payload: { name: 'Product A' } }
 * ]);
 *
 * const results = await vectorStore.search({
 *   vector: queryEmbedding,
 *   limit: 10,
 * });
 * ```
 */
export class QdrantVectorStore implements VectorStore {
  constructor(
    public readonly name: string,
    private qdrant: QdrantClient
  ) { }

  /**
   * Upsert vectors (insert or update)
   */
  async upsert(points: import('@oxlayer/capabilities-vector').VectorPoint[]): Promise<void> {
    const qdrantPoints = points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    }));
    await this.qdrant.upsert(this.name, qdrantPoints);
  }

  /**
   * Search for similar vectors
   */
  async search(query: import('@oxlayer/capabilities-vector').VectorSearchQuery): Promise<import('@oxlayer/capabilities-vector').VectorMatch[]> {
    // Convert filter format
    const convertedFilter = query.filter ? this.convertFilter(query.filter) : undefined;

    const results = await this.qdrant.search(this.name, query.vector, {
      limit: query.limit,
      scoreThreshold: query.scoreThreshold,
      withPayload: query.includePayload ? true : undefined,
      withVector: query.includeVector,
      filter: convertedFilter,
    });

    return results.map((point) => ({
      id: String(point.id),
      score: point.score,
      payload: point.payload,
      vector: point.vector,
    }));
  }

  /**
   * Get a vector by ID
   */
  async get(id: string): Promise<import('@oxlayer/capabilities-vector').VectorPoint | null> {
    const point = await this.qdrant.getPoint(this.name, id);
    if (!point) return null;

    return {
      id: String(point.id),
      vector: point.vector,
      payload: point.payload,
    };
  }

  /**
   * Get multiple vectors by IDs
   */
  async getMany(ids: string[]): Promise<import('@oxlayer/capabilities-vector').VectorPoint[]> {
    const points = await this.qdrant.getPoints(this.name, ids);
    return points.filter((p) => p !== null).map((point) => ({
      id: String(point.id),
      vector: point.vector,
      payload: point.payload || {},
    }));
  }

  /**
   * Delete vectors
   */
  async delete(ids: string[]): Promise<number> {
    await this.qdrant.delete(this.name, ids);
    return ids.length;
  }

  /**
   * Delete by filter
   */
  async deleteByFilter(filter: import('@oxlayer/capabilities-vector').VectorSearchQuery['filter']): Promise<number> {
    const convertedFilter = filter ? this.convertFilter(filter) : undefined;
    if (!convertedFilter) {
      throw new Error('Filter is required for deleteByFilter');
    }
    await this.qdrant.deleteByFilter(this.name, convertedFilter);
    // Qdrant doesn't return count, so we estimate
    return 1;
  }

  /**
   * Count vectors
   */
  async count(filter?: import('@oxlayer/capabilities-vector').VectorSearchQuery['filter']): Promise<number> {
    const convertedFilter = filter ? this.convertFilter(filter) : undefined;
    return this.qdrant.count(this.name, convertedFilter);
  }

  /**
   * Get collection info
   */
  async getInfo(): Promise<{
    name: string;
    dimension: number;
    distance: import('@oxlayer/capabilities-vector').DistanceMetric;
    count: number;
    status: 'green' | 'yellow' | 'red';
  }> {
    const info = await this.qdrant.getCollection(this.name);

    return {
      name: this.name,
      dimension: info.vectorConfig.size,
      distance: this.convertDistanceMetric(info.vectorConfig.distance),
      count: info.pointsCount,
      status: info.status,
    };
  }

  /**
   * Create payload index for filtering
   */
  async createIndex(fieldName: string, fieldType: 'keyword' | 'integer' | 'float' | 'bool'): Promise<void> {
    await this.qdrant.createPayloadIndex(this.name, fieldName, fieldType);
  }

  /**
   * Delete payload index
   */
  async deleteIndex(fieldName: string): Promise<void> {
    await this.qdrant.deletePayloadIndex(this.name, fieldName);
  }

  /**
   * List payload indexes
   */
  async listIndexes(): Promise<Array<{ fieldName: string; fieldType: string }>> {
    // Qdrant client doesn't have a listIndexes method, so we return empty array
    // In production, you would need to track indexes separately
    return [];
  }

  /**
   * Scroll through vectors
   */
  async scroll(options?: {
    limit?: number;
    offset?: string | number;
    filter?: import('@oxlayer/capabilities-vector').VectorSearchQuery['filter'];
  }): Promise<{
    points: import('@oxlayer/capabilities-vector').VectorPoint[];
    nextPage?: string;
  }> {
    const convertedFilter = options?.filter ? this.convertFilter(options.filter) : undefined;

    // Convert string offset to number for qdrant client, or keep number as is
    const offsetValue = typeof options?.offset === 'string' ? Number(options.offset) : options?.offset;

    const result = await this.qdrant.scroll(this.name, {
      limit: options?.limit || 10,
      offset: offsetValue,
      filter: convertedFilter,
    });

    return {
      points: result.points.map((p) => ({
        id: String(p.id),
        vector: p.vector,
        payload: p.payload || {},
      })),
      nextPage: result.nextPageOffset || undefined,
    };
  }

  /**
   * Clear all vectors
   */
  async clear(): Promise<void> {
    // Delete all vectors by filtering everything
    // This is expensive - consider deleting the collection instead
    const convertedFilter = this.convertFilter({
      must: [{ key: 'always_true', match: true }],
    });
    if (convertedFilter) {
      await this.qdrant.deleteByFilter(this.name, convertedFilter);
    }
  }

  /**
   * Convert filter from capabilities format to Qdrant format
   */
  private convertFilter(filter: import('@oxlayer/capabilities-vector').VectorSearchQuery['filter']) {
    if (!filter) return undefined;

    const must = filter.must?.map((c) => ({
      key: c.key,
      match: typeof c.match === 'object' ? c.match : { value: c.match },
    }));

    const mustNot = filter.must_not?.map((c) => ({
      key: c.key,
      match: typeof c.match === 'object' ? c.match : { value: c.match },
    }));

    if ((must && must.length > 0) || (mustNot && mustNot.length > 0)) {
      return { must, mustNot };
    }

    return undefined;
  }

  /**
   * Convert distance metric from Qdrant format to capabilities format
   */
  private convertDistanceMetric(distance: string): import('@oxlayer/capabilities-vector').DistanceMetric {
    const { DistanceMetric } = require('@oxlayer/capabilities-vector');
    const metricMap: Record<string, import('@oxlayer/capabilities-vector').DistanceMetric> = {
      Cosine: DistanceMetric.COSINE,
      Euclid: DistanceMetric.EUCLIDEAN,
      Dot: DistanceMetric.DOT,
    };
    return metricMap[distance] || DistanceMetric.COSINE;
  }
}

/**
 * Create a Qdrant vector store
 *
 * @param name - Collection name
 * @param config - Qdrant configuration
 * @returns QdrantVectorStore instance
 *
 * @example
 * ```ts
 * import { createQdrantVectorStore } from '@oxlayer/capabilities-adapters-qdrant';
 *
 * const vectorStore = createQdrantVectorStore('products', {
 *   url: 'http://localhost:6333',
 * });
 *
 * await vectorStore.upsert([
 *   { id: '1', vector: [0.1, 0.2, ...], payload: { name: 'Product A' } }
 * ]);
 * ```
 */
export function createQdrantVectorStore(
  name: string,
  config: QdrantConfig
): QdrantVectorStore {
  const { createQdrantClient } = require('./client.js');
  const client = createQdrantClient(config);
  return new QdrantVectorStore(name, client);
}

/**
 * Create a Qdrant vector store from environment variables
 *
 * Environment variables:
 * - QDRANT_URL
 * - QDRANT_API_KEY
 *
 * @param name - Collection name
 * @returns QdrantVectorStore instance
 */
export function createDefaultQdrantVectorStore(name: string): QdrantVectorStore {
  return createQdrantVectorStore(name, {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
  });
}
