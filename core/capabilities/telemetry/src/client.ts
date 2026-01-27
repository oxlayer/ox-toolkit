import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { trace, type Tracer } from '@opentelemetry/api';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import type { OpenTelemetryMiddlewareOptions } from './types.js';
import { ensureIndex } from './quickwit-utils.js';

export class TelemetryClient {
  private sdk: NodeSDK | null = null;
  private tracer: Tracer | null = null;
  private isInitialized = false;

  constructor(private options: OpenTelemetryMiddlewareOptions) { }

  async initialize(): Promise<void> {
    if (this.options.enabled === false) {
      console.log('⚠️ OpenTelemetry disabled, skipping initialization');
      return;
    }

    try {
      console.log(`[OpenTelemetry] Initializing OTLP exporter to: ${this.options.otlpEndpoint}`);

      const headers: Record<string, string> = {};
      if (this.options.quickwit?.indexId) {
        headers['qw-otel-traces-index'] = this.options.quickwit.indexId;
        console.log(`[OpenTelemetry] Using Quickwit traces index: ${this.options.quickwit.indexId}`);

        // Ensure index exists
        if (this.options.quickwit.url) {
          await ensureIndex(this.options.quickwit.url, this.options.quickwit.indexId, 'traces');
        }
      }

      // Append /v1/traces path if not already present (required for HTTP exporter)
      let tracesUrl = this.options.otlpEndpoint || 'http://localhost:4318';
      if (!tracesUrl.endsWith('/v1/traces')) {
        tracesUrl = tracesUrl.replace(/\/$/, '') + '/v1/traces';
      }

      const exporter = new OTLPTraceExporter({
        url: tracesUrl,
        headers,
        concurrencyLimit: 10,
      });

      console.log('[OpenTelemetry] Exporter created, setting up SDK...');

      this.sdk = new NodeSDK({
        resource: resourceFromAttributes({
          [ATTR_SERVICE_NAME]: this.options.serviceName,
          [ATTR_SERVICE_VERSION]: this.options.serviceVersion || '1.0.0',
        }),

        spanProcessor: new BatchSpanProcessor(exporter, {
          maxQueueSize: 1000,
          scheduledDelayMillis: 5000, // Send spans every 5 seconds (faster for development)
        }),

        instrumentations: [
          getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
          }),
        ],
      });

      await this.sdk.start();

      this.tracer = trace.getTracer(this.options.serviceName);
      this.isInitialized = true;

      console.log('✅ OpenTelemetry SDK started');
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
      console.warn('⚠️ Continuing without OpenTelemetry instrumentation');
    }
  }

  getTracer(): Tracer | null {
    return this.tracer;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      console.log('🔌 Shutting down OpenTelemetry SDK...');
      await this.sdk.shutdown();
      console.log('✅ OpenTelemetry SDK shut down');
    }
  }
}
