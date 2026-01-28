/**
 * Configuration Module
 *
 * Centralized exports for all configuration modules.
 */

// App Configuration
export { ENV } from './app.config.js';

// PostgreSQL
export { createPostgresConnection } from './postgres.config.js';

// Redis
export { createRedisConnection } from './redis.config.js';

// RabbitMQ
export { createEventBus, createDomainEventsEmitter } from './rabbitmq.config.js';

// Metrics
export {
  getMetricsMiddleware,
  getTelemetryMiddleware,
  initializeTelemetry,
  shutdownTelemetry,
} from './metrics.config.js';

// Logging
export { createAppLogger, logHttpRequest } from './logging.config.js';

// OpenAPI
export { apiSpec } from './openapi.config.js';
