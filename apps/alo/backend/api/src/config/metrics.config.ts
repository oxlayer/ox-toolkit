/**
 * Metrics and Telemetry Configuration
 */

import { createMetricsMiddleware, createTelemetryMiddleware, type TelemetryClient } from '@oxlayer/capabilities-telemetry';
import { ENV } from './app.config.js';

let telemetryClient: TelemetryClient | undefined;
let telemetryMiddleware: any | undefined;

/**
 * Metrics middleware configuration
 */
export const metricsOptions = {
  prefix: 'alo_manager_api',
  labels: {
    service: 'alo-manager',
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
  serviceName: ENV.OTEL_SERVICE_NAME,
  serviceVersion: '1.0.0',
  otlpEndpoint: ENV.OTEL_EXPORTER_OTLP_ENDPOINT,
  enabled: true,
  quickwit: {
    indexId: process.env.QUICKWIT_TRACES_INDEX_ID,
    url: process.env.QUICKWIT_URL || 'http://localhost:7280',
  },
};

/**
 * Initialize OpenTelemetry client eagerly
 */
export async function initializeTelemetry() {
  if (!ENV.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.warn('[Telemetry] OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping telemetry initialization');
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
  if (!ENV.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Return a no-op middleware if telemetry is not configured
    return async (_c: any, next: any) => next();
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
