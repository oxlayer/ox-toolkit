/**
 * OxLayer Control Panel API
 *
 * Main entry point - wires up Hono routes with DDD controllers
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './config/index.js';
import { HttpError } from '@oxlayer/foundation-http-kit';
import { runMigrations } from './db/migrate.js';

// Import DDD infrastructure
import { getContainer } from './infrastructure/di/container.js';

// Import route setup functions
import {
  setupOrganizationsRoutes,
  setupDevelopersRoutes,
  setupLicensesRoutes,
  setupApiKeysRoutes,
  setupDeviceAuthRoutes,
  setupCapabilityResolutionRoutes,
} from './routes/v1/index.js';

// Import auth middleware
import { authMiddleware } from '@oxlayer/capabilities-auth';

// ============================================================================
// Main Application
// ============================================================================

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:5174'
    ].filter(Boolean);
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
}));

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API v1 Routes
// ============================================================================

const v1 = new Hono();

// Get container and wire up all routes
const container = getContainer();

// Configure Keycloak auth middleware for device approval endpoint
// Only use auth middleware if Keycloak is explicitly enabled
const deviceAuthMiddleware = process.env.ENABLE_KEYCLOAK === 'true'
  ? authMiddleware({
    enableKeycloak: true,
    keycloak: {
      url: process.env.KEYCLOAK_URL || '',
      realm: process.env.KEYCLOAK_REALM || 'oxlayer',
    },
    enableJwt: false,
  })
  : undefined;

setupOrganizationsRoutes(v1, container);
setupDevelopersRoutes(v1, container);
setupLicensesRoutes(v1, container);
setupApiKeysRoutes(v1, container);
setupDeviceAuthRoutes(v1, container, deviceAuthMiddleware);
setupCapabilityResolutionRoutes(v1, container, deviceAuthMiddleware);

// Mount v1 routes
app.route('/v1', v1);

// ============================================================================
// Error Handling
// ============================================================================

app.notFound((c) => {
  return c.json({
    error: {
      message: 'Not Found',
      status: 404,
    },
  });
});

app.onError((err, c) => {
  console.error('Server error:', err);

  // Handle HttpError with proper status code
  if (err instanceof HttpError) {
    return c.json({
      success: false,
      error: err.message,
    }, err.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 500 | 503);
  }

  // Handle other errors
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return c.json({
    success: false,
    error: message,
  }, 500);
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           OxLayer Control Panel API                       ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(48)}║
║  Host:        ${config.host.padEnd(48)}║
║  Port:        ${String(config.port).padEnd(48)}║
║  Database:    ${config.database.host.padEnd(48)}║
╚════════════════════════════════════════════════════════════╝

  📦 SDK Distribution Control Panel
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🏗️  Architecture: DDD + Clean Architecture
  📁 Domains: Organizations, Developers, Licenses, API Keys
  🔧 Controllers: HTTP layer using BaseController
  💼 Use Cases: Business logic layer
  💾 Repositories: Data persistence with Drizzle ORM
  📦 Container: Dependency injection via AppContainer

  API Endpoints:
    GET    /health                          Health check

    Organizations:
      GET    /v1/organizations              List organizations
      POST   /v1/organizations              Create organization
      GET    /v1/organizations/:id          Get organization
      PATCH  /v1/organizations/:id          Update organization
      DELETE /v1/organizations/:id          Delete organization

    Developers:
      GET    /v1/developers                 List developers
      GET    /v1/developers/:id             Get developer
      POST   /v1/organizations/:orgId/developers  Create developer
      PATCH  /v1/developers/:id             Update developer
      DELETE /v1/developers/:id             Delete developer

    Licenses:
      GET    /v1/licenses                   List licenses
      GET    /v1/licenses/:id               Get license
      POST   /v1/organizations/:orgId/licenses  Create license
      PATCH  /v1/licenses/:id               Update license
      DELETE /v1/licenses/:id               Delete license
      POST   /v1/licenses/:id/activate       Activate license
      POST   /v1/licenses/:id/suspend       Suspend license
      POST   /v1/licenses/:id/revoke         Revoke license
      POST   /v1/licenses/:id/packages       Add package
      DELETE /v1/licenses/:id/packages/:pkg Remove package
      PUT    /v1/licenses/:id/capabilities/:cap  Update capability

    API Keys:
      GET    /v1/api-keys                    List API keys
      GET    /v1/api-keys/:id                Get API key
      POST   /v1/organizations/:orgId/api-keys  Create API key
      PATCH  /v1/api-keys/:id                Update API key
      DELETE /v1/api-keys/:id                Delete API key
      POST   /v1/api-keys/:id/revoke         Revoke API key

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🚀 Server starting...

`);
  console.log('🔧 Running database migrations...');
  try {
    await runMigrations();
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    // If migrations fail, it's likely because schema already exists
    // Log warning but continue starting the server
    const isAlreadyExists = error instanceof Error && (
      error.message.includes('already exists') ||
      error.message.includes('42710') ||
      error.message.includes('42P07') ||
      error.message.includes('42P06')
    );
    if (isAlreadyExists) {
      console.log('⚠️  Schema already exists, skipping migrations');
    } else {
      console.error('❌ Migration failed:', error);
      // Continue starting the server anyway for development
      console.log('⚠️  Continuing server startup despite migration error...');
    }
  }

  console.log(`✅ Server ready at http://${config.host}:${config.port}`);
  console.log(`📚 API organized with DDD structure`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
