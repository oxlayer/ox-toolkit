/**
 * Metrics Configuration
 */

import { createMetricsMiddleware, createTelemetryMiddleware, type TelemetryClient } from '@oxlayer/capabilities-telemetry';

let telemetryClient: TelemetryClient | undefined;

/**
 * Initialize OpenTelemetry
 */
export async function initializeTelemetry() {
  const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || '{{PROJECT_SLUG}}-api';

  if (!OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.warn('[Metrics] OTEL_EXPORTER_OTLP_ENDPOINT not set, telemetry disabled');
    return;
  }

  console.log(`[Metrics] Initializing telemetry for ${OTEL_SERVICE_NAME}`);

  // Initialize telemetry client here
  // telemetryClient = await createTelemetryClient({...});
}

/**
 * Get metrics middleware for Prometheus
 */
export function getMetricsMiddleware() {
  return createMetricsMiddleware({
    serviceName: process.env.OTEL_SERVICE_NAME || '{{PROJECT_SLUG}}-api',
  });
}

/**
 * Get telemetry/trace middleware
 */
export function getTelemetryMiddleware() {
  return createTelemetryMiddleware({
    serviceName: process.env.OTEL_SERVICE_NAME || '{{PROJECT_SLUG}}-api',
  });
}

/**
 * Shutdown telemetry
 */
export async function shutdownTelemetry() {
  if (telemetryClient) {
    await telemetryClient.shutdown();
  }
}
