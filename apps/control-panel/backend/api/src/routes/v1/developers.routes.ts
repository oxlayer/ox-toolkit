/**
 * Developers Routes
 *
 * Hono routes that delegate to the DevelopersController
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

export function setupDevelopersRoutes(app: Hono, container: AppContainer) {
  const controller = container.developersController;

  // GET /developers - List developers (optionally filter by organization)
  app.get('/developers', async (c) => {
    const orgId = c.req.query('organization_id');
    if (orgId) {
      const request = new Request(c.req.raw);
      const response = await controller.listByOrganization(request, { organizationId: orgId });
      return c.body(response.body, response.status as any, headersToObject(response.headers));
    } else {
      return c.json({ data: [], meta: { count: 0 } });
    }
  });

  // GET /developers/:id - Get developer by ID
  app.get('/developers/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.getById(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /organizations/:organizationId/developers - Create developer
  app.post('/organizations/:organizationId/developers', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.create(request, { organizationId: c.req.param('organizationId') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // PATCH /developers/:id - Update developer
  app.patch('/developers/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.update(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // DELETE /developers/:id - Delete developer
  app.delete('/developers/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.delete(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });
}
