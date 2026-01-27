import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * PostgreSQL adapter environment schema
 *
 * Declares the environment variables required by the PostgreSQL adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const postgresEnv: EnvSchema = {
  PG_HOST: {
    name: 'PG_HOST',
    required: true,
    parse: String,
    description: 'PostgreSQL server host',
    example: 'localhost',
  },

  PG_PORT: {
    name: 'PG_PORT',
    required: false,
    default: 5432,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1 || num > 65535) {
        throw new Error('PG_PORT must be a valid port number (1-65535)');
      }
      return num;
    },
    description: 'PostgreSQL server port',
    example: '5432',
  },

  PG_DATABASE: {
    name: 'PG_DATABASE',
    required: true,
    parse: String,
    description: 'PostgreSQL database name',
    example: 'mydb',
  },

  PG_USER: {
    name: 'PG_USER',
    required: true,
    parse: String,
    description: 'PostgreSQL user',
    example: 'postgres',
  },

  PG_PASSWORD: {
    name: 'PG_PASSWORD',
    required: true,
    parse: String,
    description: 'PostgreSQL password',
    example: 'secret',
  },

  PG_CONNECTION_TIMEOUT: {
    name: 'PG_CONNECTION_TIMEOUT',
    required: false,
    default: 10000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('PG_CONNECTION_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Connection timeout in milliseconds',
    example: '10000',
  },

  PG_IDLE_TIMEOUT: {
    name: 'PG_IDLE_TIMEOUT',
    required: false,
    default: 30000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('PG_IDLE_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Idle timeout in milliseconds',
    example: '30000',
  },

  PG_MAX_POOL_SIZE: {
    name: 'PG_MAX_POOL_SIZE',
    required: false,
    default: 20,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1) {
        throw new Error('PG_MAX_POOL_SIZE must be a positive number');
      }
      return num;
    },
    description: 'Maximum pool size',
    example: '20',
  },

  PG_MIN_POOL_SIZE: {
    name: 'PG_MIN_POOL_SIZE',
    required: false,
    default: 2,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('PG_MIN_POOL_SIZE must be a non-negative number');
      }
      return num;
    },
    description: 'Minimum pool size',
    example: '2',
  },
};
