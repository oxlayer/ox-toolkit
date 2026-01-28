/**
 * {{PROJECT_NAME}} API Server
 *
 * {{PROJECT_DESCRIPTION}}
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { scalarMiddleware, openApiSpecMiddleware, errorHandlingMiddleware } from '@oxlayer/capabilities-openapi';
import { getContainer } from './infrastructure/container.js';
import { ENV } from './config/app.config.js';
import { createAppLogger, logHttpRequest } from './config/logging.config.js';
import { getMetricsMiddleware, getTelemetryMiddleware, initializeTelemetry, shutdownTelemetry } from './config/metrics.config.js';
import { LogLevel } from '@oxlayer/capabilities-internal';
import { apiSpec } from './config/openapi.config.js';

const app = new Hono();
const container = getContainer();

// Initialize logger
const appLogger = createAppLogger('{{PROJECT_NAME}}API');

// Initialize telemetry eagerly
await initializeTelemetry();

// Initialize infrastructure
await container.initialize();

// Metrics middleware (must be first)
const { middleware: metricsMiddleware } = getMetricsMiddleware();
app.use('*', metricsMiddleware);

// Telemetry middleware
app.use('*', getTelemetryMiddleware());

// CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Request logging
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const traceId = c.get('traceId');
  const spanId = c.get('spanId');

  logHttpRequest({
    method: c.req.method,
    path: c.req.path,
    statusCode: c.res.status,
    duration,
    traceId,
    spanId,
  }).catch((err) => {
    console.error('[Logging] Failed to log:', err);
  });
});

app.use('*', logger());

// OpenAPI documentation
app.use('*', scalarMiddleware({
  title: '{{PROJECT_NAME}} API Documentation',
  specUrl: '/openapi.json',
  path: '/docs',
}));

app.use('*', openApiSpecMiddleware(apiSpec, {
  title: '{{PROJECT_NAME}} API',
  description: '{{PROJECT_DESCRIPTION}}',
  version: '1.0.0',
  path: '/openapi.json',
}));

// Health check
app.get('/health', async (c) => {
  let dbHealthy = false;
  let redisHealthy = false;

  try {
    await container.db.execute('SELECT 1');
    dbHealthy = true;
  } catch {}

  try {
    await container.redis.set('health', 'ok');
    await container.redis.del('health');
    redisHealthy = true;
  } catch {}

  return c.json({
    status: 'ok',
    services: {
      database: dbHealthy,
      redis: redisHealthy,
      eventBus: container.eventBusPublic.isConnected(),
    },
    timestamp: new Date().toISOString(),
  });
});

// API routes with authentication
const api = new Hono();

// Example: Items routes
api.get('/items', (c) => container.createItemsController().listItems(c));
api.get('/items/:id', (c) => container.createItemsController().getItem(c));
api.post('/items', (c) => container.createItemsController().createItem(c));
api.patch('/items/:id', (c) => container.createItemsController().updateItem(c));
api.delete('/items/:id', (c) => container.createItemsController().deleteItem(c));

// Mount API routes
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError(errorHandlingMiddleware({
  logLevel: ENV.LOG_LEVEL as LogLevel,
  nodeEnv: ENV.NODE_ENV,
  includeStackInLogs: ENV.NODE_ENV === 'development',
}));

// Start server
const server = (globalThis as any).Bun?.serve({
  fetch: app.fetch,
  hostname: ENV.HOST,
  port: Number(ENV.PORT),
});

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log(`║              ${'{{PROJECT_NAME}} API'.padEnd(44)}║`);
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');
console.log(`🚀 Server running at http://${ENV.HOST}:${ENV.PORT}`);
console.log('');
console.log('Endpoints:');
console.log(`  GET    /health              - Health check`);
console.log(`  GET    /metrics             - Prometheus metrics`);
console.log(`  GET    /docs                - API Documentation (Scalar)`);
console.log(`  GET    /openapi.json        - OpenAPI Specification`);
console.log('');
console.log(`  GET    /api/items           - List items`);
console.log(`  GET    /api/items/:id       - Get item`);
console.log(`  POST   /api/items           - Create item`);
console.log(`  PATCH  /api/items/:id       - Update item`);
console.log(`  DELETE /api/items/:id       - Delete item`);
console.log('');
console.log('Observability:');
console.log(`  📊 Metrics:   http://localhost:${ENV.PORT}/metrics (Prometheus)`);
console.log(`  🔍 Traces:    http://localhost:16686 (Jaeger UI)`);
console.log(`  📈 Dashboards: http://localhost:3000 (Grafana)`);
console.log(`  📋 Logs:      http://localhost:7280 (Quickwit)`);
console.log('');

// Graceful shutdown
const shutdown = async () => {
  console.log('');
  console.log('🛑 Shutting down gracefully...');
  await shutdownTelemetry();
  await container.shutdown();
  server.stop();
  console.log('👋 Goodbye!');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
