# Split Collectors - Application Configuration Guide

## Architecture Overview

```
App ──┬─► Collector A (observability) ──► Quickwit
      │   Port: 14317 (gRPC)
      │   Port: 14318 (HTTP)
      │
      └─► Collector B (domain) ────────► ClickHouse
          Port: 24317 (gRPC)
          Port: 24318 (HTTP)
```

## Environment Variables

### Observability (Logs + Traces → Quickwit)

```bash
# For OpenTelemetry SDK
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://otel-collector-observability:4317
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel-collector-observability:4317
```

### Domain Events (Business Events → ClickHouse)

```bash
# For domain events (via custom logger API)
DOMAIN_EVENTS_ENDPOINT=http://otel-collector-domain:4317
# or
DOMAIN_EVENTS_OTLP_ENDPOINT=http://otel-collector-domain:4318
```

## Application Code Usage

### Observability Logging

```typescript
import { logger } from '@oxlayer/logger';

// These go to Quickwit via Collector A
logger.info('User logged in', { userId: '123', ip: '1.2.3.4' });
logger.error('Database connection failed', { error: err });
```

### Domain Events

```typescript
import { logger } from '@oxlayer/logger';

// These go to ClickHouse via Collector B
logger.logDomainEvent('TodoCreated', {
  todoId: 'abc',
  userId: '123',
  priority: 'high',
  timestamp: new Date().toISOString(),
});
```

## Port Mapping (Local Development)

| Collector | Service | Internal Port | External Port |
|-----------|---------|---------------|---------------|
| Observability | gRPC | 4317 | 14317 |
| Observability | HTTP | 4318 | 14318 |
| Domain | gRPC | 4317 | 24317 |
| Domain | HTTP | 4318 | 24318 |

## Docker Compose Services

```bash
# Start both collectors
docker-compose up otel-collector-observability otel-collector-domain

# Start full stack
docker-compose up
```

## Verification

### Check Collector Health

```bash
# Observability collector metrics
curl http://localhost:8889/metrics

# Domain collector metrics
curl http://localhost:18889/metrics
```

### Send Test Events

```bash
# Test observability pipeline
otelcol-contrib --config=collector-observability.yaml

# Test domain pipeline
otelcol-contrib --config=collector-domain.yaml
```
