# OxLayer

<p align="center">
  <img src="docs/website/img/logo.png" alt="OxLayer Logo" width="200" />
</p>

<p align="center">
  <strong>A modular framework for building multi-tenant SaaS applications</strong>
</p>

<p align="center">
  <a href="https://github.com/oxlayer/oxlayer/actions"><img src="https://img.shields.io/github/actions/workflow/status/oxlayer/oxlayer/ci.yml?branch=main" alt="CI Status" /></a>
  <a href="https://www.npmjs.com/org/oxlayer"><img src="https://img.shields.io/npm/v/@oxlayer/foundation-domain-kit" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@oxlayer/foundation-domain-kit" alt="License" /></a>
  <a href="https://discord.gg/oxlayer"><img src="https://img.shields.io/discord/1234567890" alt="Discord" /></a>
</p>

## Overview

OxLayer is a comprehensive framework for building multi-tenant SaaS applications. It provides:

- **Foundation Kits**: Domain-driven design primitives, HTTP handling, and testing utilities
- **Capabilities**: Pluggable interfaces for authentication, events, caching, and more
- **Adapters**: Production-ready implementations for databases, queues, storage, and search

## Open Source vs Proprietary

This repository follows a hybrid open-source model:

### Open Source (Apache 2.0) ✅

- **Foundation Kits**: All infrastructure packages ([`foundation/`](foundation/))
  - Domain Kit - Entities, value objects, repositories
  - App Kit - Use cases, Result/Either types
  - HTTP Kit - Controllers, middleware
  - Persistence Kit - Repository patterns
  - Testing Kit - Builders, mocks, test helpers

- **Base Adapters**: Standard database, storage, and messaging adapters ([`capabilities/adapters/`](capabilities/adapters/))
  - PostgreSQL, MongoDB, Redis, ClickHouse, InfluxDB
  - RabbitMQ, BullMQ, SQS, MQTT
  - AWS S3, Qdrant, Quickwit

### Proprietary (Enterprise License) ❌

- **Tenancy Infrastructure**: Multi-tenant resolution and isolation ([`proprietary/`](proprietary/))
- **Tenancy Adapters**: Database, storage, and messaging adapters with automatic tenant isolation
- **Advanced Features**: BullMQ Scheduler, tenant-scoped credentials, dynamic RLS

See [`proprietary/README.md`](proprietary/README.md) for details on enterprise features.

## Installation

```bash
# Foundation kits (Open Source)
pnpm add @oxlayer/foundation-domain-kit
pnpm add @oxlayer/foundation-app-kit
pnpm add @oxlayer/foundation-http-kit

# Base adapters (Open Source)
pnpm add @oxlayer/adapters-postgres
pnpm add @oxlayer/adapters-redis
pnpm add @oxlayer/adapters-rabbitmq

# Tenancy adapters (Proprietary)
pnpm add @oxlayer/pro-adapters-postgres-tenancy
pnpm add @oxlayer/pro-adapters-redis-tenancy
pnpm add @oxlayer/pro-tenancy
```

## Quick Start

### Open Source (Basic Adapters)

```typescript
import { Todo } from './domain/entities/todo';
import { CreateTodoUseCase } from './use-cases/create-todo';
import { TodoController } from './controllers/todos.controller';
import { createPostgresClient } from '@oxlayer/adapters-postgres';

// Setup PostgreSQL connection
const db = createPostgresClient({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'secret',
});

// Create use case
const createTodo = new CreateTodoUseCase(repository, eventBus);

// Setup controller
const controller = new TodoController(createTodo, getTodos, updateTodo, deleteTodo);

// Register with Hono
app.route('/api/todos', controller.routes());
```

### Enterprise (Multi-Tenancy with RLS)

```typescript
import { createTenantResolver } from '@oxlayer/pro-tenancy';
import { createTenancyAwarePostgres } from '@oxlayer/pro-adapters-postgres-tenancy';

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

// Enable RLS on all tables (adds tenant_id column automatically)
await postgres.enableRLS();

// Queries are automatically filtered by tenant_id
await postgres.query('SELECT * FROM todos'); // Automatically adds WHERE tenant_id = ?
```

## Packages

### Foundation Kits (Apache 2.0)

| Package | Description |
|---------|-------------|
| [`@oxlayer/foundation-domain-kit`](foundation/domain-kit) | Entities, value objects, repositories, domain errors |
| [`@oxlayer/foundation-app-kit`](foundation/app-kit) | Use cases, Result/Either types, DTOs |
| [`@oxlayer/foundation-http-kit`](foundation/http-kit) | Controllers, middleware, validation |
| [`@oxlayer/foundation-persistence-kit`](foundation/persistence-kit) | Repository patterns, cursor pagination |
| [`@oxlayer/foundation-testing-kit`](foundation/testing-kit) | Builders, mocks, test helpers |

### Open Source Adapters (Apache 2.0)

#### Database
- [`@oxlayer/adapters-postgres`](capabilities/adapters/database/postgres) - PostgreSQL adapter
- [`@oxlayer/adapters-mongo`](capabilities/adapters/database/mongo) - MongoDB adapter
- [`@oxlayer/adapters-redis`](capabilities/adapters/database/redis) - Redis adapter
- [`@oxlayer/adapters-clickhouse`](capabilities/adapters/database/clickhouse) - ClickHouse adapter
- [`@oxlayer/adapters-influxdb`](capabilities/adapters/database/influxdb) - InfluxDB adapter
- See [database/README.md](capabilities/adapters/database/README.md)

#### Messaging
- [`@oxlayer/adapters-rabbitmq`](capabilities/adapters/messaging/rabbitmq) - RabbitMQ adapter
- [`@oxlayer/adapters-bullmq`](capabilities/adapters/messaging/bullmq) - BullMQ queue adapter
- [`@oxlayer/adapters-sqs`](capabilities/adapters/messaging/sqs) - AWS SQS adapter
- [`@oxlayer/adapters-mqtt`](capabilities/adapters/messaging/mqtt) - MQTT adapter
- [`@oxlayer/adapters-eventemitter`](capabilities/adapters/messaging/eventemitter) - EventEmitter adapter
- See [messaging/README.md](capabilities/adapters/messaging/README.md)

#### Storage & Search
- [`@oxlayer/adapters-s3`](capabilities/adapters/storage/s3) - AWS S3 adapter
- [`@oxlayer/adapters-qdrant`](capabilities/adapters/vector/qdrant) - Qdrant vector storage
- [`@oxlayer/adapters-search-quickwit`](capabilities/adapters/search/quickwit) - Quickwit search
- See [storage/README.md](capabilities/adapters/storage/README.md)

### Proprietary Adapters (Enterprise License)

Tenancy variants with automatic tenant isolation:

- **Database**: `@oxlayer/pro-adapters-postgres-tenancy`, `*-mongo-tenancy`, `*-redis-tenancy`, etc.
- **Messaging**: `@oxlayer/pro-adapters-rabbitmq-tenancy`, `*-sqs-tenancy`, `*-mqtt-tenancy`
- **Storage**: `@oxlayer/pro-adapters-s3-tenancy`, `*-qdrant-tenancy`, `*-quickwit-tenancy`
- **Scheduler**: `@oxlayer/pro-adapters-bullmq-scheduler`
- **Core**: `@oxlayer/pro-tenancy`

See [`proprietary/README.md`](proprietary/README.md) for full list and features.

## Documentation

Full documentation is available at [https://docs.oxlayer.com](https://docs.oxlayer.com)

To build the documentation locally:

```bash
cd docs/website
pnpm install
pnpm start
```

## Examples

See the [`examples/`](examples/) directory for complete applications:

- **Todo App**: Full CRUD with Keycloak auth, PostgreSQL, Redis, RabbitMQ
- **Multi-Tenant**: Demonstrates tenant isolation with RLS

```bash
cd examples/todo-app
pnpm install
pnpm dev
```

## Contributing

We welcome contributions to the open-source packages! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## License

- **Foundation Kits & Base Adapters**: Apache 2.0 - see [LICENSE](LICENSE)
- **Proprietary Components**: UNLICENSED - see [proprietary/README.md](proprietary/README.md)

### Licensing Summary

| Component | License | Location |
|-----------|---------|----------|
| Foundation Kits | Apache 2.0 | [`foundation/`](foundation/) |
| Base Adapters | Apache 2.0 | [`capabilities/adapters/`](capabilities/adapters/) |
| Tenancy Adapters | Proprietary | [`proprietary/adapters/`](proprietary/adapters/) |
| Tenancy Core | Proprietary | [`proprietary/tenancy/`](proprietary/tenancy/) |

## Support

- **Documentation**: [https://docs.oxlayer.com](https://docs.oxlayer.com)
- **Issues**: [GitHub Issues](https://github.com/oxlayer/oxlayer/issues)
- **Discord**: [https://discord.gg/oxlayer](https://discord.gg/oxlayer)
- **Email**: support@oxlayer.com
- **Enterprise**: enterprise@oxlayer.com

## Roadmap

- [ ] Additional search adapters (Meilisearch, OpenSearch)
- [ ] GraphQL toolkit
- [ ] Event sourcing patterns
- [ ] CQRS implementation
- [ ] Advanced monitoring & observability

---

Made with ❤️ by the OxLayer team
