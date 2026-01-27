# @oxlayer/pro-adapters-clickhouse-tenancy

ClickHouse multi-tenant analytics adapter for tenant-isolated analytics. Provides tenant-isolated ClickHouse operations with shared or dedicated database isolation strategies.

## Features

- Multi-tenant ClickHouse with automatic tenant resolution
- Shared database: Single database with tenant_id filtering
- Dedicated database: Separate database per tenant
- Automatic credential retrieval via Bitwarden Secrets Manager
- Connection pooling and caching
- Tenant isolation configuration
- Support for B2B (dedicated) and B2C (shared) isolation modes

## Installation

```bash
bun add @oxlayer/pro-adapters-clickhouse-tenancy
```

## Dependencies

```bash
bun add @oxlayer/pro-tenancy @oxlayer/capabilities-adapters-bitwarden-secrets
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareClickHouse } from '@oxlayer/pro-adapters-clickhouse-tenancy';
import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

const bitwardenClient = createBitwardenSecretsClient();

const tenantCH = createTenancyAwareClickHouse({
  tenantResolver,
  bitwardenClient,
  defaultConfig: {
    host: 'http://localhost',
    port: 8123,
    username: 'default',
  },
  pool: {
    max: 20,
  },
});

// Resolve ClickHouse client for a tenant
const ch = await tenantCH.resolve('acme-corp');

// Query with automatic tenant isolation
const result = await ch.query('SELECT * FROM events WHERE date >= today()');

// The query automatically includes tenant filtering for shared mode
```

### Tenant Configuration

Tenants can be configured with different isolation modes:

```typescript
// B2C tenant - shared database with tenant_id filtering
const tenantConfig = {
  id: 'tenant-123',
  isolation: {
    cache: 'shared',
  },
  clickhouse: {
    database: 'shared_analytics',
  },
};

// B2B tenant - dedicated database
const enterpriseConfig = {
  id: 'enterprise-456',
  isolation: {
    cache: 'dedicated',
  },
  clickhouse: {
    database: 'enterprise_analytics',
    credentialsRef: 'tenants/enterprise-456/clickhouse',
  },
};
```

### Credential Management

Credentials are retrieved from Bitwarden Secrets Manager:

```typescript
// Store in Bitwarden:
// Secret ID: tenants/acme-corp/clickhouse
// Value: {"username": "tenant_user", "password": "secret", "host": "clickhouse.example.com"}

const ch = await tenantCH.resolve('acme-corp');
// Credentials automatically loaded for dedicated mode
```

### Query Enrichment

For shared database mode, queries are automatically enriched with tenant filtering:

```typescript
// Original query:
const result = await ch.query('SELECT * FROM events WHERE date >= today()');

// Automatically becomes (for shared mode):
// SELECT * FROM events WHERE date >= today() AND tenant_id = 'acme-corp'
```

## API Reference

### `TenancyAwareClickHouse`

Main entry point for tenant-isolated ClickHouse operations.

#### Constructor

```typescript
constructor(config: TenancyAwareClickHouseConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `bitwardenClient` - Bitwarden client for credential retrieval
- `defaultConfig` - Default ClickHouse configuration
- `pool` - Connection pool configuration

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedClickHouse>`

Resolve ClickHouse client for a tenant.

**Returns:** Tenant-scoped ClickHouse client

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedClickHouse`

Tenant-isolated ClickHouse client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `database` - Database name
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

All methods from the base ClickHouse client are available:

- `query<T>(sql, options?)` - Execute query
- `queryOne<T>(sql, options?)` - Query single row
- `queryScalar<T>(sql, options?)` - Query scalar value
- `insert(options)` - Insert data
- `createTable(table, schema, options?)` - Create table
- `dropTable(table, options?)` - Drop table
- `listTables()` - List tables
- `healthCheck()` - Check connection health

## Types

### `TenancyAwareClickHouseConfig`

```typescript
interface TenancyAwareClickHouseConfig {
  tenantResolver: TenantResolver;
  bitwardenClient: BitwardenSecretsClient;
  defaultConfig: {
    host: string;
    port?: number;
    username?: string;
    database?: string;
  };
  pool?: {
    max?: number;
    min?: number;
  };
}
```

### `ClickHouseRouting`

```typescript
interface ClickHouseRouting {
  database: string;
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  credentialsRef?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share a single database with `tenant_id` column filtering:

- Automatic `tenant_id` injection in queries
- Cost-effective for B2C applications
- Easier management and maintenance

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  clickhouse: { database: 'shared_analytics' },
};
```

### Dedicated Mode

Each tenant has a dedicated database:

- Complete data isolation
- Separate retention policies
- Better performance for high-volume tenants

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  clickhouse: { database: 'enterprise_456_analytics' },
};
```

## Table Schema

### Shared Mode Tables

Include `tenant_id` column in all tables:

```sql
CREATE TABLE events (
  timestamp DateTime,
  tenant_id String,
  user_id String,
  action String,
  ...
) ENGINE = MergeTree()
ORDER BY (tenant_id, timestamp);
```

### Dedicated Mode Tables

No `tenant_id` needed (each tenant has separate database):

```sql
CREATE TABLE events (
  timestamp DateTime,
  user_id String,
  action String,
  ...
) ENGINE = MergeTree()
ORDER BY timestamp;
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Index tenant_id**: Always index `tenant_id` in shared mode
3. **Pool connections**: Reuse connections across requests
4. **Monitor database sizes**: Track storage usage per tenant
5. **Use credentials**: Store credentials securely in Bitwarden

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `UnsupportedIsolationModeError` - Isolation mode not supported

## License

MIT
