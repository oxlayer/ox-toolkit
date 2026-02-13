/**
 * Device Auth Routes
 *
 * Hono routes for OAuth 2.0 Device Authorization Grant
 *
 * Security Architecture:
 * - /code and /poll: Public (for CLI)
 * - /approve: Requires Keycloak authentication (org resolved from identity)
 * - /device: Public (browser page, but approve requires auth)
 * - /status: Public (for browser polling)
 */

import { Hono } from 'hono';
import type { AppContainer } from '../../infrastructure/di/container.js';

/**
 * Setup device auth routes
 */
export function setupDeviceAuthRoutes(
  app: Hono,
  container: AppContainer,
  authMiddleware?: (c: any, next: any) => any
): void {
  const controller = container.deviceAuthController;

  // GET /device - Browser approval page (HTML)
  // Public page that shows user code and approve button
  app.get('/device', (c) => controller.showDevicePage(c.req.raw));

  // POST /cli/device/code - Initiate device auth flow
  // Public endpoint for CLI to start the flow
  app.post('/cli/device/code', (c) => controller.initiateDeviceAuth(c.req.raw));

  // POST /cli/device/poll - Poll for token completion
  // Public endpoint for CLI to poll for approval
  app.post('/cli/device/poll', (c) => controller.pollForToken(c.req.raw));

  // POST /cli/device/approve - Approve device (REQUIRES KEYCLOAK AUTH)
  const approveHandler = async (c: any) => {
    try {
      // Get authenticated user info from Keycloak context
      const authPayload = c.get('authPayload') as any;
      const userId = authPayload?.userId || authPayload?.sub;
      const organizationId = authPayload?.organizationId;

      if (!authPayload || !userId) {
        return c.json({
          success: false,
          error: 'Authentication required',
        }, 401);
      }

      if (!organizationId) {
        return c.json({
          success: false,
          error: 'No organization found. Please create an organization first.',
        }, 403);
      }

      // Get userCode from request body
      const body = await c.req.json() as { userCode?: string };

      if (!body.userCode) {
        return c.json({
          success: false,
          error: 'Missing required field: userCode',
        }, 400);
      }

      // Call approve with auth-derived IDs (org comes from Keycloak token, NOT from body)
      await controller.approveWithAuth(body.userCode, userId, organizationId);

      return c.json({
        success: true,
        message: 'Device approved successfully',
      });
    } catch (error: any) {
      if (error?.statusCode) {
        return c.json({
          success: false,
          error: error.message || 'Approval failed',
        }, error.statusCode);
      }
      return c.json({
        success: false,
        error: error?.message || 'Internal server error',
      }, 500);
    }
  };

  // Apply auth middleware if provided - use sub-app approach
  if (authMiddleware) {
    const authRoutes = new Hono();
    authRoutes.use(authMiddleware);
    authRoutes.post('/cli/device/approve', approveHandler);
    app.route('/', authRoutes);
  } else {
    app.post('/cli/device/approve', approveHandler);
  }

  // GET /cli/device/status - Get device status (for browser polling)
  // Public endpoint for checking approval status
  app.get('/cli/device/status', (c) => controller.getDeviceStatus(c.req.raw));
}
