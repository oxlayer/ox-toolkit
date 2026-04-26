import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import type { ExporterOptions, SpanData } from './types.js';

/**
 * Quickwit OTLP span exporter
 *
 * Exports OpenTelemetry spans to Quickwit.
 *
 * @example
 * ```ts
 * import { QuickwitSpanExporter } from '@oxlayer/capabilities-telemetry-quickwit';
 * import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
 *
 * const exporter = new QuickwitSpanExporter({
 *   url: 'http://localhost:7280',
 *   indexId: 'otel-traces',
 * });
 *
 * const provider = new NodeTracerProvider();
 * provider.addSpanProcessor(new BatchSpanProcessor(exporter));
 * ```
 */
export class QuickwitSpanExporter implements SpanExporter {
  private baseUrl: string;
  private indexId: string;
  private apiKey?: string;
  private timeout: number;

  constructor(options: ExporterOptions) {
    const url = new URL(options.url);
    this.baseUrl = url.toString().replace(/\/$/, '');
    this.indexId = options.indexId;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000;

    console.log(`[QuickwitSpanExporter] Initialized for ${this.indexId}`);
  }

  /**
   * Export spans to Quickwit
   */
  async export(spans: ReadableSpan[], resultCallback: (result: { code: number; error?: Error }) => void): Promise<void> {
    try {
      if (spans.length === 0) {
        resultCallback({ code: 0 });
        return;
      }

      const spanData = spans.map(this.convertSpan);

      const endpoint = `/api/v1/${this.indexId}/ingest`;
      const url = new URL(endpoint, this.baseUrl);

      const response = await this.fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spanData),
      });

      if (!response.ok) {
        throw new Error(`Quickwit export failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[QuickwitSpanExporter] Exported ${spans.length} spans to ${this.indexId}`);
      resultCallback({ code: 0 });
    } catch (error) {
      console.error('[QuickwitSpanExporter] Export error:', error);
      resultCallback({ code: 1, error: error as Error });
    }
  }

  /**
   * Shutdown the exporter
   */
  async shutdown(): Promise<void> {
    console.log('[QuickwitSpanExporter] Shutdown');
  }

  /**
   * Convert OpenTelemetry span to Quickwit format
   */
  private convertSpan(span: ReadableSpan): SpanData {
    const context = span.spanContext();
    const status = span.status;

    return {
      traceId: context.traceId,
      spanId: context.spanId,
      parentSpanId: (span as any).parentSpanId,
      name: span.name,
      startTime: span.startTime[0],
      endTime: span.endTime[0],
      attributes: span.attributes,
      events: span.events.map((event) => ({
        name: event.name,
        timestamp: event.time[0],
        attributes: event.attributes || {},
      })),
      status: {
        code: status.code,
        message: (status as any).description,
      },
    };
  }

  /**
   * Fetch with authentication
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });
  }

  /**
   * Force flush
   */
  async forceFlush(): Promise<void> {
    // Nothing to flush for HTTP-based exporter
  }
}

/**
 * Create a Quickwit span exporter
 *
 * @param options - Exporter options
 * @returns QuickwitSpanExporter instance
 *
 * @example
 * ```ts
 * import { createQuickwitSpanExporter } from '@oxlayer/capabilities-telemetry-quickwit';
 * import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
 *
 * const exporter = createQuickwitSpanExporter({
 *   url: 'http://localhost:7280',
 *   indexId: 'otel-traces',
 * });
 *
 * const provider = new NodeTracerProvider();
 * provider.addSpanProcessor(new BatchSpanProcessor(exporter));
 * ```
 */
export function createQuickwitSpanExporter(options: ExporterOptions): QuickwitSpanExporter {
  return new QuickwitSpanExporter(options);
}

/**
 * Create a default Quickwit span exporter from environment variables
 *
 * Environment variables:
 * - QUICKWIT_URL
 * - QUICKWIT_TRACES_INDEX_ID
 * - QUICKWIT_API_KEY
 *
 * @param options - Optional config overrides
 * @returns QuickwitSpanExporter instance
 */
export function createDefaultQuickwitSpanExporter(options?: Partial<ExporterOptions>): QuickwitSpanExporter {
  return createQuickwitSpanExporter({
    url: options?.url || process.env.QUICKWIT_URL || 'http://localhost:7280',
    indexId: options?.indexId || process.env.QUICKWIT_TRACES_INDEX_ID || 'otel-traces',
    apiKey: options?.apiKey || process.env.QUICKWIT_API_KEY,
    timeout: options?.timeout,
  });
}
