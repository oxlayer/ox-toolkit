# Database Adapters

Database adapters for PostgreSQL, MongoDB, Redis, ClickHouse, InfluxDB, and more.

## Available Adapters (Open Source)

### postgres
```bash
pnpm add @oxlayer/adapters-postgres
```
PostgreSQL adapter for OxLayer capabilities.

### mongo
```bash
pnpm add @oxlayer/adapters-mongo
```
MongoDB adapter for OxLayer capabilities.

### redis
```bash
pnpm add @oxlayer/adapters-redis
```
Redis adapter for OxLayer capabilities.

### clickhouse
```bash
pnpm add @oxlayer/adapters-clickhouse
```
ClickHouse adapter for OxLayer capabilities.

### influxdb
```bash
pnpm add @oxlayer/adapters-influxdb
```
InfluxDB adapter for OxLayer capabilities.

## Multi-Tenancy Support (Proprietary)

Multi-tenancy variants with automatic tenant isolation, RLS, and tenant context injection are available in the proprietary package:

```bash
# PostgreSQL with Row-Level Security
pnpm add @oxlayer/pro-adapters-postgres-tenancy

# MongoDB with collection isolation
pnpm add @oxlayer/pro-adapters-mongo-tenancy

# Redis with key prefixing
pnpm add @oxlayer/pro-adapters-redis-tenancy

# ClickHouse with tenant isolation
pnpm add @oxlayer/pro-adapters-clickhouse-tenancy

# InfluxDB with tenant isolation
pnpm add @oxlayer/pro-adapters-influxdb-tenancy
```

> **Note**: Tenancy adapters are part of the proprietary package. See [proprietary/README.md](../../../../proprietary/README.md) for details.

## Features

### Open Source Adapters
- Connection pooling
- Query builders
- Migration support
- Type-safe queries

### Proprietary Tenancy Adapters
- Automatic tenant context injection
- Tenant-isolated connections
- Row-level security (PostgreSQL)
- Collection/database isolation (MongoDB)
- Key prefixing (Redis)
- Dynamic schema management

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.

Tenancy adapters are licensed under proprietary license - see [proprietary/README.md](../../../../proprietary/README.md).
