OTEL Collector Configuration for Custom Quickwit Indices
Goal
Configure the OpenTelemetry Collector to route logs and traces from todo-app to specific Quickwit indices (todo-app-logs, todo-app-traces) while preserving the architecture of passing through the Collector.

Problem
The todo-app sends telemetry with qw-otel-logs-index and qw-otel-traces-index headers. The default OTEL Collector configuration does not automatically forward these headers to the downstream exporters, causing data to land in default indices.

Proposed Changes
otel-collector-config.yaml
We need to ensure headers are passed through or explicitly configured.

Option A: Headers Passthrough (Preferred if supported)
Configure the otlp exporter to include headers from the context. Requires headers_setter extension or routing processor if dynamic.

Option B: Static Configuration (Chosen Approach)
Since this Collector instance is dedicated to the todo-app environment, we will explicitly configure the Quickwit exporters to target the custom indices. This ensures that even if headers are lost in transit, the Collector enforces the correct destination.

Changes:

Update otlp/quickwit-logs exporter: Add headers: { "qw-otel-logs-index": "todo-app-logs" }
Update otlp/quickwit-traces exporter: Add headers: { "qw-otel-traces-index": "todo-app-traces" }
This aligns the Collector's output with the Application's expectations (and the auto-created indices).

Verification
Restart otel-collector service: docker-compose restart otel-collector
Restart todo-app (to ensure clean slate): docker-compose restart todo-app (or local pnpm)
Generate traffic.
Verify data in Quickwit/Grafana.
Domain Event Conventions (Governance)
To maintain a clean schema in ClickHouse and ensure reliable analytics, we explicitly define the following conventions for domain events.

Naming Convention
Domain event names should follow the pattern: <bounded_context>.<past_tense_verb>.

Examples:

todo.created
todo.completed
user.registered
payment.captured
Payload Structure
Domain events are logged with log.type = "domain_event". The event payload must be nested under event.payload to prevent top-level attribute explosion.

Schema:

{
  "log.type": "domain_event",
  "event.name": "todo.created",
  "event.domain": "todo",
  "event.version": "v1",
  "event.payload": {
    "todo_id": "123",
    "user_id": "456",
    "title": "Buy milk"
  }
}
Context Normalization
Log context should be normalized to log.context (or code.namespace) in future refactors to align with semantic conventions. Currently usage of context is acceptable but normalization is recommended.

