import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * Telemetry environment schema
 *
 * Declares the environment variables required by the OpenTelemetry telemetry system.
 * The app should merge this into its main env schema and validate at startup.
 */
export const telemetryEnv: EnvSchema = {
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: {
    name: 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
    required: false,
    default: '',
    parse: String,
    description: 'OTLP endpoint for trace export (empty = disabled)',
    example: 'http://localhost:4317',
  },

  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: {
    name: 'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
    required: false,
    default: '',
    parse: String,
    description: 'OTLP endpoint for log export (empty = disabled)',
    example: 'http://localhost:4318',
  },

  OTEL_SERVICE_NAME: {
    name: 'OTEL_SERVICE_NAME',
    required: true,
    parse: String,
    description: 'Service name for telemetry',
    example: 'my-api',
  },

  OTEL_SERVICE_VERSION: {
    name: 'OTEL_SERVICE_VERSION',
    required: false,
    default: '1.0.0',
    parse: String,
    description: 'Service version for telemetry',
    example: '1.0.0',
  },

  OTEL_TRACES_SAMPLER: {
    name: 'OTEL_TRACES_SAMPLER',
    required: false,
    default: 'parentbased_always_on',
    parse: String,
    description: 'Traces sampler (always_on, always_off, traceidratio, parentbased_always_on, parentbased_always_off, parentbased_traceidratio)',
    example: 'parentbased_always_on',
  },

  OTEL_TRACES_SAMPLER_ARG: {
    name: 'OTEL_TRACES_SAMPLER_ARG',
    required: false,
    default: '1',
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0 || num > 1) {
        throw new Error('OTEL_TRACES_SAMPLER_ARG must be a number between 0 and 1');
      }
      return num;
    },
    description: 'Sampler argument (e.g., ratio for traceidratio)',
    example: '0.1',
  },

  // ========================================
  // Domain Events Collector
  // ========================================
  // Separate collector for business/domain events → ClickHouse
  // See: /examples/todo-app/COLLECTOR_SPLIT_GUIDE.md

  DOMAIN_EVENTS_ENDPOINT: {
    name: 'DOMAIN_EVENTS_ENDPOINT',
    required: false,
    default: '',
    parse: String,
    description: 'OTLP endpoint for domain event export (empty = disabled). Sends business events to ClickHouse via dedicated collector.',
    example: 'http://localhost:24317',
  },

  DOMAIN_EVENTS_OTLP_HEADERS: {
    name: 'DOMAIN_EVENTS_OTLP_HEADERS',
    required: false,
    default: '{}',
    parse: (raw: string) => {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    },
    description: 'Optional headers for domain events OTLP exporter (JSON string)',
    example: '{"Authorization": "Bearer token"}',
  },
};
