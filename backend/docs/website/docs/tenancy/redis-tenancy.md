---
title: Redis Tenancy Adapter
sidebar_label: Redis Tenancy
description: Redis multi-tenant cache adapter supporting multiple isolation strategies
---

# @oxlayer/capabilities-adapters-redis-tenancy

Redis multi-tenant cache adapter supporting multiple isolation strategies. Works with **any client keyspace** - automatic `{tenantId}:` prefixing for Redis Cluster compatibility.

## Features

- **Shared Isolation** (B2C): Single Redis instance with tenant-prefixed keys
- **Database Isolation**: Separate Redis database per tenant
- **Dedicated Isolation** (B2B): Separate Redis instance per tenant
- **Automatic Key Prefixing**: Transparently prefixes all keys with `{tenantId}:`
- **Redis Cluster Compatible**: Uses `{tenantId}:key` format for hash slot consistency
- **Connection Pooling**: Efficient resource management for tenant connections

## Installation

```bash
pnpm add @oxlayer/capabilities-adapters-redis-tenancy
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareCache } from '@oxlayer/capabilities-adapters-redis-tenancy';

// Create tenancy-aware cache adapter
const tenantCache = createTenancyAwareCache({
  tenantResolver,
  bitwardenClient,
  baseCache: redisCache,
});

// Resolve cache for a tenant
const cache = await tenantCache.resolve('acme-corp');

// All keys are automatically prefixed with {tenantId}:
await cache.set('user:123', userData);
// Stored as: {acme-corp}:user:123
```

### Automatic Key Prefixing

```typescript
const cache = await tenantCache.resolve('acme-corp');

// All operations automatically use tenant prefix
await cache.set('user:123', { name: 'John' });
// Redis key: {acme-corp}:user:123

await cache.get('user:123');
// Retrieves: {acme-corp}:user:123

await cache.del('user:123');
// Deletes: {acme-corp}:user:123

await cache.has('user:123');
// Checks: {acme-corp}:user:123

// Bulk operations
await cache.setMany(new Map([
  ['user:1', data1],
  ['user:2', data2],
]));
// Stores: {acme-corp}:user:1, {acme-corp}:user:2

await cache.getMany(['user:1', 'user:2']);
// Retrieves: {acme-corp}:user:1, {acme-corp}:user:2

// Clear all tenant keys
await cache.clear();
// Deletes: {acme-corp}:*
```

### Configuration

```typescript
interface TenancyAwareCacheConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;

  /** Base cache implementation (shared Redis) */
  baseCache: Cache;

  /** Bitwarden secrets client for credential resolution */
  bitwardenClient: BitwardenSecretsClient;

  /** Redis connection pool (optional) */
  connectionPool?: RedisConnectionPool;

  /** Key prefix format (default: 'colon') */
  keyPrefixFormat?: 'colon' | 'underscore' | 'custom';

  /** Custom prefix formatter (if keyPrefixFormat is 'custom') */
  customPrefixFormatter?: (tenantId: string) => string;
}
```

### Custom Prefix Format

```typescript
const tenantCache = createTenancyAwareCache({
  tenantResolver,
  bitwardenClient,
  baseCache: redisCache,
  keyPrefixFormat: 'colon',     // {tenantId}:key  (default, cluster-friendly)
  // keyPrefixFormat: 'underscore', // {tenantId}_key
  // keyPrefixFormat: 'custom',     // Use customPrefixFormatter
  customPrefixFormatter: (tenantId) => `tenant:${tenantId}:`,
});

const cache = await tenantCache.resolve('acme-corp');
await cache.set('key', 'value');
// Stores based on format:
// colon:     {acme-corp}:key
// underscore: {acme-corp}_key
// custom:    tenant:acme-corp:key
```

## Redis Cluster Compatibility

The default prefix format uses curly braces `{tenantId}:key` to ensure **Redis Cluster compatibility**:

```typescript
// All keys for a tenant map to the same hash slot
await cache.set('user:1', data1);  // {acme-corp}:user:1
await cache.set('user:2', data2);  // {acme-corp}:user:2

// These keys hash to the same slot because {acme-corp} is the hash tag
// This enables efficient MGET/MEXEC operations in cluster mode
```

## Isolation Strategies

### Shared (B2C)

Single Redis instance with key prefixing:

```typescript
// Tenant configuration: { isolation: { cache: 'shared' } }
const cache = await tenantCache.resolve('acme-corp');

await cache.set('session:abc', sessionData);
// Redis key: {acme-corp}:session:abc
```

### Database (B2B)

Separate Redis database per tenant:

```typescript
// Tenant configuration: { isolation: { cache: 'database' } }
const cache = await tenantCache.resolve('acme-corp');

// Uses separate Redis DB number (0-15)
await cache.set('session:abc', sessionData);
// Redis key: {acme-corp}:session:abc in tenant's dedicated DB
```

### Dedicated (B2B Enterprise)

Separate Redis instance per tenant:

```typescript
// Tenant configuration: { isolation: { cache: 'dedicated' } }
const cache = await tenantCache.resolve('acme-corp');

// Uses separate Redis instance
await cache.set('session:abc', sessionData);
// Redis key: {acme-corp}:session:abc in tenant's dedicated Redis
```

## API

### `TenancyAwareCache`

```typescript
class TenancyAwareCache {
  /** Resolve cache for tenant */
  async resolve(tenantId: string): Promise<Cache>;

  /** Invalidate cached cache instance for a tenant */
  invalidate(tenantId: string): void;

  /** Clear all cached cache instances */
  clear(): void;

  /** Close all connections */
  async closeAll(): Promise<void>;

  /** Get pool statistics */
  getPoolStats(): PoolStats;
}
```

### `TenantScopedCache`

Implements the full `Cache` interface with automatic key prefixing:

```typescript
class TenantScopedCache implements Cache {
  async get<T>(key: string): Promise<CacheResult<T>>;
  async set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;
  async del(key: string): Promise<boolean>;
  async delMany(keys: string[]): Promise<number>;
  async has(key: string): Promise<boolean>;
  async clear(): Promise<void>;
  async getStats(): Promise<CacheStats>;
  async resetStats(): Promise<void>;
  async getMany<T>(keys: string[]): Promise<Map<string, CacheResult<T>>>;
  async setMany<T>(entries: Map<string, T>, options?: { ttl?: number }): Promise<void>;
  async incr(key: string, delta?: number): Promise<number>;
  async decr(key: string, delta?: number): Promise<number>;
  async getOrSet<T>(key: string, factory: () => T | Promise<T>, options?: { ttl?: number }): Promise<T>;
  async setex<T>(key: string, value: T, ttl: number): Promise<void>;
  async setNX<T>(key: string, value: T, options?: { ttl?: number }): Promise<boolean>;
  async getAndDel<T>(key: string): Promise<T | null>;
  async ttl(key: string): Promise<number>;

  /** Access the prefix used for this tenant */
  prefixKey(key: string): string;
}
```

### `createTenancyAwareCache`

```typescript
function createTenancyAwareCache(
  config: TenancyAwareCacheConfig
): TenancyAwareCache;
```

## How It Works

### Key Prefixing

All keys are automatically prefixed with the tenant ID:

```typescript
// Input key: 'user:123'
// Stored as: {tenantId}:user:123
// Example:   {acme-corp}:user:123
```

The curly braces `{tenantId}` serve as a **hash tag** in Redis Cluster, ensuring all keys for a tenant map to the same hash slot.

### Clear by Pattern

When calling `clear()`, the adapter uses `SCAN` to find and delete all keys matching `{tenantId}:*`:

```typescript
await cache.clear();
// Executes: SCAN 0 MATCH {acme-corp}:* COUNT 100
// Deletes all matching keys
```

### Multi-Tenant Safety

Each tenant gets their own prefixed keyspace:

```typescript
const cache1 = await tenantCache.resolve('tenant-a');
const cache2 = await tenantCache.resolve('tenant-b');

await cache1.set('key', 'value1');  // {tenant-a}:key = 'value1'
await cache2.set('key', 'value2');  // {tenant-b}:key = 'value2'

// No collision - separate keys in Redis
```
