/**
 * Structured Logging Configuration
 *
 * Sets up structured logging with OpenTelemetry integration for centralized log storage.
 * Uses OTEL SDK -> OTEL Collector -> Quickwit pipeline for observability.
 */

import { Logger, LogLevel } from '@oxlayer/capabilities-internal';
import { createOtelLogger, type OtelLogger } from '@oxlayer/capabilities-telemetry';
import { ENV } from './app.config.js';

/**
 * Map internal log levels to OTEL log levels
 */
const toOtelLogLevel = (level: LogLevel): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' => {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    default:
      return 'INFO';
  }
};

/**
 * Get the log level method name from numeric level
 */
function getLogLevelMethod(level: LogLevel): 'debug' | 'info' | 'warn' | 'error' {
  switch (level) {
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
      return 'error';
    default:
      return 'info';
  }
}

/**
 * OTEL-enabled logger that extends the base Logger
 * Sends logs via OpenTelemetry to the OTEL Collector
 * Supports dual exporters:
 * - Observability logs → Quickwit (via otlpEndpoint)
 * - Domain events → ClickHouse (via domainEventsEndpoint)
 */
export class QuickwitLogger extends Logger {
  private otelLogger?: OtelLogger;
  private otelEnabled: boolean;
  private contextValue: string;

  constructor(
    context: string,
    private serviceName: string = 'todo-app',
    private serviceVersion: string = '1.0.0'
  ) {
    super(context);
    this.contextValue = context;
    // Enable OTEL logging by default (can be disabled with OTEL_LOGS_ENABLED=false)
    this.otelEnabled = process.env.OTEL_LOGS_ENABLED !== 'false';
  }

  /**
   * Initialize OTEL logger
   */
  async initializeQuickwit(): Promise<void> {
    if (!this.otelEnabled) {
      console.log('[QuickwitLogger] OTEL logging disabled');
      return;
    }

    if (!ENV.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
      throw new Error('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT is not set');
    }

    try {
      console.log('[QuickwitLogger] Initializing OTEL logger for', this.serviceName);
      this.otelLogger = await createOtelLogger({
        serviceName: this.serviceName,
        serviceVersion: this.serviceVersion,
        environment: ENV.NODE_ENV || 'development',
        context: this.contextValue,
        // Observability → Quickwit
        otlpEndpoint: ENV.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
        quickwit: {
          indexId: process.env.QUICKWIT_LOGS_INDEX_ID || 'todo-app-logs',
          url: process.env.QUICKWIT_URL || 'http://localhost:7280',
        },
        // Domain events → ClickHouse (optional)
        domainEventsEndpoint: ENV.DOMAIN_EVENTS_ENDPOINT,
      });
      console.log(`[QuickwitLogger] OTEL logger initialized for ${this.serviceName}`);
    } catch (error) {
      console.error('[QuickwitLogger] Failed to initialize OTEL:', error);
      this.otelEnabled = false;
    }
  }

  /**
   * Log with trace context
   */
  logWithTrace(
    level: LogLevel,
    message: string,
    traceContext: { traceId?: string; spanId?: string },
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    // Log to console using public methods
    const combinedData = { ...data, traceId: traceContext.traceId, spanId: traceContext.spanId };
    const levelMethod = getLogLevelMethod(level);
    this[levelMethod](message, combinedData);

    // Send to OTEL with trace context
    if (this.otelLogger && this.otelEnabled) {
      const otelLevel = toOtelLogLevel(level);
      const traceData = traceContext ? { traceId: traceContext.traceId, spanId: traceContext.spanId } : {};
      const errorData = error ? { error: error.message, stack: error.stack } : undefined;
      this.otelLogger.logWithTrace(otelLevel, message, { ...traceData, ...errorData });
    }
  }

  /**
   * Log a domain event (business event → ClickHouse)
   *
   * Uses the domain events endpoint when configured (DOMAIN_EVENTS_ENDPOINT),
   * which sends to the dedicated collector for ClickHouse.
   */
  logDomainEvent(
    eventName: string,
    _domain: string,
    data: Record<string, unknown>,
    traceContext?: { traceId?: string; spanId?: string }
  ): void {
    // Log to console using public info method
    this.info(`Domain Event: ${eventName}`, data);

    // Send to OTEL domain events collector (ClickHouse)
    if (this.otelLogger && this.otelEnabled) {
      const traceData = traceContext ? { traceId: traceContext.traceId, spanId: traceContext.spanId } : {};
      this.otelLogger.logDomainEvent(eventName, JSON.stringify(data), traceData);
    }
  }

  /**
   * Close the logger and flush OTEL logs
   */
  async close(): Promise<void> {
    if (this.otelEnabled) {
      // The OTEL logger provider is global, so we don't close it here
      // It will be closed when the application exits
      console.log('[QuickwitLogger] Logger closed (OTEL provider remains active for other loggers)');
    }
  }
}

/**
 * Create a logger instance for the Todo API
 */
export function createTodoLogger(context: string): QuickwitLogger {
  return new QuickwitLogger(context);
}

/**
 * Get the global OTEL logger instance
 */
export function getQuickwitLogger(): QuickwitLogger | undefined {
  return (global as any).__quickwit_logger;
}

/**
 * Set the global OTEL logger instance
 */
export function setQuickwitLogger(logger: QuickwitLogger): void {
  (global as any).__quickwit_logger = logger;
}

/**
 * Helper to log HTTP requests with trace context
 */
export interface HttpRequestLog {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
}

export async function logHttpRequest(log: HttpRequestLog, logger?: QuickwitLogger): Promise<void> {
  const targetLogger = logger || getQuickwitLogger();
  if (!targetLogger) {
    return;
  }

  const level: LogLevel = log.statusCode >= 500 ? LogLevel.ERROR : log.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

  await targetLogger.logWithTrace(
    level,
    `${log.method} ${log.path} ${log.statusCode}`,
    { traceId: log.traceId, spanId: log.spanId },
    {
      http: {
        method: log.method,
        path: log.path,
        status_code: log.statusCode,
        duration_ms: log.duration,
      },
      user: {
        id: log.userId,
      },
      request: {
        id: log.requestId,
      },
    }
  );
}

/**
 * Helper to log database operations
 */
export interface DatabaseOperationLog {
  operation: string;
  table: string;
  duration: number;
  rowsAffected?: number;
  error?: Error;
}

export async function logDatabaseOperation(log: DatabaseOperationLog, logger?: QuickwitLogger): Promise<void> {
  const targetLogger = logger || getQuickwitLogger();
  if (!targetLogger) {
    return;
  }

  const level: LogLevel = log.error ? LogLevel.ERROR : LogLevel.DEBUG;
  const levelMethod = level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';

  targetLogger[levelMethod](
    `DB ${log.operation} on ${log.table}`,
    {
      database: {
        operation: log.operation,
        table: log.table,
        duration_ms: log.duration,
        rows_affected: log.rowsAffected,
      },
    }
  );
}

/**
 * Helper to log business/domain events
 *
 * Uses logDomainEvent() to send to the domain events collector (ClickHouse)
 * when DOMAIN_EVENTS_ENDPOINT is configured.
 */
export interface BusinessEventLog {
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  data?: Record<string, unknown>;
  traceContext?: { traceId?: string; spanId?: string };
}

export async function logBusinessEvent(log: BusinessEventLog, logger?: QuickwitLogger): Promise<void> {
  const targetLogger = logger || getQuickwitLogger();
  if (!targetLogger) {
    return;
  }

  // Use logDomainEvent to send to ClickHouse via domain events collector
  targetLogger.logDomainEvent(
    log.eventType,
    log.entityType, // domain
    {
      entity_id: log.entityId,
      user_id: log.userId,
      ...log.data,
    },
    log.traceContext
  );
}
