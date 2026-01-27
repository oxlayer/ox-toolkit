/**
 * Application Configuration
 */

import { z } from 'zod';

/**
 * Environment Schema
 */
const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),

  // Service
  SERVICE_NAME: z.string().default('globex-api'),
  SERVICE_VERSION: z.string().default('1.0.0'),

  // Authentication
  JWT_SECRET: z.string(),

  // Keycloak Authentication
  KEYCLOAK_ENABLED: z.string().transform((v) => v === 'true'),
  KEYCLOAK_SERVER_URL: z.string().url(),
  KEYCLOAK_REALM: z.string(),
  KEYCLOAK_CLIENT_ID: z.string(),

  // PostgreSQL
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // PostgreSQL Admin (Control Panel Database)
  POSTGRES_ADMIN_HOST: z.string(),
  POSTGRES_ADMIN_PORT: z.coerce.number(),
  POSTGRES_ADMIN_DATABASE: z.string(),
  POSTGRES_ADMIN_USER: z.string(),
  POSTGRES_ADMIN_PASSWORD: z.string(),

  // Redis Cache
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number(),

  // RabbitMQ
  RABBITMQ_HOST: z.string(),
  RABBITMQ_PORT: z.coerce.number(),
  RABBITMQ_USERNAME: z.string(),
  RABBITMQ_PASSWORD: z.string(),
  RABBITMQ_VHOST: z.string(),
  RABBITMQ_QUEUE: z.string(),

  // Bitwarden Secrets (for multi-tenancy credentials)
  BITWARDEN_ENABLED: z.string().transform((v) => v === 'true'),
  BITWARDEN_TOKEN: z.string().optional(),
  BITWARDEN_URL: z.string(),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 */
export function loadEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      for (const err of error.issues) {
        const path = err.path.join('.');
        console.error(`  - ${path}: ${err.message}`);
      }
    } else {
      console.error('  Unknown error:', error);
    }
    process.exit(1);
  }
}

export const ENV = loadEnv();
