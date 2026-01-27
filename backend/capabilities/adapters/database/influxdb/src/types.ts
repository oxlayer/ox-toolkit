export interface MetricsConfig {
  url?: string;
  token?: string;
  org?: string;
  bucket?: string;
}

export interface MetricPoint {
  measurement: string;
  tags?: Record<string, string>;
  fields: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface PerformanceMetrics {
  response_time?: number;
  memory_usage?: number;
  cpu_usage?: number;
  request_count?: number;
}

export interface TimerResult {
  end: () => number;
}
