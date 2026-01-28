-- Create database for {{PROJECT_NAME}} if it doesn't exist
CREATE DATABASE IF NOT EXISTS {{PROJECT_SLUG}};

-- Domain Events Table for {{PROJECT_NAME}}
-- Stores all domain events for analytics and auditing

CREATE TABLE IF NOT EXISTS {{PROJECT_SLUG}}.domain_events
(
    timestamp DateTime64(9),
    eventName String,
    eventId String,
    entityType String,
    entityId String,
    correlationId String,
    causationId String,
    userId String,
    data String,
    INDEX idx_event_name eventName TYPE bloom_filter GRANULARITY 1,
    INDEX idx_entity entityType, entityId TYPE bloom_filter GRANULARITY 1,
    INDEX idx_user userId TYPE bloom_filter GRANULARITY 1,
    INDEX idx_timestamp timestamp TYPE minmax GRANULARITY 1
)
ENGINE = MergeTree()
ORDER BY (timestamp, eventName)
PARTITION BY toStartOfMonth(timestamp)
TTL timestamp + INTERVAL 90 DAY;

-- Business Metrics Table
CREATE TABLE IF NOT EXISTS {{PROJECT_SLUG}}.business_metrics
(
    timestamp DateTime64(9),
    metricName String,
    metricValue Float64,
    tags String,
    INDEX idx_metric_name metricName TYPE bloom_filter GRANULARITY 1,
    INDEX idx_tags tags TYPE bloom_filter GRANULARITY 1,
    INDEX idx_timestamp timestamp TYPE minmax GRANULARITY 1
)
ENGINE = MergeTree()
ORDER BY (timestamp, metricName)
PARTITION BY toStartOfMonth(timestamp)
TTL timestamp + INTERVAL 90 DAY;

-- Aggregated metrics materialized views
CREATE MATERIALIZED VIEW IF NOT EXISTS {{PROJECT_SLUG}}.metrics_by_hour AS
SELECT
    toStartOfHour(timestamp) as hour,
    eventName,
    entityType,
    count() as event_count
FROM {{PROJECT_SLUG}}.domain_events
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY hour, eventName, entityType
