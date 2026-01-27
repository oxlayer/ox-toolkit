import type { MongoClientWrapper } from './client.js';
import type { FindOptions, UpdateOptions, AggregatePipeline, IndexSpec } from './types.js';
import type { Document, Filter, UpdateFilter, WithId, OptionalUnlessRequiredId, Sort } from 'mongodb';

/**
 * Collection wrapper for type-safe operations
 *
 * @example
 * ```ts
 * import { createMongoClient, Collection } from '@oxlayer/capabilities-adapters-mongo';
 *
 * const mongo = createMongoClient({ url: 'mongodb://localhost:27017', database: 'mydb' });
 * const users = new Collection<User>(mongo, 'users');
 *
 * await users.insert({ name: 'John', age: 30 });
 * const adults = await users.find({ filter: { age: { $gte: 18 } } });
 * ```
 */
export class Collection<T extends Document = Document> {
  constructor(
    private client: MongoClientWrapper,
    private name: string
  ) { }

  /**
   * Find documents
   */
  async find(options?: FindOptions<T>): Promise<WithId<T>[]> {
    return this.client.find<T>(this.name, options);
  }

  /**
   * Find a single document
   */
  async findOne(options?: FindOptions<T>): Promise<WithId<T> | null> {
    return this.client.findOne<T>(this.name, options);
  }

  /**
   * Find a document by ID
   */
  async findById(id: string): Promise<WithId<T> | null> {
    return this.client.findById<T>(this.name, id);
  }

  /**
   * Count documents
   */
  async count(filter?: Filter<T>): Promise<number> {
    return this.client.count<T>(this.name, filter);
  }

  /**
   * Insert a document
   */
  async insert(document: OptionalUnlessRequiredId<T>): Promise<WithId<T>> {
    return this.client.insert<T>(this.name, document);
  }

  /**
   * Insert multiple documents
   */
  async insertMany(documents: OptionalUnlessRequiredId<T>[]): Promise<number> {
    return this.client.insertMany<T>(this.name, documents);
  }

  /**
   * Update a document
   */
  async update(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<WithId<T> | null> {
    return this.client.update<T>(this.name, filter, update, options);
  }

  /**
   * Update a document by ID
   */
  async updateById(id: string, update: UpdateFilter<T>, options?: UpdateOptions): Promise<WithId<T> | null> {
    return this.client.updateById<T>(this.name, id, update, options);
  }

  /**
   * Update multiple documents
   */
  async updateMany(filter: Filter<T>, update: UpdateFilter<T>): Promise<number> {
    return this.client.updateMany<T>(this.name, filter, update);
  }

  /**
   * Delete a document
   */
  async delete(filter: Filter<T>): Promise<WithId<T> | null> {
    return this.client.delete<T>(this.name, filter);
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: string): Promise<WithId<T> | null> {
    return this.client.deleteById<T>(this.name, id);
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter: Filter<T>): Promise<number> {
    return this.client.deleteMany<T>(this.name, filter);
  }

  /**
   * Aggregate documents
   */
  async aggregate(pipeline: AggregatePipeline): Promise<T[]> {
    return this.client.aggregate<T>(this.name, pipeline);
  }

  /**
   * Create an index
   */
  async createIndex(spec: IndexSpec): Promise<string> {
    return this.client.createIndex(this.name, spec);
  }

  /**
   * Create multiple indexes
   */
  async createIndexes(specs: IndexSpec[]): Promise<string[]> {
    return this.client.createIndexes(this.name, specs);
  }

  /**
   * Drop an index
   */
  async dropIndex(indexName: string): Promise<void> {
    return this.client.dropIndex(this.name, indexName);
  }

  /**
   * List indexes
   */
  async listIndexes(): Promise<Array<{ name: string | undefined; key: Record<string, number> }>> {
    return this.client.listIndexes(this.name);
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    return this.client.getCollectionStats(this.name);
  }

  /**
   * Drop the collection
   */
  async drop(): Promise<void> {
    return this.client.dropCollection(this.name);
  }
}
