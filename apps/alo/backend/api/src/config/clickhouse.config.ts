/**
 * ClickHouse Business Events & Metrics Configuration
 *
 * Provides emitters for domain events and business metrics
 * that are sent directly to ClickHouse via HTTP endpoint.
 */

import { createOtelLogger, type OtelLogger } from '@oxlayer/capabilities-telemetry';

// Lazy-initialized logger instance
let chLogger: OtelLogger | null = null;

async function getLogger(): Promise<OtelLogger> {
  if (!chLogger) {
    chLogger = await createOtelLogger({
      serviceName: 'alo-manager',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      context: 'ClickHouse',
    });
  }
  return chLogger;
}

/**
 * Helper to get trace context from active span
 */
function getTraceContext() {
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
    if (!this.enabled) {
      return;
    }

    const logger = await getLogger();
    const traceContext = getTraceContext();
    const payloadJson = JSON.stringify(payload);

    const query = `INSERT INTO ${this.database}.domain_events FORMAT JSONEachRow`;

    const row = JSON.stringify({
      event_name: eventName,
      event_domain: 'alo',
      tenant: metadata?.tenant || 'default',
      plan: metadata?.plan || 'free',
      payload: payloadJson,
      trace_id: metadata?.traceId || traceContext.traceId || '',
      span_id: metadata?.spanId || traceContext.spanId || '',
    });

    const url = `${this.clickhouseEndpoint}?query=${encodeURIComponent(query)}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

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
          }
        );
      }
    } catch (error) {
      logger.error(`Error emitting domain event`, error as Error, {
        event_name: eventName,
      });
    }
  }
}

/**
 * Business Metric Emitter
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

    if (password) {
      this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    } else {
      this.authHeader = '';
    }
  }

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
    if (!this.enabled) {
      return;
    }

    const logger = await getLogger();
    const traceContext = getTraceContext();

    const query = `INSERT INTO ${this.database}.business_metrics FORMAT JSONEachRow`;

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
      trace_id: traceContext.traceId || '',
      span_id: traceContext.spanId || '',
    });

    const url = `${this.clickhouseEndpoint}?query=${encodeURIComponent(query)}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

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
          }
        );
      }
    } catch (error) {
      logger.error(`Error recording business metric`, error as Error, {
        metric_name: metricName,
        metric_kind: kind,
      });
    }
  }

  async increment(metricName: string, dimensions?: Record<string, string | number | boolean | undefined>): Promise<void> {
    return this.record(metricName, 1, 'counter', dimensions);
  }

  async gauge(metricName: string, value: number, dimensions?: Record<string, string | number | boolean | undefined>): Promise<void> {
    return this.record(metricName, value, 'gauge', dimensions);
  }
}

// Singleton instances for easy import
export const domainEvents = new DomainEventEmitter();
export const businessMetrics = new BusinessMetricEmitter();
