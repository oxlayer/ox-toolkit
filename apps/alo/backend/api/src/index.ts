/**
 * Alo Manager API Server
 *
 * A complete CRUD API demonstrating:
 * - Keycloak authentication
 * - PostgreSQL with auto-migration
 * - Redis caching
 * - RabbitMQ event bus
 * - OpenTelemetry tracing
 * - Prometheus metrics
 * - OpenAPI documentation
 *
 * @example
 * ```bash
 * # Install dependencies
 * pnpm install
 *
 * # Start development server
 * pnpm dev
 * ```
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getContainer } from './infrastructure/container.js';
import { getAuthMiddleware, registerAuthRoutes, getAuthRoutesOpenAPI, authOptions, extractUserIdMiddleware } from './config/keycloak.config.js';
import { ENV } from './config/app.config.js';
import { scalarMiddleware, openApiSpecMiddleware, errorHandlingMiddleware } from '@oxlayer/capabilities-openapi';
import { createAloLogger, setQuickwitLogger, logHttpRequest } from './config/logging.config.js';
import { getMetricsMiddleware, getTelemetryMiddleware, shutdownTelemetry, initializeTelemetry } from './config/metrics.config.js';
import { LogLevel } from '@oxlayer/capabilities-internal';
import { aloApiSpec } from './config/openapi.config.js';

const app = new Hono();
const container = getContainer();

// Initialize Quickwit logger
const appLogger = createAloLogger('AloManagerAPI');
setQuickwitLogger(appLogger);

// Initialize Quickwit on startup (async, don't block startup)
appLogger.initializeQuickwit().catch((err) => {
  console.error('[AloManagerAPI] Failed to initialize Quickwit:', err);
});

// Metrics middleware (must be before other middleware to capture all requests)
const { middleware: metricsMiddleware } = getMetricsMiddleware();
app.use('*', metricsMiddleware);

// Telemetry/Tracing middleware (OpenTelemetry + Jaeger)
app.use('*', getTelemetryMiddleware());

// CORS middleware (must be before auth routes to allow CORS for auth endpoints)
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'X-User-ID', 'X-Session-ID'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Register auth routes (token generation endpoints)
registerAuthRoutes(app, authOptions);

// Inject auth routes into OpenAPI spec
const authRoutesOpenAPI = getAuthRoutesOpenAPI(authOptions);
Object.assign(aloApiSpec.paths || {}, authRoutesOpenAPI);

// Structured logging middleware (captures HTTP requests to Quickwit)
app.use('*', async (c, next) => {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  const traceId = c.get('traceId') as string | undefined;
  const spanId = c.get('spanId') as string | undefined;
  const userId = c.get('userId') as string | undefined;

  // Log HTTP request (async, don't block response)
  logHttpRequest({
    method: c.req.method,
    path: c.req.path,
    statusCode: c.res.status,
    duration,
    userId,
    traceId,
    spanId,
  }).catch((err) => {
    console.error('[Logging] Failed to log HTTP request:', err);
  });
});

// Global middleware
app.use('*', logger());

// OpenAPI documentation (no auth required)
app.use('*', scalarMiddleware({
  title: 'Alo Manager API Documentation',
  specUrl: '/openapi.json',
  path: '/docs',
}));

app.use('*', openApiSpecMiddleware(aloApiSpec, {
  title: 'Alo Manager API',
  description: 'Interactive API documentation for Alo Manager API with OxLayer',
  version: '1.0.0',
  path: '/openapi.json',
}));

// Health check (no auth required)
app.get('/health', async (c) => {
  let dbHealthy = false;
  let redisHealthy = false;

  try {
    // Check database
    await container.db.execute('SELECT 1');
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  try {
    // Check Redis
    await container.redis.set('health', 'ok');
    await container.redis.del('health');
    redisHealthy = true;
  } catch {
    redisHealthy = false;
  }

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

// Apply auth middleware to all API routes
api.use('*', getAuthMiddleware());
// Apply userId extraction middleware after auth
api.use('*', extractUserIdMiddleware);

// Establishment routes
api.get('/establishments', (c) => container.createEstablishmentsController().listEstablishments(c));
api.get('/establishments/:id', (c) => container.createEstablishmentsController().getEstablishment(c));
api.post('/establishments', (c) => container.createEstablishmentsController().createEstablishment(c));
api.patch('/establishments/:id', (c) => container.createEstablishmentsController().updateEstablishment(c));
api.delete('/establishments/:id', (c) => container.createEstablishmentsController().deleteEstablishment(c));

// User routes
api.get('/users', (c) => container.createUsersController().listUsers(c));
api.get('/users/:id', (c) => container.createUsersController().getUser(c));
api.post('/users', (c) => container.createUsersController().createUser(c));
api.patch('/users/:id', (c) => container.createUsersController().updateUser(c));
api.delete('/users/:id', (c) => container.createUsersController().deleteUser(c));

// Delivery Men routes
api.get('/delivery-men', (c) => container.createDeliveryMenController().listDeliveryMen(c));
api.get('/delivery-men/:id', (c) => container.createDeliveryMenController().getDeliveryMan(c));
api.post('/delivery-men', (c) => container.createDeliveryMenController().createDeliveryMan(c));
api.patch('/delivery-men/:id', (c) => container.createDeliveryMenController().updateDeliveryMan(c));
api.delete('/delivery-men/:id', (c) => container.createDeliveryMenController().deleteDeliveryMan(c));

// Service Provider routes
api.get('/service-providers', (c) => container.createServiceProvidersController().listServiceProviders(c));
api.get('/service-providers/:id', (c) => container.createServiceProvidersController().getServiceProvider(c));
api.post('/service-providers', (c) => container.createServiceProvidersController().createServiceProvider(c));
api.patch('/service-providers/:id', (c) => container.createServiceProvidersController().updateServiceProvider(c));
api.delete('/service-providers/:id', (c) => container.createServiceProvidersController().deleteServiceProvider(c));

// Public onboarding routes (no auth required)
app.post('/public/onboarding-leads', (c) => container.createOnboardingLeadsController().createPublicOnboardingLead(c));

// Protected Onboarding Lead routes
api.get('/onboarding-leads', (c) => container.createOnboardingLeadsController().listOnboardingLeads(c));
api.get('/onboarding-leads/:id', (c) => container.createOnboardingLeadsController().getOnboardingLead(c));
api.post('/onboarding-leads', (c) => container.createOnboardingLeadsController().createOnboardingLead(c));
api.patch('/onboarding-leads/:id', (c) => container.createOnboardingLeadsController().updateOnboardingLead(c));
api.delete('/onboarding-leads/:id', (c) => container.createOnboardingLeadsController().deleteOnboardingLead(c));

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

/**
 * Start server
 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║              Alo Manager API - OxLayer                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  // Initialize telemetry eagerly (before container initializes)
  await initializeTelemetry();

  // Initialize infrastructure
  // Auto-migration runs automatically via postgres adapter
  await container.initialize();

  // Start server
  const server = (globalThis as any).Bun?.serve({
    fetch: app.fetch,
    hostname: ENV.HOST,
    port: Number(ENV.PORT),
  });

  console.log(`🚀 Server running at http://${ENV.HOST}:${ENV.PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET    /health              - Health check`);
  console.log(`  GET    /metrics             - Prometheus metrics`);
  console.log(`  GET    /docs                - API Documentation (Scalar)`);
  console.log(`  GET    /openapi.json        - OpenAPI Specification`);
  console.log('');
  console.log(`  Protected Routes (authentication required):`);
  console.log(`  GET    /api/establishments  - List establishments`);
  console.log(`  GET    /api/establishments/:id - Get establishment`);
  console.log(`  POST   /api/establishments  - Create establishment`);
  console.log(`  PATCH  /api/establishments/:id - Update establishment`);
  console.log(`  DELETE /api/establishments/:id - Delete establishment`);
  console.log('');
  console.log(`  GET    /api/users           - List users`);
  console.log(`  GET    /api/users/:id       - Get user`);
  console.log(`  POST   /api/users           - Create user`);
  console.log(`  PATCH  /api/users/:id       - Update user`);
  console.log(`  DELETE /api/users/:id       - Delete user`);
  console.log('');
  console.log(`  GET    /api/delivery-men    - List delivery men`);
  console.log(`  GET    /api/delivery-men/:id - Get delivery man`);
  console.log(`  POST   /api/delivery-men    - Create delivery man`);
  console.log(`  PATCH  /api/delivery-men/:id - Update delivery man`);
  console.log(`  DELETE /api/delivery-men/:id - Delete delivery man`);
  console.log('');
  console.log(`  GET    /api/service-providers - List service providers`);
  console.log(`  GET    /api/service-providers/:id - Get service provider`);
  console.log(`  POST   /api/service-providers - Create service provider`);
  console.log(`  PATCH  /api/service-providers/:id - Update service provider`);
  console.log(`  DELETE /api/service-providers/:id - Delete service provider`);
  console.log('');
  console.log(`  POST   /public/onboarding-leads - Create onboarding lead (PUBLIC)`);
  console.log(`  GET    /api/onboarding-leads - List onboarding leads`);
  console.log(`  GET    /api/onboarding-leads/:id - Get onboarding lead`);
  console.log(`  POST   /api/onboarding-leads - Create onboarding lead`);
  console.log(`  PATCH  /api/onboarding-leads/:id - Update onboarding lead`);
  console.log(`  DELETE /api/onboarding-leads/:id - Delete onboarding lead`);
  console.log('');
  console.log('Observability:');
  console.log(`  📊 Metrics:   http://localhost:${ENV.PORT}/metrics (Prometheus)`);
  console.log(`  🔍 Traces:    http://localhost:16686 (Jaeger UI)`);
  console.log(`  📈 Dashboards: http://localhost:3000 (Grafana)`);
  console.log(`  📋 Logs:      http://localhost:7280 (Quickwit)`);
  console.log('');
  console.log('Features:');
  console.log(`  ✅ Keycloak Authentication`);
  console.log(`  ✅ Public Routes (no auth)`);
  console.log(`  ✅ Protected Routes (with auth)`);
  console.log(`  ✅ PostgreSQL`);
  console.log(`  ✅ Redis Caching`);
  console.log(`  ✅ RabbitMQ Events`);
  console.log(`  ✅ Prometheus Metrics`);
  console.log(`  ✅ OpenTelemetry Tracing`);
  console.log(`  ✅ Quickwit Structured Logging`);
  console.log(`  ✅ OpenAPI Documentation`);
  console.log('');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('');
    console.log('🛑 Shutting down gracefully...');
    await appLogger.close();
    await shutdownTelemetry();
    await container.shutdown();
    server.stop();
    console.log('👋 Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
