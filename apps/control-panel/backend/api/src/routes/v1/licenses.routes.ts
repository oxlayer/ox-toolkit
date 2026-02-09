/**
 * Licenses Routes
 *
 * Hono routes that delegate to the LicensesController
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

export function setupLicensesRoutes(app: Hono, container: AppContainer) {
  const controller = container.licensesController;

  // GET /licenses - List licenses (optionally filter by organization)
  app.get('/licenses', async (c) => {
    const orgId = c.req.query('organization_id');
    if (orgId) {
      const request = new Request(c.req.raw);
      const response = await controller.listByOrganization(request, { organizationId: orgId });
      return c.body(response.body, response.status as any, headersToObject(response.headers));
    } else {
      return c.json({ data: [], meta: { count: 0 } });
    }
  });

  // GET /licenses/:id - Get license by ID
  app.get('/licenses/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.getById(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /organizations/:organizationId/licenses - Create license
  app.post('/organizations/:organizationId/licenses', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.create(request, { organizationId: c.req.param('organizationId') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // PATCH /licenses/:id - Update license
  app.patch('/licenses/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.update(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // DELETE /licenses/:id - Delete license
  app.delete('/licenses/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.delete(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /licenses/:id/activate - Activate license
  app.post('/licenses/:id/activate', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.activate(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /licenses/:id/suspend - Suspend license
  app.post('/licenses/:id/suspend', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.suspend(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /licenses/:id/revoke - Revoke license
  app.post('/licenses/:id/revoke', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.revoke(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /licenses/:id/packages - Add package to license
  app.post('/licenses/:id/packages', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.addPackage(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // DELETE /licenses/:id/packages/:package - Remove package from license
  app.delete('/licenses/:id/packages/:package', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.removePackage(request, {
      id: c.req.param('id'),
      package: c.req.param('package')
    });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // PUT /licenses/:id/capabilities/:capability - Update capability limits
  app.put('/licenses/:id/capabilities/:capability', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.updateCapabilityLimits(request, {
      id: c.req.param('id'),
      capability: c.req.param('capability')
    });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // DELETE /licenses/:id/capabilities/:capability - Remove capability
  app.delete('/licenses/:id/capabilities/:capability', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.removeCapability(request, {
      id: c.req.param('id'),
      capability: c.req.param('capability')
    });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });
}
