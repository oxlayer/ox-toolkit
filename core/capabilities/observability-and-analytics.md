# Observability & Analytics Architecture

This document defines the **official observability and business analytics architecture** used across the platform.

The goal is to provide:
- Clear separation of concerns
- Predictable signal routing
- Scalable storage backends
- Zero ambiguity between logs, traces, metrics, events, and KPIs

This architecture is **production-oriented**, Kubernetes-aligned, and designed for multi-tenant SaaS systems.

---

## 1. High-Level Signal Flow

### Infrastructure & Platform

```

Infra / Redis / Rabbit / Postgres
→ Prometheus (/metrics)
→ Grafana

```

- Prometheus scrapes infrastructure and platform metrics directly.
- Grafana visualizes operational health.

---

### Application Observability

```

App
├─ Logs ───────→ OTEL → Quickwit → Grafana
├─ Traces ─────→ OTEL → Quickwit → Grafana
└─ Métricas op → Prometheus → Grafana

```

- Logs and traces are routed via OpenTelemetry (OTEL) to Quickwit.
- Operational metrics are exposed via `/metrics` and scraped by Prometheus.
- OTEL is used as a **router**, not a metrics backend.

---

### Business Domain Signals

```

Domínio
├─ Eventos ────→ OTEL → ClickHouse → Grafana
└─ KPIs ───────→ OTEL → ClickHouse → Grafana

```

- Business-domain data is stored in ClickHouse.
- This includes:
  - Immutable domain events
  - Business KPIs and counters
- Grafana is the single visualization layer.

---

## 2. Backend Responsibilities

### Prometheus
**Purpose:** Operational health & alerting

Used for:
- Request rate
- Request latency (p95 / p99)
- HTTP status codes
- CPU / memory / saturation
- Redis, RabbitMQ, Postgres exporters

**Not used for:**
- Business KPIs
- Domain events
- Logs or traces

---

### Quickwit
**Purpose:** Debugging & observability

Used for:
- Application logs
- Distributed traces
- Error investigation
- Request-level debugging

**Not used for:**
- Business metrics
- Analytics or BI

---

### ClickHouse
**Purpose:** Business analytics & domain truth

Used for:
- Domain events (what happened)
- Business metrics (how much / how often)
- Tenant-level analytics
- Historical reporting
- BI-style queries

**Not used for:**
- Alerting
- Debug logs
- Tracing UI

---

## 3. Signal Classification

### Operational Metrics (Prometheus)

Examples:
- Request Rate / Latency / Status
- CPU / Memory
- Queue depth

```

→ Prometheus
→ Grafana

```

---

### Business Metrics (ClickHouse)

Example attributes:

```

metric.name   = "business.todo.created"
metric.kind   = "counter"
metric.domain = "business"

```

Used for:
- Product dashboards
- Tenant usage
- Plan comparison
- Growth metrics

```

→ OTEL
→ ClickHouse
→ Grafana

```

---

### Domain Events (ClickHouse)

Example attributes:

```

log.type     = "domain_event"
event.name   = "todo_created"
event.domain = "todo"

```

Used for:
- Auditing
- Funnels
- Analytics
- Historical reconstruction

```

→ OTEL
→ ClickHouse
→ Grafana

````

---

## 4. OpenTelemetry Routing (Pipelines)

OTEL uses **explicit pipelines**.
Signals are routed based on **semantic attributes**, never automatically duplicated.

```yaml
service:
  pipelines:

    metrics/business:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [clickhouse]

    logs/domain_events:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [clickhouse]

    logs/observability:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [quickwit]
````

### Routing Rules

* `log.type = "domain_event"`
  → ClickHouse (not Quickwit)

* `metric.domain = "business"`
  → ClickHouse (not Prometheus)

* Regular logs and traces
  → Quickwit

* Operational metrics
  → Prometheus (scraped directly)

---

## 5. Domain Events vs Business Metrics

### Domain Events

* Represent **immutable facts**
* Answer: *“What happened?”*
* High cardinality
* Stored as individual records

Example:

```json
{
  "event": "todo_created",
  "tenant": "acme",
  "plan": "pro",
  "timestamp": "2026-01-16T10:00:00Z"
}
```

Query example:

```sql
SELECT
  tenant,
  count(*) AS todos
FROM todo_events
WHERE event = 'todo_created'
GROUP BY tenant;
```

---

### Business Metrics

* Represent **aggregated measurements**
* Answer: *“How much / how often?”*
* Counters, gauges, rates
* Optimized for dashboards

Example:

```json
{
  "metric": "business.todo.created",
  "tenant": "acme",
  "plan": "pro",
  "value": 1,
  "timestamp": "2026-01-16T10:00:00Z"
}
```

Query example:

```sql
SELECT
  tenant,
  sum(value)
FROM business_metrics
GROUP BY tenant;
```

---

### Important Rule

> A single domain action **may emit both**:
>
> * one domain event
> * one business metric
>
> They are **different signals with different purposes**.

---

## 6. OTLP Transport Choice

### Why HTTP for ClickHouse

* ClickHouse has a **native HTTP ingestion API**
* Simpler than maintaining a custom gRPC server
* Uses `INSERT ... FORMAT JSONEachRow`
* Easy to debug and reason about

OTEL → HTTP → ClickHouse is:

* Explicit
* Transparent
* Production-proven

---

## 7. Data Retention & Storage Strategy

### ClickHouse Tables

* Engine: `MergeTree`
* Partitioning: **by month**
* Retention (TTL): **90 days**

This provides:

* Fast analytical queries
* Predictable storage growth
* Easy retention enforcement

---

## 8. Summary (Rules of the System)

* Prometheus = system health
* Quickwit = debugging & traces
* ClickHouse = business truth
* OTEL = router, not a database
* Signals are **explicitly classified**
* No backend receives “everything”

This architecture is the **reference model** for all services in the platform.