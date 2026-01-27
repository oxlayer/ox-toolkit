/**
 * Metrics Configuration
 *
 * Sets up Prometheus metrics and OpenTelemetry tracing for the Todo API.
 */

import { createMetricsMiddleware, createTelemetryMiddleware, type TelemetryClient } from '@oxlayer/capabilities-telemetry';
import { ENV } from './app.config.js';

let telemetryClient: TelemetryClient | undefined;
let telemetryMiddleware: any | undefined;

/**
 * Metrics middleware configuration
 */
export const metricsOptions = {
  prefix: 'todo_api',
  labels: {
    service: 'todo-app',
    version: '1.0.0',
    environment: ENV.NODE_ENV,
  },
  path: '/metrics',
};

/**
 * Create metrics middleware for HTTP metrics
 */
export function getMetricsMiddleware() {
  const { metrics, middleware } = createMetricsMiddleware(metricsOptions);
  return { metrics, middleware };
}

/**
 * OpenTelemetry configuration for distributed tracing
 */
export const telemetryOptions = {
  serviceName: 'todo-app',
  serviceVersion: '1.0.0',
  // Send traces to OTEL Collector or directly to Quickwit
  // Prioritize specific traces endpoint, then generic endpoint + path, then default to Quickwit HTTP
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  // Enable in development for demo, or in production
  enabled: true, // !!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || ENV.NODE_ENV === 'production',
  quickwit: {
    indexId: process.env.QUICKWIT_TRACES_INDEX_ID,
    url: process.env.QUICKWIT_URL || 'http://localhost:7280',
  },
};

/**
 * Initialize OpenTelemetry client eagerly
 *
 * Call this during startup to ensure the telemetry client is available
 * before the DI container initializes. This enables proper tracing for
 * database operations, use cases, and other components.
 */
export async function initializeTelemetry() {
  if (!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    console.warn('[Telemetry] OTEL_EXPORTER_OTLP_TRACES_ENDPOINT not set, skipping telemetry initialization');
    return;
  }

  // Check if already fully initialized
  if (telemetryClient && telemetryClient.isReady()) {
    console.warn('[Telemetry] Already initialized, skipping');
    return;
  }

  // If client exists but isn't initialized, initialize it now
  // This can happen if getTelemetryMiddleware() was called before initializeTelemetry()
  if (telemetryClient && !telemetryClient.isReady()) {
    console.log('[Telemetry] Client exists but not initialized, initializing now...');
    await telemetryClient.initialize();
    console.log('[Telemetry] Initialized eagerly during startup');
    return;
  }

  // Otherwise, create new client and initialize it
  const { middleware, client } = createTelemetryMiddleware(telemetryOptions);
  telemetryClient = client;
  telemetryMiddleware = middleware;

  // Initialize the client eagerly so the tracer is available
  await client.initialize();
  console.log('[Telemetry] Initialized eagerly during startup');
}

/**
 * Get OpenTelemetry middleware for tracing
 */
export function getTelemetryMiddleware() {
  if (!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    throw new Error('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is not set');
  }

  // If telemetry was already initialized eagerly, reuse the middleware
  if (telemetryMiddleware) {
    return telemetryMiddleware;
  }

  // Otherwise, initialize lazily (first request path)
  const { middleware, client } = createTelemetryMiddleware(telemetryOptions);
  telemetryClient = client;
  telemetryMiddleware = middleware;
  return middleware;
}

/**
 * Get the telemetry client instance
 *
 * Useful for accessing the tracer in other parts of the application.
 *
 * @example
 * ```ts
 * import { getTelemetryClient } from './config/metrics.config.js';
 *
 * const client = getTelemetryClient();
 * const tracer = client?.getTracer();
 * ```
 */
export function getTelemetryClient(): TelemetryClient | undefined {
  return telemetryClient;
}

/**
 * Shutdown telemetry client
 */
export async function shutdownTelemetry() {
  if (telemetryClient) {
    await telemetryClient.shutdown();
  }
}

/**
 * Helper to record business metrics
 *
 * @example
 * ```ts
 * import { recordTodoCreated, recordTodoCompleted, recordActiveTodos } from './config/metrics.config.js';
 *
 * // Record a todo creation
 * recordTodoCreated({ status: 'pending' });
 *
 * // Record a todo completion
 * recordTodoCompleted();
 *
 * // Record active todos count
 * recordActiveTodos(42);
 * ```
 */

// Todo-specific metrics helpers
export function recordTodoCreated(labels?: { status?: string; has_due_date?: boolean }) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'todos_created_total',
    'Total number of todos created',
    ['status', 'has_due_date']
  );

  counter.inc({
    status: labels?.status || 'unknown',
    has_due_date: labels?.has_due_date ? 'true' : 'false',
  });
}

export function recordTodoUpdated(labels?: { field?: string }) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'todos_updated_total',
    'Total number of todos updated',
    ['field']
  );

  counter.inc({ field: labels?.field || 'unknown' });
}

export function recordTodoDeleted() {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'todos_deleted_total',
    'Total number of todos deleted',
    []
  );

  counter.inc();
}

export function recordTodoCompleted() {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'todos_completed_total',
    'Total number of todos completed',
    []
  );

  counter.inc();
}

export function recordActiveTodos(count: number) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const gauge = metrics.createGauge(
    'todos_active_count',
    'Number of active (non-completed) todos',
    []
  );

  gauge.set(count);
}

export function recordDatabaseQueryDuration(operation: string, duration: number) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const histogram = metrics.createHistogram(
    'database_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],
    [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
  );

  histogram.observe({ operation }, duration);
}

export function recordCacheHit(hit: boolean) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'cache_requests_total',
    'Total number of cache requests',
    ['hit']
  );

  counter.inc({ hit: hit ? 'true' : 'false' });
}

export function recordEventPublished(eventType: string) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'events_published_total',
    'Total number of events published',
    ['event_type']
  );

  counter.inc({ event_type: eventType });
}
