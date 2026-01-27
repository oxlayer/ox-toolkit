import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

/**
 * Quickwit search adapter environment schema
 *
 * Declares the environment variables required by the Quickwit search adapter.
 * The app should merge this into its main env schema and validate at startup.
 */
export const quickwitSearchEnv: EnvSchema = {
  QUICKWIT_URL: {
    name: 'QUICKWIT_URL',
    required: true,
    parse: String,
    description: 'Quickwit server URL',
    example: 'http://localhost:7280',
  },

  QUICKWIT_INDEX_ID: {
    name: 'QUICKWIT_INDEX_ID',
    required: true,
    parse: String,
    description: 'Quickwit search index ID',
    example: 'products',
  },

  QUICKWIT_API_KEY: {
    name: 'QUICKWIT_API_KEY',
    required: false,
    default: '',
    parse: String,
    description: 'Quickwit API key (empty if no auth)',
    example: 'your-api-key',
  },

  QUICKWIT_TIMEOUT: {
    name: 'QUICKWIT_TIMEOUT',
    required: false,
    default: 30000,
    parse: (raw: string) => {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        throw new Error('QUICKWIT_TIMEOUT must be a non-negative number');
      }
      return num;
    },
    description: 'Request timeout in milliseconds',
    example: '30000',
  },
};
