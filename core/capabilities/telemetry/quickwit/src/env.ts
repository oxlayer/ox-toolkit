import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * Quickwit telemetry adapter environment schema
 *
 * Declares the environment variables required by the Quickwit telemetry adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const quickwitTelemetryEnv: EnvSchema = {
  QUICKWIT_URL: {
    name: 'QUICKWIT_URL',
    required: true,
    parse: String,
    description: 'Quickwit server URL',
    example: 'http://localhost:7280',
  },

  QUICKWIT_TELEMETRY_INDEX_ID: {
    name: 'QUICKWIT_TELEMETRY_INDEX_ID',
    required: false,
    default: 'otel-traces',
    parse: String,
    description: 'Quickwit traces/logs index ID',
    example: 'otel-traces',
  },

  QUICKWIT_API_KEY: {
    name: 'QUICKWIT_API_KEY',
    required: false,
    default: '',
    parse: String,
    description: 'Quickwit API key (empty if no auth)',
    example: 'your-api-key',
  },

  QUICKWIT_TELEMETRY_TIMEOUT: {
    name: 'QUICKWIT_TELEMETRY_TIMEOUT',
    required: false,
    default: 30000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('QUICKWIT_TELEMETRY_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Request timeout in milliseconds',
    example: '30000',
  },

  QUICKWIT_TELEMETRY_BATCH_SIZE: {
    name: 'QUICKWIT_TELEMETRY_BATCH_SIZE',
    required: false,
    default: 100,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1) {
        throw new Error('QUICKWIT_TELEMETRY_BATCH_SIZE must be a positive number');
      }
      return num;
    },
    description: 'Batch size for log ingestion',
    example: '100',
  },

  QUICKWIT_TELEMETRY_FLUSH_INTERVAL: {
    name: 'QUICKWIT_TELEMETRY_FLUSH_INTERVAL',
    required: false,
    default: 5000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('QUICKWIT_TELEMETRY_FLUSH_INTERVAL must be a non-negative number');
      }
      return num;
    },
    description: 'Flush interval in milliseconds',
    example: '5000',
  },
};
