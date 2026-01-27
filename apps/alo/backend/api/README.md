# Alo Manager API

A complete CRUD API for managing establishments, users, delivery men, and service providers in the Alo platform. Built with OxLayer DDD patterns, featuring Keycloak authentication, PostgreSQL, Redis caching, RabbitMQ events, and comprehensive observability.

## Features

- **Authentication**: Keycloak integration with JWT fallback
- **Database**: PostgreSQL with auto-migration via Drizzle ORM
- **Caching**: Redis for performance optimization
- **Events**: RabbitMQ for domain events and async processing
- **Metrics**: Prometheus metrics for HTTP and business operations
- **Tracing**: OpenTelemetry + Jaeger for distributed tracing
- **Logging**: Quickwit for structured log aggregation
- **Docs**: OpenAPI 3.0 with Scalar UI

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DATABASE` | Database name | `alo_manager` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `RABBITMQ_HOST` | RabbitMQ host | `localhost` |
| `RABBITMQ_PORT` | RabbitMQ port | `5672` |
| `KEYCLOAK_ENABLED` | Enable Keycloak auth | `true` |
| `KEYCLOAK_SERVER_URL` | Keycloak URL | `http://localhost:8080` |
| `KEYCLOAK_REALM` | Keycloak realm | `alo` |
| `KEYCLOAK_CLIENT_ID` | Keycloak client | `alo-manager` |

## API Endpoints

### Health & Observability
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /docs` - API documentation (Scalar)
- `GET /openapi.json` - OpenAPI specification

### Establishments
- `GET /api/establishments` - List establishments
- `GET /api/establishments/:id` - Get establishment
- `POST /api/establishments` - Create establishment
- `PATCH /api/establishments/:id` - Update establishment
- `DELETE /api/establishments/:id` - Delete establishment

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Delivery Men
- `GET /api/delivery-men` - List delivery men
- `GET /api/delivery-men/:id` - Get delivery man
- `POST /api/delivery-men` - Create delivery man
- `PATCH /api/delivery-men/:id` - Update delivery man
- `DELETE /api/delivery-men/:id` - Delete delivery man

### Service Providers
- `GET /api/service-providers` - List service providers
- `GET /api/service-providers/:id` - Get service provider
- `POST /api/service-providers` - Create service provider
- `PATCH /api/service-providers/:id` - Update service provider
- `DELETE /api/service-providers/:id` - Delete service provider

### Onboarding Leads
- `POST /public/onboarding-leads` - Create onboarding lead (public)
- `GET /api/onboarding-leads` - List onboarding leads
- `GET /api/onboarding-leads/:id` - Get onboarding lead
- `POST /api/onboarding-leads` - Create onboarding lead
- `PATCH /api/onboarding-leads/:id` - Update onboarding lead
- `DELETE /api/onboarding-leads/:id` - Delete onboarding lead

## Docker Setup

```bash
# Start all infrastructure services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services included:
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (port 5672, management UI on 15672)
- Keycloak (port 8080)
- Prometheus (port 9090)
- Grafana (port 3000)
- Jaeger (port 16686)
- Quickwit (port 7280)
- OpenTelemetry Collector (port 14318)

## Architecture

This API follows OxLayer DDD patterns:

```
src/
├── config/           # Configuration modules
├── controllers/      # HTTP request handlers
├── db/              # Database schema and migrations
├── domain/          # Domain entities and events
├── infrastructure/  # Dependency injection container
├── repositories/    # Data access layer
├── use-cases/       # Business logic
└── index.ts         # Application entry point
```

## Documentation

- [Testing Guide](./TESTING.md) - Testing structure and patterns
- [Observability Guide](./OBSERVABILITY.md) - Metrics, tracing, and logging
- [Event Naming](./NAMING_EVENTS.md) - Domain event conventions