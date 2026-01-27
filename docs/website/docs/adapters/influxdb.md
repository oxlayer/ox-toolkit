---
title: InfluxDB Adapter
sidebar_label: InfluxDB
description: InfluxDB adapter for metrics and time-series data with automatic flush management
---

# @oxlayer/capabilities-adapters-influxdb

InfluxDB adapter for @oxlayer/capabilities metrics. Provides a simplified interface for writing metrics and time-series data to InfluxDB.

## Features

- Simplified InfluxDB client for metrics
- Counter, gauge, timing, and error metrics
- Performance metrics tracking
- Automatic flush management
- Built-in timer helper
- Default tags (service, environment, version)
- Error tracking

## Installation

```bash
bun add @oxlayer/capabilities-adapters-influxdb
```

## Dependencies

```bash
bun add @influxdata/influxdb-client
```

## Usage

### Basic Setup

```typescript
import { MetricsClient } from '@oxlayer/capabilities-adapters-influxdb';

const metrics = new MetricsClient({
  url: 'http://localhost:8086',
  token: 'your-token',
  org: 'my-org',
  bucket: 'metrics',
});

// Write a counter metric
metrics.counter('requests', 1, { endpoint: '/api/users' });

// Write a gauge metric
metrics.gauge('memory_usage', 1024, { unit: 'mb' });

// Flush metrics
await metrics.flush();

// Close connection
await metrics.close();
```

### Environment Variables

```typescript
// Environment variables (or use constructor):
// INFLUXDB_URL=http://localhost:8086
// INFLUXDB_TOKEN=your-token
// INFLUXDB_ORG=my-org
// INFLUXDB_BUCKET=metrics
// SERVICE_NAME=my-service
// NODE_ENV=production
// SERVICE_VERSION=1.0.0
```

### Metric Types

#### Counter

```typescript
// Increment counter
metrics.counter('user.logins', 1, { method: 'oauth' });

// Increment by more than 1
metrics.counter('bytes.sent', 1024, { region: 'us-east-1' });
```

#### Gauge

```typescript
// Set gauge value
metrics.gauge('queue.size', 42, { queue: 'emails' });

// Temperature, memory, etc.
metrics.gauge('cpu.temperature', 65.5);
```

#### Timing

```typescript
// Record timing in milliseconds
metrics.timing('request.duration', 123, { endpoint: '/api/users' });

// Using timer helper
const timer = metrics.timer('database.query', { table: 'users' });
// ... do work ...
const duration = await timer.end();
```

#### Error

```typescript
try {
  // Some operation
} catch (error) {
  metrics.error('operation.failed', error, { operation: 'send-email' });
}
```

#### Performance

```typescript
metrics.performance('api.response', {
  response_time: 123,
  memory_usage: 512,
  cpu_usage: 45.2,
  request_count: 1000,
}, { endpoint: '/api/products' });
```

### Batch Operations

```typescript
// Write multiple points
metrics.writePoints([
  {
    measurement: 'requests',
    tags: { endpoint: '/api/users' },
    fields: { count: 1, duration: 45 },
  },
  {
    measurement: 'requests',
    tags: { endpoint: '/api/products' },
    fields: { count: 1, duration: 23 },
  },
]);

await metrics.flush();
```

### Custom Tags and Timestamps

```typescript
metrics.writePoint({
  measurement: 'custom.metric',
  tags: {
    environment: 'production',
    region: 'us-west-2',
    version: 'v2.3.4',
  },
  fields: {
    value: 42,
    status: 'active',
  },
  timestamp: new Date(),
});
```

## API Reference

### `MetricsClient`

Main client for InfluxDB metrics.

#### Constructor

```typescript
constructor(config?: MetricsConfig)
```

**Config:**
- `url` - InfluxDB URL (default: `http://localhost:8086`)
- `token` - Authentication token (default: `influx_admin_token`)
- `org` - Organization name (default: `fator-h`)
- `bucket` - Bucket name (default: `metrics`)

#### Methods

##### `writePoint(point: MetricPoint): void`

Write a single metric point.

##### `writePoints(points: MetricPoint[]): void`

Write multiple metric points.

##### `counter(measurement: string, value: number, tags?: Record<string, string>): void`

Write a counter metric.

##### `gauge(measurement: string, value: number, tags?: Record<string, string>): void`

Write a gauge metric.

##### `timing(measurement: string, duration: number, tags?: Record<string, string>): void`

Write a timing metric.

##### `error(measurement: string, error: Error, tags?: Record<string, string>): void`

Write an error metric.

##### `performance(measurement: string, metrics: PerformanceMetrics, tags?: Record<string, string>): void`

Write performance metrics.

##### `timer(measurement: string, tags?: Record<string, string>): TimerResult`

Create a timer. Call `end()` to record duration.

##### `flush(): Promise<void>`

Flush buffered metrics to InfluxDB.

##### `close(): Promise<void>`

Close the connection and flush remaining metrics.

## Types

### `MetricPoint`

```typescript
interface MetricPoint {
  measurement: string;
  tags?: Record<string, string>;
  fields: Record<string, string | number | boolean>;
  timestamp?: Date;
}
```

### `PerformanceMetrics`

```typescript
interface PerformanceMetrics {
  response_time?: number;
  memory_usage?: number;
  cpu_usage?: number;
  request_count?: number;
}
```

### `TimerResult`

```typescript
interface TimerResult {
  end: () => number;
}
```

## Default Tags

The client automatically adds these default tags:

```typescript
{
  service: process.env.SERVICE_NAME || 'fator-h',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.SERVICE_VERSION || '1.0.0',
}
```

## Field Types

Fields can be:
- **number**: Stored as float
- **string**: Stored as string
- **boolean**: Stored as boolean

```typescript
metrics.writePoint({
  measurement: 'mixed_fields',
  fields: {
    count: 42,           // float
    name: 'test',        // string
    active: true,        // boolean
  },
});
```

## Flush Management

Metrics are buffered and flushed:

```typescript
// Manual flush
await metrics.flush();

// Auto-flush on close
await metrics.close();
```

## Best Practices

1. **Use appropriate types**: Counters for increments, gauges for current values
2. **Add meaningful tags**: Tags enable filtering and grouping
3. **Time your operations**: Use `timer()` for duration tracking
4. **Track errors**: Use `error()` to capture failure metrics
5. **Flush regularly**: Call `flush()` periodically or use `close()`

## Querying Metrics

Use InfluxDB UI or API to query metrics:

```flux
from(bucket: "metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "requests")
  |> filter(fn: (r) => r.service == "my-service")
```
