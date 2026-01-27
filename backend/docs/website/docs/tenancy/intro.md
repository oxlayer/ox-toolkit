# Multi-Tenancy

OxLayer tenancy adapters provide automatic tenant isolation for databases, caches, storage, and messaging systems. Each tenancy adapter supports multiple isolation strategies to meet different use cases.

## Overview

Tenancy adapters extend base adapters with automatic tenant isolation:

### Database Tenancy
- **PostgreSQL Tenancy** - Row-Level Security (RLS) for B2C, dedicated databases for B2B
- **MongoDB Tenancy** - tenant_id field injection for B2C, separate databases for B2B
- **ClickHouse Tenancy** - Shared/dedicated database isolation
- **InfluxDB Tenancy** - Shared/dedicated bucket isolation

### Cache Tenancy
- **Redis Tenancy** - `{tenantId}:` key prefixing for Redis Cluster compatibility

### Storage Tenancy
- **S3 Tenancy** - Path prefixing for shared buckets, dedicated buckets for B2B
- **Qdrant Tenancy** - Tenant-isolated collections
- **Quickwit Tenancy** - Tenant-isolated indexes

### Messaging Tenancy
- **RabbitMQ Tenancy** - Exchange-level isolation
- **SQS Tenancy** - Queue-level isolation
- **MQTT Tenancy** - Topic prefixing

## Isolation Strategies

### Shared Isolation (B2C)

All tenants share the same resource with tenant-specific identifiers:

```typescript
const tenantPostgres = createTenancyAwarePostgres({
  tenantResolver,
  bitwardenClient,
  sharedDb: postgres,
});

// Automatically applies RLS - adds tenant_id column and policies
await tenantPostgres.enableRLS();

const db = await tenantPostgres.resolve('acme-corp');
// All queries automatically scoped to tenant
```

**Benefits:**
- Cost-effective for many tenants
- Easier resource management
- Automatic tenant context injection

### Dedicated Isolation (B2B)

Each tenant gets their own dedicated resource:

```typescript
const tenantS3 = createTenancyAwareS3({
  tenantResolver,
  bitwardenClient,
  defaultRegion: 'us-east-1',
});

const s3 = await tenantS3.resolve('enterprise-corp');
// Uses dedicated bucket for enterprise tenant
```

**Benefits:**
- Complete data isolation
- Separate resource policies
- Better performance guarantees

## Installation

```bash
pnpm add @oxlayer/capabilities-adapters-postgres-tenancy
```

## Common Patterns

### Tenant Resolution

All tenancy adapters require a tenant resolver:

```typescript
interface TenantResolver {
  resolve(tenantId: string): Promise<Tenant>;
}

interface Tenant {
  id: string;
  isolation: {
    database: 'shared' | 'schema' | 'database';
    cache: 'shared' | 'dedicated';
    storage: 'shared' | 'dedicated';
  };
  // ... routing information
}
```

### Credential Management

Credentials are retrieved from Bitwarden Secrets Manager:

```typescript
const bitwardenClient = createBitwardenSecretsClient({
  accessToken: process.env.BITWARDEN_TOKEN,
});

const tenantPostgres = createTenancyAwarePostgres({
  tenantResolver,
  bitwardenClient,  // Automatic credential resolution
  sharedDb: postgres,
});
```

## Features by Database

| Adapter | Shared Mode | Dedicated Mode | Dynamic Schema |
|---------|-------------|----------------|----------------|
| PostgreSQL | RLS with tenant_id | Separate DB | ✅ Auto-adds tenant_id |
| MongoDB | tenant_id filtering | Separate DB | ✅ Auto-adds tenant_id |
| Redis | `{tenantId}:` prefix | Separate DB | ❌ Not applicable |
| S3 | Path prefixing | Separate bucket | ❌ Not applicable |

## Next Steps

Explore specific tenancy adapters:
- [PostgreSQL Tenancy](./postgres-tenancy)
- [MongoDB Tenancy](./mongo-tenancy)
- [Redis Tenancy](./redis-tenancy)
- [S3 Tenancy](./s3-tenancy)
