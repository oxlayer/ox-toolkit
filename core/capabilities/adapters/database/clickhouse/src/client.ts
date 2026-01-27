import { createClient, type ResponseJSON } from '@clickhouse/client';
import type { ClickHouseConfig, QueryOptions, QueryResult, InsertOptions } from './types.js';

/**
 * ClickHouse client wrapper
 *
 * Provides a simplified interface for common ClickHouse operations
 * with automatic connection management and query execution.
 *
 * @example
 * ```ts
 * import { createClickHouseClient } from '@oxlayer/capabilities-adapters-clickhouse';
 *
 * const ch = createClickHouseClient({
 *   host: 'http://localhost',
 *   port: 8123,
 *   database: 'analytics',
 * });
 *
 * const result = await ch.query('SELECT * FROM events WHERE date >= {min_date:Date}', {
 *   params: { min_date: '2024-01-01' },
 * });
 * ```
 */
export class ClickHouseClient {
  private client: ReturnType<typeof createClient>;

  constructor(private config: ClickHouseConfig) {
    const url = new URL(config.host);
    if (config.port) {
      url.port = config.port.toString();
    }

    this.client = createClient({
      url: url.toString(),
      database: config.database || 'default',
      username: config.username || 'default',
      password: config.password || '',
      request_timeout: config.request_timeout || 30000,
      compression: {
        response: config.compression !== 'none',
        request: config.compression !== 'none',
      },
      clickhouse_settings: {
        clickhouse_client_name: config.clickhouse_client_name || 'staples-clickhouse',
      },
    });

    console.log(`[ClickHouseClient] Initialized for ${url.host}/${config.database || 'default'}`);
  }

  /**
   * Execute a query
   *
   * @param query - SQL query string
   * @param options - Query options
   * @returns Query result
   */
  async query<T = unknown>(query: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
      const resultSet = await this.client.query({
        query,
        query_params: options?.params,
        format: options?.format || 'JSON',
        clickhouse_settings: options?.settings,
      });

      const result = await resultSet.json<T>();

      const duration = Date.now() - start;
      console.log(`[ClickHouseClient] Query executed in ${duration}ms: ${query.substring(0, 100)}...`);

      // Narrow the type from ResponseJSON<unknown> | unknown[] to ResponseJSON<T>
      const response = Array.isArray(result) ? { data: result } : result;

      return {
        data: (response as ResponseJSON<T>).data || [],
        rows: (response as ResponseJSON<T>).rows || 0,
        metadata: (response as ResponseJSON<T>).meta
          ? {
            names: (response as ResponseJSON<T>).meta!.map((m) => m.name),
            types: (response as ResponseJSON<T>).meta!.map((m) => m.type),
          }
          : undefined,
        statistics: (response as ResponseJSON<T>).statistics
          ? {
            rows_read: (response as ResponseJSON<T>).statistics!.rows_read || 0,
            bytes_read: (response as ResponseJSON<T>).statistics!.bytes_read || 0,
            elapsed: (response as ResponseJSON<T>).statistics!.elapsed || 0,
          }
          : undefined,
      };
    } catch (error) {
      console.error('[ClickHouseClient] Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a query and return the first row
   *
   * @param query - SQL query string
   * @param options - Query options
   * @returns First row or null
   */
  async queryOne<T = unknown>(query: string, options?: QueryOptions): Promise<T | null> {
    const result = await this.query<T>(query, options);

    if (result.data.length === 0) {
      return null;
    }

    return result.data[0];
  }

  /**
   * Execute a query and return a scalar value
   *
   * @param query - SQL query string
   * @param options - Query options
   * @returns Scalar value or null
   */
  async queryScalar<T = unknown>(query: string, options?: QueryOptions): Promise<T | null> {
    const row = await this.queryOne<Record<string, T>>(query, options);

    if (!row) {
      return null;
    }

    const keys = Object.keys(row);
    return keys.length > 0 ? row[keys[0]] : null;
  }

  /**
   * Insert data into a table
   *
   * @param options - Insert options
   */
  async insert(options: InsertOptions): Promise<void> {
    const start = Date.now();

    try {
      await this.client.insert({
        table: options.table,
        values: options.data,
        format: options.format || 'JSONEachRow',
      });

      const duration = Date.now() - start;
      console.log(`[ClickHouseClient] Inserted ${options.data.length} rows to ${options.table} in ${duration}ms`);
    } catch (error) {
      console.error('[ClickHouseClient] Insert error:', error);
      throw error;
    }
  }

  /**
   * Create a table
   *
   * @param table - Table name
   * @param schema - Table schema (CREATE TABLE query)
   * @param options - Additional options
   */
  async createTable(
    table: string,
    schema: {
      columns: Array<{ name: string; type: string }>;
      engine: string;
      orderBy?: string[];
      partitionBy?: string;
      primaryKey?: string[];
    },
    options?: { ifNotExists?: boolean; cluster?: string }
  ): Promise<void> {
    const columns = schema.columns.map((c) => `${c.name} ${c.type}`).join(',\n  ');

    const query = `CREATE TABLE ${options?.ifNotExists ? 'IF NOT EXISTS' : ''} ${this.escapeIdentifier(table)}${options?.cluster ? ` ON CLUSTER ${options.cluster}` : ''
      }
(
  ${columns}
) ENGINE = ${schema.engine}
${schema.orderBy ? `ORDER BY (${schema.orderBy.join(', ')})` : ''}
${schema.partitionBy ? `PARTITION BY ${schema.partitionBy}` : ''}
${schema.primaryKey ? `PRIMARY KEY (${schema.primaryKey.join(', ')})` : ''}`;

    await this.client.command({ query });
    console.log(`[ClickHouseClient] Table ${table} created`);
  }

  /**
   * Drop a table
   *
   * @param table - Table name
   * @param options - Additional options
   */
  async dropTable(table: string, options?: { ifExists?: boolean; cluster?: string }): Promise<void> {
    const query = `DROP TABLE ${options?.ifExists ? 'IF EXISTS' : ''} ${this.escapeIdentifier(table)}${options?.cluster ? ` ON CLUSTER ${options.cluster}` : ''
      }`;

    await this.client.command({ query });
    console.log(`[ClickHouseClient] Table ${table} dropped`);
  }

  /**
   * Truncate a table
   *
   * @param table - Table name
   * @param options - Additional options
   */
  async truncateTable(table: string, options?: { cluster?: string }): Promise<void> {
    const query = `TRUNCATE TABLE ${this.escapeIdentifier(table)}${options?.cluster ? ` ON CLUSTER ${options.cluster}` : ''
      }`;

    await this.client.command({ query });
    console.log(`[ClickHouseClient] Table ${table} truncated`);
  }

  /**
   * Get table schema
   *
   * @param table - Table name
   * @returns Table schema
   */
  async getTableSchema(table: string): Promise<Array<{ name: string; type: string; default_kind?: string }>> {
    const query = `DESCRIBE TABLE ${this.escapeIdentifier(table)}`;
    const result = await this.query<{
      name: string;
      type: string;
      default_type: string;
    }>(query);

    return result.data.map((col) => ({
      name: col.name,
      type: col.type,
      default_kind: col.default_type,
    }));
  }

  /**
   * List all tables in the current database
   *
   * @returns List of table names
   */
  async listTables(): Promise<string[]> {
    const query = 'SHOW TABLES';
    const result = await this.query<{ name: string }>(query);

    return result.data.map((row) => row.name);
  }

  /**
   * Get database size
   *
   * @returns Database size in bytes
   */
  async getDatabaseSize(): Promise<{ tables: number; rows: number; bytes: number }> {
    const query = `
      SELECT
        count() as tables,
        sum(rows) as rows,
        sum(bytes_on_disk) as bytes
      FROM system.parts
      WHERE active AND database = currentDatabase()
    `;

    const result = await this.queryOne<{ tables: string; rows: string; bytes: string }>(query);

    return {
      tables: result ? parseInt(result.tables, 10) : 0,
      rows: result ? parseInt(result.rows, 10) : 0,
      bytes: result ? parseInt(result.bytes, 10) : 0,
    };
  }

  /**
   * Health check
   *
   * @returns True if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the underlying ClickHouse client
   *
   * Use this for advanced operations not covered by the wrapper.
   *
   * @returns ClickHouse client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Close the client connection
   */
  async close(): Promise<void> {
    await this.client.close();
    console.log('[ClickHouseClient] Connection closed');
  }

  /**
   * Escape an identifier (table name, column name, etc.)
   *
   * @param identifier - Identifier to escape
   * @returns Escaped identifier
   */
  private escapeIdentifier(identifier: string): string {
    // ClickHouse uses backticks for identifiers
    return `\`${identifier.replace(/`/g, '``')}\``;
  }
}

/**
 * Create a ClickHouse client
 *
 * @param config - ClickHouse configuration
 * @returns ClickHouseClient instance
 *
 * @example
 * ```ts
 * import { createClickHouseClient } from '@oxlayer/capabilities-adapters-clickhouse';
 *
 * const ch = createClickHouseClient({
 *   host: 'http://localhost',
 *   port: 8123,
 *   database: 'analytics',
 * });
 * ```
 */
export function createClickHouseClient(config: ClickHouseConfig): ClickHouseClient {
  return new ClickHouseClient(config);
}

/**
 * Create a default ClickHouse client from environment variables
 *
 * Environment variables:
 * - CLICKHOUSE_HOST
 * - CLICKHOUSE_PORT
 * - CLICKHOUSE_DATABASE
 * - CLICKHOUSE_USERNAME
 * - CLICKHOUSE_PASSWORD
 *
 * @param config - Optional config overrides
 * @returns ClickHouseClient instance
 */
export function createDefaultClickHouseClient(config?: Partial<ClickHouseConfig>): ClickHouseClient {
  return createClickHouseClient({
    host: config?.host || process.env.CLICKHOUSE_HOST || 'http://localhost',
    port: config?.port || Number(process.env.CLICKHOUSE_PORT) || 8123,
    database: config?.database || process.env.CLICKHOUSE_DATABASE || 'default',
    username: config?.username || process.env.CLICKHOUSE_USERNAME,
    password: config?.password || process.env.CLICKHOUSE_PASSWORD,
    tls: config?.tls,
    request_timeout: config?.request_timeout,
    max_retries: config?.max_retries,
    compression: config?.compression,
    clickhouse_client_name: config?.clickhouse_client_name,
  });
}
