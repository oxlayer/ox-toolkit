/**
 * Prometheus Metrics Module
 *
 * Provides Prometheus-compatible metrics collection for Hono applications.
 * Uses prom-client for metrics and exposes them on /metrics endpoint.
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import type { Context } from 'hono';

export interface MetricsOptions {
  /**
   * Prefix for all metrics
   * @default 'http'
   */
  prefix?: string;

  /**
   * Labels to apply to all metrics
   */
  labels?: Record<string, string>;

  /**
   * Collect default Node.js metrics (memory, CPU, event loop lag)
   * @default true
   */
  collectDefaultMetrics?: boolean;

  /**
   * Custom metrics registry
   */
  registry?: Registry;
}

export interface MetricsMiddlewareOptions extends MetricsOptions {
  /**
   * Path to expose metrics endpoint
   * @default '/metrics'
   */
  path?: string;

  /**
   * Whether to include method label
   * @default true
   */
  includeMethod?: boolean;

  /**
   * Whether to include status code label
   * @default true
   */
  includeStatus?: boolean;

  /**
   * Whether to include path label (route pattern)
   * @default true
   */
  includePath?: boolean;
}

export interface MetricsLabels {
  method?: string;
  status?: string;
  path?: string;
  [key: string]: string | number | undefined;
}

/**
 * Metrics class that manages Prometheus metrics
 */
export class PrometheusMetrics {
  private registry: Registry;
  private prefix: string;
  private defaultLabels: Record<string, string>;

  // HTTP metrics
  private httpRequestsTotal!: Counter<string>;
  private httpRequestDuration!: Histogram<string>;
  private httpRequestsInProgress!: Gauge<string>;
  private httpRequestSize!: Histogram<string>;
  private httpResponseSize!: Histogram<string>;

  // Custom metrics storage
  private customCounters = new Map<string, Counter<string>>();
  private customGauges = new Map<string, Gauge<string>>();
  private customHistograms = new Map<string, Histogram<string>>();

  constructor(options: MetricsOptions = {}) {
    this.prefix = options.prefix || 'http';
    this.defaultLabels = options.labels || {};
    this.registry = options.registry || new Registry();

    // Set default labels
    if (Object.keys(this.defaultLabels).length > 0) {
      this.registry.setDefaultLabels(this.defaultLabels);
    }

    // Collect default Node.js metrics
    if (options.collectDefaultMetrics !== false) {
      collectDefaultMetrics({ register: this.registry });
    }

    // Initialize HTTP metrics
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const labelNames = ['method', 'status', 'path'];

    // HTTP request counter
    this.httpRequestsTotal = new Counter({
      name: `${this.prefix}_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames,
      registers: [this.registry],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: `${this.prefix}_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // HTTP requests in progress gauge
    this.httpRequestsInProgress = new Gauge({
      name: `${this.prefix}_requests_in_progress`,
      help: 'Number of HTTP requests in progress',
      labelNames: ['path'],
      registers: [this.registry],
    });

    // HTTP request size histogram
    this.httpRequestSize = new Histogram({
      name: `${this.prefix}_request_size_bytes`,
      help: 'HTTP request size in bytes',
      labelNames,
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry],
    });

    // HTTP response size histogram
    this.httpResponseSize = new Histogram({
      name: `${this.prefix}_response_size_bytes`,
      help: 'HTTP response size in bytes',
      labelNames,
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry],
    });
  }

  /**
   * Increment request counter
   */
  incRequest(labels: MetricsLabels): void {
    this.httpRequestsTotal.inc(labels);
  }

  /**
   * Observe request duration
   */
  observeDuration(duration: number, labels: MetricsLabels): void {
    this.httpRequestDuration.observe(labels, duration);
  }

  /**
   * Increment in-progress requests
   */
  incInProgress(path: string): void {
    this.httpRequestsInProgress.inc({ path });
  }

  /**
   * Decrement in-progress requests
   */
  decInProgress(path: string): void {
    this.httpRequestsInProgress.dec({ path });
  }

  /**
   * Observe request size
   */
  observeRequestSize(size: number, labels: MetricsLabels): void {
    this.httpRequestSize.observe(labels, size);
  }

  /**
   * Observe response size
   */
  observeResponseSize(size: number, labels: MetricsLabels): void {
    this.httpResponseSize.observe(labels, size);
  }

  /**
   * Create or get a custom counter
   */
  createCounter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    if (this.customCounters.has(name)) {
      return this.customCounters.get(name)!;
    }

    const counter = new Counter({
      name: `${this.prefix}_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });

    this.customCounters.set(name, counter);
    return counter;
  }

  /**
   * Create or get a custom gauge
   */
  createGauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    if (this.customGauges.has(name)) {
      return this.customGauges.get(name)!;
    }

    const gauge = new Gauge({
      name: `${this.prefix}_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });

    this.customGauges.set(name, gauge);
    return gauge;
  }

  /**
   * Create or get a custom histogram
   */
  createHistogram(name: string, help: string, labelNames: string[] = [], buckets?: number[]): Histogram<string> {
    if (this.customHistograms.has(name)) {
      return this.customHistograms.get(name)!;
    }

    const histogram = new Histogram({
      name: `${this.prefix}_${name}`,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    });

    this.customHistograms.set(name, histogram);
    return histogram;
  }

  /**
   * Get metrics registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Get metrics as Prometheus text format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.registry.clear();
    this.initializeMetrics();
  }
}

/**
 * Create metrics middleware factory
 *
 * @example
 * ```ts
 * import { metricsMiddleware } from '@oxlayer/capabilities-telemetry';
 *
 * app.use('/api/*', metricsMiddleware({
 *   prefix: 'todo_api',
 *   labels: { service: 'todo-app' },
 * }));
 * ```
 */
export function createMetricsMiddleware(options: MetricsMiddlewareOptions = {}) {
  const {
    path = '/metrics',
    prefix = 'http',
    labels = {},
  } = options;

  const metrics = new PrometheusMetrics({ prefix, labels });

  // Store metrics instance for later access
  (global as any).__prometheus_metrics = metrics;

  return {
    metrics,
    middleware: async (c: Context, next: any) => {
      // Skip metrics endpoint itself
      if (c.req.path === path) {
        const metricsData = await metrics.getMetrics();
        return c.text(metricsData, 200, {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        });
      }

      // Extract labels
      const method = options.includeMethod !== false ? c.req.method : undefined;
      const routePath = options.includePath !== false ? c.req.path : undefined;

      // Track in-progress requests
      metrics.incInProgress(routePath || 'unknown');

      // Track request size
      const contentLength = c.req.header('content-length');
      if (contentLength) {
        metrics.observeRequestSize(parseInt(contentLength, 10), {
          method,
          path: routePath,
          status: 'incoming',
        });
      }

      const start = Date.now();

      await next();

      // Calculate duration
      const duration = (Date.now() - start) / 1000;
      const status = options.includeStatus !== false ? String(c.res.status) : undefined;

      // Record metrics
      metrics.incRequest({ method, status, path: routePath });
      metrics.observeDuration(duration, { method, status, path: routePath });

      // Track response size (estimated from response)
      // Note: Hono doesn't expose response size directly
      metrics.decInProgress(routePath || 'unknown');
    },
  };
}

/**
 * Get the global metrics instance
 */
export function getMetrics(): PrometheusMetrics | undefined {
  return (global as any).__prometheus_metrics;
}

/**
 * Helper to record custom business metrics
 *
 * @example
 * ```ts
 * import { recordCounter, recordGauge } from '@oxlayer/capabilities-telemetry';
 *
 * // Record a todo creation
 * recordCounter('todos_created_total', 1, { status: 'pending' });
 *
 * // Record active todos count
 * recordGauge('todos_active_count', 42);
 * ```
 */
export function recordCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
  const metrics = getMetrics();
  if (!metrics) return;

  const counter = metrics.createCounter(name, `${name} counter`, Object.keys(labels || {}));
  counter.inc(labels || {}, value);
}

export function recordGauge(name: string, value: number, labels?: Record<string, string>): void {
  const metrics = getMetrics();
  if (!metrics) return;

  const gauge = metrics.createGauge(name, `${name} gauge`, Object.keys(labels || {}));
  gauge.set(labels || {}, value);
}

export function recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
  const metrics = getMetrics();
  if (!metrics) return;

  const histogram = metrics.createHistogram(name, `${name} histogram`, Object.keys(labels || {}));
  histogram.observe(labels || {}, value);
}
