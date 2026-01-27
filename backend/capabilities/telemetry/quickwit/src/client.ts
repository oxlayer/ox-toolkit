import type { QuickwitTelemetryConfig, LogEntry } from './types.js';

/**
 * Quickwit telemetry client
 *
 * Sends logs and traces to Quickwit for observability.
 *
 * @example
 * ```ts
 * import { createQuickwitTelemetryClient } from '@oxlayer/capabilities-telemetry-quickwit';
 *
 * const telemetry = createQuickwitTelemetryClient({
 *   url: 'http://localhost:7280',
 *   indexId: 'traces',
 *   serviceName: 'my-service',
 * });
 *
 * // Write logs
 * await telemetry.write({
 *   timestamp: new Date().toISOString(),
 *   level: 'INFO',
 *   message: 'Request received',
 *   service: 'my-service',
 * });
 * ```
 */
export class QuickwitTelemetryClient {
  private baseUrl: string;
  private logBuffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(private config: QuickwitTelemetryConfig) {
    const url = new URL(config.url);
    this.baseUrl = url.toString().replace(/\/$/, '');

    // Set up auto-flush
    const flushInterval = config.flushInterval || 5000;
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('[QuickwitTelemetryClient] Auto-flush error:', error);
      });
    }, flushInterval);

    console.log(`[QuickwitTelemetryClient] Initialized for ${config.serviceName} -> ${config.indexId}`);
  }

  /**
   * Write a log entry
   *
   * @param log - Log entry
   */
  async write(log: LogEntry): Promise<void> {
    if (this.closed) {
      throw new Error('QuickwitTelemetryClient is closed');
    }

    this.logBuffer.push({
      ...log,
      service: log.service || this.config.serviceName,
    });

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= (this.config.batchSize || 100)) {
      await this.flush();
    }
  }

  /**
   * Write multiple log entries
   *
   * @param logs - Log entries
   */
  async writeMany(logs: LogEntry[]): Promise<void> {
    if (this.closed) {
      throw new Error('QuickwitTelemetryClient is closed');
    }

    this.logBuffer.push(...logs);

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= (this.config.batchSize || 100)) {
      await this.flush();
    }
  }

  /**
   * Convenience method: write INFO log
   */
  async info(message: string, context?: Record<string, unknown>, traceContext?: { traceId?: string; spanId?: string }): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      service: this.config.serviceName,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      context,
    });
  }

  /**
   * Convenience method: write WARN log
   */
  async warn(message: string, context?: Record<string, unknown>, traceContext?: { traceId?: string; spanId?: string }): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      service: this.config.serviceName,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      context,
    });
  }

  /**
   * Convenience method: write ERROR log
   */
  async error(message: string, error?: Error | unknown, context?: Record<string, unknown>, traceContext?: { traceId?: string; spanId?: string }): Promise<void> {
    const errorContext = error instanceof Error
      ? {
        ...context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }
      : context;

    await this.write({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      service: this.config.serviceName,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      context: errorContext,
    });
  }

  /**
   * Convenience method: write DEBUG log
   */
  async debug(message: string, context?: Record<string, unknown>, traceContext?: { traceId?: string; spanId?: string }): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      service: this.config.serviceName,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      context,
    });
  }

  /**
   * Flush buffered logs to Quickwit
   *
   * @returns Number of logs flushed
   */
  async flush(): Promise<number> {
    if (this.logBuffer.length === 0) {
      return 0;
    }

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const endpoint = `/api/v1/${this.config.indexId}/ingest`;
      const url = new URL(endpoint, this.baseUrl);

      const response = await this.fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logs),
      });

      if (!response.ok) {
        throw new Error(`Quickwit ingest failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitTelemetryClient] Flushed ${logs.length} logs to ${this.config.indexId}`);
      return logs.length;
    } catch (error) {
      console.error('[QuickwitTelemetryClient] Flush error:', error);
      // Re-add failed logs to buffer
      this.logBuffer.unshift(...logs);
      throw error;
    }
  }

  /**
   * Get the current buffer size
   */
  getBufferSize(): number {
    return this.logBuffer.length;
  }

  /**
   * Close the client and flush remaining logs
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining logs
    if (this.logBuffer.length > 0) {
      await this.flush();
    }

    console.log('[QuickwitTelemetryClient] Closed');
  }

  /**
   * Check if the client is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Fetch with authentication
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });
  }
}

/**
 * Create a Quickwit telemetry client
 *
 * @param config - Quickwit telemetry configuration
 * @returns QuickwitTelemetryClient instance
 *
 * @example
 * ```ts
 * import { createQuickwitTelemetryClient } from '@oxlayer/capabilities-telemetry-quickwit';
 *
 * const telemetry = createQuickwitTelemetryClient({
 *   url: 'http://localhost:7280',
 *   indexId: 'traces',
 *   serviceName: 'my-service',
 * });
 * ```
 */
export function createQuickwitTelemetryClient(config: QuickwitTelemetryConfig): QuickwitTelemetryClient {
  return new QuickwitTelemetryClient(config);
}

/**
 * Create a default Quickwit telemetry client from environment variables
 *
 * Environment variables:
 * - QUICKWIT_URL
 * - QUICKWIT_TELEMETRY_INDEX_ID
 * - QUICKWIT_API_KEY
 * - SERVICE_NAME
 * - SERVICE_VERSION
 *
 * @param config - Optional config overrides
 * @returns QuickwitTelemetryClient instance
 */
export function createDefaultQuickwitTelemetryClient(config?: Partial<QuickwitTelemetryConfig>): QuickwitTelemetryClient {
  return createQuickwitTelemetryClient({
    url: config?.url || process.env.QUICKWIT_URL || 'http://localhost:7280',
    indexId: config?.indexId || process.env.QUICKWIT_TELEMETRY_INDEX_ID || 'otel-traces',
    apiKey: config?.apiKey || process.env.QUICKWIT_API_KEY,
    serviceName: config?.serviceName || process.env.SERVICE_NAME || 'service',
    serviceVersion: config?.serviceVersion || process.env.SERVICE_VERSION,
    timeout: config?.timeout,
    batchSize: config?.batchSize,
    flushInterval: config?.flushInterval,
  });
}
