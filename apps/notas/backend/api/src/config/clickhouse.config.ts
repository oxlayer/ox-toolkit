/**
 * ClickHouse Business Events & Metrics Configuration
 *
 * Provides emitters for domain events and business metrics
 * that are sent directly to ClickHouse via HTTP endpoint.
 *
 * Signal Routing:
 * - Domain events: Direct HTTP → ClickHouse domain_events table
 * - Business metrics: Direct HTTP → ClickHouse business_metrics table
 *
 * Architecture:
 * App → HTTP → ClickHouse (direct write, no OTEL Collector for business data)
 */

import { createOtelLogger, type OtelLogger } from '@oxlayer/capabilities-telemetry';

// Lazy-initialized logger instance
let chLogger: OtelLogger | null = null;

async function getLogger(): Promise<OtelLogger> {
  if (!chLogger) {
    chLogger = await createOtelLogger({
      serviceName: 'todo-app',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      context: 'ClickHouse',
      // Note: We're not setting up OTEL export for ClickHouse operations
      // since these are direct HTTP calls. The logger will use console output.
      // If you want to send ClickHouse operation logs to OTEL, set otlpEndpoint.
    });
  }
  return chLogger;
}

/**
 * Helper to get trace context from active span
 * This is a simplified version that doesn't require @opentelemetry/api import
 */
function getTraceContext() {
  // Try to get trace context from the async local storage
  // If the app is running with OpenTelemetry instrumentation,
  // the trace context will be available through the OTEL context
  try {
    const asyncLocalStorage = (global as any).__OTEL_ASYNC_LOCAL_STORAGE__;
    if (asyncLocalStorage) {
      const context = asyncLocalStorage.getStore();
      if (context) {
        const spanContext = context._currentSpan?.spanContext();
        if (spanContext) {
          return {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
          };
        }
      }
    }
  } catch {
    // Ignore errors and fall back to empty context
  }
  return { traceId: '', spanId: '' };
}

/**
 * Domain Event Emitter
 *
 * Emits domain events directly to ClickHouse via HTTP endpoint.
 * This gives us full control over the table schema.
 *
 * @example
 * ```ts
 * import { domainEvents } from './config/clickhouse.config.js';
 *
 * await domainEvents.emit('todo_created',
 *   { todo_id: '123', user_id: '456', title: 'My Todo' },
 *   { tenant: 'acme', plan: 'pro' }
 * );
 * ```
 */
export class DomainEventEmitter {
  private clickhouseEndpoint: string;
  private database: string;
  private authHeader: string;
  private enabled: boolean;

  constructor() {
    const host = process.env.CLICKHOUSE_HOST || 'localhost';
    const port = process.env.CLICKHOUSE_PORT || '8123';
    const db = process.env.CLICKHOUSE_DB || 'analytics';
    const user = process.env.CLICKHOUSE_USER || 'default';
    const password = process.env.CLICKHOUSE_PASSWORD || '';
    const enabled = process.env.CLICKHOUSE_ENABLED !== 'false';

    this.clickhouseEndpoint = `http://${host}:${port}`;
    this.database = db;
    this.enabled = enabled;

    // Build Basic Auth header if credentials are provided
    if (password) {
      this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    } else {
      this.authHeader = '';
    }
  }

  /**
   * Emit a domain event to ClickHouse
   *
   * @param eventName - Name of the event (e.g., "todo_created")
   * @param payload - Event payload (will be JSON stringified)
   * @param metadata - Optional metadata (tenant, plan, trace context)
   */
  async emit(
    eventName: string,
    payload: Record<string, unknown>,
    metadata?: {
      tenant?: string;
      plan?: string;
      traceId?: string;
      spanId?: string;
    }
  ): Promise<void> {
    // Skip if ClickHouse is disabled
    if (!this.enabled) {
      return;
    }

    const logger = await getLogger();

    // Get current trace context if not provided
    const traceContext = getTraceContext();

    const payloadJson = JSON.stringify(payload);

    const query = `INSERT INTO ${this.database}.domain_events FORMAT JSONEachRow`;

    const row = JSON.stringify({
      event_name: eventName,
      event_domain: 'todo',
      tenant: metadata?.tenant || 'default',
      plan: metadata?.plan || 'free',
      payload: payloadJson,
      // Use provided trace context or get from active span
      trace_id: metadata?.traceId || traceContext.traceId || '',
      span_id: metadata?.spanId || traceContext.spanId || '',
    });

    const url = `${this.clickhouseEndpoint}?query=${encodeURIComponent(query)}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth header if credentials are configured
      if (this.authHeader) {
        headers['Authorization'] = this.authHeader;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: row,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(
          `Failed to emit domain event: ${response.statusText}`,
          new Error(errorText),
          {
            event_name: eventName,
            status_code: response.status,
            clickhouse_endpoint: this.clickhouseEndpoint,
          }
        );
      } else {
        logger.debug(`Domain event emitted successfully`, {
          event_name: eventName,
          tenant: metadata?.tenant || 'default',
        });
      }
    } catch (error) {
      logger.error(`Error emitting domain event`, error as Error, {
        event_name: eventName,
        clickhouse_endpoint: this.clickhouseEndpoint,
      });
    }
  }
}

/**
 * Business Metric Emitter
 *
 * Emits business metrics directly to ClickHouse via HTTP endpoint.
 *
 * @example
 * ```ts
 * import { businessMetrics } from './config/clickhouse.config.js';
 *
 * // Record a counter metric
 * await businessMetrics.increment('business.todo.created', {
 *   tenant: 'acme',
 *   plan: 'pro',
 * });
 *
 * // Record a gauge metric
 * await businessMetrics.gauge('business.todos.active', 42, {
 *   tenant: 'acme',
 *   plan: 'pro',
 * });
 * ```
 */
export class BusinessMetricEmitter {
  private clickhouseEndpoint: string;
  private database: string;
  private authHeader: string;
  private enabled: boolean;

  constructor() {
    const host = process.env.CLICKHOUSE_HOST || 'localhost';
    const port = process.env.CLICKHOUSE_PORT || '8123';
    const db = process.env.CLICKHOUSE_DB || 'analytics';
    const user = process.env.CLICKHOUSE_USER || 'default';
    const password = process.env.CLICKHOUSE_PASSWORD || '';
    const enabled = process.env.CLICKHOUSE_ENABLED !== 'false';

    this.clickhouseEndpoint = `http://${host}:${port}`;
    this.database = db;
    this.enabled = enabled;

    // Build Basic Auth header if credentials are provided
    if (password) {
      this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    } else {
      this.authHeader = '';
    }
  }

  /**
   * Record a business metric to ClickHouse
   *
   * @param metricName - Name of the metric (e.g., "business.todo.created")
   * @param value - Numeric value
   * @param kind - Type of metric (counter, gauge, histogram)
   * @param dimensions - Business dimensions (tenant, plan, etc.)
   */
  async record(
    metricName: string,
    value: number,
    kind: 'counter' | 'gauge' | 'histogram',
    dimensions?: {
      tenant?: string;
      plan?: string;
      [key: string]: string | number | boolean | undefined;
    }
  ): Promise<void> {
    // Skip if ClickHouse is disabled
    if (!this.enabled) {
      return;
    }

    const logger = await getLogger();

    // Get current trace context
    const traceContext = getTraceContext();

    const query = `INSERT INTO ${this.database}.business_metrics FORMAT JSONEachRow`;

    // Build attributes map, excluding tenant and plan which are columns
    const attributes: Record<string, string> = {};
    if (dimensions) {
      for (const [key, val] of Object.entries(dimensions)) {
        if (key !== 'tenant' && key !== 'plan' && val !== undefined) {
          attributes[key] = String(val);
        }
      }
    }

    const row = JSON.stringify({
      metric_name: metricName,
      metric_domain: 'business',
      metric_kind: kind,
      tenant: dimensions?.tenant || 'default',
      plan: dimensions?.plan || 'free',
      value: value,
      attributes: attributes,
      // Add trace context for correlation
      trace_id: traceContext.traceId || '',
      span_id: traceContext.spanId || '',
    });

    const url = `${this.clickhouseEndpoint}?query=${encodeURIComponent(query)}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth header if credentials are configured
      if (this.authHeader) {
        headers['Authorization'] = this.authHeader;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: row,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(
          `Failed to record business metric: ${response.statusText}`,
          new Error(errorText),
          {
            metric_name: metricName,
            metric_kind: kind,
            status_code: response.status,
            clickhouse_endpoint: this.clickhouseEndpoint,
          }
        );
      } else {
        logger.debug(`Business metric recorded successfully`, {
          metric_name: metricName,
          metric_kind: kind,
          tenant: dimensions?.tenant || 'default',
        });
      }
    } catch (error) {
      logger.error(`Error recording business metric`, error as Error, {
        metric_name: metricName,
        metric_kind: kind,
        clickhouse_endpoint: this.clickhouseEndpoint,
      });
    }
  }

  /**
   * Convenience method for recording a counter increment
   *
   * @param metricName - Name of the counter metric
   * @param dimensions - Business dimensions
   */
  async increment(metricName: string, dimensions?: Record<string, string | number | boolean | undefined>): Promise<void> {
    return this.record(metricName, 1, 'counter', dimensions);
  }

  /**
   * Convenience method for recording a gauge value
   *
   * @param metricName - Name of the gauge metric
   * @param value - Current gauge value
   * @param dimensions - Business dimensions
   */
  async gauge(metricName: string, value: number, dimensions?: Record<string, string | number | boolean | undefined>): Promise<void> {
    return this.record(metricName, value, 'gauge', dimensions);
  }
}

// Singleton instances for easy import
export const domainEvents = new DomainEventEmitter();
export const businessMetrics = new BusinessMetricEmitter();
