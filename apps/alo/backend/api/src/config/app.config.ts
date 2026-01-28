/**
 * Application Configuration
 */

import { z } from 'zod';

/**
 * Environment schema validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),

  // PostgreSQL
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432'),
  POSTGRES_DATABASE: z.string().default('alo_manager'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.string().default('0'),

  // RabbitMQ
  RABBITMQ_HOST: z.string().default('localhost'),
  RABBITMQ_PORT: z.string().default('5672'),
  RABBITMQ_USERNAME: z.string().default('guest'),
  RABBITMQ_PASSWORD: z.string().default('guest'),
  RABBITMQ_VHOST: z.string().default('/'),
  RABBITMQ_QUEUE: z.string().default('alo.manager.events'),

  // Keycloak
  KEYCLOAK_ENABLED: z.string().default('true'),
  KEYCLOAK_SERVER_URL: z.string().default('http://localhost:8080'),
  KEYCLOAK_REALM: z.string().default('alo'),
  KEYCLOAK_CLIENT_ID: z.string().default('alo-manager'),
  // Keycloak Admin (for user management)
  KEYCLOAK_ADMIN_CLIENT_ID: z.string().optional(),
  KEYCLOAK_ADMIN_CLIENT_SECRET: z.string().optional(),
  KEYCLOAK_ADMIN_USERNAME: z.string().optional(),
  KEYCLOAK_ADMIN_PASSWORD: z.string().optional(),

  // JWT Fallback
  JWT_SECRET: z.string().default('change-this-secret-in-production'),

  // Telemetry
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:14318'),
  OTEL_SERVICE_NAME: z.string().default('alo-manager-api'),

  // Logging
  LOG_LEVEL: z.string(),

  // Manager App (for redirect after onboarding)
  MANAGER_APP_URL: z.string().default('http://localhost:6174'),
});

/**
 * Validate and export environment variables
 */
export const ENV = envSchema.parse(process.env);

/**
 * Application constants
 */
export const APP_NAME = 'Alo Manager API';
export const APP_VERSION = '1.0.0';
