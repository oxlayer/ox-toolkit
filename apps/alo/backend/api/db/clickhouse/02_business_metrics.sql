-- Business Metrics Table for Alo Manager
CREATE TABLE IF NOT EXISTS analytics.business_metrics (
  timestamp DateTime64(9, 'UTC') DEFAULT now64(9, 'UTC'),
  metric_name String,
  metric_domain String,
  metric_kind String,
  tenant String DEFAULT 'default',
  plan String DEFAULT 'free',
  value Float64,
  attributes String DEFAULT '{}',
  trace_id String DEFAULT '',
  span_id String DEFAULT ''
) ENGINE = MergeTree()
PRIMARY KEY (timestamp, metric_name)
ORDER BY (timestamp, metric_name, tenant)
TTL timestamp + INTERVAL 30 DAY;
