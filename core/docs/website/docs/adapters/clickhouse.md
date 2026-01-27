---
title: ClickHouse Adapter
sidebar_label: ClickHouse
description: ClickHouse adapter for analytics and time-series data with connection management and query execution
---

# @oxlayer/capabilities-adapters-clickhouse

ClickHouse adapter for @oxlayer/capabilities. Provides a simplified interface for ClickHouse operations with automatic connection management, query execution, and data insertion.

## Features

- Simplified ClickHouse client with connection pooling
- Query execution with parameter binding
- Batch data insertion
- Table management (create, drop, truncate)
- Collection and table statistics
- Health check
- Compression support (LZ4, ZSTD)
- TLS/SSL support
- Automatic query logging with timing

## Installation

```bash
bun add @oxlayer/capabilities-adapters-clickhouse
```

## Dependencies

```bash
bun add @clickhouse/client
```

## Usage

### Basic Setup

```typescript
import { createClickHouseClient } from '@oxlayer/capabilities-adapters-clickhouse';

const ch = createClickHouseClient({
  host: 'http://localhost',
  port: 8123,
  database: 'analytics',
  username: 'default',
  password: '',
});

// Execute query
const result = await ch.query('SELECT * FROM events WHERE date >= {min_date:Date}', {
  params: { min_date: '2024-01-01' },
});

console.log(result.data);
console.log(result.rows);
console.log(result.statistics);
```

### Query Variants

```typescript
// Query multiple rows
const users = await ch.query<User>('SELECT * FROM users');

// Query single row
const user = await ch.queryOne<User>('SELECT * FROM users WHERE id = {id:UInt32}', {
  params: { id: 1 },
});

// Query scalar value
const count = await ch.queryScalar<number>('SELECT count() FROM users');
```

### Data Insertion

```typescript
// Insert single record
await ch.insert({
  table: 'events',
  data: [{
    timestamp: '2024-01-12 10:00:00',
    user_id: '123',
    action: 'click',
  }],
  format: 'JSONEachRow',
});

// Insert multiple records
await ch.insert({
  table: 'events',
  data: eventsArray,
  format: 'JSONEachRow',
});
```

### Table Management

```typescript
// Create table
await ch.createTable('events', {
  columns: [
    { name: 'timestamp', type: 'DateTime' },
    { name: 'user_id', type: 'String' },
    { name: 'action', type: 'String' },
  ],
  engine: 'MergeTree()',
  orderBy: ['timestamp'],
  partitionBy: 'toYYYYMM(timestamp)',
});

// Drop table
await ch.dropTable('events', { ifExists: true });

// Truncate table
await ch.truncateTable('events');

// Get table schema
const schema = await ch.getTableSchema('events');

// List tables
const tables = await ch.listTables();
```

### Environment Variables

```typescript
import { createDefaultClickHouseClient } from '@oxlayer/capabilities-adapters-clickhouse';

const ch = createDefaultClickHouseClient();

// Uses environment variables:
// CLICKHOUSE_HOST=http://localhost
// CLICKHOUSE_PORT=8123
// CLICKHOUSE_DATABASE=default
// CLICKHOUSE_USERNAME=default
// CLICKHOUSE_PASSWORD=
```

### Cluster Operations

```typescript
// Create table on cluster
await ch.createTable('events', schema, {
  ifNotExists: true,
  cluster: 'my-cluster',
});

// Drop table on cluster
await ch.dropTable('events', {
  cluster: 'my-cluster',
});
```

## API Reference

### `ClickHouseClient`

Main client class for ClickHouse operations.

#### Constructor

```typescript
constructor(config: ClickHouseConfig)
```

**Config Parameters:**
- `host` - ClickHouse server URL (default: `http://localhost`)
- `port` - Port number (default: `8123`)
- `database` - Database name (default: `default`)
- `username` - Username (default: `default`)
- `password` - Password (default: empty string)
- `request_timeout` - Request timeout in milliseconds (default: `30000`)
- `max_retries` - Maximum retry attempts (default: `3`)
- `compression` - Compression type: `'lz4'`, `'zstd'`, or `'none'` (default: `'lz4'`)
- `clickhouse_client_name` - Client name for identification (default: `'staples-clickhouse'`)
- `tls` - Enable TLS/SSL (default: `false`)

#### Methods

##### `query<T>(query: string, options?: QueryOptions): Promise<QueryResult<T>>`

Execute a query and return results.

**Options:**
- `params` - Query parameters for parameterized queries
- `format` - Response format (default: `'JSON'`)
- `settings` - ClickHouse settings

**Returns:**
- `data` - Result rows
- `rows` - Number of rows
- `metadata` - Column metadata
- `statistics` - Query statistics

##### `queryOne<T>(query: string, options?: QueryOptions): Promise<T | null>`

Execute query and return first row.

##### `queryScalar<T>(query: string, options?: QueryOptions): Promise<T | null>`

Execute query and return scalar value (first column of first row).

##### `insert(options: InsertOptions): Promise<void>`

Insert data into a table.

**Options:**
- `table` - Table name
- `data` - Data to insert
- `format` - Data format (default: `'JSONEachRow'`)

##### `createTable(table, schema, options?): Promise<void>`

Create a table.

**Schema:**
- `columns` - Array of `{ name, type }`
- `engine` - ClickHouse engine (e.g., `'MergeTree()'`)
- `orderBy` - Order by columns
- `partitionBy` - Partition by expression
- `primaryKey` - Primary key columns

##### `dropTable(table, options?): Promise<void>`

Drop a table.

##### `truncateTable(table, options?): Promise<void>`

Truncate a table.

##### `getTableSchema(table): Promise<Array<{ name, type }>>`

Get table schema.

##### `listTables(): Promise<string[]>`

List all tables in current database.

##### `getDatabaseSize(): Promise<{ tables, rows, bytes }>`

Get database size statistics.

##### `healthCheck(): Promise<boolean>`

Check if connection is healthy.

##### `getClient(): ClickHouseClient`

Get underlying ClickHouse client for advanced operations.

##### `close(): Promise<void>`

Close the connection.

## Types

### `ClickHouseConfig`

```typescript
interface ClickHouseConfig {
  host: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  request_timeout?: number;
  max_retries?: number;
  compression?: 'lz4' | 'zstd' | 'none';
  clickhouse_client_name?: string;
  tls?: boolean;
}
```

### `QueryOptions`

```typescript
interface QueryOptions {
  params?: Record<string, unknown>;
  format?: string;
  settings?: Record<string, unknown>;
}
```

### `QueryResult<T>`

```typescript
interface QueryResult<T> {
  data: T[];
  rows: number;
  metadata?: {
    names: string[];
    types: string[];
  };
  statistics?: {
    rows_read: number;
    bytes_read: number;
    elapsed: number;
  };
}
```

### `InsertOptions`

```typescript
interface InsertOptions {
  table: string;
  data: unknown[];
  format?: string;
}
```

## Parameterized Queries

Use named parameters in your queries:

```typescript
await ch.query(
  'SELECT * FROM users WHERE id = {id:UInt32} AND status = {status:String}',
  { params: { id: 123, status: 'active' } }
);
```

## Performance Tips

1. **Use batch inserts**: Insert multiple rows at once
2. **Enable compression**: Use LZ4 or ZSTD for better performance
3. **Use appropriate formats**: JSONEachRow for batch inserts
4. **Set reasonable timeouts**: Adjust based on query complexity
5. **Monitor statistics**: Check `statistics` for query performance

## Error Handling

The adapter logs all query errors and rethrows them for handling:

```typescript
try {
  await ch.query('INVALID SQL');
} catch (error) {
  console.error('Query failed:', error);
}
```

## Best Practices

1. **Use connection pooling**: Reuse client instances
2. **Parameterize queries**: Prevent SQL injection and improve caching
3. **Batch operations**: Group inserts and updates
4. **Monitor performance**: Use query statistics
5. **Handle timeouts**: Set appropriate timeouts for long-running queries
