/**
 * ClickHouse connection configuration
 */
export interface ClickHouseConfig {
  /**
   * ClickHouse host
   */
  host: string;
  /**
   * ClickHouse HTTP port (default: 8123)
   */
  port?: number;
  /**
   * Database name
   */
  database?: string;
  /**
   * Username for authentication
   */
  username?: string;
  /**
   * Password for authentication
   */
  password?: string;
  /**
   * Use TLS/SSL connection
   */
  tls?: boolean;
  /**
   * Request timeout in milliseconds
   */
  request_timeout?: number;
  /**
   * Maximum number of retries
   */
  max_retries?: number;
  /**
   * Compression
   */
  compression?: 'none' | 'lz4' | 'zstd';
  /**
   * Application name for connection tracking
   */
  clickhouse_client_name?: string;
}

/**
 * Query options
 */
export interface QueryOptions {
  /**
   * Query parameters
   */
  params?: Record<string, unknown>;
  /**
   * Format for results (default: JSON)
   */
  format?: 'JSON' | 'JSONCompact' | 'JSONEachRow';
  /**
   * Query timeout in milliseconds
   */
  query_timeout?: number;
  /**
   * ClickHouse settings
   */
  settings?: Record<string, string | number | boolean>;
}

/**
 * Query result
 */
export interface QueryResult<T = unknown> {
  /**
   * Result rows
   */
  data: T[];
  /**
   * Number of rows
   */
  rows: number;
  /**
   * Query execution metadata
   */
  metadata?: {
    /**
     * Column names
     */
    names: string[];
    /**
     * Column types
     */
    types: string[];
  };
  /**
   * Statistics
   */
  statistics?: {
    /**
     * Rows read
     */
    rows_read: number;
    /**
     * Bytes read
     */
    bytes_read: number;
    /**
     * Execution time in seconds
     */
    elapsed: number;
  };
}

/**
 * Insert options
 */
export interface InsertOptions {
  /**
   * Table name
   */
  table: string;
  /**
   * Data to insert
   */
  data: Record<string, unknown>[];
  /**
   * Format for insert (default: JSONEachRow)
   */
  format?: 'JSONEachRow' | 'CSV' | 'TabSeparated';
}

/**
 * Batch insert options
 */
export interface BatchInserterOptions {
  /**
   * Table name
   */
  table: string;
  /**
   * Batch size (default: 10000)
   */
  batchSize?: number;
  /**
   * Flush interval in milliseconds (default: 5000)
   */
  flushInterval?: number;
  /**
   * Maximum retries
   */
  maxRetries?: number;
}
