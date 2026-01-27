/**
 * Todo API Server
 *
 * A complete CRUD API demonstrating:
 * - Keycloak authentication
 * - PostgreSQL with Row-Level Security (RLS)
 * - Redis caching
 * - RabbitMQ event bus
 *
 * @example
 * ```bash
 * # Install dependencies
 * pnpm install
 *
 * # Run database migration
 * pnpm run db:migrate
 *
 * # Seed sample data
 * pnpm run db:seed
 *
 * # Start development server
 * pnpm dev
 * ```
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
// import { json } from 'hono/json';
import { getContainer } from './infrastructure/container.js';
import { getAuthMiddleware, registerAuthRoutes, getAuthRoutesOpenAPI, authOptions, extractUserIdMiddleware } from './config/keycloak.config.js';
import { ENV } from './config/app.config.js';
import { scalarMiddleware, openApiSpecMiddleware, errorHandlingMiddleware } from '@oxlayer/capabilities-openapi';
import { todoApiSpec } from './config/openapi.config.js';
import { createTodoLogger, setQuickwitLogger, logHttpRequest } from './config/logging.config.js';
import { getMetricsMiddleware, getTelemetryMiddleware, shutdownTelemetry, initializeTelemetry } from './config/metrics.config.js';
import { LogLevel } from '@oxlayer/capabilities-internal';

const app = new Hono();
const container = getContainer();

// Initialize Quickwit logger
const appLogger = createTodoLogger('TodoAPI');
setQuickwitLogger(appLogger);

// Initialize Quickwit on startup (async, don't block startup)
appLogger.initializeQuickwit().catch((err) => {
  console.error('[TodoAPI] Failed to initialize Quickwit:', err);
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

// JSON parser middleware (must be before routes that parse JSON bodies)
// app.use('*', json());

// Register auth routes (token generation endpoints)
registerAuthRoutes(app, authOptions);

// Inject auth routes into OpenAPI spec
const authRoutesOpenAPI = getAuthRoutesOpenAPI(authOptions);
Object.assign(todoApiSpec.paths || {}, authRoutesOpenAPI);

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
  title: 'Todo API Documentation',
  specUrl: '/openapi.json',
  path: '/docs',
}));

app.use('*', openApiSpecMiddleware(todoApiSpec, {
  title: 'Todo API',
  description: 'Interactive API documentation for Todo API with OxLayer',
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

// Todo routes
api.get('/todos', (c) => container.createTodosController().getTodos(c));
api.get('/todos/:id', (c) => container.createTodosController().getTodoById(c));
api.post('/todos', (c) => container.createTodosController().createTodo(c));
api.patch('/todos/:id', (c) => container.createTodosController().updateTodo(c));
api.delete('/todos/:id', (c) => container.createTodosController().deleteTodo(c));
api.patch('/todos/:id/complete', (c) => container.createTodosController().completeTodo(c));

// Project routes
api.get('/projects', (c) => container.createProjectsController().getProjects(c));
api.get('/projects/:id', (c) => container.createProjectsController().getProjectById(c));
api.post('/projects', (c) => container.createProjectsController().createProject(c));
api.patch('/projects/:id', (c) => container.createProjectsController().updateProject(c));
api.delete('/projects/:id', (c) => container.createProjectsController().deleteProject(c));

// Section routes
api.get('/sections', (c) => container.createSectionsController().getSections(c));
api.get('/sections/:id', (c) => container.createSectionsController().getSectionById(c));
api.post('/sections', (c) => container.createSectionsController().createSection(c));
api.patch('/sections/:id', (c) => container.createSectionsController().updateSection(c));
api.delete('/sections/:id', (c) => container.createSectionsController().deleteSection(c));

// Voice routes (speech-to-text)
api.post('/voice/transcribe', (c) => container.createVoiceController().transcribe(c));
api.get('/voice/config', (c) => container.createVoiceController().getConfig(c));
api.get('/voice/health', (c) => container.createVoiceController().health(c));

// Workspace routes
api.get('/workspaces', (c) => container.createWorkspacesController().getWorkspaces(c));
api.get('/workspaces/default', (c) => container.createWorkspacesController().getDefaultWorkspace(c));
api.get('/workspaces/:id', (c) => container.createWorkspacesController().getWorkspaceById(c));
api.post('/workspaces', (c) => container.createWorkspacesController().createWorkspace(c));
api.patch('/workspaces/:id', (c) => container.createWorkspacesController().updateWorkspace(c));
api.delete('/workspaces/:id', (c) => container.createWorkspacesController().deleteWorkspace(c));
api.post('/workspaces/:id/switch', (c) => container.createWorkspacesController().switchWorkspace(c));

// Public voice health check (no auth required)
app.get('/voice/health', (c) => container.createVoiceController().health(c));

// Mount API routes
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler (use plain Logger - appLogger is QuickwitLogger which has incompatible type)
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
  console.log('║           Todo API - OxLayer Example                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  // Initialize telemetry eagerly (before container initializes)
  // This ensures the tracer is available for database and use case spans
  await initializeTelemetry();

  // Initialize infrastructure
  // Auto-migration runs automatically via postgres adapter
  await container.initialize();

  // Start server
  const server = (globalThis as any).Bun?.serve({
    fetch: app.fetch,
    // reusePort: true,
    // reuseAddress: true,
    // hostname: "127.0.0.1",
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
  console.log(`  GET    /api/todos           - List user's todos`);
  console.log(`  GET    /api/todos/:id       - Get todo`);
  console.log(`  POST   /api/todos           - Create todo`);
  console.log(`  PATCH  /api/todos/:id       - Update todo`);
  console.log(`  PATCH  /api/todos/:id/complete - Complete todo`);
  console.log(`  DELETE /api/todos/:id       - Delete todo`);
  console.log('');
  console.log(`  GET    /api/projects        - List user's projects`);
  console.log(`  GET    /api/projects/:id    - Get project`);
  console.log(`  POST   /api/projects        - Create project`);
  console.log(`  PATCH  /api/projects/:id    - Update project`);
  console.log(`  DELETE /api/projects/:id    - Delete project`);
  console.log('');
  console.log(`  GET    /api/sections        - List sections`);
  console.log(`  GET    /api/sections/:id    - Get section`);
  console.log(`  POST   /api/sections        - Create section`);
  console.log(`  PATCH  /api/sections/:id    - Update section`);
  console.log(`  DELETE /api/sections/:id    - Delete section`);
  console.log('');
  console.log(`  GET    /api/workspaces      - List workspaces`);
  console.log(`  GET    /api/workspaces/default - Get default workspace`);
  console.log(`  GET    /api/workspaces/:id  - Get workspace`);
  console.log(`  POST   /api/workspaces      - Create workspace`);
  console.log(`  PATCH  /api/workspaces/:id  - Update workspace`);
  console.log(`  DELETE /api/workspaces/:id  - Delete workspace`);
  console.log(`  POST   /api/workspaces/:id/switch - Switch workspace`);
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
