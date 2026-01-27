/**
 * PostgreSQL Configuration
 *
 * Simple configuration for postgres-js connection with optional auto-migration.
 */
export interface PostgresConfig {
  /**
   * Database host
   * @default 'localhost'
   */
  host?: string;

  /**
   * Database port
   * @default 5432
   */
  port?: number;

  /**
   * Database name
   */
  database: string;

  /**
   * Database user
   * @default 'postgres'
   */
  user?: string;

  /**
   * Database password
   */
  password: string;

  /**
   * Maximum connections in pool
   * @default 20
   */
  max?: number;

  /**
   * Idle timeout in seconds before closing a connection
   * @default 30
   */
  idle_timeout?: number;

  /**
   * Connection timeout in seconds
   * @default 10
   */
  connect_timeout?: number;

  /**
   * Enable auto-migration on connection
   * @default true
   */
  autoMigrate?: boolean;

  /**
   * SQL to run for migration (when autoMigrate is true)
   */
  migrationSQL?: string;
}

/**
 * Drizzle database instance
 *
 * Use type from drizzle-orm/postgres-js
 */
export type DrizzleDb = ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>;

/**
 * Postgres-js instance
 */
export type PostgresJs = ReturnType<typeof import('postgres')>;
