/**
 * Application Configuration Template
 *
 * A template for creating application configuration with environment variable validation.
 * Uses Zod for schema validation and type inference.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const envSchema = z.object({
 *   // Server
 *   PORT: z.string().default('3000'),
 *   HOST: z.string().default('0.0.0.0'),
 *   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
 *
 *   // Database
 *   POSTGRES_HOST: z.string(),
 *   POSTGRES_PORT: z.string().transform(Number).default('5432'),
 *   POSTGRES_DATABASE: z.string(),
 *   POSTGRES_USER: z.string(),
 *   POSTGRES_PASSWORD: z.string(),
 *
 *   // Observability
 *   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().url(),
 *   OTEL_SERVICE_NAME: z.string().default('my-service'),
 * });
 *
 * export type Env = z.infer<typeof envSchema>;
 *
 * export function loadEnv(): Env {
 *   try {
 *     return envSchema.parse(process.env);
 *   } catch (error) {
 *     if (error instanceof z.ZodError) {
 *       console.error('❌ Invalid environment configuration:');
 *       error.errors.forEach((err) => {
 *         console.error(`  - ${err.path.join('.')}: ${err.message}`);
 *       });
 *     }
 *     process.exit(1);
 *   }
 * }
 *
 * export const ENV = loadEnv();
 * ```
 */

import { z } from 'zod';

/**
 * Common environment variable schemas
 * Reuse these in your app config to avoid repetition
 */
export const CommonEnvSchemas = {
  /**
   * Server configuration
   */
  server: {
    PORT: z.string().default('3000'),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * Database configuration (PostgreSQL)
   */
  postgres: {
    POSTGRES_HOST: z.string(),
    POSTGRES_PORT: z.string().transform(Number).default('5432'),
    POSTGRES_DATABASE: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_SSL: z.string().transform((v) => v === 'true').default('false'),
  },

  /**
   * Redis configuration
   */
  redis: {
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string().transform(Number).default('6379'),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.string().transform(Number).default('0'),
    REDIS_TLS: z.string().transform((v) => v === 'true').default('false'),
  },

  /**
   * RabbitMQ configuration
   */
  rabbitmq: {
    RABBITMQ_HOST: z.string(),
    RABBITMQ_PORT: z.string().transform(Number).default('5672'),
    RABBITMQ_USERNAME: z.string(),
    RABBITMQ_PASSWORD: z.string(),
    RABBITMQ_VHOST: z.string().default('/'),
    RABBITMQ_QUEUE: z.string().default('events'),
  },

  /**
   * Observability configuration
   */
  observability: {
    OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: z.string().url(),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().url(),
    OTEL_SERVICE_NAME: z.string(),
    OTEL_SERVICE_VERSION: z.string().default('1.0.0'),
    OTEL_ENVIRONMENT: z.string().default('production'),
  },

  /**
   * Quickwit configuration
   */
  quickwit: {
    QUICKWIT_URL: z.string().url().default('http://localhost:7280'),
    QUICKWIT_LOGS_INDEX_ID: z.string().default('otel-logs-v0_7'),
    QUICKWIT_TRACES_INDEX_ID: z.string().default('otel-traces-v0_7'),
    QUICKWIT_API_KEY: z.string().optional(),
  },

  /**
   * ClickHouse configuration
   */
  clickhouse: {
    CLICKHOUSE_HOST: z.string().default('localhost'),
    CLICKHOUSE_PORT: z.string().default('8123'),
    CLICKHOUSE_DATABASE: z.string().default('analytics'),
    CLICKHOUSE_USER: z.string().optional(),
    CLICKHOUSE_PASSWORD: z.string().optional(),
  },

  /**
   * Authentication configuration
   */
  auth: {
    JWT_SECRET: z.string(),
    KEYCLOAK_ENABLED: z.string().transform((v) => v === 'true').default('false'),
    KEYCLOAK_URL: z.string().url().optional(),
    KEYCLOAK_REALM: z.string().optional(),
    KEYCLOAK_CLIENT_ID: z.string().optional(),
  },
} as const;

/**
 * Create a complete environment schema from common schemas
 * Mix and match based on your needs
 */
export function createEnvSchema(parts: {
  server?: boolean;
  postgres?: boolean;
  redis?: boolean;
  rabbitmq?: boolean;
  observability?: boolean;
  quickwit?: boolean;
  clickhouse?: boolean;
  auth?: boolean;
  custom?: Record<string, z.ZodTypeAny>;
}) {
  const schema: Record<string, z.ZodTypeAny> = {};

  if (parts.server) {
    Object.assign(schema, CommonEnvSchemas.server);
  }

  if (parts.postgres) {
    Object.assign(schema, CommonEnvSchemas.postgres);
  }

  if (parts.redis) {
    Object.assign(schema, CommonEnvSchemas.redis);
  }

  if (parts.rabbitmq) {
    Object.assign(schema, CommonEnvSchemas.rabbitmq);
  }

  if (parts.observability) {
    Object.assign(schema, CommonEnvSchemas.observability);
  }

  if (parts.quickwit) {
    Object.assign(schema, CommonEnvSchemas.quickwit);
  }

  if (parts.clickhouse) {
    Object.assign(schema, CommonEnvSchemas.clickhouse);
  }

  if (parts.auth) {
    Object.assign(schema, CommonEnvSchemas.auth);
  }

  if (parts.custom) {
    Object.assign(schema, parts.custom);
  }

  return z.object(schema);
}

/**
 * Load and validate environment variables
 * Handles errors gracefully with detailed messages
 */
export function loadEnv(schema: z.ZodObject<any>) {
  try {
    return schema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:');
      error.errors.forEach((err) => {
        const received = (err as any).received !== undefined ? ` (received: ${JSON.stringify((err as any).received)})` : '';
        console.error(`  - ${err.path.join('.')}: ${err.message}${received}`);
      });
    } else {
      console.error('❌ Failed to load environment:', error);
    }
    process.exit(1);
  }
}

/**
 * Environment variable categories for better organization
 * Use these prefixes to group related environment variables
 */
export const EnvCategories = {
  SERVER: 'Server',
  DATABASE: 'Database',
  CACHE: 'Cache',
  QUEUE: 'Message Queue',
  OBSERVABILITY: 'Observability',
  SEARCH: 'Search',
  ANALYTICS: 'Analytics',
  AUTH: 'Authentication',
  FEATURES: 'Feature Flags',
} as const;

/**
 * Template for creating a typed .env.example file
 * Generates a string that can be written to .env.example
 */
export function generateEnvExample(schema: z.ZodObject<any>): string {
  const lines: string[] = [
    '# Environment Configuration',
    '# Copy this file to .env and fill in the values',
    '',
  ];

  const entries = Object.entries(schema.shape);
  let currentCategory = '';

  for (const [key, zodType] of entries) {
    // Try to infer category from key prefix
    let category = '';
    if (key.startsWith('PORT') || key.startsWith('HOST') || key.startsWith('NODE_ENV')) {
      category = EnvCategories.SERVER;
    } else if (key.startsWith('POSTGRES') || key.startsWith('DATABASE')) {
      category = EnvCategories.DATABASE;
    } else if (key.startsWith('REDIS')) {
      category = EnvCategories.CACHE;
    } else if (key.startsWith('RABBITMQ')) {
      category = EnvCategories.QUEUE;
    } else if (key.startsWith('OTEL') || key.startsWith('QUICKWIT')) {
      category = EnvCategories.OBSERVABILITY;
    } else if (key.startsWith('CLICKHOUSE')) {
      category = EnvCategories.ANALYTICS;
    } else if (key.startsWith('JWT') || key.startsWith('KEYCLOAK')) {
      category = EnvCategories.AUTH;
    }

    // Add category header if changed
    if (category && category !== currentCategory) {
      lines.push(`# ${category}`);
      currentCategory = category;
    }

    // Get default value or placeholder
    const defaultValue = (zodType as any)._def?.defaultValue?.();
    const description = (zodType as any).description || '';

    if (description) {
      lines.push(`# ${description}`);
    }

    if (defaultValue !== undefined) {
      lines.push(`${key}=${defaultValue}`);
    } else {
      lines.push(`${key}=`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
