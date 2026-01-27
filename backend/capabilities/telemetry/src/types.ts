import type { Tracer } from '@opentelemetry/api';

export interface QuickwitTelemetryOptions {
  /**
   * Quickwit server URL (e.g. http://localhost:7280)
   * Required for automatic index creation.
   */
  url?: string;

  /**
   * Custom index ID for Quickwit (overrides default 'otel-logs-v0_7' or 'otel-traces-v0_7')
   */
  indexId?: string;
}

export interface OpenTelemetryMiddlewareOptions {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  enabled?: boolean;
  quickwit?: QuickwitTelemetryOptions;
}

// Re-export OpenTelemetry types for convenience
export type { Tracer };
