---
title: PostgreSQL Adapter
sidebar_label: PostgreSQL
description: PostgreSQL adapter for simplified database operations with connection pooling and query execution
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# @oxlayer/capabilities-adapters-postgres

PostgreSQL adapter for @oxlayer/capabilities. Provides a simplified interface for PostgreSQL operations with automatic connection pooling and query execution.

## Features

- Simplified PostgreSQL client with connection pooling
- Parameterized queries for SQL injection prevention
- CRUD helper methods (insert, update, delete)
- Query execution (query, queryOne, queryScalar)
- Connection pool management
- Health check
- Automatic query logging with timing
- Transaction support via pool client

## Installation

```bash
bun add @oxlayer/capabilities-adapters-postgres
```

## Dependencies

```bash
bun add pg pg-pool
```

## Usage

### Basic Setup

```typescript
import { createPostgresClient } from '@oxlayer/capabilities-adapters-postgres';

const pg = createPostgresClient({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'pass',
});

// Execute query
const result = await pg.query<User>('SELECT * FROM users WHERE id = $1', {
  params: [1],
});

console.log(result.rows);
console.log(result.rowCount);
```

### Query Variants

```typescript
// Query multiple rows
const users = await pg.query<User>('SELECT * FROM users WHERE active = $1', {
  params: [true],
});

// Query single row
const user = await pg.queryOne<User>('SELECT * FROM users WHERE email = $1', {
  params: ['user@example.com'],
});

// Query scalar value
const count = await pg.queryScalar<number>('SELECT COUNT(*) FROM users');
```

### CRUD Operations

```typescript
// Insert
const user = await pg.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});
console.log(user); // Inserted row with ID

// Update
const updated = await pg.update(
  'users',
  { name: 'John Updated', email: 'john@example.com' }, // data
  'email = $1',                                        // where clause
  ['john@example.com'],                                // where params
  'id, name, email'                                    // returning columns
);

// Delete
const deleted = await pg.delete('users', 'id = $1', [1]);
```

### Environment Variables

```typescript
import { createDefaultPostgresClient } from '@oxlayer/capabilities-adapters-postgres';

const pg = createDefaultPostgresClient();

// Uses environment variables:
// PG_HOST=localhost
// PG_PORT=5432
// PG_DATABASE=mydb
// PG_USER=user
// PG_PASSWORD=pass
```

### Transactions

```typescript
// Get a client from the pool for transactions
const client = await pg.getClient();

try {
  await client.query('BEGIN');

  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('INSERT INTO logs (action) VALUES ($1)', ['created']);

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Pool Statistics

```typescript
const stats = pg.getPoolStats();
console.log(stats.totalCount);   // Total connections
console.log(stats.idleCount);    // Idle connections
console.log(stats.waitingCount); // Clients waiting for connection
```

## API Reference

### `PostgresClient`

Main client class for PostgreSQL operations.

#### Constructor

```typescript
constructor(config: PostgresConfig)
```

**Config:**
- `host` - Database host (default: `localhost`)
- `port` - Database port (default: `5432`)
- `database` - Database name (required)
- `user` - Database user (required)
- `password` - Database password (required)
- `connectionTimeoutMillis` - Connection timeout (default: `10000`)
- `idleTimeoutMillis` - Idle timeout (default: `30000`)
- `max` - Max pool size (default: `20`)
- `min` - Min pool size (default: `2`)
- `ssl` - SSL configuration
- `application_name` - Application name (default: `'staples-postgres'`)

#### Methods

##### `query<T>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>`

Execute a query and return results.

**Options:**
- `params` - Query parameters for parameterized queries

**Returns:**
- `rows` - Result rows
- `rowCount` - Number of rows
- `fields` - Field metadata

##### `queryOne<T>(sql: string, options?: QueryOptions): Promise<T | null>`

Execute query and return first row.

##### `queryScalar<T>(sql: string, options?: QueryOptions): Promise<T | null>`

Execute query and return scalar value (first column of first row).

##### `insert<T>(table: string, data: Record<string, unknown>, returning?: string): Promise<T>`

Insert a row and return the inserted row.

##### `update<T>(table: string, data: Record<string, unknown>, where: string, whereParams?: unknown[], returning?: string): Promise<T[]>`

Update rows and return the updated rows.

##### `delete(table: string, where: string, params?: unknown[]): Promise<number>`

Delete rows and return count.

##### `getPool(): Pool`

Get the underlying pg pool.

##### `getClient(): Promise<PoolClient>`

Get a client from the pool for transactions.

##### `healthCheck(): Promise<boolean>`

Check if connection is healthy.

##### `close(): Promise<void>`

Close all connections in the pool.

##### `getPoolStats(): PoolStats`

Get pool statistics.

## Types

### `PostgresConfig`

```typescript
interface PostgresConfig {
  host?: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
  min?: number;
  ssl?: any;
  application_name?: string;
}
```

### `QueryOptions`

```typescript
interface QueryOptions {
  params?: unknown[];
}
```

### `QueryResult<T>`

```typescript
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  fields: any[];
}
```

### `PoolStats`

```typescript
interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}
```

## Parameterized Queries

Always use parameterized queries to prevent SQL injection:

```typescript
// Safe - parameterized
await pg.query('SELECT * FROM users WHERE id = $1', { params: [userId] });

// Unsafe - never do this
await pg.query(`SELECT * FROM users WHERE id = ${userId}`);
```

## Connection Pool Events

The client logs pool events:

```typescript
// New client connected
// [PostgresClient] New client connected

// Client removed
// [PostgresClient] Client removed

// Unexpected error
// [PostgresClient] Unexpected error: ...
```

## Best Practices

1. **Use parameterized queries**: Prevent SQL injection
2. **Monitor pool stats**: Check `getPoolStats()` periodically
3. **Release clients**: Always release pool clients when done
4. **Use transactions**: For multi-step operations
5. **Handle connection errors**: Implement retry logic

## Transaction Pattern

```typescript
const transaction = async (callback: (client: PoolClient) => Promise<void>) => {
  const client = await pg.getClient();
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Usage
await transaction(async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('INSERT INTO logs (action) VALUES ($1)', ['created']);
});
```

## Error Handling

```typescript
try {
  await pg.query('SELECT * FROM nonexistent_table');
} catch (error) {
  if (error.code === '42P01') {
    console.error('Table not found');
  } else {
    console.error('Query failed:', error);
  }
}
```
