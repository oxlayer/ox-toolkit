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
      'http://keycloak.localhost:8080',
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
// Note: enableJwt must be true to support device tokens (HS256 with local secret)
const deviceAuthMiddleware = process.env.ENABLE_KEYCLOAK === 'true'
  ? authMiddleware({
    enableKeycloak: true,
    keycloak: {
      url: process.env.KEYCLOAK_URL || '',
      realm: process.env.KEYCLOAK_REALM || 'oxlayer',
    },
    enableJwt: true,  // Enable to support both Keycloak tokens and device tokens
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
  console.log('🔧 Running database migrations...');

  try {
    await runMigrations();
    console.log('✅ Migrations completed successfully');
  } catch (error) {
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
    }
  }

  // ✅ ACTUALLY START SERVER
  const server = serve({
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,

  });

  console.log(`✅ Server ready at http://${config.host}:${config.port}`);

  // ✅ Graceful shutdown (VERY IMPORTANT for WSL)
  const shutdown = () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
      console.log('✅ Server closed cleanly');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});