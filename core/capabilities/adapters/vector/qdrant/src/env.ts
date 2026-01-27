import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * Qdrant adapter environment schema
 *
 * Declares the environment variables required by the Qdrant adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const qdrantEnv: EnvSchema = {
  QDRANT_URL: {
    name: 'QDRANT_URL',
    required: true,
    parse: String,
    description: 'Qdrant server URL',
    example: 'http://localhost:6333',
  },

  QDRANT_API_KEY: {
    name: 'QDRANT_API_KEY',
    required: false,
    default: '',
    parse: String,
    description: 'Qdrant API key (empty if no auth)',
    example: 'your-api-key',
  },

  QDRANT_TIMEOUT: {
    name: 'QDRANT_TIMEOUT',
    required: false,
    default: 30000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('QDRANT_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Request timeout in milliseconds',
    example: '30000',
  },
};
