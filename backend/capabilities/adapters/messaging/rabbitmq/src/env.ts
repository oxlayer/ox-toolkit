import type { EnvSchema } from '@oxlayer/capabilities-internal';

/**
 * RabbitMQ adapter environment schema
 *
 * Declares the environment variables required by the RabbitMQ adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const rabbitmqEnv: EnvSchema = {
  RABBITMQ_URL: {
    name: 'RABBITMQ_URL',
    required: true,
    parse: String,
    description: 'RabbitMQ connection URL (amqp://...)',
    example: 'amqp://guest:guest@localhost:5672',
  },

  RABBITMQ_QUEUE: {
    name: 'RABBITMQ_QUEUE',
    required: false,
    default: 'events',
    parse: String,
    description: 'Default queue name for events',
    example: 'events',
  },

  RABBITMQ_EXCHANGE: {
    name: 'RABBITMQ_EXCHANGE',
    required: false,
    default: 'events',
    parse: String,
    description: 'Default exchange name for events',
    example: 'events',
  },

  RABBITMQ_PREFETCH: {
    name: 'RABBITMQ_PREFETCH',
    required: false,
    default: 10,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 1) {
        throw new Error('RABBITMQ_PREFETCH must be a positive number');
      }
      return num;
    },
    description: 'Prefetch count for consumer',
    example: '10',
  },

  RABBITMQ_CONNECTION_TIMEOUT: {
    name: 'RABBITMQ_CONNECTION_TIMEOUT',
    required: false,
    default: 10000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('RABBITMQ_CONNECTION_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Connection timeout in milliseconds',
    example: '10000',
  },
};
