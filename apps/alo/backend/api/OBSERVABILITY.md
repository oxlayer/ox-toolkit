# Observability Guide

This document describes the observability setup for the Alo Manager API, including metrics, tracing, and logging.

## Overview

The API uses a comprehensive observability stack:

| Component | Purpose | Access |
|-----------|---------|--------|
| **Prometheus** | Metrics collection | http://localhost:9090 |
| **Grafana** | Metrics visualization | http://localhost:3000 |
| **Jaeger** | Distributed tracing | http://localhost:16686 |
| **Quickwit** | Log aggregation | http://localhost:7280 |
| **OTEL Collector** | Telemetry pipeline | http://localhost:14318 |

## Metrics

### HTTP Metrics

Automatically collected for all HTTP requests:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_in_progress` - Current requests in flight

### Business Metrics

Custom metrics for business operations:

- `establishment_created_total` - Establishments created
- `user_created_total` - Users created
- `delivery_man_created_total` - Delivery men created
- `service_provider_created_total` - Service providers created
- `onboarding_lead_created_total` - Onboarding leads created

### Viewing Metrics

```bash
# Access metrics endpoint
curl http://localhost:3001/metrics

# Example output:
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/establishments",status="200"} 42
```

### Grafana Dashboards

Pre-configured dashboards:

1. **API Overview** - Request rate, error rate, latency
2. **Business Metrics** - Entity creation rates
3. **Infrastructure** - Database, Redis, RabbitMQ health

Access: http://localhost:3000 (default credentials: admin/admin)

## Tracing

### Distributed Tracing

All HTTP requests are automatically traced with:

- Trace ID - Correlates spans across services
- Span ID - Identifies individual operations
- Parent Span ID - Links spans in a call tree

### Trace Attributes

Each span includes:

- `http.method` - HTTP method
- `http.path` - Request path
- `http.status_code` - Response status
- `user.id` - Authenticated user ID
- `error.message` - Error message (if failed)

### Viewing Traces

Access Jaeger UI: http://localhost:16686

1. Select service: `alo-manager-api`
2. Click "Find Traces"
3. Click on a trace to view details

### Trace Propagation

Traces propagate across services via HTTP headers:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

## Logging

### Structured Logging

Logs are emitted as JSON for easy parsing:

```json
{
  "level": "info",
  "context": "EstablishmentsController",
  "message": "createEstablishment: Created establishment",
  "establishmentId": 123,
  "timestamp": "2024-01-27T10:30:00Z"
}
```

### Log Levels

- `debug` - Detailed debugging information
- `info` - General informational messages
- `warn` - Warning messages
- `error` - Error messages

### Quickwit Queries

Access Quickwit UI: http://localhost:7280

Example queries:

```
# All errors
level: "error"

# Requests by user
context: "EstablishmentsController" AND userId: 123

# Slow requests
duration_ms: >1000

# Recent logs
timestamp: >now-1h
```

## Telemetry Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│    API      │────▶│  OTEL        │────▶│ Prometheus│
│             │     │  Collector   │     │          │
└─────────────┘     └──────────────┘     └──────────┘
                           │
                           ▼
                    ┌──────────┐
                    │  Jaeger  │
                    │          │
                    └──────────┘

┌─────────────┐     ┌──────────────┐     ┌──────────┐
│    API      │────▶│  OTEL        │────▶│ Quickwit │
│             │     │  Collector   │     │          │
└─────────────┘     └──────────────┘     └──────────┘
```

## Configuration

### Environment Variables

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:14318
OTEL_SERVICE_NAME=alo-manager-api

# Logging
LOG_LEVEL=info

# Quickwit
QUICKWIT_URL=http://localhost:7280
QUICKWIT_TRACES_INDEX_ID=alo-manager-traces
```

### Collector Configuration

The OpenTelemetry Collector is configured in `collector-observability.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14318

processors:
  batch:

exporters:
  prometheus:
    endpoint: "0.0.0.0:9090"
  jaeger:
    endpoint: jaeger:4317
  otlp/quickwit:
    endpoint: quickwit:7280
```

## Monitoring Best Practices

1. **Set Up Alerts**
   - Error rate > 1%
   - P95 latency > 500ms
   - Database connection pool exhausted
   - Redis connection failures

2. **Custom Metrics**
   - Track business KPIs
   - Monitor external API calls
   - Track cache hit rates

3. **Log Correlation**
   - Include trace IDs in logs
   - Include user IDs in logs
   - Include request IDs in logs

4. **Dashboard Queries**
   - Request rate: `rate(http_requests_total[5m])`
   - Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
   - P95 latency: `histogram_quantile(0.95, http_request_duration_seconds)`

## Troubleshooting

### No Metrics Appearing

1. Check Prometheus target: http://localhost:9090/targets
2. Verify `/metrics` endpoint returns data
3. Check OTEL collector is running

### No Traces Appearing

1. Check Jaeger UI: http://localhost:16686
2. Verify OTEL exporter configuration
3. Check for trace sampling configuration

### No Logs Appearing

1. Check Quickwit UI: http://localhost:7280
2. Verify log level settings
3. Check OTEL logs endpoint

## Performance Considerations

- **Sampling**: Use trace sampling in production (e.g., 10%)
- **Cardinality**: Avoid high-cardinality labels in metrics
- **Retention**: Configure appropriate data retention periods
- **Batching**: Use batch processor for better throughput

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Quickwit Documentation](https://quickwit.io/docs/)
