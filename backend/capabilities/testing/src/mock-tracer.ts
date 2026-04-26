/**
 * Mock Tracer
 *
 * OpenTelemetry Tracer mock for testing.
 * Simulates the OTEL Tracer API without requiring actual OTEL setup.
 *
 * @example
 * ```typescript
 * import { MockTracer } from '@oxlayer/capabilities-testing/mock-tracer';
 *
 * const tracer = new MockTracer();
 *
 * await tracer.startActiveSpan('operation', { kind: SpanKind.INTERNAL }, (span) => {
 *   span?.setAttribute('key', 'value');
 *   span?.setStatus({ code: SpanStatusCode.OK });
 * });
 * ```
 */

export type SpanKind = 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER';

export type SpanStatus = {
  code: number;
  message?: string;
};

export type SpanContext = {
  traceId: string;
  spanId: string;
  traceFlags: number;
};

export interface MockSpan {
  setAttribute(key: string, value: unknown): void;
  setAttributes(attributes: Record<string, unknown>): void;
  setStatus(status: SpanStatus): void;
  recordException(exception: Error | unknown): void;
  addEvent(name: string, attributes?: Record<string, unknown>): void;
  end(endTime?: number): void;
}

export interface MockSpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, unknown>;
  links?: unknown[];
  startTime?: number;
}

/**
 * Mock Tracer class for testing OpenTelemetry tracing without actual OTEL setup.
 *
 * This mock implements the basic Tracer API from @opentelemetry/api:
 * - startActiveSpan for creating active spans
 * - startSpan for creating manual spans
 * - getTracer for getting the tracer instance
 *
 * Spans created by this mock are no-op objects that accept all OTEL span methods
 * but don't actually perform any tracing. This is useful for unit and integration
 * tests where you don't want to set up actual OTEL exporters.
 */
export class MockTracer {
  private spanCounter = 0;

  /**
   * Start an active span and execute a function within its context.
   *
   * @param name - The name of the span
   * @param options - Span options (kind, attributes, etc.)
   * @param fn - Function to execute within the span context
   * @returns The result of the function
   *
   * @example
   * ```typescript
   * const result = await tracer.startActiveSpan(
   *   'database.query',
   *   { kind: 'CLIENT' },
   *   async (span) => {
   *     span?.setAttribute('db.system', 'postgresql');
   *     await queryDatabase();
   *     return result;
   *   }
   * );
   * ```
   */
  startActiveSpan<T>(
    name: string,
    options: MockSpanOptions | undefined,
    fn: (span: MockSpan | undefined) => T | Promise<T>
  ): T | Promise<T> {
    const span: MockSpan = {
      setAttribute: () => { },
      setAttributes: () => { },
      setStatus: () => { },
      recordException: () => { },
      addEvent: () => { },
      end: () => { },
    };

    this.spanCounter++;
    return fn(span);
  }

  /**
   * Start a new span (manual management).
   *
   * @param name - The name of the span
   * @param options - Span options (kind, attributes, etc.)
   * @returns A mock span object
   *
   * @example
   * ```typescript
   * const span = tracer.startSpan('manual.operation', { kind: 'INTERNAL' });
   * span.setAttribute('key', 'value');
   * // ... do work ...
   * span.end();
   * ```
   */
  startSpan(_name: string, _options?: MockSpanOptions): MockSpan {
    this.spanCounter++;
    return {
      setAttribute: () => { },
      setAttributes: () => { },
      setStatus: () => { },
      recordException: () => { },
      addEvent: () => { },
      end: () => { },
    };
  }

  /**
   * Get the tracer instance (returns self for mock).
   *
   * This method exists for compatibility with OTEL's getTracer() API.
   *
   * @returns This mock tracer instance
   */
  getTracer(): MockTracer {
    return this;
  }

  /**
   * Get the number of spans created by this tracer.
   * Useful for testing that spans are being created as expected.
   *
   * @returns The count of spans created
   *
   * @example
   * ```typescript
   * const tracer = new MockTracer();
   * tracer.startActiveSpan('test', () => {});
   * expect(tracer.getSpanCount()).toBe(1);
   * ```
   */
  getSpanCount(): number {
    return this.spanCounter;
  }

  /**
   * Reset the span counter.
   * Useful for test setup/teardown.
   */
  reset(): void {
    this.spanCounter = 0;
  }
}

/**
 * Create a new MockTracer instance.
 *
 * Convenience function for creating a mock tracer.
 *
 * @example
 * ```typescript
 * import { createMockTracer } from '@oxlayer/capabilities-testing/mock-tracer';
 *
 * const tracer = createMockTracer();
 * ```
 */
export function createMockTracer(): MockTracer {
  return new MockTracer();
}

/**
 * Default mock tracer instance.
 *
 * A singleton instance that can be imported and used directly.
 *
 * @example
 * ```typescript
 * import { mockTracer } from '@oxlayer/capabilities-testing/mock-tracer';
 *
 * await mockTracer.startActiveSpan('operation', () => {
 *   // Your test code here
 * });
 * ```
 */
export const mockTracer = new MockTracer();
