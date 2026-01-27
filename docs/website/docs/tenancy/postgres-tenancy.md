---
title: PostgreSQL Tenancy Adapter
sidebar_label: PostgreSQL Tenancy
description: PostgreSQL multi-tenant database adapter supporting multiple isolation strategies
---

# @oxlayer/capabilities-adapters-postgres-tenancy

PostgreSQL multi-tenant database adapter supporting multiple isolation strategies. Works with **any client database schema** - no external schema dependencies.

## Features

- **Shared Isolation** (B2C): Single database with Row-Level Security (RLS)
- **Schema Isolation**: Same database, separate schemas per tenant
- **Database Isolation** (B2B): Separate database instance per tenant
- **Dynamic RLS**: Automatically adds `tenant_id` column and RLS policies to ALL tables
- **Connection Pooling**: Efficient resource management for tenant databases

## Installation

```bash
pnpm add @oxlayer/capabilities-adapters-postgres-tenancy
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwarePostgres } from '@oxlayer/capabilities-adapters-postgres-tenancy';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create shared database connection
const client = postgres(process.env.DATABASE_URL);
const sharedDb = drizzle(client);

// Create tenancy-aware PostgreSQL adapter
const tenantPostgres = createTenancyAwarePostgres({
  tenantResolver,
  bitwardenClient,
  sharedDb,
});

// Enable RLS on all tables (adds tenant_id column if needed)
await tenantPostgres.enableRLS();

// Resolve database for a tenant
const db = await tenantPostgres.resolve('acme-corp');
```

### Dynamic RLS Setup

The `enableRLS()` method dynamically applies Row-Level Security to ALL tables:

```typescript
const result = await tenantPostgres.enableRLS();

console.log(result);
// {
//   tables: ['users', 'products', 'orders', ...],
//   columnsAdded: ['products', 'orders'],  // tables that got tenant_id
//   policiesCreated: ['tenant_isolation_users', ...],
//   errors: []
// }
```

**What it does:**
1. Inspects all tables in the database using `information_schema`
2. Adds `tenant_id` column to tables that don't have it
3. Enables Row-Level Security on all tables
4. Creates tenant isolation policies using `current_setting('app.current_tenant')`

### Querying with RLS

```typescript
// Set tenant context for the transaction
await tenantPostgres.setRlsContext('acme-corp');

// All queries automatically filter by tenant_id
const users = await db.select().from(usersTable);
// SELECT * FROM users WHERE tenant_id = 'acme-corp'
```

### Configuration

```typescript
interface TenancyAwarePostgresConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;

  /** Bitwarden secrets client for credential resolution */
  bitwardenClient: BitwardenSecretsClient;

  /** Shared database (for B2C tenants with isolation="shared") */
  sharedDb: Database;

  /** RLS configuration (optional) */
  rlsConfig?: {
    /** Schema name (default: 'public') */
    schema?: string;
    /** Tenant ID column name (default: 'tenant_id') */
    tenantColumn?: string;
    /** Add tenant_id column if missing (default: true) */
    addColumnIfMissing?: boolean;
    /** Tables to exclude from RLS */
    excludeTables?: string[];
    /** Tables to include in RLS (if specified, only these tables get RLS) */
    includeTables?: string[];
  };

  /** Custom database pool (optional) */
  databasePool?: DatabasePool;
}
```

## Isolation Strategies

### Shared (B2C)

Single database with RLS filtering by `tenant_id`:

```typescript
// Tenant configuration: { isolation: { database: 'shared' } }
const db = await tenantPostgres.resolve('acme-corp');
```

### Schema (B2B)

Same database, separate schemas per tenant:

```typescript
// Tenant configuration: { isolation: { database: 'schema' } }
const db = await tenantPostgres.resolve('acme-corp');
// Sets search_path to tenant's schema
```

### Database (B2B Enterprise)

Separate database instance per tenant:

```typescript
// Tenant configuration: { isolation: { database: 'database' } }
const db = await tenantPostgres.resolve('acme-corp');
// Returns dedicated connection pool for tenant's database
```

## API

### `TenancyAwarePostgres`

```typescript
class TenancyAwarePostgres {
  /** Resolve database for tenant */
  async resolve(tenantId: string): Promise<Database>;

  /** Enable RLS on all tables */
  async enableRLS(): Promise<RLSResult>;

  /** Set RLS context for queries */
  async setRlsContext(tenantId: string): Promise<void>;

  /** Reset RLS context */
  async resetRlsContext(): Promise<void>;

  /** Close all database connections */
  async closeAll(): Promise<void>;

  /** Get pool statistics */
  getPoolStats(): PoolStats;
}
```

### `createTenancyAwarePostgres`

```typescript
function createTenancyAwarePostgres(
  config: TenancyAwarePostgresConfig
): TenancyAwarePostgres;
```
