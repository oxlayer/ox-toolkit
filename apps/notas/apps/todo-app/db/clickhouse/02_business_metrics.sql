-- Business metrics table for aggregated KPIs
-- This table stores pre-aggregated business metrics for analytics
-- Includes trace_id and span_id for correlation with distributed traces
CREATE TABLE IF NOT EXISTS business_metrics (
    metric_time DateTime64(3) DEFAULT now64(3),
    metric_name LowCardinality(String),
    metric_domain LowCardinality(String) DEFAULT 'business',
    metric_kind LowCardinality(String) DEFAULT 'counter',
    tenant String DEFAULT '',
    plan String DEFAULT '',
    service_name String DEFAULT '',
    environment String DEFAULT '',
    value Float64 DEFAULT 0,
    attributes Map(String, String) DEFAULT map(),
    -- Trace context for correlation with traces in Quickwit/Jaeger
    trace_id String DEFAULT '',
    span_id String DEFAULT ''
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(metric_time)
ORDER BY (metric_domain, metric_name, tenant, metric_time)
TTL toDateTime(metric_time) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
