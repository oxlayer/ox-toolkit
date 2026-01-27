import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * Redis adapter environment schema
 *
 * Declares the environment variables required by the Redis adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const redisEnv: EnvSchema = {
  REDIS_HOST: {
    name: 'REDIS_HOST',
    required: true,
    parse: String,
    description: 'Redis server host',
    example: 'localhost',
  },

  REDIS_PORT: {
    name: 'REDIS_PORT',
    required: false,
    default: 6379,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1 || num > 65535) {
        throw new Error('REDIS_PORT must be a valid port number (1-65535)');
      }
      return num;
    },
    description: 'Redis server port',
    example: '6379',
  },

  REDIS_PASSWORD: {
    name: 'REDIS_PASSWORD',
    required: false,
    default: '',
    parse: String,
    description: 'Redis password (empty if no auth)',
    example: 'my-password',
  },

  REDIS_DB: {
    name: 'REDIS_DB',
    required: false,
    default: 0,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0 || num > 15) {
        throw new Error('REDIS_DB must be a number between 0 and 15');
      }
      return num;
    },
    description: 'Redis database number (0-15)',
    example: '0',
  },

  REDIS_KEY_PREFIX: {
    name: 'REDIS_KEY_PREFIX',
    required: false,
    default: '',
    parse: String,
    description: 'Prefix for all Redis keys',
    example: 'myapp:',
  },

  REDIS_DEFAULT_TTL: {
    name: 'REDIS_DEFAULT_TTL',
    required: false,
    default: 3600,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('REDIS_DEFAULT_TTL must be a non-negative number');
      }
      return num;
    },
    description: 'Default TTL for keys in seconds',
    example: '3600',
  },

  REDIS_CONNECTION_TIMEOUT: {
    name: 'REDIS_CONNECTION_TIMEOUT',
    required: false,
    default: 10000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('REDIS_CONNECTION_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Connection timeout in milliseconds',
    example: '10000',
  },
};
