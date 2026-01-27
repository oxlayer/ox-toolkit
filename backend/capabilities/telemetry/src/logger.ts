/**
 * OpenTelemetry Logger Factory
 *
 * Provides structured logging with OTEL integration.
 * Logs are emitted to the OTEL Collector via OTLP gRPC.
 */

import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { logs, type Logger } from '@opentelemetry/api-logs';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { OTLPLogExporter as OTLPLogExporterClass } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ensureIndex } from './quickwit-utils';

/**
 * OTEL Logger configuration options
 */
export interface OtelLoggerOptions {
  /**
   * Service name for the logger
   */
  serviceName: string;

  /**
   * Service version
   */
  serviceVersion?: string;

  /**
   * Deployment environment
   */
  environment?: string;

  /**
   * Context/namespace for the logger (e.g., "TodoAPI", "Database")
   */
  context?: string;

  /**
   * OTLP endpoint for logs (default: http://localhost:4317)
   * Used for observability logs → Quickwit
   */
  otlpEndpoint?: string;

  /**
   * OTLP endpoint for domain events (default: disabled)
   * Used for business/domain events → ClickHouse
   * See: COLLECTOR_SPLIT_GUIDE.md
   */
  domainEventsEndpoint?: string;

  /**
   * Additional headers for OTLP requests
   */
  headers?: Record<string, string>;

  /**
   * Additional headers for domain events OTLP requests
   */
  domainEventsHeaders?: Record<string, string>;

  /**
   * Batch size for log records
   */
  batchSize?: number;

  /**
   * Flush interval in milliseconds
   */
  flushInterval?: number;

  /**
   * Quickwit configuration
   */
  quickwit?: {
    indexId?: string;
    url?: string;
  };
}

/**
 * Severity levels for OTEL logs
 */
export type OtelLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Severity number mapping per OTEL spec
 */
const SEVERITY_NUMBER: Record<OtelLogLevel, number> = {
  DEBUG: 1,
  INFO: 9,
  WARN: 13,
  ERROR: 17,
};

/**
 * Severity text mapping
 */
const SEVERITY_TEXT: Record<OtelLogLevel, string> = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};



/**
 * OTEL Logger class
 *
 * Provides a simple API for emitting structured logs to OpenTelemetry.
 * Supports dual exporters:
 * - Observability logs → Quickwit (via otlpEndpoint)
 * - Domain events → ClickHouse (via domainEventsEndpoint)
 */
export class OtelLogger {
  private logger: Logger;
  private domainEventsLogger: Logger | null;
  private context: string;
  private enabled: boolean;

  constructor(
    private options: OtelLoggerOptions,
    logger: Logger,
    domainEventsLogger?: Logger | null
  ) {
    this.logger = logger;
    this.domainEventsLogger = domainEventsLogger || null;
    this.context = options.context || 'default';
    this.enabled = true;
  }

  /**
   * Emit a log record
   */
  private emit(
    level: OtelLogLevel,
    message: string,
    attributes?: Record<string, unknown>,
    error?: Error,
    traceContext?: { traceId?: string; spanId?: string }
  ): void {
    if (!this.enabled) {
      return;
    }

    try {
      // Build attributes
      const attrs: Record<string, any> = {
        context: this.context,
        ...(attributes || {}),
      };

      // Add error attributes
      if (error) {
        attrs['error.type'] = error.name;
        attrs['error.message'] = error.message;
        attrs['error.stack'] = error.stack || '';
      }

      // Add trace context
      // Note: If logged within an active span, the SDK might auto-inject these.
      // But for explicit context passing, we should align with standard naming (snake_case for storage)
      if (traceContext?.traceId) {
        attrs['trace_id'] = traceContext.traceId;
      }
      if (traceContext?.spanId) {
        attrs['span_id'] = traceContext.spanId;
      }

      // Debug log to verify emission
      console.debug(`[OtelLogger] Emitting ${level} log:`, message);

      // Emit log record using the Logger's emit method
      // We rely on the SDK to capture the current timestamp
      this.logger.emit({
        severityNumber: SEVERITY_NUMBER[level],
        severityText: SEVERITY_TEXT[level],
        body: message,
        attributes: attrs,
      });
    } catch (err) {
      console.error('[OtelLogger] Failed to emit log:', err);
    }
  }

  /**
   * Log a DEBUG message
   */
  debug(message: string, attributes?: Record<string, unknown>): void {
    this.emit('DEBUG', message, attributes);
  }

  /**
   * Log an INFO message
   */
  info(message: string, attributes?: Record<string, unknown>): void {
    this.emit('INFO', message, attributes);
  }

  /**
   * Log a WARN message
   */
  warn(message: string, attributes?: Record<string, unknown>): void {
    this.emit('WARN', message, attributes);
  }

  /**
   * Log an ERROR message
   */
  error(message: string, error?: Error | unknown, attributes?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.emit('ERROR', message, attributes, errorObj);
  }

  /**
   * Log with trace context
   */
  logWithTrace(
    level: OtelLogLevel,
    message: string,
    traceContext: { traceId?: string; spanId?: string },
    attributes?: Record<string, unknown>,
    error?: Error
  ): void {
    this.emit(level, message, attributes, error, traceContext);
  }

  /**
   * Log a domain event (structured for ClickHouse)
   *
   * Uses the domain events endpoint if configured, otherwise falls back
   * to the main observability endpoint.
   */
  logDomainEvent(
    eventName: string,
    domain: string,
    data: Record<string, unknown>,
    traceContext?: { traceId?: string; spanId?: string }
  ): void {
    const targetLogger = this.domainEventsLogger || this.logger;

    try {
      const attrs: Record<string, any> = {
        context: this.context,
        'log.type': 'domain_event',
        'event.name': eventName,
        'event.domain': domain,
        'event.version': 'v1',
        // Nest payload to avoid attribute explosion and schema drift
        'event.payload': data,
      };

      // Add trace context
      if (traceContext?.traceId) {
        attrs['trace_id'] = traceContext.traceId;
      }
      if (traceContext?.spanId) {
        attrs['span_id'] = traceContext.spanId;
      }

      targetLogger.emit({
        severityNumber: SEVERITY_NUMBER.INFO,
        severityText: SEVERITY_TEXT.INFO,
        body: `Domain Event: ${eventName}`,
        attributes: attrs,
      });
    } catch (err) {
      console.error('[OtelLogger] Failed to emit domain event:', err);
    }
  }

  /**
   * Disable logging
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Check if logger is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Global logger provider instance (observability logs)
 */
let globalProvider: LoggerProvider | null = null;

/**
 * Global domain events logger provider instance (domain events → ClickHouse)
 */
let globalDomainEventsProvider: LoggerProvider | null = null;

/**
 * Initialize OTEL Logger Provider
 *
 * This should be called once at application startup.
 * Supports dual exporters:
 * - Observability logs → Quickwit (via otlpEndpoint)
 * - Domain events → ClickHouse (via domainEventsEndpoint)
 *
 * @param options - OTEL logger configuration
 * @returns Logger instance
 *
 * @example
 * ```ts
 * import { createOtelLogger } from '@oxlayer/capabilities-telemetry';
 *
 * const logger = createOtelLogger({
 *   serviceName: 'todo-app',
 *   context: 'TodoAPI',
 *   otlpEndpoint: 'http://localhost:14317',
 *   domainEventsEndpoint: 'http://localhost:24317',
 * });
 * ```
 */
export async function createOtelLogger(options: OtelLoggerOptions): Promise<OtelLogger> {
  // ========================================
  // Main logger provider (observability)
  // ========================================
  if (!globalProvider) {
    let endpoint = options.otlpEndpoint || 'http://localhost:4318'; // Default to HTTP port

    // Append /v1/logs path for HTTP exporter if not already present
    if (!endpoint.endsWith('/v1/logs')) {
      endpoint = endpoint.replace(/\/$/, '') + '/v1/logs';
    }

    // Create resource with service information
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName,
      [ATTR_SERVICE_VERSION]: options.serviceVersion || '1.0.0',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: options.environment || 'development',
    });

    // Create OTLP log exporter
    const headers = options.headers || {};

    // Add Quickwit index header if configured
    if (options.quickwit?.indexId) {
      headers['qw-otel-logs-index'] = options.quickwit.indexId;

      if (options.quickwit?.url) {
        await ensureIndex(options.quickwit.url, options.quickwit.indexId, 'logs');
      }
    }

    const exporter = new OTLPLogExporterClass({
      url: endpoint,
      headers,
    });

    // Create logger provider
    globalProvider = new LoggerProvider({ resource });

    globalProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(exporter, {
        maxQueueSize: options.batchSize || 10000,
        scheduledDelayMillis: options.flushInterval || 5000,
      })
    );

    // Register globally
    logs.setGlobalLoggerProvider(globalProvider);

    console.log(`[OtelLogger] Initialized observability logger provider -> ${endpoint}`);
  }

  const logger = globalProvider.getLogger(options.serviceName, options.serviceVersion);

  // ========================================
  // Domain events logger provider (optional)
  // ========================================
  let domainEventsLogger: Logger | null = null;

  if (options.domainEventsEndpoint) {
    if (!globalDomainEventsProvider) {
      let endpoint = options.domainEventsEndpoint;

      // Fix gRPC protocol if necessary
      if (endpoint.startsWith('http://')) {
        endpoint = endpoint.replace('http://', 'grpc://');
      }

      // Create resource with service information
      const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: options.serviceName,
        [ATTR_SERVICE_VERSION]: options.serviceVersion || '1.0.0',
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: options.environment || 'development',
        'collector.intent': 'domain',
      });

      const headers = options.domainEventsHeaders || {};

      const exporter = new OTLPLogExporterClass({
        url: endpoint,
        headers,
      });

      // Create domain events logger provider
      globalDomainEventsProvider = new LoggerProvider({ resource });

      globalDomainEventsProvider.addLogRecordProcessor(
        new BatchLogRecordProcessor(exporter, {
          maxQueueSize: options.batchSize || 10000,
          scheduledDelayMillis: options.flushInterval || 5000,
        })
      );

      console.log(`[OtelLogger] Initialized domain events logger provider -> ${endpoint}`);
    }

    domainEventsLogger = globalDomainEventsProvider.getLogger(
      `${options.serviceName}-domain-events`,
      options.serviceVersion
    );
  }

  // Create and return logger wrapper
  return new OtelLogger(options, logger, domainEventsLogger);
}

/**
 * Shutdown the global logger providers
 *
 * Flushes any pending logs and shuts down both providers.
 * Call this before application exit.
 */
export async function shutdownOtelLogger(): Promise<void> {
  const shutdownPromises: Promise<void>[] = [];

  if (globalProvider) {
    shutdownPromises.push(
      globalProvider.shutdown().then(() => {
        globalProvider = null;
        console.log('[OtelLogger] Observability logger provider shut down');
      })
    );
  }

  if (globalDomainEventsProvider) {
    shutdownPromises.push(
      globalDomainEventsProvider.shutdown().then(() => {
        globalDomainEventsProvider = null;
        console.log('[OtelLogger] Domain events logger provider shut down');
      })
    );
  }

  if (shutdownPromises.length > 0) {
    await Promise.all(shutdownPromises);
  }
}

/**
 * Get the global logger provider (if initialized)
 */
export function getGlobalLoggerProvider(): LoggerProvider | null {
  return globalProvider;
}

/**
 * Set the global logger provider (for advanced use cases)
 */
export function setGlobalLoggerProvider(provider: LoggerProvider): void {
  globalProvider = provider;
  logs.setGlobalLoggerProvider(provider);
}
