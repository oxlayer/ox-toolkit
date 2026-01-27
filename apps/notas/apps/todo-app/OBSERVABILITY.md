# Observability Setup - Todo API

This document provides a quick reference for all observability features in the Todo API.

## Overview

The Todo API includes comprehensive observability with:
- **Prometheus Metrics**: HTTP request metrics, business metrics
- **OpenTelemetry Tracing**: Distributed tracing with Jaeger
- **Quickwit Structured Logging**: Centralized log storage and search

## Quick Start

### 1. Start Services

```bash
cd examples/todo-app
docker-compose up -d postgres redis rabbitmq quickwit prometheus grafana jaeger-collector jaeger-query elasticsearch
```

### 2. Start the Todo App

```bash
pnpm dev
```

### 3. Access Observability Tools

| Tool | URL | Credentials |
|------|-----|-------------|
| **Metrics Endpoint** | http://localhost:3001/metrics | - |
| **Prometheus UI** | http://localhost:9090 | - |
| **Grafana Dashboards** | http://localhost:3000 | admin/admin123 |
| **Jaeger Tracing UI** | http://localhost:16686 | - |
| **Quickwit Logs** | http://localhost:7280 | - |

## Metrics

### HTTP Metrics (Automatic)

The following metrics are automatically collected:

- `todo_api_requests_total` - Total HTTP requests (labels: method, status, path)
- `todo_api_request_duration_seconds` - Request duration histogram
- `todo_api_http_requests_in_progress` - Current requests in progress
- `todo_api_request_size_bytes` - Request size histogram
- `todo_api_response_size_bytes` - Response size histogram

### Business Metrics (Manual)

Import and use the helper functions:

```typescript
import {
  recordTodoCreated,
  recordTodoUpdated,
  recordTodoDeleted,
  recordTodoCompleted,
  recordActiveTodos,
  recordDatabaseQueryDuration,
  recordCacheHit,
  recordEventPublished
} from './config/metrics.config.js';

// Record a todo creation
recordTodoCreated({ status: 'pending', has_due_date: true });

// Record active todos count
recordActiveTodos(42);

// Record database query
recordDatabaseQueryDuration('find', 0.023);

// Record cache hit
recordCacheHit(true);

// Record event published
recordEventPublished('TodoCreated');
```

### Custom Metrics

Create your own metrics:

```typescript
import { getMetrics } from '@oxlayer/capabilities-telemetry';

const metrics = getMetrics();

// Create a counter
const counter = metrics.createCounter(
  'custom_operations_total',
  'Total custom operations',
  ['operation_type']
);
counter.inc({ operation_type: 'export' });

// Create a gauge
const gauge = metrics.createGauge('queue_size', 'Queue size');
gauge.set(100);

// Create a histogram
const histogram = metrics.createHistogram(
  'processing_time_seconds',
  'Processing time',
  ['step'],
  [0.1, 0.5, 1, 5]
);
histogram.observe({ step: 'process' }, 0.23);
```

## Tracing

### View Traces in Jaeger

1. Go to http://localhost:16686
2. Search for traces by:
   - Service: `todo-app`
   - Operation: HTTP method (GET, POST, etc.)
   - Tags: userId, path, status

### Add Custom Spans

```typescript
import { getTelemetryMiddleware } from './config/metrics.config.js';

// In your route handlers
app.get('/api/todos/:id', async (c) => {
  const tracer = c.get('tracer');
  return tracer.startActiveSpan('getTodo', async (span) => {
    try {
      // ... your logic
      span.setStatus({ code: SpanStatusCode.OK });
      return c.json({ todo });
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
});
```

## Logging

### Structured Logging

Use the Quickwit logger throughout your app:

```typescript
import { createTodoLogger } from './config/logging.config.js';

const logger = createTodoLogger('MyContext');

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.warn('Rate limit approaching', { requests: 95, limit: 100 });
logger.error('Database connection failed', error, { retries: 3 });
logger.debug('Cache state', { keys: 5, size: '1MB' });
```

### Logging with Trace Context

```typescript
import { logHttpRequest } from './config/logging.config.js';

await logHttpRequest({
  method: 'GET',
  path: '/api/todos',
  statusCode: 200,
  duration: 45,
  userId: '123',
  traceId: 'abc123',
  spanId: 'def456',
});
```

### Database Operation Logging

```typescript
import { logDatabaseOperation } from './config/logging.config.js';

await logDatabaseOperation({
  operation: 'SELECT',
  table: 'todos',
  duration: 12,
  rowsAffected: 5,
});
```

### Business Event Logging

```typescript
import { logBusinessEvent } from './config/logging.config.js';

await logBusinessEvent({
  eventType: 'TodoCreated',
  entityType: 'Todo',
  entityId: 'todo_123',
  userId: 'user_456',
  data: { title: 'Buy groceries', status: 'pending' },
});
```

## Querying Logs in Quickwit

### Access Quickwit UI

1. Go to http://localhost:7280
2. Select the `todo-api-logs` index
3. Use the search bar to query logs

### Example Queries

```
# All errors
level: "ERROR"

# Requests by a specific user
user.id: "123"

# Slow requests (> 1000ms)
http.duration_ms: > 1000

# Database operations
database.operation: "*"

# Business events
event.type: "TodoCreated"

# Full-text search
message: "database"

# Trace-specific logs
trace_id: "abc123"

# Time range
timestamp: [2024-01-01 TO 2024-01-31]
```

## Grafana Dashboards

### Pre-built Dashboard

The Todo API includes a pre-configured dashboard:

1. Go to http://localhost:3000
2. Login with `admin/admin123`
3. Navigate to Dashboards → Todo API Dashboard

### Dashboard Panels

- Request Rate (req/s)
- Request Latency (p95/p99)
- Requests In Progress
- Requests by Status Code
- Requests by Method
- Requests by Endpoint
- Todo Operations (created/updated/deleted/completed)
- Active Todos Gauge

## Environment Variables

### Observability Configuration

```bash
# Quickwit Logging
QUICKWIT_URL=http://localhost:7280
QUICKWIT_LOGS_INDEX_ID=todo-api-logs
QUICKWIT_TRACES_INDEX_ID=todo-api-traces
QUICKWIT_API_KEY=  # Optional

# OpenTelemetry Tracing
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=todo-app

# Application
LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR
```

## Troubleshooting

### Quickwit Not Receiving Logs

1. Check Quickwit is running: `docker-compose ps quickwit`
2. Check Quickwit health: `curl http://localhost:7280/health`
3. Check app logs for Quickwit errors
4. Verify index exists: `curl http://localhost:7280/api/v1/indexes`

### Prometheus Not Scraping Metrics

1. Check Prometheus config: `docker-compose exec prometheus cat /etc/prometheus/prometheus.yml`
2. Check metrics endpoint: `curl http://localhost:3001/metrics`
3. Check Prometheus targets: http://localhost:9090/targets

### Traces Not Appearing in Jaeger

1. Check Jaeger services: `docker-compose ps jaeger-collector jaeger-query`
2. Check OTLP endpoint is configured
3. Verify traces are being generated: check app logs for "OpenTelemetry" messages

### Grafana Dashboard Empty

1. Check Prometheus datasource: Configuration → Data Sources → Prometheus
2. Test the connection
3. Check metrics are being scraped: http://localhost:9090/targets
4. Verify dashboard queries match your metric names

## Best Practices

1. **Use structured logging** - Include context in log messages
2. **Add trace IDs** - Pass trace context through your service calls
3. **Create business metrics** - Track domain-specific operations
4. **Set appropriate log levels** - DEBUG for development, INFO/WARN for production
5. **Use histogram buckets wisely** - Adjust based on your actual latency patterns
6. **Add labels to metrics** - Enable filtering and aggregation in Grafana
