/**
 * Example App Environment Configuration
 *
 * This file demonstrates how to aggregate env schemas from all packages
 * and validate them once at application startup.
 *
 * Place this file in your app's entrypoint (e.g., apps/api/src/env.ts)
 *
 * IMPORTANT: Run this BEFORE any other initialization to fail fast on misconfig.
 */

import { loadEnv, mergeEnvSchemas, generateEnvExample } from '@oxlayer/capabilities-internal/env';

// Import env schemas from all packages used by the app
import { rabbitmqEnv } from '@oxlayer/capabilities-adapters-rabbitmq/env';
import { redisEnv } from '@oxlayer/capabilities-adapters-redis/env';
import { postgresEnv } from '@oxlayer/capabilities-adapters-postgres/env';
import { mongoEnv } from '@oxlayer/capabilities-adapters-mongo/env';
import { clickhouseEnv } from '@oxlayer/capabilities-adapters-clickhouse/env';
import { qdrantEnv } from '@oxlayer/capabilities-adapters-qdrant/env';
import { quickwitSearchEnv } from '@oxlayer/capabilities-adapters-search-quickwit/env';
import { telemetryEnv } from '@oxlayer/capabilities-telemetry/env';

// Merge all env schemas into one
// Later schemas override earlier ones for duplicate keys
const appEnvSchema = mergeEnvSchemas(
  telemetryEnv,
  rabbitmqEnv,
  redisEnv,
  postgresEnv,
  mongoEnv,
  clickhouseEnv,
  qdrantEnv,
  quickwitSearchEnv,
);

// Generate .env.example file content (optional, for documentation)
export const envExample = generateEnvExample(appEnvSchema);

/**
 * Load and validate ALL environment variables at startup
 *
 * This will throw immediately if any required env vars are missing or invalid.
 * Call this before initializing any adapters or services.
 *
 * @example
 * ```ts
 * // apps/api/index.ts
 * import { ENV } from './env.js';
 *
 * // Validate envs first - fail fast
 * // No adapter initialization happens before this point
 *
 * // Now safely use validated env values
 * const rabbit = createRabbitMQClient({ url: ENV.RABBITMQ_URL });
 * const pg = createPostgresClient({
 *   host: ENV.PG_HOST,
 *   port: ENV.PG_PORT,
 *   database: ENV.PG_DATABASE,
 *   user: ENV.PG_USER,
 *   password: ENV.PG_PASSWORD,
 * });
 * ```
 */
export const ENV = loadEnv(appEnvSchema);

/**
 * Type-safe access to loaded environment variables
 *
 * The ENV object is frozen and typed based on the schema.
 * TypeScript will autocomplete available env vars.
 */
export type Env = typeof ENV;
