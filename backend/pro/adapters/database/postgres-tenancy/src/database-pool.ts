/**
 * Database Pool Abstraction
 *
 * Generic database connection pool management for multi-tenant applications.
 * Works with any PostgreSQL database.
 *
 * @example
 * ```ts
 * import { DatabasePool, getDatabasePool } from './database-pool.js';
 *
 * const pool = new DatabasePool();
 * const db = await pool.connect({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'mydb',
 *   user: 'user',
 *   password: 'pass',
 * });
 * ```
 */

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

/**
 * Type alias for Drizzle Postgres.js database instance
 *
 * This is an internal type. For the public API, import Database from tenancy-aware-postgres.ts
 */
type PoolDatabase = PostgresJsDatabase<any>;

/**
 * Database connection configuration
 */
export interface DatabaseConnectionConfig {
  /** Database host */
  host: string;
  /** Database port */
  port: number;
  /** Database name */
  database: string;
  /** Database user */
  user: string;
  /** Database password (from secret store) */
  password: string;
  /** Connection pool size (default: 10) */
  poolSize?: number;
  /** Schema to set as search_path (optional) */
  schema?: string;
  /** SSL configuration */
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Connection result with metadata
 */
export interface ConnectionResult {
  /** Drizzle database instance */
  db: PoolDatabase;
  /** Connection key for caching */
  key: string;
  /** Whether connection was cached */
  cached: boolean;
}

/**
 * Multi-tenant database pool manager
 *
 * Manages separate connection pools for each tenant database.
 * Connections are cached and reused based on connection key.
 *
 * This is a generic implementation that works with any PostgreSQL database.
 * clients provide their own schema.
 */
export class DatabasePool {
  private pools = new Map<string, PoolDatabase>();
  private clients = new Map<string, Sql>();

  /**
   * Get or create a database connection
   *
   * Connections are cached by connection key (host:port:database).
   * Subsequent calls for the same database return the cached connection.
   *
   * @param config - Database connection configuration
   * @returns Drizzle Database instance
   */
  async connect(config: DatabaseConnectionConfig): Promise<PoolDatabase> {
    const result = await this.connectWithMetadata(config);
    return result.db;
  }

  /**
   * Get or create a database connection with metadata
   *
   * Same as connect() but returns metadata about the connection.
   *
   * @param config - Database connection configuration
   * @returns Connection result with database instance and metadata
   */
  async connectWithMetadata(config: DatabaseConnectionConfig): Promise<ConnectionResult> {
    const key = this.buildConnectionKey(config);

    if (this.pools.has(key)) {
      return {
        db: this.pools.get(key)!,
        key,
        cached: true,
      };
    }

    const connectionString = this.buildConnectionString(config);

    const client = postgres(connectionString, {
      max: config.poolSize ?? 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: config.ssl,
    });

    const db = drizzle(client);

    this.clients.set(key, client);
    this.pools.set(key, db);

    // Set search_path if schema is specified
    if (config.schema) {
      await this.setSearchPath(db, config.schema);
    }

    return {
      db,
      key,
      cached: false,
    };
  }

  /**
   * Build PostgreSQL connection string from config
   */
  private buildConnectionString(config: DatabaseConnectionConfig): string {
    const { host, port, database, user, password } = config;
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Set search_path for a connection
   */
  private async setSearchPath(db: PoolDatabase, schema: string): Promise<void> {
    const sql = db as any;
    if (typeof sql.execute === "function") {
      await sql.execute(`SET search_path TO ${schema}`);
    }
  }

  /**
   * Close a specific connection by key
   *
   * @param key - Connection key (host:port:database)
   */
  async close(key: string): Promise<void> {
    const client = this.clients.get(key);
    if (client) {
      await client.end();
    }
    this.clients.delete(key);
    this.pools.delete(key);
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    await Promise.all([...this.clients.values()].map((c) => c.end()));
    this.clients.clear();
    this.pools.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolCount: this.pools.size,
      keys: Array.from(this.pools.keys()),
    };
  }

  /**
   * Check if a connection exists for the given config
   */
  hasConnection(config: DatabaseConnectionConfig): boolean {
    const key = this.buildConnectionKey(config);
    return this.pools.has(key);
  }

  /**
   * Build connection key from config (public method)
   */
  buildConnectionKey(config: DatabaseConnectionConfig): string {
    return `${config.host}:${config.port}:${config.database}`;
  }
}
