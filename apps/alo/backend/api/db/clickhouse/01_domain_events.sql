-- Domain Events Table for Alo Manager
CREATE TABLE IF NOT EXISTS analytics.domain_events (
  timestamp DateTime64(9, 'UTC') DEFAULT now64(9, 'UTC'),
  event_name String,
  event_domain String,
  tenant String DEFAULT 'default',
  plan String DEFAULT 'free',
  payload String,
  trace_id String DEFAULT '',
  span_id String DEFAULT ''
) ENGINE = MergeTree()
PRIMARY KEY (timestamp, event_name)
ORDER BY (timestamp, event_name, tenant)
TTL timestamp + INTERVAL 30 DAY;
