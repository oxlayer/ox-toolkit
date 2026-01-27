import { MongoClient, Db } from 'mongodb';
import type {
  Document,
  Filter,
  UpdateFilter,
  WithId,
  OptionalUnlessRequiredId,
  IndexDescription,
} from 'mongodb';
import type { MongoConfig, FindOptions, UpdateOptions, AggregatePipeline, IndexSpec, CollectionStats } from './types.js';

/**
 * MongoDB client wrapper
 *
 * Provides a simplified interface for common MongoDB operations
 * with automatic connection pooling and collection management.
 *
 * @example
 * ```ts
 * import { createMongoClient } from '@oxlayer/capabilities-adapters-mongo';
 *
 * const mongo = createMongoClient({
 *   url: 'mongodb://localhost:27017',
 *   database: 'mydb',
 * });
 *
 * await mongo.connect();
 *
 * const users = await mongo.find('users', { filter: { age: { $gte: 18 } } });
 *
 * await mongo.disconnect();
 * ```
 */
export class MongoClientWrapper {
  private client: MongoClient;
  private db: Db;
  private connected = false;

  constructor(private config: MongoConfig) {
    this.client = new MongoClient(config.url, {
      maxPoolSize: config.options?.maxPoolSize || 20,
      minPoolSize: config.options?.minPoolSize || 2,
      maxIdleTimeMS: config.options?.maxIdleTimeMS || 60000,
      connectTimeoutMS: config.options?.connectTimeoutMS || 10000,
      socketTimeoutMS: config.options?.socketTimeoutMS || 45000,
      serverSelectionTimeoutMS: config.options?.serverSelectionTimeoutMS || 30000,
      heartbeatFrequencyMS: config.options?.heartbeatFrequencyMS || 10000,
      appName: config.options?.appName || 'staples-mongo',
    });

    this.db = this.client.db(config.database);
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.connected) {
      console.log('[MongoClient] Already connected');
      return;
    }

    try {
      await this.client.connect();
      this.connected = true;
      console.log(`[MongoClient] Connected to ${this.config.database}`);
    } catch (error) {
      console.error('[MongoClient] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close();
    this.connected = false;
    console.log('[MongoClient] Disconnected');
  }

  /**
   * Find documents in a collection
   *
   * @param collection - Collection name
   * @param options - Find options
   * @returns Found documents
   */
  async find<T extends Document = Document>(collection: string, options?: FindOptions<T>): Promise<WithId<T>[]> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const cursor = coll.find(options?.filter || {});

    if (options?.sort) {
      cursor.sort(options.sort);
    }

    if (options?.skip) {
      cursor.skip(options.skip);
    }

    if (options?.limit) {
      cursor.limit(options.limit);
    }

    if (options?.projection) {
      cursor.project(options.projection);
    }

    return cursor.toArray();
  }

  /**
   * Find a single document in a collection
   *
   * @param collection - Collection name
   * @param options - Find options
   * @returns Found document or null
   */
  async findOne<T extends Document = Document>(collection: string, options?: FindOptions<T>): Promise<WithId<T> | null> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const cursor = coll.findOne(options?.filter || {}, {
      projection: options?.projection,
      sort: options?.sort as Record<string, 1 | -1>,
    });

    return cursor;
  }

  /**
   * Find a document by ID
   *
   * @param collection - Collection name
   * @param id - Document ID
   * @returns Found document or null
   */
  async findById<T extends Document = Document>(collection: string, id: string): Promise<WithId<T> | null> {
    return this.findOne<T>(collection, {
      filter: { _id: id } as Filter<T>,
    });
  }

  /**
   * Count documents in a collection
   *
   * @param collection - Collection name
   * @param filter - Query filter
   * @returns Document count
   */
  async count<T extends Document = Document>(collection: string, filter?: Filter<T>): Promise<number> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    return coll.countDocuments(filter || {});
  }

  /**
   * Insert a document into a collection
   *
   * @param collection - Collection name
   * @param document - Document to insert
   * @returns Inserted document
   */
  async insert<T extends Document = Document>(collection: string, document: OptionalUnlessRequiredId<T>): Promise<WithId<T>> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const result = await coll.insertOne(document);

    return { ...document, _id: result.insertedId } as WithId<T>;
  }

  /**
   * Insert multiple documents into a collection
   *
   * @param collection - Collection name
   * @param documents - Documents to insert
   * @returns Number of inserted documents
   */
  async insertMany<T extends Document = Document>(collection: string, documents: OptionalUnlessRequiredId<T>[]): Promise<number> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const result = await coll.insertMany(documents);

    return result.insertedCount;
  }

  /**
   * Update a document in a collection
   *
   * @param collection - Collection name
   * @param filter - Query filter
   * @param update - Update specification
   * @param options - Update options
   * @returns Updated document or null
   */
  async update<T extends Document = Document>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<WithId<T> | null> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const result = await coll.findOneAndUpdate(
      filter,
      update,
      {
        returnDocument: options?.returnDocument === 'after' ? 'after' : 'before',
        upsert: options?.upsert,
      }
    );

    return result;
  }

  /**
   * Update a document by ID
   *
   * @param collection - Collection name
   * @param id - Document ID
   * @param update - Update specification
   * @param options - Update options
   * @returns Updated document or null
   */
  async updateById<T extends Document = Document>(
    collection: string,
    id: string,
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<WithId<T> | null> {
    return this.update<T>(collection, { _id: id } as Filter<T>, update, options);
  }

  /**
   * Update multiple documents in a collection
   *
   * @param collection - Collection name
   * @param filter - Query filter
   * @param update - Update specification
   * @returns Number of updated documents
   */
  async updateMany<T extends Document = Document>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>
  ): Promise<number> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const result = await coll.updateMany(filter, update);

    return result.modifiedCount;
  }

  /**
   * Delete a document from a collection
   *
   * @param collection - Collection name
   * @param filter - Query filter
   * @returns Deleted document or null
   */
  async delete<T extends Document = Document>(collection: string, filter: Filter<T>): Promise<WithId<T> | null> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const result = await coll.findOneAndDelete(filter);

    return result;
  }

  /**
   * Delete a document by ID
   *
   * @param collection - Collection name
   * @param id - Document ID
   * @returns Deleted document or null
   */
  async deleteById<T extends Document = Document>(collection: string, id: string): Promise<WithId<T> | null> {
    return this.delete<T>(collection, { _id: id } as Filter<T>);
  }

  /**
   * Delete multiple documents from a collection
   *
   * @param collection - Collection name
   * @param filter - Query filter
   * @returns Number of deleted documents
   */
  async deleteMany<T extends Document = Document>(collection: string, filter: Filter<T>): Promise<number> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    const result = await coll.deleteMany(filter);

    return result.deletedCount;
  }

  /**
   * Aggregate documents in a collection
   *
   * @param collection - Collection name
   * @param pipeline - Aggregation pipeline
   * @returns Aggregation results
   */
  async aggregate<T extends Document = Document>(collection: string, pipeline: AggregatePipeline): Promise<T[]> {
    this.ensureConnected();

    const coll = this.db.collection<T>(collection);
    return coll.aggregate(pipeline).toArray() as Promise<T[]>;
  }

  /**
   * Create an index on a collection
   *
   * @param collection - Collection name
   * @param spec - Index specification
   */
  async createIndex(collection: string, spec: IndexSpec): Promise<string> {
    this.ensureConnected();

    const coll = this.db.collection(collection);
    return coll.createIndex(spec.keys as IndexDescription['key'], spec.options);
  }

  /**
   * Create multiple indexes on a collection
   *
   * @param collection - Collection name
   * @param specs - Index specifications
   */
  async createIndexes(collection: string, specs: IndexSpec[]): Promise<string[]> {
    this.ensureConnected();

    const coll = this.db.collection(collection);
    return coll.createIndexes(specs.map((spec) => ({
      key: spec.keys as IndexDescription['key'],
      ...spec.options,
    })));
  }

  /**
   * Drop an index from a collection
   *
   * @param collection - Collection name
   * @param indexName - Index name
   */
  async dropIndex(collection: string, indexName: string): Promise<void> {
    this.ensureConnected();

    const coll = this.db.collection(collection);
    await coll.dropIndex(indexName);
  }

  /**
   * List indexes on a collection
   *
   * @param collection - Collection name
   * @returns List of indexes
   */
  async listIndexes(collection: string): Promise<Array<{ name: string | undefined; key: Record<string, number> }>> {
    this.ensureConnected();

    const coll = this.db.collection(collection);
    const indexes = await coll.indexes();

    return indexes.map((index) => ({
      name: index.name,
      key: index.key as Record<string, number>,
    }));
  }

  /**
   * Get collection statistics
   *
   * @param collection - Collection name
   * @returns Collection statistics
   */
  async getCollectionStats(collection: string): Promise<CollectionStats> {
    this.ensureConnected();

    const coll = this.db.collection(collection);
    const stats = await coll.aggregate([
      {
        $collStats: {
          count: {},
          storageStats: {},
        },
      },
    ]).toArray();

    const stat = stats[0];

    return {
      name: collection,
      count: stat.count || 0,
      size: stat.storageStats?.size || 0,
      avgObjSize: stat.storageStats?.avgObjSize || 0,
      indexCount: stat.storageStats?.nindexes || 0,
      indexSize: stat.storageStats?.totalIndexSize || 0,
    };
  }

  /**
   * Drop a collection
   *
   * @param collection - Collection name
   */
  async dropCollection(collection: string): Promise<void> {
    this.ensureConnected();

    const coll = this.db.collection(collection);
    await coll.drop();
  }

  /**
   * List all collections
   *
   * @returns List of collection names
   */
  async listCollections(): Promise<string[]> {
    this.ensureConnected();

    const collections = await this.db.listCollections().toArray();
    return collections.map((c) => c.name);
  }

  /**
   * Health check
   *
   * @returns True if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the underlying MongoDB client
   *
   * Use this for advanced operations not covered by the wrapper.
   *
   * @returns MongoClient instance
   */
  getClient(): MongoClient {
    return this.client;
  }

  /**
   * Get the underlying MongoDB Db instance
   *
   * @returns Db instance
   */
  getDb(): Db {
    return this.db;
  }

  /**
   * Ensure the client is connected
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('MongoClient is not connected. Call connect() first.');
    }
  }

  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Create a MongoDB client
 *
 * @param config - MongoDB configuration
 * @returns MongoClientWrapper instance
 *
 * @example
 * ```ts
 * import { createMongoClient } from '@oxlayer/capabilities-adapters-mongo';
 *
 * const mongo = createMongoClient({
 *   url: 'mongodb://localhost:27017',
 *   database: 'mydb',
 * });
 *
 * await mongo.connect();
 * ```
 */
export function createMongoClient(config: MongoConfig): MongoClientWrapper {
  return new MongoClientWrapper(config);
}

/**
 * Create a default MongoDB client from environment variables
 *
 * Environment variables:
 * - MONGO_URL
 * - MONGO_DATABASE
 *
 * @param config - Optional config overrides
 * @returns MongoClientWrapper instance
 */
export function createDefaultMongoClient(config?: Partial<MongoConfig>): MongoClientWrapper {
  return createMongoClient({
    url: config?.url || process.env.MONGO_URL || 'mongodb://localhost:27017',
    database: config?.database || process.env.MONGO_DATABASE || 'default',
    options: config?.options,
  });
}