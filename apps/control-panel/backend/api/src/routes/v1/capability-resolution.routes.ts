/**
 * Capability Resolution Routes
 *
 * Routes for SDK capability resolution and package downloads.
 * These are used by SDKs (API key auth) and CLI (JWT auth).
 *
 * Security Architecture:
 * - /v1/capabilities/resolve: API key auth (for SDKs)
 * - /v1/packages/download: JWT Bearer auth (for CLI) - uses local JWT verification
 * - /v1/health: Public
 */

import { Hono } from 'hono';
import { HttpError } from '@oxlayer/foundation-http-kit';
import type { AppContainer } from '../../infrastructure/di/container.js';
import { extractJwt } from '../../middleware/jwt-auth.js';

/**
 * Setup capability resolution routes
 */
export function setupCapabilityResolutionRoutes(
  app: Hono,
  container: AppContainer,
  _authMiddleware?: (c: any, next: any) => any
): void {
  const controller = container.capabilityResolutionController;

  // POST /v1/capabilities/resolve - Resolve capabilities (API key auth)
  // Public endpoint for SDKs to get their configuration
  app.post('/capabilities/resolve', (c) => controller.resolveCapabilities(c.req.raw));

  // POST /v1/packages/download - Request package download (JWT auth)
  // Protected endpoint for CLI to get download URLs
  // Uses local JWT verification (not Keycloak)
  app.post('/packages/download', async (c) => {
    try {
      // Verify JWT and add to request context
      extractJwt(c.req.raw);
      return controller.requestPackageDownload(c.req.raw);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(401, 'Authentication failed');
    }
  });

  // GET /v1/health - Health check (public)
  app.get('/health', (c) => controller.health());
}
