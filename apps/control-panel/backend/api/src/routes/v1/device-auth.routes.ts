/**
 * Device Auth Routes
 *
 * Hono routes that delegate to DeviceAuthController
 *
 * These endpoints enable CLI browser-based authentication via OAuth 2.0 Device Authorization Grant.
 */

import { Hono } from 'hono';
import type { AppContainer } from '../../infrastructure/di/container.js';

/**
 * Setup device auth routes
 */
export function setupDeviceAuthRoutes(
  app: Hono,
  container: AppContainer
): void {
  const controller = container.deviceAuthController;

  // GET /device - Browser approval page (HTML)
  app.get('/device', (c) => controller.showDevicePage(c.req.raw));

  // POST /cli/device/code - Initiate device auth flow
  app.post('/cli/device/code', (c) => controller.initiateDeviceAuth(c.req.raw));

  // POST /cli/device/poll - Poll for token completion
  app.post('/cli/device/poll', (c) => controller.pollForToken(c.req.raw));

  // POST /cli/device/approve - Approve device (requires auth)
  app.post('/cli/device/approve', (c) => controller.approveDevice(c.req.raw));

  // GET /cli/device/status - Get device status (for browser polling)
  app.get('/cli/device/status', (c) => controller.getDeviceStatus(c.req.raw));
}
