export interface MetricsConfig {
  /**
   * Enable/disable metrics collection
   */
  enabled?: boolean;

  /**
   * Default labels to include with all metrics
   */
  defaultLabels?: Record<string, string>;

  /**
   * Port for metrics endpoint (default: 9090)
   */
  port?: number;

  /**
   * Path for metrics endpoint (default: /metrics)
   */
  path?: string;
}

export interface CounterMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface GaugeMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface HistogramMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  buckets?: number[];
  timestamp?: number;
}
