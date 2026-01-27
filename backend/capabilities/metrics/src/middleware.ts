import type { Context, Next } from 'hono';
import { MetricsClient } from './metrics-client.js';
import type { MetricsConfig } from './types.js';

/**
 * Metrics collection middleware for Hono
 * Tracks HTTP request count, duration, and status codes
 */
export function metricsMiddleware(client: MetricsClient, config: MetricsConfig = {}) {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    // Process the request
    await next();

    // Calculate duration
    const duration = Date.now() - start;
    const status = c.res.status;

    // Record metrics
    const labels = {
      method,
      path,
      status: status.toString(),
    };

    // Counter for requests
    client.counter('http_requests_total', 1, labels);

    // Histogram for request duration
    client.histogram('http_request_duration_ms', duration, labels);

    // Gauge for active requests (decrement after request)
    client.gauge('http_requests_active', 1, { method, path });
    client.gauge('http_requests_active', -1, { method, path });
  };
}

/**
 * Middleware that serves metrics in Prometheus format
 */
export function metricsEndpoint(client: MetricsClient, config: MetricsConfig = {}) {
  const path = config.path ?? '/metrics';

  return async (c: Context, next: Next) => {
    // Only respond to metrics endpoint
    if (c.req.path === path && c.req.method === 'GET') {
      const metrics = client.getMetrics();
      return c.text(metrics, 200, {
        'Content-Type': 'text/plain',
      });
    }

    await next();
  };
}
