# @oxlayer/pro-adapters-quickwit-tenancy

Quickwit multi-tenant search adapter for tenant-isolated log analytics. Provides tenant-isolated Quickwit operations with shared or dedicated index isolation strategies.

## Features

- Multi-tenant Quickwit with automatic tenant resolution
- Shared index: Single index with tenant_id filtering
- Dedicated index: Separate index per tenant
- Automatic tenant_id filter injection for queries
- Connection pooling and caching
- Support for B2B (dedicated) and B2C (shared) isolation modes

## Installation

```bash
bun add @oxlayer/pro-adapters-quickwit-tenancy
```

## Dependencies

```bash
bun add @oxlayer/pro-tenancy @oxlayer/capabilities-search
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareQuickwit } from '@oxlayer/pro-adapters-quickwit-tenancy';

const tenantQuickwit = createTenancyAwareQuickwit({
  tenantResolver,
  endpoint: 'http://localhost:7280',
  defaultIndex: 'logs',
});

// Resolve Quickwit for a tenant
const qw = await tenantQuickwit.resolve('acme-corp');

// Search - tenant filter automatically applied for shared mode
const results = await qw.search('logs', 'error', {
  maxHits: 10,
  timeRange: '1h',
});
```

### Tenant Configuration

```typescript
// B2C tenant - shared index
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  quickwit: {
    indexId: 'shared_logs',
  },
};

// B2B tenant - dedicated index
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  quickwit: {
    indexId: 'enterprise-456-logs',
    apiKeyRef: 'tenants/enterprise-456/quickwit',
  },
};
```

### Search Operations

For shared index mode, tenant filter is automatically injected:

```typescript
const qw = await tenantQuickwit.resolve('acme-corp');

// Original query:
qw.search('logs', 'error', { maxHits: 10 });

// Automatically becomes (for shared mode):
qw.search('logs', 'error AND tenant_id:acme-corp', { maxHits: 10 });
```

## API Reference

### `TenancyAwareQuickwit`

Main entry point for tenant-isolated Quickwit operations.

#### Constructor

```typescript
constructor(config: TenancyAwareQuickwitConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `endpoint` - Quickwit server URL
- `defaultIndex` - Default index ID
- `apiKey` - Optional default API key

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedQuickwit>`

Resolve Quickwit client for a tenant.

**Throws:**
- `TenantNotFoundError` - If tenant doesn't exist
- `TenantNotReadyError` - If tenant is not in ready state

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedQuickwit`

Tenant-isolated Quickwit client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

- `search(indexId, query, options?)` - Search with tenant filter
- `fuzzySearch(indexId, queryString, options?)` - Fuzzy search
- `getDocument(indexId, docId)` - Get document by ID
- `getIndexInfo(indexId)` - Get index info
- `listIndexes()` - List all indexes
- `deleteIndex(indexId)` - Delete index
- `healthCheck()` - Check connection health

## Types

### `TenancyAwareQuickwitConfig`

```typescript
interface TenancyAwareQuickwitConfig {
  tenantResolver: TenantResolver;
  endpoint: string;
  defaultIndex: string;
  apiKey?: string;
  timeout?: number;
}
```

### `QuickwitRouting`

```typescript
interface QuickwitRouting {
  indexId: string;
  apiKey?: string;
  endpoint?: string;
  credentialsRef?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share an index with `tenant_id` field filtering:

- Automatic `tenant_id` filter injection in queries
- Cost-effective for B2C applications

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  quickwit: { indexId: 'shared_logs' },
};
```

### Dedicated Mode

Each tenant has a dedicated index:

- Complete data isolation
- Separate retention policies
- Better performance for high-volume tenants

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  quickwit: { indexId: 'enterprise-456-logs' },
};
```

## Index Schema

### Shared Mode Indexes

Include `tenant_id` field in all documents:

```json
{
  "timestamp": "2024-01-12T10:00:00Z",
  "tenant_id": "acme-corp",
  "level": "ERROR",
  "message": "Database connection failed"
}
```

### Dedicated Mode Indexes

No `tenant_id` field needed (each tenant has separate index):

```json
{
  "timestamp": "2024-01-12T10:00:00Z",
  "level": "ERROR",
  "message": "Database connection failed"
}
```

## Query Enrichment

For shared index mode, queries are automatically enriched:

### Simple Query

```typescript
// Original: 'error'
// Becomes: 'error AND tenant_id:acme-corp'
```

### Field Query

```typescript
// Original: 'level:ERROR'
// Becomes: 'level:ERROR AND tenant_id:acme-corp'
```

### Boolean Query

```typescript
// Original: '(error OR fail) AND level:CRITICAL'
// Becomes: '((error OR fail) AND level:CRITICAL) AND tenant_id:acme-corp'
```

### Skip Enrichment

Queries that already have `tenant_id` are not modified:

```typescript
// 'error AND tenant_id:acme-corp'
// Not modified (already has tenant_id filter)
```

## Search Examples

```typescript
const qw = await tenantQuickwit.resolve('acme-corp');

// Basic search
const results = await qw.search('logs', 'error', { maxHits: 10 });

// Time range search
const results = await qw.search('logs', 'error', {
  maxHits: 10,
  startTime: new Date(Date.now() - 3600000),
  endTime: new Date(),
});

// Field-specific search
const results = await qw.search('logs', 'level:ERROR AND service:api', {
  maxHits: 20,
});

// Fuzzy search
const results = await qw.fuzzySearch('logs', 'conection faled', {
  maxHits: 10,
});
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Index tenant_id**: Ensure `tenant_id` is indexed in shared mode
3. **Use time ranges**: Always include time filters in queries
4. **Monitor index sizes**: Track storage usage per tenant
5. **Cache connections**: Reuse connections across requests

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `UnsupportedIsolationModeError` - Isolation mode not supported

## License

MIT
