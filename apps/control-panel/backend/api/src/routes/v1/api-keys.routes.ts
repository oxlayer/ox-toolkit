/**
 * API Keys Routes
 *
 * Hono routes that delegate to the ApiKeysController
 */

import { Hono } from 'hono';
import type { AppContainer } from '../../infrastructure/di/container.js';
import { getContainer } from '../../infrastructure/di/container.js';

/**
 * Convert Headers object to plain object for Hono
 */
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

export function setupApiKeysRoutes(app: Hono, container: AppContainer) {
  const controller = container.apiKeysController;

  // GET /api-keys - List API keys (with optional filters)
  app.get('/api-keys', async (c) => {
    const orgId = c.req.query('organization_id');
    const licenseId = c.req.query('license_id');
    const devId = c.req.query('developer_id');

    if (orgId) {
      const request = new Request(c.req.raw);
      const response = await controller.listByOrganization(request, { organizationId: orgId });
      return c.body(response.body, response.status as any, headersToObject(response.headers));
    } else if (licenseId) {
      const request = new Request(c.req.raw);
      const response = await controller.listByLicense(request, { licenseId });
      return c.body(response.body, response.status as any, headersToObject(response.headers));
    } else if (devId) {
      const request = new Request(c.req.raw);
      const response = await controller.listByDeveloper(request, { developerId: devId });
      return c.body(response.body, response.status as any, headersToObject(response.headers));
    } else {
      return c.json({ data: [], meta: { count: 0 } });
    }
  });

  // GET /api-keys/:id - Get API key by ID
  app.get('/api-keys/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.getById(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /organizations/:organizationId/api-keys - Create API key
  app.post('/organizations/:organizationId/api-keys', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.create(request, { organizationId: c.req.param('organizationId') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // PATCH /api-keys/:id - Update API key
  app.patch('/api-keys/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.update(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // DELETE /api-keys/:id - Delete API key
  app.delete('/api-keys/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.delete(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /api-keys/:id/revoke - Revoke API key
  app.post('/api-keys/:id/revoke', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.revoke(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });
}
