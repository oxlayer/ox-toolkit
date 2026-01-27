# @oxlayer/pro-adapters-qdrant-tenancy

Qdrant multi-tenant vector search adapter for tenant-isolated embeddings. Provides tenant-isolated Qdrant operations with shared or dedicated collection isolation strategies.

## Features

- Multi-tenant Qdrant with automatic tenant resolution
- Shared collection: Single collection with tenant_id filtering
- Dedicated collection: Separate collection per tenant
- Automatic tenant_id payload injection for shared mode
- Automatic tenant filter injection for searches
- Connection pooling and caching
- Support for B2B (dedicated) and B2C (shared) isolation modes

## Installation

```bash
bun add @oxlayer/pro-adapters-qdrant-tenancy
```

## Dependencies

```bash
bun add @oxlayer/pro-tenancy @oxlayer/capabilities-vector
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareQdrant } from '@oxlayer/pro-adapters-qdrant-tenancy';

const tenantQdrant = createTenancyAwareQdrant({
  tenantResolver,
  defaultCollection: 'embeddings',
  endpoint: 'http://localhost:6333',
});

// Resolve Qdrant for a tenant
const qdrant = await tenantQdrant.resolve('acme-corp');

// Search - tenant filter automatically applied for shared mode
const results = await qdrant.search(embedding, {
  limit: 10,
  withPayload: true,
});

// Upsert - tenant_id automatically injected for shared mode
await qdrant.upsert([
  {
    id: '1',
    vector: embedding,
    payload: { text: 'Hello world' },
  },
]);
```

### Tenant Configuration

```typescript
// B2C tenant - shared collection
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  qdrant: {
    collection: 'shared_embeddings',
  },
};

// B2B tenant - dedicated collection
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  qdrant: {
    collection: 'enterprise-456-embeddings',
    credentialsRef: 'tenants/enterprise-456/qdrant',
  },
};
```

### Write Operations

For shared collection mode, `tenant_id` is automatically injected:

```typescript
const qdrant = await tenantQdrant.resolve('acme-corp');

// Original point:
{ id: '1', vector: [...], payload: { text: 'hello' } }

// Automatically becomes (for shared mode):
{
  id: '1',
  vector: [...],
  payload: { text: 'hello', tenant_id: 'acme-corp' }
}
```

### Search Operations

For shared collection mode, tenant filter is automatically added:

```typescript
// Original search:
{ limit: 10 }

// Automatically becomes (for shared mode):
{
  limit: 10,
  filter: {
    must: [{ key: 'tenant_id', match: { value: 'acme-corp' } }]
  }
}
```

## API Reference

### `TenancyAwareQdrant`

Main entry point for tenant-isolated Qdrant operations.

#### Constructor

```typescript
constructor(config: TenancyAwareQdrantConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `defaultCollection` - Default collection name
- `endpoint` - Qdrant server URL
- `apiKey` - Optional API key

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedQdrant>`

Resolve Qdrant client for a tenant.

**Throws:**
- `TenantNotFoundError` - If tenant doesn't exist
- `TenantNotReadyError` - If tenant is not in ready state

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedQdrant`

Tenant-isolated Qdrant client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `collection` - Collection name
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

All standard Qdrant methods with automatic tenant filtering:

- `search(vector, options?)` - Search with tenant filter
- `upsert(points, options?)` - Upsert with tenant_id injection
- `insert(points, options?)` - Insert with tenant_id injection
- `update(points, options?)` - Update with tenant_id injection
- `delete(ids)` - Delete points
- `deleteByFilter(filter)` - Delete by filter
- `getPoint(id)` - Get point by ID
- `getPoints(ids)` - Get multiple points
- `scroll(options?)` - Scroll through points
- `count(filter?)` - Count points
- `healthCheck()` - Check connection

## Types

### `TenancyAwareQdrantConfig`

```typescript
interface TenancyAwareQdrantConfig {
  tenantResolver: TenantResolver;
  defaultCollection: string;
  endpoint: string;
  apiKey?: string;
  timeout?: number;
}
```

### `QdrantRouting`

```typescript
interface QdrantRouting {
  collection: string;
  apiKey?: string;
  endpoint?: string;
  credentialsRef?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share a collection with `tenant_id` payload filtering:

- Automatic `tenant_id` injection in payloads
- Automatic tenant filter in searches
- Cost-effective for B2C applications

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  qdrant: { collection: 'shared_embeddings' },
};
```

### Dedicated Mode

Each tenant has a dedicated collection:

- Complete data isolation
- Separate collection configuration
- Better performance for high-volume tenants

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  qdrant: { collection: 'enterprise-456-embeddings' },
};
```

## Collection Schema

### Shared Mode Collections

Include `tenant_id` in payload and index it:

```typescript
// Create collection
await qdrant.createCollection('shared_embeddings', {
  vectorSize: 384,
  distance: 'Cosine',
  payloadIndexes: [
    { fieldName: 'tenant_id', fieldType: 'keyword' },
  ],
});

// Points have tenant_id in payload
{
  id: '1',
  vector: [...],
  payload: { text: 'hello', tenant_id: 'acme-corp' }
}
```

### Dedicated Mode Collections

No `tenant_id` needed (each tenant has separate collection):

```typescript
// Create collection per tenant
await qdrant.createCollection('acme-corp-embeddings', {
  vectorSize: 384,
  distance: 'Cosine',
});

// Points don't need tenant_id
{
  id: '1',
  vector: [...],
  payload: { text: 'hello' }
}
```

## Search Examples

```typescript
const qdrant = await tenantQdrant.resolve('acme-corp');

// Basic search
const results = await qdrant.search(embedding, { limit: 10 });

// Search with payload filter (merged with tenant filter)
const results = await qdrant.search(embedding, {
  limit: 10,
  filter: {
    must: [{ key: 'category', match: { value: 'products' } }],
  },
});
// For shared mode, becomes:
// filter: {
//   must: [
//     { key: 'category', match: { value: 'products' } },
//     { key: 'tenant_id', match: { value: 'acme-corp' } }
//   ]
// }
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Index tenant_id**: Always index `tenant_id` in shared mode
3. **Set vector size**: Configure based on your embedding model
4. **Monitor collection sizes**: Track storage usage per tenant
5. **Use appropriate distance**: Choose based on your use case

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `UnsupportedIsolationModeError` - Isolation mode not supported

## License

MIT
