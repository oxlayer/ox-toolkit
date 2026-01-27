import type pg from 'pg';
import type { PostgresClient } from './client.js';
import type { TransactionOptions } from './types.js';
import type { QueryResultRow } from 'pg';

/**
 * Transaction callback type
 */
type TransactionCallback<T> = (client: pg.PoolClient) => Promise<T>;

/**
 * Execute a callback within a transaction
 *
 * The transaction will be committed if the callback succeeds,
 * or rolled back if the callback throws an error.
 *
 * @param client - PostgresClient instance
 * @param callback - Callback to execute within the transaction
 * @param options - Transaction options
 * @returns Result of the callback
 *
 * @example
 * ```ts
 * import { withTransaction } from '@oxlayer/capabilities-adapters-postgres';
 *
 * const result = await withTransaction(pg, async (client) => {
 *   await client.query('INSERT INTO users (name) VALUES ($1)', { params: ['John'] });
 *   await client.query('INSERT INTO posts (user_id, title) VALUES ($1, $2)', { params: [1, 'Hello'] });
 *   return { success: true };
 * });
 * ```
 */
export async function withTransaction<T>(
  client: PostgresClient,
  callback: TransactionCallback<T>,
  options?: TransactionOptions
): Promise<T> {
  const poolClient = await client.getClient();

  try {
    await beginTransaction(poolClient, options);

    const result = await callback(poolClient);

    await poolClient.query('COMMIT');

    return result;
  } catch (error) {
    await poolClient.query('ROLLBACK');
    throw error;
  } finally {
    poolClient.release();
  }
}

/**
 * Begin a transaction
 *
 * @param client - Pool client
 * @param options - Transaction options
 */
async function beginTransaction(client: pg.PoolClient, options?: TransactionOptions): Promise<void> {
  const sqlParts = ['BEGIN'];

  if (options?.isolationLevel) {
    sqlParts.push(`ISOLATION LEVEL ${options.isolationLevel}`);
  }

  if (options?.readOnly) {
    sqlParts.push('READ ONLY');
  }

  if (options?.deferrable !== undefined) {
    sqlParts.push(options.deferrable ? 'DEFERRABLE' : 'NOT DEFERRABLE');
  }

  await client.query(sqlParts.join(' '));
}

/**
 * Transaction class for manual transaction control
 *
 * @example
 * ```ts
 * import { Transaction } from '@oxlayer/capabilities-adapters-postgres';
 *
 * const tx = await Transaction.begin(pg);
 * try {
 *   await tx.query('INSERT INTO users (name) VALUES ($1)', { params: ['John'] });
 *   await tx.query('INSERT INTO posts (user_id, title) VALUES ($1, $2)', { params: [1, 'Hello'] });
 *   await tx.commit();
 * } catch (error) {
 *   await tx.rollback();
 *   throw error;
 * }
 * ```
 */
export class Transaction {
  private client: pg.PoolClient;
  private committed = false;
  private rolledBack = false;

  private constructor(client: pg.PoolClient) {
    this.client = client;
  }

  /**
   * Begin a new transaction
   *
   * @param postgresClient - PostgresClient instance
   * @param options - Transaction options
   * @returns Transaction instance
   */
  static async begin(postgresClient: PostgresClient, options?: TransactionOptions): Promise<Transaction> {
    const client = await postgresClient.getClient();

    await beginTransaction(client, options);

    return new Transaction(client);
  }

  /**
   * Execute a query within the transaction
   *
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Query result
   */
  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction has already been closed');
    }

    return this.client.query<T>(sql, params);
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction has already been closed');
    }

    await this.client.query('COMMIT');
    this.committed = true;
    this.client.release();
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction has already been closed');
    }

    await this.client.query('ROLLBACK');
    this.rolledBack = true;
    this.client.release();
  }

  /**
   * Check if the transaction is still active
   */
  isActive(): boolean {
    return !this.committed && !this.rolledBack;
  }
}
