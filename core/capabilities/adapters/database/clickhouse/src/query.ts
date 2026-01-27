import type { ClickHouseClient } from './client.js';
import type { QueryOptions } from './types.js';

/**
 * Query builder for ClickHouse
 *
 * Provides a fluent interface for building ClickHouse queries.
 *
 * @example
 * ```ts
 * import { createClickHouseClient, QueryBuilder } from '@oxlayer/capabilities-adapters-clickhouse';
 *
 * const ch = createClickHouseClient({ host: 'http://localhost', port: 8123 });
 *
 * const result = await new QueryBuilder(ch)
 *   .select('user_id', 'count() as count')
 *   .from('events')
 *   .where('date >= {min_date:Date}', { min_date: '2024-01-01' })
 *   .groupBy('user_id')
 *   .orderBy('count', 'DESC')
 *   .limit(10)
 *   .execute();
 * ```
 */
export class QueryBuilder {
  private selectClause: string[] = [];
  private fromClause = '';
  private whereClause: string[] = [];
  private groupByClause: string[] = [];
  private havingClause: string[] = [];
  private orderByClause: string[] = [];
  private limitClause = '';
  private offsetClause = '';
  private params: Record<string, unknown> = {};

  constructor(private client: ClickHouseClient) { }

  /**
   * SELECT clause
   */
  select(...columns: string[]): this {
    this.selectClause.push(...columns);
    return this;
  }

  /**
   * FROM clause
   */
  from(table: string): this {
    this.fromClause = table;
    return this;
  }

  /**
   * WHERE clause
   */
  where(condition: string, queryParams?: Record<string, unknown>): this {
    this.whereClause.push(condition);
    if (queryParams) {
      Object.assign(this.params, queryParams);
    }
    return this;
  }

  /**
   * AND WHERE clause
   */
  andWhere(condition: string, queryParams?: Record<string, unknown>): this {
    return this.where(condition, queryParams);
  }

  /**
   * OR WHERE clause
   */
  orWhere(condition: string, queryParams?: Record<string, unknown>): this {
    this.whereClause.push(`OR ${condition}`);
    if (queryParams) {
      Object.assign(this.params, queryParams);
    }
    return this;
  }

  /**
   * GROUP BY clause
   */
  groupBy(...columns: string[]): this {
    this.groupByClause.push(...columns);
    return this;
  }

  /**
   * HAVING clause
   */
  having(condition: string, queryParams?: Record<string, unknown>): this {
    this.havingClause.push(condition);
    if (queryParams) {
      Object.assign(this.params, queryParams);
    }
    return this;
  }

  /**
   * ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClause.push(`${column} ${direction}`);
    return this;
  }

  /**
   * LIMIT clause
   */
  limit(count: number): this {
    this.limitClause = count.toString();
    return this;
  }

  /**
   * OFFSET clause
   */
  offset(count: number): this {
    this.offsetClause = count.toString();
    return this;
  }

  /**
   * Build the query string
   */
  build(): string {
    const parts: string[] = [];

    // SELECT
    if (this.selectClause.length === 0) {
      parts.push('SELECT *');
    } else {
      parts.push(`SELECT ${this.selectClause.join(', ')}`);
    }

    // FROM
    if (this.fromClause) {
      parts.push(`FROM ${this.fromClause}`);
    }

    // WHERE
    if (this.whereClause.length > 0) {
      parts.push(`WHERE ${this.whereClause.join(' ')}`);
    }

    // GROUP BY
    if (this.groupByClause.length > 0) {
      parts.push(`GROUP BY ${this.groupByClause.join(', ')}`);
    }

    // HAVING
    if (this.havingClause.length > 0) {
      parts.push(`HAVING ${this.havingClause.join(' ')}`);
    }

    // ORDER BY
    if (this.orderByClause.length > 0) {
      parts.push(`ORDER BY ${this.orderByClause.join(', ')}`);
    }

    // LIMIT
    if (this.limitClause) {
      parts.push(`LIMIT ${this.limitClause}`);
    }

    // OFFSET
    if (this.offsetClause) {
      parts.push(`OFFSET ${this.offsetClause}`);
    }

    return parts.join('\n');
  }

  /**
   * Get the query parameters
   */
  getParams(): Record<string, unknown> {
    return { ...this.params };
  }

  /**
   * Execute the query
   */
  async execute<T = unknown>(options?: QueryOptions): Promise<Awaited<ReturnType<typeof ClickHouseClient.prototype.query<T>>>> {
    const query = this.build();
    const mergedParams = { ...this.params, ...options?.params };

    return this.client.query<T>(query, {
      ...options,
      params: mergedParams,
    });
  }

  /**
   * Execute the query and return the first row
   */
  async executeOne<T = unknown>(options?: QueryOptions): Promise<T | null> {
    const result = await this.execute<T>(options);
    return result.data[0] || null;
  }

  /**
   * Get the query string (for debugging)
   */
  toString(): string {
    return this.build();
  }
}

/**
 * Create a query builder
 *
 * @param client - ClickHouseClient instance
 * @returns QueryBuilder instance
 */
export function createQueryBuilder(client: ClickHouseClient): QueryBuilder {
  return new QueryBuilder(client);
}
