/**
 * Metrics Configuration
 *
 * Sets up Prometheus metrics and OpenTelemetry tracing for the FatorH API.
 */

import { createMetricsMiddleware, createTelemetryMiddleware, type TelemetryClient } from '@oxlayer/capabilities-telemetry';
import { ENV } from './app.config.js';

let telemetryClient: TelemetryClient | undefined;
let telemetryMiddleware: any | undefined;

/**
 * Metrics middleware configuration
 */
export const metricsOptions = {
  prefix: 'globex_api',
  labels: {
    service: ENV.SERVICE_NAME,
    version: ENV.SERVICE_VERSION,
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
  serviceName: ENV.SERVICE_NAME,
  serviceVersion: ENV.SERVICE_VERSION,
  // Send traces to OTEL Collector or directly to Quickwit
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  // Enable in development for demo, or in production
  enabled: !!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || ENV.NODE_ENV === 'production',
  quickwit: {
    indexId: process.env.QUICKWIT_TRACES_INDEX_ID,
    url: process.env.QUICKWIT_URL || 'http://localhost:7280',
  },
};

/**
 * Initialize OpenTelemetry client eagerly
 *
 * Call this during startup to ensure the telemetry client is available
 * before the DI container initializes.
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
    // Return a no-op middleware if telemetry is not configured
    return async (c: any, next: any) => next();
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
 * Helper to record business metrics for FatorH
 */

// Exam metrics
export function recordExamCreated(labels?: { exam_name?: string }) {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'exams_created_total',
    'Total number of exams created',
    ['exam_name']
  );

  counter.inc({ exam_name: labels?.exam_name || 'unknown' });
}

// Evaluation metrics
export function recordEvaluationStarted() {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'evaluations_started_total',
    'Total number of evaluations started',
    []
  );

  counter.inc();
}

export function recordEvaluationCompleted(status: 'completed' | 'partial' | 'failed') {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'evaluations_completed_total',
    'Total number of evaluations completed',
    ['status']
  );

  counter.inc({ status });
}

// Candidate metrics
export function recordCandidateRegistered() {
  const metrics = (global as any).__prometheus_metrics;
  if (!metrics) return;

  const counter = metrics.createCounter(
    'candidates_registered_total',
    'Total number of candidates registered',
    []
  );

  counter.inc();
}

// Database metrics
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

// Cache metrics
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

// Event metrics
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
