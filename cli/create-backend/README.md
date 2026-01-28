# @oxlayer/create-backend

Scaffold a new OxLayer backend API with full observability stack.

## Features

Generated backend includes:

- **PostgreSQL** - Database with Drizzle ORM and auto-migration
- **Redis** - Caching layer
- **RabbitMQ** - Event bus for domain events
- **OpenTelemetry** - Metrics and tracing (Prometheus + Jaeger)
- **Grafana** - Pre-configured dashboards
- **k6** - Performance testing suite
- **OpenAPI** - Interactive documentation (Scalar UI)
- **Test Infrastructure** - Builders, fixtures, and mocks

## Usage

### Interactive Mode

```bash
npx @oxlayer/create-backend my-api
```

### Quick Mode (Defaults)

```bash
npx @oxlayer/create-backend my-api --defaults
```

### What Gets Created

```
my-api/
├── src/
│   ├── config/              # Configuration modules
│   │   ├── app.config.ts
│   │   ├── postgres.config.ts
│   │   ├── redis.config.ts
│   │   ├── rabbitmq.config.ts
│   │   ├── metrics.config.ts
│   │   ├── logging.config.ts
│   │   ├── openapi.config.ts
│   │   └── index.ts
│   ├── controllers/         # HTTP handlers
│   │   └── items.controller.ts
│   ├── db/                 # Database schema
│   ├── domain/             # Domain entities & events
│   │   ├── item.ts
│   │   └── events.ts
│   ├── infrastructure/     # DI container
│   │   └── container.ts
│   ├── repositories/       # Data access layer
│   │   └── item.repository.ts
│   ├── use-cases/          # Business logic
│   │   ├── create-item.usecase.ts
│   │   ├── list-items.usecase.ts
│   │   ├── get-item.usecase.ts
│   │   ├── update-item.usecase.ts
│   │   ├── delete-item.usecase.ts
│   │   └── index.ts
│   ├── __tests__/          # Unit & integration tests
│   │   ├── unit/
│   │   └── integration/
│   └── test/               # Test utilities
│       ├── builders/       # Test data builders
│       ├── fixtures/       # Test fixtures
│       └── mocks/          # Mock implementations
├── grafana/               # Grafana dashboards
│   └── provisioning/
├── perf-tests/            # k6 performance tests
├── docker-compose.yml     # Full infrastructure
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

# Tenancy template (multi-tenant)
```bash
npx @oxlayer/create-backend my-api --template tenancy
```

## Generated Commands

```bash
cd my-api
pnpm install
pnpm dev        # Start development server
pnpm test       # Run tests
pnpm build      # Build for production
```

## Infrastructure

Generated `docker-compose.yml` includes:

- PostgreSQL 15
- Redis 7
- RabbitMQ 3 (with management UI)
- Prometheus
- Grafana
- Jaeger
- OpenTelemetry Collector
- Quickwit (logs)

Start all services:

```bash
docker-compose up -d
```

## API Endpoints

- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Scalar UI)
- `GET /openapi.json` - OpenAPI specification
- `GET /metrics` - Prometheus metrics
- `GET /api/items` - List items (example)
- `POST /api/items` - Create item (example)
- etc.

## Performance Tests

```bash
# Quick smoke test (30s)
k6 run perf-tests/quick-test.js

# Full load test (up to 3000 RPS)
k6 run perf-tests/load-test.js

# Soak test (1 hour, memory leak detection)
k6 run perf-tests/soak-test.js
```

## Observability

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **RabbitMQ UI**: http://localhost:15672 (guest/guest)
- **API Docs**: http://localhost:3001/docs

## Example Usage

After scaffolding:

```bash
cd my-api
pnpm install
pnpm dev
```

The example includes:
- `Item` entity with CRUD operations
- Domain events (`Item.Created`, `Item.Updated`, `Item.Deleted`)
- Repository pattern using `PostgresRepositoryTemplate`
- Use case pattern (`CreateUseCaseTemplate`, `ListUseCaseTemplate`, etc.)
- Controller extending `BaseController` with Zod validation
- Test infrastructure with builders, fixtures, and mocks
- OpenAPI documentation with schemas and paths
- Performance tests for load and soak testing
- Grafana dashboards for metrics

## Templates

The generator uses templates located in `template/` with placeholder variables:

- `{{PROJECT_NAME}}` - Project title case name
- `{{PROJECT_SLUG}}` - URL-safe project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{PROJECT_AUTHOR}}` - Author name
- `{{PORT}}` - API port
- `{{DB_NAME}}` - Database name

## Development

```bash
# Install dependencies
pnpm install

# Build CLI
pnpm build

# Test CLI locally
node dist/index.js test-api
```

## License

MIT
