/**
 * Hono App Setup for ox-globex-api
 *
 * Follows the oxlayer DDD architecture with Hono web framework
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getContainer } from './infrastructure/container.js';
import { getAuthMiddleware, getRealmAgnosticAuthMiddleware, getAdminAuthMiddleware, extractUserIdMiddleware, authOptions, tenantContextPropagationMiddleware } from './config/keycloak.config.js';
import { registerAuthRoutes, getAuthRoutesOpenAPI } from '@oxlayer/capabilities-auth';
import { ENV } from './config/app.config.js';
import { scalarMiddleware, openApiSpecMiddleware, errorHandlingMiddleware } from '@oxlayer/capabilities-openapi';
import { globexApiSpec } from './config/openapi.config.js';
import { getMetricsMiddleware, getTelemetryMiddleware, shutdownTelemetry, initializeTelemetry } from './config/metrics.config.js';
import { LogLevel } from '@oxlayer/capabilities-internal';
import { initAdminDbOnStartup } from './config/admin-db.config.js';

const app = new Hono();
const container = getContainer();

// Inject auth routes OpenAPI spec
const authRoutesOpenAPI = getAuthRoutesOpenAPI(authOptions);
globexApiSpec.paths = { ...globexApiSpec.paths, ...authRoutesOpenAPI };

// Metrics middleware (must be before other middleware to capture all requests)
const { middleware: metricsMiddleware } = getMetricsMiddleware();
app.use('*', metricsMiddleware);

// Telemetry/Tracing middleware (OpenTelemetry + Jaeger)
app.use('*', getTelemetryMiddleware());

// CORS middleware (must be before auth routes)
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'X-User-ID', 'X-Session-ID', 'X-Admin-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Global middleware
app.use('*', logger());

// OpenAPI documentation (no auth required)
app.use('*', scalarMiddleware({
  title: 'FatorH API Documentation',
  specUrl: '/openapi.json',
  path: '/docs',
}));

app.use('*', openApiSpecMiddleware(globexApiSpec, {
  title: 'FatorH API',
  description: 'Interactive API documentation for FatorH with OxLayer',
  version: ENV.SERVICE_VERSION,
  path: '/openapi.json',
}));

// Health check (no auth required)
app.get('/health', async (c) => {
  let dbHealthy = false;
  let redisHealthy = false;

  try {
    // Check database
    await container.pg.db.execute({ sql: 'SELECT 1' });
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
    service: ENV.SERVICE_NAME,
    version: ENV.SERVICE_VERSION,
    services: {
      database: dbHealthy,
      redis: redisHealthy,
      eventBus: true, // TODO: add actual event bus health check
    },
    timestamp: new Date().toISOString(),
  });
});

// Register auth routes via the capabilities package
registerAuthRoutes(app, authOptions);

// Manual auth route override - explicitly public without Keycloak redirect
// This must come AFTER registerAuthRoutes to override Keycloak behavior
import { generateAnonymousToken } from '@oxlayer/capabilities-auth';

app.post('/auth/token/anonymous', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, metadata } = body;

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const result = generateAnonymousToken({ userId, metadata }, { secret: jwtSecret, expiresIn: '7d' });
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || 'Unknown error' }, 400);
  }
});

// Admin API routes - mount at /api/admin with realm-agnostic auth
// Admin routes manage realms and databases across all tenants
app.get('/api/admin/tenants', getAdminAuthMiddleware(), (c) => container.createAdminController().listTenants(c));
app.get('/api/admin/tenants/:realmId', getAdminAuthMiddleware(), (c) => container.createAdminController().getTenant(c));
app.get('/api/admin/users', getAdminAuthMiddleware(), (c) => container.createAdminController().listUsers(c));
app.get('/api/admin/realms', getAdminAuthMiddleware(), (c) => container.createAdminController().listRealms(c));
app.post('/api/admin/realms/provision', getAdminAuthMiddleware(), (c) => container.createAdminController().provisionRealm(c));
app.post('/api/admin/databases/create', getAdminAuthMiddleware(), (c) => container.createAdminController().createDatabase(c));
app.post('/api/admin/databases/migrate', getAdminAuthMiddleware(), (c) => container.createAdminController().migrateDatabase(c));
app.post('/api/admin/tenants/provision', getAdminAuthMiddleware(), (c) => container.createAdminController().provisionTenant(c));
app.post('/api/admin/workspaces/provision', getAdminAuthMiddleware(), (c) => container.createAdminController().provisionWorkspace(c));
app.post('/api/admin/tenants/:realmId/organizations/retry', getAdminAuthMiddleware(), (c) => container.createAdminController().retryOrganization(c));

// Delete and recreate routes
app.delete('/api/admin/tenants/:realmId', getAdminAuthMiddleware(), (c) => container.createAdminController().deleteTenant(c));
app.delete('/api/admin/tenants/:realmId/realm', getAdminAuthMiddleware(), (c) => container.createAdminController().deleteRealm(c));
app.delete('/api/admin/databases', getAdminAuthMiddleware(), (c) => container.createAdminController().deleteDatabase(c));
app.post('/api/admin/tenants/:realmId/realm/recreate', getAdminAuthMiddleware(), (c) => container.createAdminController().recreateRealm(c));
app.post('/api/admin/databases/recreate', getAdminAuthMiddleware(), (c) => container.createAdminController().recreateDatabase(c));
app.post('/api/admin/databases/rotate-credentials', getAdminAuthMiddleware(), (c) => container.createAdminController().rotateCredentials(c));

// API routes with authentication
const api = new Hono();

// Apply realm-agnostic auth middleware to all API routes
// This accepts tokens from any Keycloak realm (multi-tenant SaaS)
api.use('*', getRealmAgnosticAuthMiddleware());
// Apply userId extraction middleware after auth middleware
api.use('*', extractUserIdMiddleware);
// Apply tenant context propagation middleware (for Keycloak workspaces)
api.use('*', tenantContextPropagationMiddleware());

// Exam routes
api.post('/exams', (c) => container.createExamsController().create(c));
api.get('/exams', (c) => container.createExamsController().list(c));
api.get('/exams/:id/questions', (c) => container.createExamsController().getWithQuestions(c));
api.get('/exams/:id', (c) => container.createExamsController().getById(c));
api.patch('/exams/:id', (c) => container.createExamsController().update(c));
api.delete('/exams/:id', (c) => container.createExamsController().delete(c));

// Evaluation routes
api.post('/evaluations/bulk', (c) => container.createEvaluationsController().bulkEvaluate(c));
api.get('/evaluations/results', (c) => container.createEvaluationsController().list(c));
api.get('/evaluations/by-exam-cpf', (c) => container.createEvaluationsController().getByExamAndCpf(c));
api.get('/evaluations/:id', (c) => container.createEvaluationsController().getById(c));

// Workspace routes
api.post('/workspaces', (c) => container.createWorkspacesController().create(c));
api.get('/workspaces', (c) => container.createWorkspacesController().list(c));
api.get('/workspaces/:id', (c) => container.createWorkspacesController().getById(c));
api.patch('/workspaces/:id', (c) => container.createWorkspacesController().update(c));
api.delete('/workspaces/:id', (c) => container.createWorkspacesController().delete(c));

// Organization routes (for People app - creates orgs within user's realm)
api.post('/organizations/provision', (c) => container.createAdminController().provisionOrganization(c));

// Question routes
api.post('/questions', (c) => container.createQuestionsController().create(c));
api.get('/questions', (c) => container.createQuestionsController().list(c));
api.get('/questions/:id', (c) => container.createQuestionsController().getById(c));
api.patch('/questions/:id', (c) => container.createQuestionsController().update(c));
api.delete('/questions/:id', (c) => container.createQuestionsController().delete(c));

// Answer routes
api.post('/answers', (c) => container.createAnswersController().create(c));
api.get('/answers', (c) => container.createAnswersController().list(c));
api.get('/answers/:id', (c) => container.createAnswersController().getById(c));
api.patch('/answers/:id', (c) => container.createAnswersController().update(c));
api.delete('/answers/:id', (c) => container.createAnswersController().delete(c));

// Candidate routes
api.post('/candidates', (c) => container.createCandidatesController().create(c));
api.get('/candidates', (c) => container.createCandidatesController().list(c));
api.get('/candidates/:id', (c) => container.createCandidatesController().getById(c));
api.patch('/candidates/:id', (c) => container.createCandidatesController().update(c));
api.delete('/candidates/:id', (c) => container.createCandidatesController().delete(c));

// Tag routes
api.post('/tags', (c) => container.createTagsController().create(c));
api.get('/tags', (c) => container.createTagsController().list(c));
api.get('/tags/keys', (c) => container.createTagsController().getKeys(c));
api.get('/tags/values/:key', (c) => container.createTagsController().getValuesByKey(c));
api.get('/tags/:id', (c) => container.createTagsController().getById(c));
api.patch('/tags/:id', (c) => container.createTagsController().update(c));
api.delete('/tags/:id', (c) => container.createTagsController().delete(c));

// Template routes
api.post('/templates', (c) => container.createTemplatesController().create(c));
api.get('/templates', (c) => container.createTemplatesController().list(c));
api.get('/templates/:id', (c) => container.createTemplatesController().getById(c));
api.patch('/templates/:id', (c) => container.createTemplatesController().update(c));
api.delete('/templates/:id', (c) => container.createTemplatesController().delete(c));

// Campaign routes
api.post('/campaigns', (c) => container.createCampaignsController().create(c));
api.get('/campaigns', (c) => container.createCampaignsController().list(c));
api.get('/campaigns/:id', (c) => container.createCampaignsController().getById(c));
api.patch('/campaigns/:id', (c) => container.createCampaignsController().update(c));
api.delete('/campaigns/:id', (c) => container.createCampaignsController().delete(c));

// Exam candidates routes (maps to exam_assignments table with field mapping)
api.post('/exam-candidates', (c) => container.createExamCandidatesController().add(c));
api.get('/exam-candidates/:id', (c) => container.createExamCandidatesController().getById(c));
api.get('/exam-candidates', (c) => container.createExamCandidatesController().list(c));
api.delete('/exam-candidates/:id', (c) => container.createExamCandidatesController().remove(c));

// Mount API routes
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: `Route ${c.req.path} not found` }, 404);
});

// Error handler
app.onError(errorHandlingMiddleware({
  logLevel: ENV.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
  nodeEnv: ENV.NODE_ENV,
  includeStackInLogs: ENV.NODE_ENV === 'development',
}));

/**
 * Start server (for standalone execution)
 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║           FatorH API - OxLayer                     ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  // Initialize telemetry eagerly
  await initializeTelemetry();

  // Initialize infrastructure
  // Auto-migration runs automatically via postgres adapter
  await container.initialize();

  // Initialize admin database for control panel
  // This creates the globex_admin database if it doesn't exist
  console.log('🔐 Initializing admin database...');
  await initAdminDbOnStartup();

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
  console.log('  Authentication Routes (public):');
  console.log(`  POST   /auth/token/anonymous - Generate anonymous JWT token`);
  if (ENV.KEYCLOAK_ENABLED) {
  console.log(`  POST   /auth/token/keycloak  - Login with Keycloak credentials`);
  }
  console.log('');
  console.log(`  Protected Routes (authentication required):`);
  console.log(`  POST   /api/exams           - Create exam`);
  console.log(`  GET    /api/exams           - List exams`);
  console.log(`  GET    /api/exams/:id       - Get exam`);
  console.log(`  GET    /api/exams/:id/questions - Get exam with questions`);
  console.log(`  DELETE /api/exams/:id       - Delete exam`);
  console.log('');
  console.log(`  POST   /api/evaluations/bulk - Bulk evaluate candidates`);
  console.log(`  GET    /api/evaluations/:id - Get evaluation result`);
  console.log(`  GET    /api/evaluations/by-exam-cpf - Get evaluation by exam and CPF`);
  console.log('');
  console.log(`  Workspaces:`);
  console.log(`  POST   /api/workspaces      - Create workspace`);
  console.log(`  GET    /api/workspaces      - List workspaces`);
  console.log(`  GET    /api/workspaces/:id  - Get workspace`);
  console.log(`  PATCH  /api/workspaces/:id  - Update workspace`);
  console.log(`  DELETE /api/workspaces/:id  - Delete workspace`);
  console.log('');
  console.log(`  Questions:`);
  console.log(`  POST   /api/questions       - Create question`);
  console.log(`  GET    /api/questions       - List questions`);
  console.log(`  GET    /api/questions/:id   - Get question`);
  console.log(`  PATCH  /api/questions/:id   - Update question`);
  console.log(`  DELETE /api/questions/:id   - Delete question`);
  console.log('');
  console.log(`  Answers:`);
  console.log(`  POST   /api/answers         - Create answer`);
  console.log(`  GET    /api/answers         - List answers`);
  console.log(`  GET    /api/answers/:id     - Get answer`);
  console.log(`  PATCH  /api/answers/:id     - Update answer`);
  console.log(`  DELETE /api/answers/:id     - Delete answer`);
  console.log('');
  console.log(`  Candidates:`);
  console.log(`  POST   /api/candidates       - Create candidate`);
  console.log(`  GET    /api/candidates       - List candidates`);
  console.log(`  GET    /api/candidates/:id   - Get candidate`);
  console.log(`  PATCH  /api/candidates/:id   - Update candidate`);
  console.log(`  DELETE /api/candidates/:id   - Delete candidate`);
  console.log('');
  console.log(`  Tags:`);
  console.log(`  POST   /api/tags            - Create tag`);
  console.log(`  GET    /api/tags            - List tags`);
  console.log(`  GET    /api/tags/keys       - Get unique tag keys`);
  console.log(`  GET    /api/tags/values/:key - Get values for key`);
  console.log(`  GET    /api/tags/:id        - Get tag`);
  console.log(`  PATCH  /api/tags/:id        - Update tag`);
  console.log(`  DELETE /api/tags/:id        - Delete tag`);
  console.log('');
  console.log(`  Templates:`);
  console.log(`  POST   /api/templates       - Create template`);
  console.log(`  GET    /api/templates       - List templates`);
  console.log(`  GET    /api/templates/:id   - Get template`);
  console.log(`  PATCH  /api/templates/:id   - Update template`);
  console.log(`  DELETE /api/templates/:id   - Delete template`);
  console.log('');
  console.log(`  Campaigns:`);
  console.log(`  POST   /api/campaigns       - Create campaign`);
  console.log(`  GET    /api/campaigns       - List campaigns`);
  console.log(`  GET    /api/campaigns/:id   - Get campaign`);
  console.log(`  PATCH  /api/campaigns/:id   - Update campaign`);
  console.log(`  DELETE /api/campaigns/:id   - Delete campaign`);
  console.log('');
  console.log('Observability:');
  console.log(`  📊 Metrics:   http://localhost:${ENV.PORT}/metrics (Prometheus)`);
  console.log(`  🔍 Traces:    http://localhost:16686 (Jaeger UI)`);
  console.log(`  📈 Dashboards: http://localhost:3000 (Grafana)`);
  console.log('');
  console.log('Features:');
  console.log(`  ✅ Keycloak Authentication with Multi-Tenancy`);
  console.log(`  ✅ Realm-based tenant isolation (legal/security boundary)`);
  console.log(`  ✅ Workspace-based database isolation (data boundary)`);
  console.log(`  ✅ Organization-based business boundary`);
  console.log(`  ✅ PostgreSQL with Drizzle ORM`);
  console.log(`  ✅ Redis Caching`);
  console.log(`  ✅ RabbitMQ Events`);
  console.log(`  ✅ Prometheus Metrics`);
  console.log(`  ✅ OpenTelemetry Tracing`);
  console.log(`  ✅ OpenAPI Documentation`);
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
}

// Start server if this file is run directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default app;
export { main };
