import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * ClickHouse adapter environment schema
 *
 * Declares the environment variables required by the ClickHouse adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const clickhouseEnv: EnvSchema = {
  CLICKHOUSE_HOST: {
    name: 'CLICKHOUSE_HOST',
    required: true,
    parse: String,
    description: 'ClickHouse server URL (without port)',
    example: 'http://localhost',
  },

  CLICKHOUSE_PORT: {
    name: 'CLICKHOUSE_PORT',
    required: false,
    default: 8123,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1 || num > 65535) {
        throw new Error('CLICKHOUSE_PORT must be a valid port number (1-65535)');
      }
      return num;
    },
    description: 'ClickHouse HTTP port',
    example: '8123',
  },

  CLICKHOUSE_DATABASE: {
    name: 'CLICKHOUSE_DATABASE',
    required: false,
    default: 'default',
    parse: String,
    description: 'ClickHouse database name',
    example: 'analytics',
  },

  CLICKHOUSE_USERNAME: {
    name: 'CLICKHOUSE_USERNAME',
    required: false,
    default: 'default',
    parse: String,
    description: 'ClickHouse username',
    example: 'default',
  },

  CLICKHOUSE_PASSWORD: {
    name: 'CLICKHOUSE_PASSWORD',
    required: false,
    default: '',
    parse: String,
    description: 'ClickHouse password (empty if no auth)',
    example: 'secret',
  },

  CLICKHOUSE_REQUEST_TIMEOUT: {
    name: 'CLICKHOUSE_REQUEST_TIMEOUT',
    required: false,
    default: 30000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('CLICKHOUSE_REQUEST_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Request timeout in milliseconds',
    example: '30000',
  },

  CLICKHOUSE_COMPRESSION: {
    name: 'CLICKHOUSE_COMPRESSION',
    required: false,
    default: 'lz4',
    parse: (raw: string): 'none' | 'lz4' | 'zstd' => {
      if (raw === 'none' || raw === 'lz4' || raw === 'zstd') {
        return raw;
      }
      throw new Error('CLICKHOUSE_COMPRESSION must be one of: none, lz4, zstd');
    },
    description: 'Compression algorithm (none, lz4, zstd)',
    example: 'lz4',
  },
};
