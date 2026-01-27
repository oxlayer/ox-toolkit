# Proprietary Components

This directory contains proprietary, closed-source components that are **NOT** open-sourced. These packages contain business logic, proprietary algorithms, and competitive advantages.

## What Goes Here

- **Tenancy Infrastructure**: Multi-tenant resolution and isolation
- **Tenant Adapters**: Database, storage, and messaging adapters with automatic tenant isolation
- **Business Logic**: Revenue-critical features and competitive insights
- **Authentication Flows**: Custom authentication/authorization logic

## Available Packages

### Core Tenancy

#### @oxlayer/pro-tenancy
Multi-tenancy capability for Hono - tenant resolution and resource isolation.

**Features:**
- Tenant context resolution from requests
- Tenant configuration caching
- Control plane integration
- Isolation mode management (shared, database, schema)

### Database Adapters (Tenancy)

#### @oxlayer/pro-adapters-postgres-tenancy
PostgreSQL adapter with Row-Level Security (RLS) for automatic tenant isolation.

**Features:**
- Dynamic RLS policy creation
- Automatic `tenant_id` column addition
- Schema inspection and migration
- Connection pooling per tenant

#### @oxlayer/pro-adapters-mongo-tenancy
MongoDB adapter with collection-based tenant isolation.

**Features:**
- Collection prefixing
- Automatic `tenant_id` injection
- Dynamic index creation
- Tenant-scoped aggregations

#### @oxlayer/pro-adapters-redis-tenancy
Redis adapter with key-based tenant isolation using hash tags for cluster compatibility.

**Features:**
- `{tenantId}:key` format for Redis Cluster
- Automatic key prefixing
- Tenant-scoped pub/sub
- Connection pooling per tenant

#### @oxlayer/pro-adapters-clickhouse-tenancy
ClickHouse adapter with tenant isolation for analytics.

**Features:**
- Database-per-tenant isolation
- Tenant-scoped queries
- Automatic tenant context injection

#### @oxlayer/pro-adapters-influxdb-tenancy
InfluxDB adapter with tenant isolation for time-series data.

**Features:**
- Bucket-per-tenant isolation
- Tenant-scoped queries
- Automatic tenant context injection

### Messaging Adapters (Tenancy)

#### @oxlayer/pro-adapters-rabbitmq-tenancy
RabbitMQ adapter with tenant-isolated queues and exchanges.

**Features:**
- Tenant-prefixed queues
- Virtual host isolation
- Tenant-scoped routing

#### @oxlayer/pro-adapters-sqs-tenancy
AWS SQS adapter with tenant-isolated queues.

**Features:**
- Queue URL management per tenant
- Tenant-specific credentials
- Auto-creation of tenant queues

#### @oxlayer/pro-adapters-mqtt-tenancy
MQTT adapter with tenant-isolated topics.

**Features:**
- Topic prefixing
- Client ID per tenant
- Tenant-scoped subscriptions

#### @oxlayer/pro-adapters-bullmq-scheduler
BullMQ scheduler for advanced job scheduling.

**Features:**
- Cron-like scheduling
- Delayed jobs
- Recurring tasks
- Job flows and dependencies

### Storage Adapters (Tenancy)

#### @oxlayer/pro-adapters-object-storage-tenancy
Object Storage adapter with tenant-isolated buckets and paths.

**Features:**
- Bucket-per-tenant or path-based isolation
- Tenant-specific presigned URLs
- Automatic tenant context injection
- Credentials per tenant

### Vector Adapters (Tenancy)

#### @oxlayer/pro-adapters-qdrant-tenancy
Qdrant vector database adapter with tenant-isolated collections.

**Features:**
- Collection-per-tenant isolation
- Dynamic index creation
- Tenant-scoped vector operations

### Search Adapters (Tenancy)

#### @oxlayer/pro-adapters-quickwit-tenancy
Quickwit search adapter with tenant-isolated indexes.

**Features:**
- Index-per-tenant isolation
- Tenant-scoped search queries
- Automatic tenant context injection

## Separation Principle

The OxLayer framework follows a clear separation between open-source and proprietary components:

### Open Source Can Depend On ✅
- Other open-source packages
- Foundation kits
- Base adapters (without tenancy)

### Proprietary Can Depend On ✅
- Open-source packages
- Foundation kits
- Base adapters
- Other proprietary packages

### Open Source CANNOT Depend On ❌
- Proprietary packages
- Tenancy adapters
- Business logic

## License

**UNLICENSED** - All rights reserved. Proprietary and confidential.

These components are NOT open-source and are licensed separately for commercial use.

## Usage

These packages are typically used together:

```typescript
import { createTenantResolver } from '@oxlayer/pro-tenancy';
import { createTenancyAwarePostgres } from '@oxlayer/pro-adapters-postgres-tenancy';
import { createTenancyAwareRedis } from '@oxlayer/pro-adapters-redis-tenancy';

// Create tenant resolver
const tenantResolver = createTenantResolver({
  controlDb,
  cache: redis,
  secretService: bitwarden,
});

// Create tenancy-aware PostgreSQL with RLS
const postgres = await createTenancyAwarePostgres({
  tenantResolver,
  sharedDb,
  rlsConfig: {
    schema: 'public',
    tenantColumn: 'tenant_id',
    addColumnIfMissing: true,
  },
});

// Enable RLS on all tables
await postgres.enableRLS();
```

## Migration from Open Source

If you're using the open-source adapters and want to add multi-tenancy:

1. Replace base adapters with tenancy adapters
2. Set up tenant resolver
3. Configure isolation modes
4. Enable automatic tenant context injection

See the examples directory for complete implementations.

## Support

For questions about proprietary components or licensing:
- Email: enterprise@oxlayer.com
- Documentation: https://docs.oxlayer.com/enterprise
