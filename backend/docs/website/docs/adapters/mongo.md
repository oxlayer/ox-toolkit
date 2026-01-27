---
title: MongoDB Adapter
sidebar_label: MongoDB
description: MongoDB adapter for simplified database operations with connection pooling and collection management
---

# @oxlayer/capabilities-adapters-mongo

MongoDB adapter for @oxlayer/capabilities. Provides a simplified interface for MongoDB operations with automatic connection pooling and collection management.

## Features

- Simplified MongoDB client with connection pooling
- CRUD operations (create, read, update, delete)
- Aggregation pipelines
- Index management
- Collection statistics
- Health check
- Automatic query logging with timing
- Support for transactions via pool client

## Installation

```bash
bun add @oxlayer/capabilities-adapters-mongo
```

## Dependencies

```bash
bun add mongodb
```

## Usage

### Basic Setup

```typescript
import { createMongoClient } from '@oxlayer/capabilities-adapters-mongo';

const mongo = createMongoClient({
  url: 'mongodb://localhost:27017',
  database: 'mydb',
});

await mongo.connect();

// Find documents
const users = await mongo.find('users', {
  filter: { age: { $gte: 18 } },
  sort: { createdAt: -1 },
  limit: 10,
});

// Find one document
const user = await mongo.findOne('users', {
  filter: { email: 'user@example.com' },
});

// Find by ID
const user = await mongo.findById('users', '507f1f77bcf86cd799439011');

await mongo.disconnect();
```

### Insert Operations

```typescript
// Insert single document
const user = await mongo.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});

// Insert multiple documents
const count = await mongo.insertMany('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
]);
console.log(`Inserted ${count} documents`);
```

### Update Operations

```typescript
// Update one document
const updated = await mongo.update('users',
  { email: 'john@example.com' }, // filter
  { $set: { age: 31 } },          // update
  { returnDocument: 'after' }     // options
);

// Update by ID
await mongo.updateById('users', '507f1f77bcf86cd799439011', {
  $set: { status: 'active' },
});

// Update multiple documents
const count = await mongo.updateMany('users',
  { status: 'pending' },
  { $set: { status: 'processed' } }
);
```

### Delete Operations

```typescript
// Delete one document
const deleted = await mongo.delete('users', { email: 'old@example.com' });

// Delete by ID
await mongo.deleteById('users', '507f1f77bcf86cd799439011');

// Delete multiple documents
const count = await mongo.deleteMany('users', { status: 'deleted' });
```

### Aggregation

```typescript
const results = await mongo.aggregate('users', [
  { $match: { age: { $gte: 18 } } },
  { $group: { _id: '$city', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```

### Index Management

```typescript
// Create single index
await mongo.createIndex('users', {
  keys: { email: 1 },
  options: { unique: true },
});

// Create multiple indexes
await mongo.createIndexes('users', [
  { keys: { email: 1 }, options: { unique: true } },
  { keys: { createdAt: -1 } },
  { keys: { name: 'text', email: 'text' } },
]);

// List indexes
const indexes = await mongo.listIndexes('users');

// Drop index
await mongo.dropIndex('users', 'email_1');
```

### Collection Management

```typescript
// Get collection statistics
const stats = await mongo.getCollectionStats('users');
console.log(stats.count, stats.size, stats.avgObjSize);

// List all collections
const collections = await mongo.listCollections();

// Drop collection
await mongo.dropCollection('temp_data');
```

### Environment Variables

```typescript
import { createDefaultMongoClient } from '@oxlayer/capabilities-adapters-mongo';

const mongo = createDefaultMongoClient();

// Uses environment variables:
// MONGO_URL=mongodb://localhost:27017
// MONGO_DATABASE=mydb
```

### Transactions

```typescript
// Get a client from the pool for transactions
const client = await mongo.getClient();
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    const db = client.db();

    await db.collection('users').insertOne({ name: 'Alice' }, { session });
    await db.collection('logs').insertOne({ action: 'created' }, { session });
  });
} finally {
  await session.endSession();
}
```

## API Reference

### `MongoClientWrapper`

Main client class for MongoDB operations.

#### Constructor

```typescript
constructor(config: MongoConfig)
```

**Config:**
- `url` - MongoDB connection string (required)
- `database` - Database name (required)
- `options` - Connection pool options
  - `maxPoolSize` - Maximum pool size (default: `20`)
  - `minPoolSize` - Minimum pool size (default: `2`)
  - `maxIdleTimeMS` - Max idle time (default: `60000`)
  - `connectTimeoutMS` - Connect timeout (default: `10000`)
  - `socketTimeoutMS` - Socket timeout (default: `45000`)
  - `serverSelectionTimeoutMS` - Server selection timeout (default: `30000`)
  - `appName` - Application name (default: `'staples-mongo'`)

#### Methods

##### `connect(): Promise<void>`

Connect to MongoDB.

##### `disconnect(): Promise<void>`

Disconnect from MongoDB.

##### `find<T>(collection, options?): Promise<T[]>`

Find documents in a collection.

**Options:**
- `filter` - Query filter
- `sort` - Sort specification
- `skip` - Number of documents to skip
- `limit` - Maximum number of documents to return
- `projection` - Field projection

##### `findOne<T>(collection, options?): Promise<T | null>`

Find a single document.

##### `findById<T>(collection, id): Promise<T | null>`

Find a document by ID.

##### `count<T>(collection, filter?): Promise<number>`

Count documents in a collection.

##### `insert<T>(collection, document): Promise<T>`

Insert a document and return the inserted document.

##### `insertMany<T>(collection, documents): Promise<number>`

Insert multiple documents and return count.

##### `update<T>(collection, filter, update, options?): Promise<T | null>`

Update a document and return the updated document.

##### `updateById<T>(collection, id, update, options?): Promise<T | null>`

Update a document by ID.

##### `updateMany<T>(collection, filter, update): Promise<number>`

Update multiple documents and return count.

##### `delete<T>(collection, filter): Promise<T | null>`

Delete a document and return it.

##### `deleteById<T>(collection, id): Promise<T | null>`

Delete a document by ID.

##### `deleteMany<T>(collection, filter): Promise<number>`

Delete multiple documents and return count.

##### `aggregate<T>(collection, pipeline): Promise<T[]>`

Execute an aggregation pipeline.

##### `createIndex(collection, spec): Promise<string>`

Create an index on a collection.

##### `createIndexes(collection, specs): Promise<string[]>`

Create multiple indexes.

##### `dropIndex(collection, indexName): Promise<void>`

Drop an index from a collection.

##### `listIndexes(collection): Promise<Array<{ name, key }>>`

List indexes on a collection.

##### `getCollectionStats(collection): Promise<CollectionStats>`

Get collection statistics.

##### `dropCollection(collection): Promise<void>`

Drop a collection.

##### `listCollections(): Promise<string[]>`

List all collections.

##### `healthCheck(): Promise<boolean>`

Check if connection is healthy.

##### `getClient(): MongoClient`

Get the underlying MongoDB client.

##### `getDb(): Db`

Get the underlying MongoDB Db instance.

##### `isConnected(): boolean`

Check if the client is connected.

## Types

### `MongoConfig`

```typescript
interface MongoConfig {
  url: string;
  database: string;
  options?: {
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    connectTimeoutMS?: number;
    socketTimeoutMS?: number;
    serverSelectionTimeoutMS?: number;
    appName?: string;
  };
}
```

### `FindOptions<T>`

```typescript
interface FindOptions<T> {
  filter?: Filter<T>;
  sort?: Sort;
  skip?: number;
  limit?: number;
  projection?: Record<string, 1 | 0>;
}
```

### `CollectionStats`

```typescript
interface CollectionStats {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  indexCount: number;
  indexSize: number;
}
```

## Query Operators

Use MongoDB query operators:

```typescript
// Comparison
await mongo.find('users', { filter: { age: { $gte: 18, $lt: 65 } } });

// Logical
await mongo.find('users', { filter: { $or: [{ active: true }, { verified: true }] } });

// Arrays
await mongo.find('posts', { filter: { tags: { $in: ['javascript', 'typescript'] } } });
```

## Best Practices

1. **Use connection pooling**: Reuse client across requests
2. **Index frequently queried fields**: Create appropriate indexes
3. **Use projections**: Limit returned fields for better performance
4. **Monitor connection pool**: Check pool statistics
5. **Handle transactions**: Use sessions for multi-document operations

## Error Handling

The adapter logs all query errors:

```typescript
try {
  await mongo.find('users', { filter: { $invalid: true } });
} catch (error) {
  console.error('Query failed:', error);
}
```
