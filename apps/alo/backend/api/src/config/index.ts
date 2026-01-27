/**
 * Configuration Module
 *
 * Centralized exports for all configuration modules.
 * This file provides a single entry point for importing configuration.
 *
 * @example
 * ```ts
 * import { ENV, createPostgresConnection } from './config/index.js';
 * import { createAloLogger } from './config/index.js';
 * ```
 */

// App Configuration
export { ENV } from './app.config.js';

// PostgreSQL
export { createPostgresConnection } from './postgres.config.js';

// Redis
export { createRedisConnection } from './redis.config.js';

// RabbitMQ
export { createEventBus, setupEventHandlers } from './rabbitmq.config.js';

// Keycloak
export {
  getAuthMiddleware,
  registerAuthRoutes,
  extractUserIdMiddleware,
  getAuthRoutesOpenAPI,
  authOptions,
} from './keycloak.config.js';

// Metrics
export {
  getMetricsMiddleware,
  getTelemetryMiddleware,
  initializeTelemetry,
  shutdownTelemetry,
} from './metrics.config.js';

// Logging
export {
  createAppLogger,
  createAloLogger,
  logHttpRequest,
  QuickwitLogger,
  setQuickwitLogger,
  getAppLogger,
} from './logging.config.js';

// OpenAPI
export { aloManagerApiSpec, aloApiSpec } from './openapi.config.js';

// ClickHouse
export { domainEvents, businessMetrics } from './clickhouse.config.js';
