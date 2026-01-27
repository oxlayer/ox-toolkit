import type { Context, Next } from 'hono';
import { TelemetryClient } from './client.js';
import type { OpenTelemetryMiddlewareOptions } from './types.js';
import { SpanStatusCode, trace, type Span } from '@opentelemetry/api';

export interface TelemetryVariables {
  telemetry: TelemetryClient;
  tracer: any;
  traceId?: string;
  spanId?: string;
}

declare module 'hono' {
  interface ContextVariableMap extends TelemetryVariables { }
}

/**
 * OpenTelemetry middleware factory for Hono
 *
 * Initializes OpenTelemetry SDK and attaches tracer to the Hono context.
 * Also creates automatic HTTP spans for each request.
 *
 * @example
 * ```ts
 * import { telemetryMiddleware } from '@oxlayer/capabilities-telemetry';
 *
 * app.use('/api/*', telemetryMiddleware({
 *   serviceName: 'auth-api',
 *   serviceVersion: '1.0.0',
 *   otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
 *   enabled: !!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
 * }));
 *
 * // Use in handlers
 * app.get('/users/:id', async (c) => {
 *   const tracer = c.get('tracer');
 *   return tracer.startActiveSpan('getUser', async (span) => {
 *     try {
 *       // ... your logic
 *       span.setStatus({ code: SpanStatusCode.OK });
 *       return c.json({ user: 'data' });
 *     } catch (error) {
 *       span.recordException(error as Error);
 *       throw error;
 *     } finally {
 *       span.end();
 *     }
 *   });
 * });
 * ```
 */
/**
 * Create OpenTelemetry middleware and return the client instance
 */
export function createTelemetryMiddleware(options: OpenTelemetryMiddlewareOptions) {
  // Create singleton client
  const client = new TelemetryClient(options);

  // Initialize on first use (not during middleware creation)
  let initialized = false;

  const middleware: any = async (c: Context, next: Next) => {
    if (!initialized) {
      await client.initialize();
      initialized = true;
    }

    const tracer = client.getTracer();

    c.set('telemetry', client);
    c.set('tracer', tracer);

    // Create HTTP span for this request
    if (tracer && tracer.startActiveSpan) {
      console.log('Creating HTTP span for request', c.req.method, c.req.url);
      return tracer.startActiveSpan(
        `HTTP ${c.req.method}`,
        {
          attributes: {
            'http.method': c.req.method,
            'http.url': c.req.url,
            'http.target': c.req.path,
            'http.scheme': c.req.url.split(':')[0] || 'http',
            'http.host': c.req.header('host') || 'localhost',
            'http.user_agent': c.req.header('user-agent'),
            'net.host.name': c.req.header('host')?.split(':')[0] || 'localhost',
          },
        },
        async (span: Span) => {
          try {
            await next();

            // Set span status based on response
            const statusCode = c.res.status;
            span.setAttribute('http.status_code', statusCode);

            // Store trace context for logging correlation
            // Use the active span since we're inside the span's context already
            const spanContext = span.spanContext();
            c.set('traceId', spanContext.traceId);
            c.set('spanId', spanContext.spanId);

            if (statusCode >= 500) {
              span.setStatus({ code: SpanStatusCode.ERROR });
            } else if (statusCode >= 400) {
              span.setStatus({ code: SpanStatusCode.ERROR });
            } else {
              span.setStatus({ code: SpanStatusCode.OK });
            }
          } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            throw error;
          } finally {
            span.end();
          }
        }
      );
    }

    // Fallback if tracer not available
    await next();
  };

  return { middleware, client };
}

/**
 * OpenTelemetry middleware factory for Hono
 *
 * Initializes OpenTelemetry SDK and attaches tracer to the Hono context.
 * Also creates automatic HTTP spans for each request.
 */
export function telemetryMiddleware(options: OpenTelemetryMiddlewareOptions) {
  return createTelemetryMiddleware(options).middleware;
}
