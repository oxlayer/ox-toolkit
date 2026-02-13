/**
 * Device Auth Routes
 *
 * Hono routes that delegate to DeviceAuthController
 *
 * These endpoints enable CLI browser-based authentication via OAuth 2.0 Device Authorization Grant.
 */

import { Hono } from 'hono';
import type { AppContainer } from '../../infrastructure/di/container.js';
import type { DeviceAuthController } from '../../controllers/index.js';

/**
 * Get authenticated developer ID from request
 */
function getDeveloperId(c: any): string {
  // In development mode, you can bypass auth for testing
  if (process.env.MIDDLEWARE_DEV_MODE === 'true') {
    return 'dev-developer-id';
  }

  // TODO: Implement proper authentication middleware
  // For now, this would extract from session/JWT
  throw new Error('Authentication required');
}

/**
 * Get authenticated organization ID from request
 */
function getOrganizationId(c: any): string {
  // In development mode, you can bypass auth for testing
  if (process.env.MIDDLEWARE_DEV_MODE === 'true') {
    return 'dev-org-id';
  }

  // TODO: Implement proper authentication middleware
  // For now, this would extract from session/JWT
  throw new Error('Authentication required');
}

/**
 * Setup device auth routes
 */
export function setupDeviceAuthRoutes(
  app: Hono,
  container: AppContainer
): void {
  const controller = container.deviceAuthController;

  // GET /device - Browser approval page (HTML)
  app.get('/device', (c) => controller.showDevicePage(c.req));

  // POST /cli/device/code - Initiate device auth flow
  app.post('/cli/device/code', async (c) => {
    const body = await c.req.json();
    const result = await controller.initiateDeviceAuth(c.req, body);
    return c.json(result);
  });

  // POST /cli/device/poll - Poll for token completion
  app.post('/cli/device/poll', async (c) => {
    const body = await c.req.json();
    const result = await controller.pollForToken(c.req, body);
    return c.json(result);
  });

  // POST /cli/device/approve - Approve device (requires auth)
  app.post('/cli/device/approve', async (c) => {
    const body = await c.req.json();
    const result = await controller.approveDevice(c.req, body);
    return c.json(result);
  });

  // Helper to get authenticated context
  const getAuthContext = (req: Request) => ({
    developerId: getDeveloperId(req),
    organizationId: getOrganizationId(req),
  });

  // Add getAuthContext to the controller for internal use
  (controller as any).getAuthContext = getAuthContext;
}
