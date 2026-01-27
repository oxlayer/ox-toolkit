-- Domain events table for storing business events
-- This table stores raw domain events for analytics and reporting
CREATE TABLE IF NOT EXISTS domain_events (
    event_time DateTime64(3) DEFAULT now64(3),
    event_name LowCardinality(String),
    event_domain LowCardinality(String),
    tenant String DEFAULT '',
    plan String DEFAULT '',
    service_name String DEFAULT '',
    environment String DEFAULT '',
    payload String DEFAULT '{}',
    trace_id String DEFAULT '',
    span_id String DEFAULT ''
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_domain, event_name, event_time, tenant)
TTL toDateTime(event_time) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
