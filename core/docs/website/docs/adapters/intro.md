# Adapters

OxLayer adapters provide a unified interface for working with various external services. Each adapter abstracts away the complexity of direct integration while providing consistent APIs across different providers.

## Overview

Adapters are organized by category:

### Database Adapters
- **PostgreSQL** - Relational database with connection pooling
- **MongoDB** - Document database with aggregation support
- **ClickHouse** - Analytics database for OLAP workloads
- **InfluxDB** - Time-series database for metrics

### Storage Adapters
- **S3** - Object storage (AWS S3 and S3-compatible)
- **Qdrant** - Vector database for similarity search
- **Quickwit** - Search engine for log analytics

### Security
- **Bitwarden Secrets** - Secure credential storage via Bitwarden Secrets Manager

## Installation

Adapters are published as separate packages under the `@oxlayer` scope:

```bash
# Install an adapter
pnpm add @oxlayer/capabilities-adapters-postgres

# Install multiple adapters
pnpm add @oxlayer/capabilities-adapters-postgres @oxlayer/capabilities-adapters-s3
```

## Common Patterns

All adapters follow consistent patterns:

### Factory Function

Each adapter exports a `create` function:

```typescript
import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';

const postgres = createPostgres({
  connectionString: process.env.DATABASE_URL,
});
```

### Async Operations

Database operations are async:

```typescript
const result = await postgres.query('SELECT * FROM users');
```

### Connection Management

Adapters handle connection pooling automatically:

```typescript
// Connections are managed internally
await postgres.close(); // Clean shutdown
```

## Next Steps

Explore specific adapters:
- [PostgreSQL Adapter](./postgres)
- [MongoDB Adapter](./mongo)
- [S3 Adapter](./s3)

For multi-tenant applications, see the [Tenancy Documentation](../tenancy/intro).
