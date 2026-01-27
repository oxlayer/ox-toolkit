---
title: MongoDB Tenancy Adapter
sidebar_label: MongoDB Tenancy
description: MongoDB multi-tenant adapter supporting multiple isolation strategies
---

# @oxlayer/capabilities-adapters-mongo-tenancy

MongoDB multi-tenant adapter supporting multiple isolation strategies. Works with **any client database schema** - automatically adds `tenant_id` to documents.

## Features

- **Shared Isolation** (B2C): Single database with `tenant_id` field filtering
- **Collection Isolation**: Separate collection per tenant (prefix-based)
- **Database Isolation** (B2B): Separate database per tenant
- **Automatic tenant_id Injection**: Transparently adds `tenant_id` to all documents
- **Dynamic Indexing**: Automatically creates `tenant_id` indexes on all collections
- **Connection Pooling**: Efficient resource management for tenant databases

## Installation

```bash
pnpm add @oxlayer/capabilities-adapters-mongo-tenancy
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareMongo } from '@oxlayer/capabilities-adapters-mongo-tenancy';
import { MongoClient } from 'mongodb';

// Create shared MongoDB client
const client = new MongoClient(process.env.MONGODB_URL);
await client.connect();

// Create tenancy-aware MongoDB adapter
const tenantMongo = createTenancyAwareMongo({
  tenantResolver,
  bitwardenClient,
  sharedClient: client,
  defaultDatabase: 'app',
});

// Enable tenant_id indexing on all collections
await tenantMongo.enableTenantIndexing();

// Resolve database for a tenant
const db = await tenantMongo.resolve('acme-corp');
```

### Automatic tenant_id Injection

```typescript
const users = db.collection('users');

// Insert automatically adds tenant_id
await users.insertOne({ name: 'John', email: 'john@example.com' });
// Inserted: { tenant_id: 'acme-corp', name: 'John', email: 'john@example.com' }

// Find automatically filters by tenant_id
const user = await users.findOne({ email: 'john@example.com' });
// Query: { email: 'john@example.com', tenant_id: 'acme-corp' }

// Update automatically filters by tenant_id
await users.updateOne(
  { email: 'john@example.com' },
  { $set: { name: 'John Doe' } }
);
// Query: { email: 'john@example.com', tenant_id: 'acme-corp' }

// Aggregate automatically prepends tenant_id match
const results = await users.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);
// Pipeline: [{ $match: { tenant_id: 'acme-corp' } }, { $group: ... }]
```

### Dynamic Indexing

```typescript
const result = await tenantMongo.enableTenantIndexing();

console.log(result);
// {
//   collections: ['users', 'products', 'orders', ...],
//   indexesCreated: ['products', 'orders'],  // collections that got tenant_id index
//   errors: []
// }
```

**What it does:**
1. Lists all collections in the database
2. Checks if `tenant_id` index exists
3. Creates `tenant_id` index if missing (background: true)

### Configuration

```typescript
interface TenancyAwareMongoConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;

  /** Bitwarden secrets client for credential resolution */
  bitwardenClient: BitwardenSecretsClient;

  /** Shared MongoDB client (for B2C tenants with isolation="shared") */
  sharedClient: MongoClient;

  /** Default database name */
  defaultDatabase: string;

  /** Custom connection pool (optional) */
  connectionPool?: MongoConnectionPool;
}
```

## Isolation Strategies

### Shared (B2C)

Single database with `tenant_id` field filtering:

```typescript
// Tenant configuration: { isolation: { database: 'shared' } }
const db = await tenantMongo.resolve('acme-corp');

// All operations automatically inject/filter by tenant_id
await db.collection('users').insertOne({ name: 'John' });
// Document: { tenant_id: 'acme-corp', name: 'John' }
```

### Collection (B2B)

Separate collection per tenant using prefix:

```typescript
// Tenant configuration: { isolation: { database: 'collection' } }
const db = await tenantMongo.resolve('acme-corp');

// Collections are prefixed: tenant_acme-corp_users
await db.collection('users').insertOne({ name: 'John' });
// Inserted into collection: "tenant_acme-corp_users"
```

### Database (B2B Enterprise)

Separate database instance per tenant:

```typescript
// Tenant configuration: { isolation: { database: 'database' } }
const db = await tenantMongo.resolve('acme-corp');

// No tenant_id injection - database is isolated
await db.collection('users').insertOne({ name: 'John' });
// Document: { name: 'John' } (no tenant_id needed)
```

## API

### `TenancyAwareMongo`

```typescript
class TenancyAwareMongo {
  /** Resolve MongoDB client for tenant */
  async resolve(tenantId: string): Promise<MongoClientInterface>;

  /** Enable tenant_id indexing on all collections */
  async enableTenantIndexing(): Promise<IndexingResult>;

  /** Close all database connections */
  async closeAll(): Promise<void>;

  /** Get pool statistics */
  getPoolStats(): PoolStats;

  /** Get underlying Db instance */
  db(name?: string): Db;
}
```

### `MongoClientInterface`

```typescript
interface MongoClientInterface {
  collection<T>(name: string): TenantScopedCollection<T>;
  database(name: string): any;
  db(name?: string): Db;
}
```

### `TenantScopedCollection<T>`

```typescript
interface TenantScopedCollection<T> {
  insertOne(doc: T): Promise<any>;
  insertMany(docs: T[]): Promise<any>;
  findOne(filter: any): Promise<T | null>;
  find(filter: any): Promise<T[]>;
  updateOne(filter: any, update: any): Promise<any>;
  updateMany(filter: any, update: any): Promise<any>;
  deleteOne(filter: any): Promise<any>;
  deleteMany(filter: any): Promise<any>;
  countDocuments(filter: any): Promise<number>;
  aggregate(pipeline: any[]): Promise<any[]>;
}
```

## How It Works

### Shared Mode

1. **Write Operations**: Inject `tenant_id` into documents
2. **Read Operations**: Filter queries by `tenant_id`
3. **Aggregations**: Prepend `$match` stage with `tenant_id`

### Collection Mode

1. Collections are prefixed with `tenant_{tenantId}_`
2. Example: `users` → `tenant_acme-corp_users`
3. No `tenant_id` field needed in documents

### Database Mode

1. Separate MongoDB database per tenant
2. Separate connection pool per tenant
3. No tenant filtering needed
