import type { Context, Next } from 'hono';
import { MetricsClient } from './client.js';
import type { MetricsConfig } from './types.js';

export interface MetricsVariables {
  metrics: MetricsClient;
}

declare module 'hono' {
  interface ContextVariableMap extends MetricsVariables { }
}

interface MetricsMiddlewareOptions extends MetricsConfig {
  enableRequestTracking?: boolean;
  enableHealthEndpoint?: boolean;
  healthPath?: string;
}

/**
 * Metrics middleware factory for Hono with InfluxDB
 *
 * @example
 * ```ts
 * import { metricsMiddleware } from '@oxlayer/capabilities-adapters/metrics';
 *
 * app.use('/api/*', metricsMiddleware({
 *   url: process.env.INFLUXDB_URL,
 *   token: process.env.INFLUXDB_TOKEN,
 *   org: process.env.INFLUXDB_ORG,
 *   bucket: process.env.INFLUXDB_BUCKET,
 *   enableRequestTracking: true,
 * }));
 * ```
 */
export function metricsMiddleware(options: MetricsMiddlewareOptions = {}) {
  const metricsClient = new MetricsClient({
    url: options.url,
    token: options.token,
    org: options.org,
    bucket: options.bucket
  });

  return async (c: Context, next: Next) => {
    c.set('metrics', metricsClient);

    if (options.enableRequestTracking !== false) {
      const start = Date.now();

      await next();

      const duration = Date.now() - start;
      metricsClient.timing('http_request_duration', duration, {
        method: c.req.method,
        route: c.req.routePath || c.req.path,
        status_code: c.res.status.toString()
      });

      metricsClient.counter('http_requests_total', 1, {
        method: c.req.method,
        route: c.req.routePath || c.req.path,
        status_code: c.res.status.toString()
      });
    } else {
      await next();
    }
  };
}
