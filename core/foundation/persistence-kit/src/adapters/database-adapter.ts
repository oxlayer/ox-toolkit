/**
 * Base interface for database adapters.
 *
 * Database adapters provide a thin abstraction over specific databases,
 * allowing repository implementations to be somewhat portable.
 *
 * @example
 * ```ts
 * class ClickHouseAdapter implements DatabaseAdapter {
 *   async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
 *     // ClickHouse-specific implementation
 *   }
 * }
 * ```
 */
export interface DatabaseAdapter {
  /**
   * Execute a query and return results
   */
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a query that returns a single result
   */
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;

  /**
   * Execute a command (insert, update, delete) and return affected rows
   */
  execute(sql: string, params?: unknown[]): Promise<number>;

  /**
   * Check database connectivity
   */
  ping(): Promise<boolean>;

  /**
   * Close the connection
   */
  close(): Promise<void>;
}

/**
 * Transaction-capable database adapter
 */
export interface TransactionalDatabaseAdapter extends DatabaseAdapter {
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute a function within a transaction
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Connection pool interface
 */
export interface ConnectionPool<T extends DatabaseAdapter = DatabaseAdapter> {
  /**
   * Acquire a connection from the pool
   */
  acquire(): Promise<T>;

  /**
   * Release a connection back to the pool
   */
  release(connection: T): void;

  /**
   * Close all connections in the pool
   */
  drain(): Promise<void>;
}
