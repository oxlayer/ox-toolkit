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

  // Keycloak Authentication
  KEYCLOAK_ENABLED: z.string().transform((v) => v === 'true'),
  KEYCLOAK_SERVER_URL: z.string().url(),
  KEYCLOAK_REALM: z.string(),
  KEYCLOAK_CLIENT_ID: z.string(),

  // PostgreSQL
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number).default('5432'),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // Redis Cache
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // RabbitMQ
  RABBITMQ_HOST: z.string(),
  RABBITMQ_PORT: z.string().transform(Number).default('5672'),
  RABBITMQ_USERNAME: z.string(),
  RABBITMQ_PASSWORD: z.string(),
  RABBITMQ_VHOST: z.string().default('/'),
  RABBITMQ_QUEUE: z.string().default('todo.events'),

  // Bitwarden Secrets (for tenant credentials)
  BITWARDEN_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  BITWARDEN_TOKEN: z.string().optional(),
  BITWARDEN_URL: z.string().default('https://api.bitwarden.com'),

  // Groq API for Whisper Speech-to-Text
  GROQ_API_KEY: z.string().optional(),
  GROQ_WHISPER_MODEL: z.string().default('whisper-large-v3-turbo'),

  // Quickwit Logging
  QUICKWIT_URL: z.string().url().default('http://localhost:7280'),
  QUICKWIT_LOGS_INDEX_ID: z.string().default('otel-logs-v0_7'),
  QUICKWIT_TRACES_INDEX_ID: z.string().default('otel-traces-v0_7'),
  QUICKWIT_API_KEY: z.string().optional(),

  // OpenTelemetry
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: z.string().url(),
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().url(),
  OTEL_SERVICE_NAME: z.string().default('todo-app'),

  // Domain Events Collector (business events → ClickHouse)
  DOMAIN_EVENTS_ENDPOINT: z.string().url().optional(),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
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
      error.errors.forEach((err) => {
        const received = 'received' in err ? ` (received: ${err.received})` : '';
        console.error(
          `  - ${err.path.join('.')}: ${err.message}${received}`
        );
      });
    }
    process.exit(1);
  }
}

export const ENV = loadEnv();
