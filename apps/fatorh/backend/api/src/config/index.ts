/**
 * Main Configuration Export
 *
 * Centralizes all configuration for the application
 */

import { ENV } from './app.config.js';

export interface FatorHConfig {
  server: {
    port: number;
    host: string;
    logLevel: string;
    nodeEnv: string;
  };
  service: {
    name: string;
    version: string;
  };
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
  };
  auth: {
    jwtSecret: string;
    keycloakEnabled: boolean;
    keycloakUrl?: string;
    keycloakRealm?: string;
    keycloakClientId?: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  rabbitmq: {
    host: string;
    port: number;
    username: string;
    password: string;
    vhost: string;
  };
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket?: string;
  };
  openai?: {
    apiKey: string;
    organization?: string;
    project?: string;
  };
  otel?: {
    endpoint: string;
    serviceName: string;
  };
}

/**
 * Load application configuration
 */
export function loadConfig(): FatorHConfig {
  return {
    server: {
      port: Number(ENV.PORT),
      host: ENV.HOST,
      logLevel: 'info',
      nodeEnv: ENV.NODE_ENV,
    },
    service: {
      name: ENV.SERVICE_NAME,
      version: ENV.SERVICE_VERSION,
    },
    database: {
      url: `postgresql://${ENV.POSTGRES_USER}:${ENV.POSTGRES_PASSWORD}@${ENV.POSTGRES_HOST}:${ENV.POSTGRES_PORT}/${ENV.POSTGRES_DATABASE}`,
      host: ENV.POSTGRES_HOST,
      port: ENV.POSTGRES_PORT,
      name: ENV.POSTGRES_DATABASE,
      user: ENV.POSTGRES_USER,
    },
    auth: {
      jwtSecret: ENV.JWT_SECRET,
      keycloakEnabled: ENV.KEYCLOAK_ENABLED,
      keycloakUrl: ENV.KEYCLOAK_SERVER_URL,
      keycloakRealm: ENV.KEYCLOAK_REALM,
      keycloakClientId: ENV.KEYCLOAK_CLIENT_ID,
    },
    redis: {
      host: ENV.REDIS_HOST,
      port: ENV.REDIS_PORT,
      password: ENV.REDIS_PASSWORD,
      db: ENV.REDIS_DB,
    },
    rabbitmq: {
      host: ENV.RABBITMQ_HOST,
      port: ENV.RABBITMQ_PORT,
      username: ENV.RABBITMQ_USERNAME,
      password: ENV.RABBITMQ_PASSWORD,
      vhost: ENV.RABBITMQ_VHOST,
    },
  };
}

export const config = loadConfig();

// Re-export environment and service configs
export { ENV } from './app.config.js';
export { createEventBus, setupEventHandlers, disconnectEventBus } from './rabbitmq.config.js';
export {
  createRedisConnection,
  createRedisStore,
  createCachedDecorator,
  CacheKeys,
  CacheTTL,
  invalidateCache,
  invalidateWorkspaceCache,
} from './redis.config.js';
export {
  getMetricsMiddleware,
  getTelemetryMiddleware,
  initializeTelemetry,
  shutdownTelemetry,
  recordExamCreated,
  recordEvaluationStarted,
  recordEvaluationCompleted,
  recordCandidateRegistered,
  recordDatabaseQueryDuration,
  recordCacheHit,
  recordEventPublished,
} from './metrics.config.js';
export { globexApiSpec } from './openapi.config.js';
