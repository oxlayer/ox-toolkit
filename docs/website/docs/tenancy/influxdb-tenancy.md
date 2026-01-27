---
title: InfluxDB Tenancy Adapter
sidebar_label: InfluxDB Tenancy
description: InfluxDB multi-tenant time-series adapter for tenant-isolated metrics
---

# @oxlayer/capabilities-adapters-influxdb-tenancy

InfluxDB multi-tenant time-series adapter for tenant-isolated metrics. Provides tenant-isolated InfluxDB operations with shared or dedicated bucket isolation strategies.

## Features

- Multi-tenant InfluxDB with automatic tenant resolution
- Shared bucket: Single bucket with tenant_id tag filtering
- Dedicated bucket: Separate bucket per tenant
- Automatic tenant_id tag injection for shared mode
- Automatic tenant filter injection for queries
- Connection pooling and caching
- Support for B2B (dedicated) and B2C (shared) isolation modes

## Installation

```bash
bun add @oxlayer/capabilities-adapters-influxdb-tenancy
```

## Dependencies

```bash
bun add @oxlayer/capabilities-tenancy @influxdata/influxdb-client
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareInfluxDB } from '@oxlayer/capabilities-adapters-influxdb-tenancy';
import { InfluxDB } from '@influxdata/influxdb-client';

const influxdbClient = new InfluxDB({ url: 'http://localhost:8086', token: 'token' });

const tenantInfluxDB = createTenancyAwareInfluxDB({
  tenantResolver,
  baseClient: influxdbClient,
  defaultOrg: 'main-org',
  defaultBucket: 'metrics',
});

// Resolve InfluxDB for a tenant
const influxdb = await tenantInfluxDB.resolve('acme-corp');

// Write points - tenant_id automatically injected for shared mode
const writeApi = influxdb.getWriteApi();
import { Point } from '@influxdata/influxdb-client';

writeApi.writePoint(new Point('temperature')
  .tag('location', 'server-room')
  .floatField('value', 23.5));
await writeApi.flush();

// Query - tenant filter automatically injected for shared mode
const queryApi = influxdb.getQueryApi();
const result = queryApi.query('from(bucket:"metrics") |> range(start: -1h)');
```

### Write Operations

For shared bucket mode, `tenant_id` tag is automatically injected:

```typescript
const influxdb = await tenantInfluxDB.resolve('acme-corp');
const writeApi = influxdb.getWriteApi();

// Original point:
new Point('temperature').tag('location', 'room1').floatField('value', 23.5)

// Automatically becomes (for shared mode):
// temperature,location=room1,tenant_id=acme-corp value=23.5
```

### Query Operations

For shared bucket mode, tenant filter is automatically injected:

```typescript
// Original query:
from(bucket:"metrics") |> range(start: -1h)

// Automatically becomes (for shared mode):
from(bucket:"metrics") |> range(start: -1h) |> filter(fn: (r) => r.tenant_id == "acme-corp")
```

### Tenant Configuration

```typescript
// B2C tenant - shared bucket
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  influxdb: {
    bucket: 'metrics',
    organization: 'main-org',
  },
};

// B2B tenant - dedicated bucket
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  influxdb: {
    bucket: 'enterprise-456-metrics',
    organization: 'main-org',
    tokenRef: 'tenants/enterprise-456/influxdb',
  },
};
```

## API Reference

### `TenancyAwareInfluxDB`

Main entry point for tenant-isolated InfluxDB operations.

#### Constructor

```typescript
constructor(config: TenancyAwareInfluxDBConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `baseClient` - Base InfluxDB client for shared bucket scenario
- `defaultOrg` - Default organization for shared bucket
- `defaultBucket` - Default bucket for shared scenario

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedInfluxDB>`

Resolve InfluxDB client for a tenant.

**Throws:**
- `TenantNotFoundError` - If tenant doesn't exist
- `TenantNotReadyError` - If tenant is not in ready state
- `UnsupportedIsolationModeError` - If isolation mode is not supported

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedInfluxDB`

Tenant-isolated InfluxDB client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `bucket` - Bucket name
- `organization` - Organization name
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

##### `getWriteApi(org?, bucket?, options?): WriteApi`

Get a WriteApi for this tenant. Returns `TenantScopedWriteApi` for automatic tenant_id injection.

##### `getQueryApi(org?): QueryApi`

Get a QueryApi for this tenant. Returns `TenantScopedQueryApi` for automatic tenant filtering.

## Types

### `TenancyAwareInfluxDBConfig`

```typescript
interface TenancyAwareInfluxDBConfig {
  tenantResolver: TenantResolver;
  baseClient: InfluxDB;
  defaultOrg: string;
  defaultBucket: string;
}
```

### `InfluxDBRouting`

```typescript
interface InfluxDBRouting {
  bucket: string;
  organization: string;
  tokenRef?: string;
  region?: string;
  url?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share a single bucket with `tenant_id` tag filtering:

- Automatic `tenant_id` tag injection in writes
- Automatic tenant filter injection in queries
- Cost-effective for B2C applications

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  influxdb: { bucket: 'metrics', organization: 'main-org' },
};
```

### Dedicated Mode

Each tenant has a dedicated bucket:

- Complete data isolation
- Separate retention policies
- Better performance for high-volume tenants

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  influxdb: { bucket: 'enterprise-456-metrics', organization: 'main-org' },
};
```

## Query Enrichment

For shared bucket mode, Flux queries are automatically enriched:

### Pattern Matching

```typescript
// After range() function
from(bucket:"metrics") |> range(start: -1h)
// Becomes:
from(bucket:"metrics") |> range(start: -1h) |> filter(fn: (r) => r.tenant_id == "acme-corp")

// Before existing filter
from(bucket:"metrics") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "cpu")
// Becomes:
from(bucket:"metrics") |> range(start: -1h) |> filter(fn: (r) => r.tenant_id == "acme-corp" and r._measurement == "cpu")
```

### Skip Enrichment

Queries that already have `tenant_id` filter are not modified:

```typescript
from(bucket:"metrics") |> range(start: -1h) |> filter(fn: (r) => r.tenant_id == "acme-corp")
// Not modified (already has tenant_id filter)
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Index tenant_id**: Ensure `tenant_id` is indexed in shared mode
3. **Use time ranges**: Always include `range()` in queries
4. **Pool connections**: Reuse connections across requests
5. **Monitor bucket sizes**: Track storage usage per tenant

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `UnsupportedIsolationModeError` - Isolation mode not supported
