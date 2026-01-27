/**
 * Quickwit telemetry configuration
 */
export interface QuickwitTelemetryConfig {
  /**
   * Quickwit server URL
   */
  url: string;
  /**
   * Index ID for traces/logs
   */
  indexId: string;
  /**
   * API key for authentication (optional)
   */
  apiKey?: string;
  /**
   * Service name for telemetry
   */
  serviceName: string;
  /**
   * Service version
   */
  serviceVersion?: string;
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
  /**
   * Batch size for ingesting traces
   */
  batchSize?: number;
  /**
   * Flush interval in milliseconds
   */
  flushInterval?: number;
}

/**
 * Log entry
 */
export interface LogEntry {
  /**
   * Timestamp
   */
  timestamp: string;
  /**
   * Log level
   */
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  /**
   * Log message
   */
  message: string;
  /**
   * Service name
   */
  service: string;
  /**
   * Trace ID
   */
  traceId?: string;
  /**
   * Span ID
   */
  spanId?: string;
  /**
   * Additional context
   */
  context?: Record<string, unknown>;
}

/**
 * Span data for export
 */
export interface SpanData {
  /**
   * Trace ID
   */
  traceId: string;
  /**
   * Span ID
   */
  spanId: string;
  /**
   * Parent span ID
   */
  parentSpanId?: string;
  /**
   * Span name
   */
  name: string;
  /**
   * Start time
   */
  startTime: number;
  /**
   * End time
   */
  endTime: number;
  /**
   * Attributes
   */
  attributes: Record<string, unknown>;
  /**
   * Events
   */
  events: Array<{
    name: string;
    timestamp: number;
    attributes: Record<string, unknown>;
  }>;
  /**
   * Status
   */
  status: {
    code: number;
    message?: string;
  };
}

/**
 * Telemetry exporter options
 */
export interface ExporterOptions {
  /**
   * Quickwit URL
   */
  url: string;
  /**
   * Index ID
   */
  indexId: string;
  /**
   * API key
   */
  apiKey?: string;
  /**
   * Timeout
   */
  timeout?: number;
}
