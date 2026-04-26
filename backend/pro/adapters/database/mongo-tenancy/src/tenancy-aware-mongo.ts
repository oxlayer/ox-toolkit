/**
 * MongoDB Tenancy Adapter
 *
 * Multi-tenant MongoDB adapter supporting:
 * - **Shared**: Single database with tenant_id field filtering (B2C)
 * - **Schema**: Separate collection per tenant (prefix-based)
 * - **Database**: Separate database per tenant (B2B)
 *
 * Works with ANY client database/collections - no external dependencies.
 * Automatically adds tenant_id to documents in shared mode.
 *
 * @example
 * ```ts
 * import { createTenancyAwareMongo } from '@oxlayer/pro-adapters-mongo-tenancy';
 *
 * const tenantMongo = createTenancyAwareMongo({
 *   tenantResolver,
 *   bitwardenClient,
 *   sharedClient: mongoClient,
 *   defaultDatabase: 'app',
 * });
 *
 * // Enable tenant_id on all collections (adds index if needed)
 * await tenantMongo.enableTenantIndexing();
 *
 * const mongo = await tenantMongo.resolve('acme-corp');
 * await mongo.collection('users').insertOne({ name: 'John' });
 * // Automatically adds { tenant_id: 'acme-corp', name: 'John' }
 * ```
 *
 * Note: This adapter uses composition over inheritance. The returned client wraps
 * the MongoDB SDK client, rather than implementing SDK interfaces.
 */

import type { Db, Collection, Document } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { TenantResolver, DatabaseRouting } from '@oxlayer/pro-tenancy';
import {
  UnsupportedIsolationModeError,
  DatabaseConnectionError,
  SecretResolutionError,
} from '@oxlayer/pro-tenancy';

/**
 * Bitwarden secrets client interface
 */
export interface BitwardenSecretsClient {
  getDatabaseCredentials(secretRef: string): Promise<DatabaseCredentials>;
}

/**
 * Database credentials from secret store
 */
export interface DatabaseCredentials {
  username: string;
  password: string;
  host?: string;
  port?: number;
  connectionString?: string;
}

/**
 * MongoDB connection configuration
 */
export interface MongoConnectionConfig {
  /** Connection string or host:port */
  host: string;
  /** Database name */
  database: string;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** Connection options */
  options?: Record<string, unknown>;
  /** Auth database */
  authDatabase?: string;
}

/**
 * Collection wrapper that automatically injects tenant_id
 *
 * Uses composition over inheritance - wraps MongoDB collection rather than implementing SDK interfaces.
 */
export interface TenantScopedCollection<T = unknown> {
  insertOne(doc: T): Promise<any>;
  insertMany(docs: T[]): Promise<any>;
  findOne(filter: Document): Promise<T | null>;
  find(filter: Document): Promise<T[]>;
  updateOne(filter: Document, update: Document): Promise<any>;
  updateMany(filter: Document, update: Document): Promise<any>;
  deleteOne(filter: Document): Promise<any>;
  deleteMany(filter: Document): Promise<any>;
  countDocuments(filter: Document): Promise<number>;
  aggregate(pipeline: Document[]): Promise<Document[]>;
}

/**
 * Tenant-scoped MongoDB client interface
 *
 * Provides tenant-isolated access to MongoDB with automatic tenant_id injection
 * for shared databases or dedicated database/collection isolation.
 */
export interface TenantScopedMongoClient {
  collection<T>(name: string): TenantScopedCollection<T>;
}

/**
 * Configuration for TenancyAwareMongo
 */
export interface TenancyAwareMongoConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;

  /** Bitwarden secrets client for credential resolution */
  bitwardenClient: BitwardenSecretsClient;

  /** Shared MongoDB client (for B2C tenants with isolation="shared") */
  sharedClient: MongoClient;

  /** Default database name */
  defaultDatabase: string;

  /** Custom connection pool (optional, defaults to internal pool) */
  connectionPool?: MongoConnectionPool;
}

/**
 * MongoDB connection pool manager
 *
 * Manages separate MongoDB clients for each tenant database.
 */
export class MongoConnectionPool {
  private clients = new Map<string, MongoClient>();

  /**
   * Get or create a MongoDB connection
   *
   * @param config - MongoDB connection configuration
   * @returns MongoClient instance
   */
  async connect(config: MongoConnectionConfig): Promise<MongoClient> {
    const key = this.getConnectionKey(config);

    if (this.clients.has(key)) {
      return this.clients.get(key)!;
    }

    const connectionString = this.buildConnectionString(config);

    const client = new MongoClient(connectionString, config.options);

    await client.connect();

    this.clients.set(key, client);

    return client;
  }

  /**
   * Build MongoDB connection string from config
   */
  private buildConnectionString(config: MongoConnectionConfig): string {
    if (config.options?.connectionString) {
      return config.options.connectionString as string;
    }

    const { host, database, username, password, authDatabase } = config;
    const auth = username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';
    const authDb = authDatabase || database || 'admin';

    return `mongodb://${auth}${host}/${database}?authSource=${authDb}`;
  }

  /**
   * Generate connection key for caching
   *
   * Includes username to prevent key collision when tenants share
   * the same host/database but have different credentials.
   */
  private getConnectionKey(config: MongoConnectionConfig): string {
    return `${config.host}:${config.database}:${config.username ?? 'anon'}`;
  }

  /**
   * Close a specific connection by key
   */
  async close(key: string): Promise<void> {
    const client = this.clients.get(key);
    if (client) {
      await client.close();
    }
    this.clients.delete(key);
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    await Promise.all([...this.clients.values()].map((c: MongoClient) => c.close()));
    this.clients.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      connectionCount: this.clients.size,
      keys: Array.from(this.clients.keys()),
    };
  }
}

/**
 * Tenant Indexing Manager
 *
 * Dynamically adds tenant_id indexes to all collections.
 * Works with any client collection structure.
 */
export class TenantIndexingManager {
  constructor(
    private db: Db,
    private tenantColumn = 'tenant_id'
  ) { }

  /**
   * Enable tenant_id index on all collections
   *
   * This method:
   * 1. Inspects all collections in the database
   * 2. Creates tenant_id index if it doesn't exist
   *
   * @returns Result of indexing operation
   */
  async enableTenantIndexing() {
    const collections = await this.db.listCollections().toArray();
    const result = {
      collections: [] as string[],
      indexesCreated: [] as string[],
      errors: [] as Array<{ collection: string; error: string }>,
    };

    for (const coll of collections) {
      try {
        const collectionName = coll.name;
        result.collections.push(collectionName);

        // Check if tenant_id index exists
        const collection = this.db.collection(collectionName);
        const existingIndexes = await collection.indexes();
        const hasTenantIndex = existingIndexes.some(
          (idx: any) => idx.key?.[this.tenantColumn] === 1
        );

        if (!hasTenantIndex) {
          await collection.createIndex({ [this.tenantColumn]: 1 }, {
            name: `tenant_idx_${collectionName}`,
            background: true,
          });
          result.indexesCreated.push(collectionName);
        }
      } catch (error) {
        result.errors.push({
          collection: coll.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }
}

/**
 * MongoDB tenancy-aware resolver
 *
 * Resolves tenant-specific MongoDB connections based on isolation strategy.
 * Works with any client database - no external schema dependencies.
 *
 * Isolation strategies:
 * - **shared** (B2C): Returns shared client with tenant_id filtering
 * - **collection**: Uses tenant-prefixed collections (e.g., tenant_acme_users)
 * - **database** (B2B): Returns dedicated client for tenant's database
 *
 * Dynamic tenant_id injection:
 * When using shared isolation, all write operations automatically inject tenant_id.
 * All read operations automatically filter by tenant_id.
 */
export class TenancyAwareMongo implements TenantScopedMongoClient {
  private connectionPool: MongoConnectionPool;
  private indexingManager: TenantIndexingManager;

  constructor(private config: TenancyAwareMongoConfig) {
    this.connectionPool = config.connectionPool || new MongoConnectionPool();
    this.indexingManager = new TenantIndexingManager(
      config.sharedClient.db(config.defaultDatabase),
      'tenant_id'
    );
  }

  /**
   * Resolve MongoDB client for tenant
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped MongoClient
   */
  async resolve(tenantId: string): Promise<TenantScopedMongoClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    switch (tenant.isolation.database) {
      case 'shared':
        return this.getSharedClient(tenantId);

      case 'schema':
        return this.getCollectionPrefixedClient(tenantId);

      case 'database':
        return this.getTenantDatabase(tenant.database, tenantId);

      default:
        throw new UnsupportedIsolationModeError(
          tenantId,
          'database',
          tenant.isolation.database
        );
    }
  }

  /**
   * Enable tenant_id indexing on all collections
   *
   * Dynamically adds tenant_id index to all collections in the shared database.
   */
  async enableTenantIndexing() {
    return await this.indexingManager.enableTenantIndexing();
  }

  /**
   * Get a collection from the shared database
   *
   * Convenience method for direct collection access.
   */
  collection<T>(_name: string): TenantScopedCollection<T> {
    throw new Error('Use resolve(tenantId).collection(name) instead');
  }

  /**
   * Get a database
   *
   * Convenience method for direct database access.
   */
  database(name: string): any {
    return this.config.sharedClient.db(name);
  }

  /**
   * Get the underlying Db instance
   */
  db(name?: string): Db {
    return this.config.sharedClient.db(name || this.config.defaultDatabase);
  }

  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    await this.connectionPool.closeAll();
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return this.connectionPool.getStats();
  }

  /**
   * Get shared MongoDB client with tenant filtering
   */
  private getSharedClient(tenantId: string): TenantScopedMongoClient {
    return new SharedMongoClient(
      this.config.sharedClient.db(this.config.defaultDatabase),
      tenantId
    );
  }

  /**
   * Get MongoDB client with collection prefixing
   */
  private getCollectionPrefixedClient(tenantId: string): TenantScopedMongoClient {
    return new CollectionPrefixedMongoClient(
      this.config.sharedClient.db(this.config.defaultDatabase),
      tenantId
    );
  }

  /**
   * Get dedicated tenant database
   */
  private async getTenantDatabase(
    routing: DatabaseRouting,
    tenantId: string
  ): Promise<TenantScopedMongoClient> {
    try {
      const credentials = await this.getCredentials(routing.secretRef);

      const connectionConfig: MongoConnectionConfig = {
        host: credentials.connectionString || routing.host,
        database: routing.name,
        username: credentials.username,
        password: credentials.password,
      };

      const client = await this.connectionPool.connect(connectionConfig);

      return new DedicatedMongoClient(client.db(routing.name));
    } catch (error) {
      if (error instanceof Error) {
        throw new DatabaseConnectionError(tenantId, error.message);
      }
      throw error;
    }
  }

  /**
   * Get credentials from Bitwarden with error handling
   */
  private async getCredentials(secretRef: string): Promise<DatabaseCredentials> {
    try {
      return await this.config.bitwardenClient.getDatabaseCredentials(secretRef);
    } catch (error) {
      if (error instanceof Error) {
        throw new SecretResolutionError(
          secretRef.split('/')[1] || 'unknown',
          secretRef,
          error.message
        );
      }
      throw error;
    }
  }
}

/**
 * Shared MongoDB client with tenant_id filtering
 *
 * Automatically injects tenant_id into all write operations
 * and filters by tenant_id in all read operations.
 *
 * Uses composition over inheritance - wraps MongoDB Db rather than implementing interfaces.
 */
class SharedMongoClient {
  constructor(
    private readonly db: Db,
    private readonly tenantId: string
  ) { }

  collection<T>(name: string): TenantScopedCollection<T> {
    const rawCollection = this.db.collection(name);
    return new TenantFilteredCollection(rawCollection, this.tenantId);
  }

  database(name: string): SharedMongoClient {
    const mongoClient = this.db.client as MongoClient;
    return new SharedMongoClient(mongoClient.db(name), this.tenantId);
  }

  /**
   * Get the underlying MongoDB Db instance
   *
   * Use this for advanced MongoDB operations not exposed by this wrapper.
   * Be aware that tenant filtering will NOT be automatically applied.
   */
  getDb(name?: string): Db {
    const mongoClient = this.db.client as MongoClient;
    return mongoClient.db(name || this.db.databaseName);
  }
}

/**
 * Collection with automatic tenant_id filtering
 *
 * Uses composition over inheritance - wraps MongoDB Collection rather than implementing interfaces.
 */
class TenantFilteredCollection<T> {
  constructor(
    private readonly collection: Collection<any>,
    private readonly tenantId: string
  ) { }

  /**
   * Inject tenant_id into document
   */
  private injectTenant(doc: T): any {
    return { ...doc, tenant_id: this.tenantId };
  }

  /**
   * Inject tenant_id into filter
   */
  private injectFilter(filter: Document): Document {
    if (filter && typeof filter === 'object') {
      return { ...filter, tenant_id: this.tenantId };
    }
    return { tenant_id: this.tenantId };
  }

  async insertOne(doc: T): Promise<any> {
    return this.collection.insertOne(this.injectTenant(doc));
  }

  async insertMany(docs: T[]): Promise<any> {
    const enrichedDocs = docs.map((d) => this.injectTenant(d));
    return this.collection.insertMany(enrichedDocs);
  }

  async findOne(filter: Document): Promise<T | null> {
    return this.collection.findOne(this.injectFilter(filter));
  }

  async find(filter: Document): Promise<T[]> {
    const cursor = this.collection.find(this.injectFilter(filter));
    return cursor.toArray();
  }

  async updateOne(filter: Document, update: Document): Promise<any> {
    return this.collection.updateOne(this.injectFilter(filter), update);
  }

  async updateMany(filter: Document, update: Document): Promise<any> {
    return this.collection.updateMany(this.injectFilter(filter), update);
  }

  async deleteOne(filter: Document): Promise<any> {
    return this.collection.deleteOne(this.injectFilter(filter));
  }

  async deleteMany(filter: Document): Promise<any> {
    return this.collection.deleteMany(this.injectFilter(filter));
  }

  async countDocuments(filter: Document): Promise<number> {
    return this.collection.countDocuments(this.injectFilter(filter));
  }

  async aggregate(pipeline: Document[]): Promise<Document[]> {
    // Prepend tenant_id match to pipeline
    const tenantMatch = { $match: { tenant_id: this.tenantId } };
    const tenantPipeline = [tenantMatch, ...pipeline];
    const cursor = this.collection.aggregate(tenantPipeline);
    return cursor.toArray();
  }
}

/**
 * MongoDB client with collection prefixing
 *
 * Uses tenant-prefixed collections (e.g., tenant_acme_users).
 *
 * Uses composition over inheritance - wraps MongoDB Db rather than implementing interfaces.
 */
class CollectionPrefixedMongoClient {
  constructor(
    private readonly db: Db,
    private readonly tenantId: string
  ) { }

  collection<T>(name: string): TenantScopedCollection<T> {
    const prefixedName = `tenant_${this.tenantId}_${name}`;
    return new DirectCollectionWrapper(this.db.collection(prefixedName));
  }

  database(name: string): CollectionPrefixedMongoClient {
    const mongoClient = this.db.client as MongoClient;
    return new CollectionPrefixedMongoClient(
      mongoClient.db(name),
      this.tenantId
    );
  }

  /**
   * Get the underlying MongoDB Db instance
   *
   * Use this for advanced MongoDB operations not exposed by this wrapper.
   */
  getDb(name?: string): Db {
    const mongoClient = this.db.client as MongoClient;
    return mongoClient.db(name || this.db.databaseName);
  }
}

/**
 * Dedicated MongoDB client (no tenant_id injection needed)
 *
 * Uses composition over inheritance - wraps MongoDB Db rather than implementing interfaces.
 */
class DedicatedMongoClient {
  constructor(private readonly database: Db) { }

  collection<T>(name: string): TenantScopedCollection<T> {
    return new DirectCollectionWrapper(this.database.collection(name));
  }

  /**
   * Get a different database
   *
   * @param name - Database name
   * @returns New DedicatedMongoClient for the specified database
   */
  getDb(name?: string): DedicatedMongoClient {
    const mongoClient = this.database.client as MongoClient;
    return new DedicatedMongoClient(mongoClient.db(name));
  }
}

/**
 * Direct collection wrapper (no tenant filtering)
 *
 * Used for dedicated databases where tenant isolation is guaranteed
 * by the database itself.
 *
 * Uses composition over inheritance - wraps MongoDB Collection rather than implementing interfaces.
 */
class DirectCollectionWrapper<T> {
  constructor(private readonly collection: Collection<any>) { }

  async insertOne(doc: T): Promise<any> {
    return this.collection.insertOne(doc);
  }

  async insertMany(docs: T[]): Promise<any> {
    return this.collection.insertMany(docs);
  }

  async findOne(filter: Document): Promise<T | null> {
    return this.collection.findOne(filter);
  }

  async find(filter: Document): Promise<T[]> {
    const cursor = this.collection.find(filter);
    return cursor.toArray();
  }

  async updateOne(filter: Document, update: Document): Promise<any> {
    return this.collection.updateOne(filter, update);
  }

  async updateMany(filter: Document, update: Document): Promise<any> {
    return this.collection.updateMany(filter, update);
  }

  async deleteOne(filter: Document): Promise<any> {
    return this.collection.deleteOne(filter);
  }

  async deleteMany(filter: Document): Promise<any> {
    return this.collection.deleteMany(filter);
  }

  async countDocuments(filter: Document): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async aggregate(pipeline: Document[]): Promise<Document[]> {
    const cursor = this.collection.aggregate(pipeline);
    return cursor.toArray();
  }
}

/**
 * Create a tenancy-aware MongoDB resolver
 */
export function createTenancyAwareMongo(
  config: TenancyAwareMongoConfig
): TenancyAwareMongo {
  return new TenancyAwareMongo(config);
}
