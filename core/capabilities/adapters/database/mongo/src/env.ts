import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * MongoDB adapter environment schema
 *
 * Declares the environment variables required by the MongoDB adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const mongoEnv: EnvSchema = {
  MONGO_URL: {
    name: 'MONGO_URL',
    required: true,
    parse: String,
    description: 'MongoDB connection URL',
    example: 'mongodb://localhost:27017',
  },

  MONGO_DATABASE: {
    name: 'MONGO_DATABASE',
    required: true,
    parse: String,
    description: 'MongoDB database name',
    example: 'mydb',
  },

  MONGO_MAX_POOL_SIZE: {
    name: 'MONGO_MAX_POOL_SIZE',
    required: false,
    default: 20,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1) {
        throw new Error('MONGO_MAX_POOL_SIZE must be a positive number');
      }
      return num;
    },
    description: 'Maximum connection pool size',
    example: '20',
  },

  MONGO_MIN_POOL_SIZE: {
    name: 'MONGO_MIN_POOL_SIZE',
    required: false,
    default: 2,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('MONGO_MIN_POOL_SIZE must be a non-negative number');
      }
      return num;
    },
    description: 'Minimum connection pool size',
    example: '2',
  },

  MONGO_MAX_IDLE_TIME: {
    name: 'MONGO_MAX_IDLE_TIME',
    required: false,
    default: 60000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('MONGO_MAX_IDLE_TIME must be a non-negative number');
      }
      return num;
    },
    description: 'Maximum idle time in milliseconds',
    example: '60000',
  },

  MONGO_CONNECT_TIMEOUT: {
    name: 'MONGO_CONNECT_TIMEOUT',
    required: false,
    default: 10000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('MONGO_CONNECT_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Connection timeout in milliseconds',
    example: '10000',
  },

  MONGO_SOCKET_TIMEOUT: {
    name: 'MONGO_SOCKET_TIMEOUT',
    required: false,
    default: 45000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('MONGO_SOCKET_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Socket timeout in milliseconds',
    example: '45000',
  },

  MONGO_SERVER_SELECTION_TIMEOUT: {
    name: 'MONGO_SERVER_SELECTION_TIMEOUT',
    required: false,
    default: 30000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('MONGO_SERVER_SELECTION_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Server selection timeout in milliseconds',
    example: '30000',
  },
};
