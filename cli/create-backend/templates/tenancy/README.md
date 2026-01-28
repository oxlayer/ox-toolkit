# {{PROJECT_NAME}} API

{{PROJECT_DESCRIPTION}}

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

## API Documentation

- Swagger UI: http://localhost:{{PORT}}/docs
- OpenAPI Spec: http://localhost:{{PORT}}/openapi.json

## Features

- PostgreSQL with Drizzle ORM
- Redis caching
- RabbitMQ event bus
- OpenTelemetry metrics & tracing
- Prometheus + Grafana
- k6 performance testing

## Observability

- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

## Performance Testing

```bash
k6 run perf-tests/quick-test.js
k6 run perf-tests/load-test.js
```
